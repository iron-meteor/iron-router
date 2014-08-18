var isLogging = false;
var log = function (msg) {
  if (!isLogging)
    return;
  console.log('%c<RouteController> ' + msg, 'color: purple; font-size: 1.3em; font-weight: bold;');
};

var bindData = function (value, thisArg) {
  return function () {
    return (typeof value === 'function') ? value.apply(thisArg, arguments) : value;
  };
};

RouteController = Utils.extend(RouteController, {
  constructor: function () {
    var self = this;

    RouteController.__super__.constructor.apply(this, arguments);

    this._waitList = new WaitList;

    //XXX putting this back so people can access data by calling
    //this.data().

    var data = this.lookupProperty('data');

    this._hasData = function () { return typeof data !== 'undefined'; };
    this.data = bindData(data, this);

    // proxy these methods to the router
    _.each([
      'layout',
      'setRegion',
      'clearRegion'
    ], function (routerApiMethod) {
      self[routerApiMethod] = function () {
        if (!self.router)
          throw new Error("No router defined on RouteController");
        return self.router[routerApiMethod].apply(self.router, arguments);
      };
    });
  },

  setLayout: function () {
    return this.layout.apply(this, arguments);
  },

  ready: function () {
    return this._waitList.ready();
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   * @api public
   */

  redirect: function (/* args */) {
    return Router.go.apply(Router, arguments);
  },

  subscribe: function (/* same as Meteor.subscribe */) {
    var self = this;
    var handle = Meteor.subscribe.apply(this, arguments);

    return _.extend(handle, {
      wait: function () {
        self.wait(this);
      }
    });
  },

  lookupLayoutTemplate: function () {
    return this.lookupProperty('layoutTemplate');
  },

  lookupTemplate: function () {
    return this.lookupProperty('template')
      || Router.convertTemplateName(this.route.name);
  },

  lookupRegionTemplates: function () {
    var res;

    if (res = this.lookupProperty('regionTemplates'))
      return res;
    else if (res = this.lookupProperty('yieldTemplates'))
      return res;
    else
      return {};
  },

  /**
   * Return an array of waitOn values in the folowing order (although, ordering
   * shouldn't really matter for waitOn). The result may contain sub arrays like
   * this:
   *   [[fn1, fn2], [fn3, fn4]]
   *
   *   1. Router options
   *   2. Route options
   *   3. Controller options
   *   4. Controller instance
   */

  lookupWaitOn: function () {
    var toArray = Utils.toArray;

    var fromRouterHook = toArray(this.router.getHooks('waitOn', this.route.name));
    var fromRouterOptions = toArray(this.router.options.waitOn);
    var fromRouteOptions = toArray(this.route.options.waitOn);
    var fromMyOptions = toArray(this.options.waitOn);
    var fromInstOptions = toArray(this.waitOn);

    return fromRouterHook
      .concat(fromRouterOptions)
      .concat(fromRouteOptions)
      .concat(fromMyOptions)
      .concat(fromInstOptions);
  },

  /**
   * Either specify a template to render or call with no arguments to render the
   * RouteController's template plus all of the yieldTemplates.
   * 
   * XXX can we have some hooks here? would be nice to give
   * iron-transitioner a place to plug in. Maybe onSetRegion(fn)?
   */

  render: function (template, options) {
    var to;
    var template;
    var layout;
    var self = this;

    if (arguments.length == 0) {
      this.setRegion(this.lookupTemplate());
      this.renderRegions();
    } else {
      options = options || {};
      to = options.to;
      this.setRegion(to, template);
    }
  },
  
  renderRegions: function() {
    var self = this;
    var regionTemplates = this.lookupRegionTemplates();
    
    _.each(regionTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  /**
   * Add an item to the waitlist.
   */
  wait: function (fn) {
    var self = this;

    if (!fn)
      // it's possible fn is just undefined but we'll just return instead
      // of throwing an error, to make it easier to call this function
      // with waitOn which might not return anything.
      return;

    if (_.isArray(fn)) {
      _.each(fn, function eachWait (fnOrHandle) {
        self.wait(fnOrHandle);
      });
    } else if (fn.ready) {
      this._waitList.wait(function () { return fn.ready(); });
    } else {
      this._waitList.wait(fn);
    }

    return this;
  },

  action: function () {
    this.render();
  },

  /**
   * A private method that the Router can call into to
   * stop the controller. The reason we need this is because we
   * don't want users calling stop() in their hooks/action like they
   * had done previously. We now want them to call pause(). stop() now
   * completely stops the controller and tears down its computations. pause()
   * just stopps running downstream functions (e.g. when you're running
   * before/action/after functions. But if the outer computation causes the
   * entire chain of functions to run again that's fine.
   */
  _stopController: function (cb) {
    var self = this;

    // noop if we're already stopped
    if (this.isStopped)
      return;

    var onStop = function () {
      RouteController.__super__._stopController.call(self, cb);
    };

    if (this._computation) {
      this._computation.stop();
      this._computation.onInvalidate(onStop);
    } else {
      onStop();
    }
  },

  _run: function () {
    var self = this;
    var layout = self.router._layout;

    // if we're already running, you can't call run again without
    // calling stop first.
    if (self.isRunning)
      throw new Error("You called _run without first calling stop");

    self.isRunning = true;
    self.isStopped = false;

    var withNoStopsAllowed = function (fn, thisArg) {
      return function () {
        var oldStop = self.stop;

        self.stop = function () {
          if (typeof console !== 'undefined') {
            console.warn("You called this.stop() inside a hook or your action function but you should use pause() now instead which is the first parameter to the hook function.");
            return;
          }
        };

        try {
          return fn.apply(thisArg || this, arguments);
        } finally {
          self.stop = oldStop;
        }
      };
    };

    // outer most computation is just used to stop inner computations from one
    // place. i don't expect this computation to be invalidated during the run.
    self._computation = Deps.autorun(withNoStopsAllowed(function (c) {
      Deps.autorun(withNoStopsAllowed(function (onRunComp) {
        if (!self.router._hasJustReloaded && c.firstRun && onRunComp.firstRun)
          self.runHooks('onRun');
        self.router._hasJustReloaded = false;
      }));

      Deps.autorun(function (c) {
        // waitOn
        var waitOnList = self.lookupWaitOn();
        var waitOn = _.flatten(_.map(waitOnList, function (fnOrHandle) {
          return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
        }));

        log('waitOn');

        self.wait(waitOn);
      });

      Deps.autorun(function (c) {
        // if we're already in a renderig transaction we want to cancel the
        // transaction. So the previous afterFlush callback should just be a
        // noop, and the new afterflush callback should do what's required. But
        // we need to keep a stack of these 
        self.router._layout.beginRendering(function onCompleteRenderingTransaction (usedRegions) {
          if (self.isStopped)
            return;
          var allRegions = layout.regionKeys();
          var unusedRegions = _.difference(allRegions, usedRegions);
          _.each(unusedRegions, function (r) { layout.clear(r); });
        });

        // action
        var action = _.isFunction(self.action) ? self.action : self[self.action];
        Utils.assert(action,
          "You don't have an action named \"" + self.action + "\" defined on your RouteController");

        // Set layout to configured layoutTemplate
        self.layout(self.lookupLayoutTemplate(), {
          data: self.lookupProperty('data')
        });
        
        self.runHooks('onBeforeAction', [], function (paused) {
          if (self.isStopped)
            return;

          if (!paused) {
            action.call(self);

            if (!self.isStopped) {
              self.runHooks('onAfterAction');
            }
          }
        });
      });
    }));
  }
});
