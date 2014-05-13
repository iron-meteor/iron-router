/**
 * XXX Bug in the new waitOn design. Ran out of time to fix for today.
 * cc @tmeasday
 *
 * The waitOn function gets called multiple times (every time
 * you call this.ready()). 
 *
 * I did this to fix the issue raised by Tom to make sure we always have the
 * correct return value from the waitOn function (or any value function being
 * used with ReactiveResult. So when we call this.ready() the waitOn function
 * gets called each time.
 *
 * Problem 1: Meteor will subscribe multiple times. When it checks for an
 * existing subscription it will only find it if "inactive: true" which only
 * happens on an invalidation.
 *
 * Problem 2: We can probably do better than calling the waitOn function
 * multiple needless times.
 *
 * Possible Solutions:
 *
 *  1. Patch to Core removing the "inactive: true" in the subscription lookup.
 *      - But waitOn would still get called multiple times
 *      - The existing check in livedata does a linear search over all
 *        subscriptions
 *  2. Some kind of enhancement to ReactiveResult, or maybe even a new data
 *     structure to handle these new requirements.
 *      - Can we meet Tom's previous requirement for result to always be
 *        current, while also caching the value? Would this be a new ds?
 */
var isLogging = false;
var log = function (msg) {
  if (!isLogging)
    return;
  console.log('%c<RouteController> ' + msg, 'color: purple; font-size: 1.3em; font-weight: bold;');
};

RouteController = Utils.extend(RouteController, {
  constructor: function () {
    var self = this;

    RouteController.__super__.constructor.apply(this, arguments);

    // the value of the data option or prototype property
    this._dataValue = this.lookupProperty('data');

    // rewrite the data function on the instance itself.  Get the data from the
    // controller itself, not the router global data context. This is what
    // controller functions will read from. Templates will get their data
    // context from the global router data context which will get set in the
    // _run function.
    this.data = function () {
      var value;

      if (_.isFunction(self._dataValue))
        value = self._dataValue.call(self);
      else if (self._dataValue)
        value = self._dataValue
      else
        value = null;

      log('this.data()');
      return value;
    };

    this._waitList = new WaitList(function () {
      var waitOnList = self.lookupWaitOn();
      return _.flatten(_.map(waitOnList, function (fnOrHandle) {
        return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
      }));
    });

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
    if (this._waitList)
      return this._waitList.ready();
    else
      return true;
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   * @api public
   */

  redirect: function (/* args */) {
    return Router.go.apply(Router, arguments);
  },

  //XXX move into subscription class? look into arunoda's work.
  subscribe: function (/* same as Meteor.subscribe */) {
    var self = this;

    var waitApi = (function () {
      return {
        wait: function () {
          self._waitList.push(this);
          added = true;
        }
      };
    })();

    var handle = Meteor.subscribe.apply(this, arguments);
    return _.extend(handle, waitApi);
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

    var addRenderedRegion = function (key) {
      if (self._renderedRegions) {
        //XXX doesn't using "main" creep into the ui manager?
        key = key || 'main';
        self._renderedRegions.push(key);
      }
    };

    if (arguments.length == 0) {
      this.setRegion(this.lookupTemplate());
      addRenderedRegion();
      this.renderRegions();
    } else {
      options = options || {};
      to = options.to;
      this.setRegion(to, template);
      addRenderedRegion(to);
    }
  },
  
  renderRegions: function() {
    var self = this;
    var regionTemplates = this.lookupRegionTemplates();
    
    _.each(regionTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  wait: function (handle) {
    handle = _.isFunction(handle) ? handle.call(this) : handle;
    // handle could be an object or a array if a function returned an array
    this._waitList.append(handle);
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

      if (self._waitList)
        self._waitList.stop();
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
          return fn.call(thisArg || this);
        } finally {
          self.stop = oldStop;
        }
      };
    };

    // outer most computation is just used to stop inner computations from one
    // place. i don't expect this computation to be invalidated during the run.
    self._computation = Deps.autorun(withNoStopsAllowed(function () {
      self._renderedRegions = [];

      Deps.autorun(withNoStopsAllowed(function () {
        if (!self.router._hasJustReloaded)
          self.runHooks('onRun');
        self.router._hasJustReloaded = false;
      }));

      // action
      var action = _.isFunction(self.action) ? self.action : self[self.action];
      Utils.assert(action,
        "You don't have an action named \"" + self.action + "\" defined on your RouteController");

      Deps.autorun(withNoStopsAllowed(function () {
        // Set layout to configured layoutTemplate
        self.layout(self.lookupLayoutTemplate());

        if (self.ready()) {
          Deps.autorun(withNoStopsAllowed(function () {
            self.router.setData(self.data());
            self.runHooks('onData');
          }));
        } else {
          self.router.setData(null);
        }

        log('Call action');
        self.runHooks('onBeforeAction', [], function (paused) {
          if (!paused && !self.isStopped) {
            action.call(self);

            if (!self.isStopped) {
              self.runHooks('onAfterAction', [
                function clearUnusedRegions () {
                  if (this.router) {
                    this.router.clearUnusedRegions(this._renderedRegions);
                  }
                }
              ]);
            }
          }
        });
      }));
    }));
  }
});
