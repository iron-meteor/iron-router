RouteController = Utils.extend(RouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);

    var self = this;

    //XXX clean up this options parsing somehow. Maybe with
    //a configure method like on Router.
    var getOption = function (key) {
      return Utils.pick(self.options[key], self[key]);
    };

    this.loadingTemplate = getOption('loadingTemplate');
    this.notFoundTemplate = getOption('notFoundTemplate');

    this.template = getOption('template') || (this.route && Router.convertTemplateName(this.route.name));
    this.yieldTemplates = getOption('yieldTemplates');
    this.layoutTemplate = getOption('layoutTemplate');
    
    // the value of the data option or prototype property
    this._dataValue = getOption('data');

    // rewrite the data function on the instance itself.  Get the data from the
    // controller itself, not the router global data context. This is what
    // controller functions will read from. Templates will get their data
    // context from the global router data context which will get set in the
    // _run function.
    this.data = function () {
      var self = this;
      var value;

      if (_.isFunction(self._dataValue))
        value = self._dataValue.call(self);
      else if (self._dataValue)
        value = self._dataValue
      else
        value = null;

      return value;
    }

    /*
     * waitOn can come from the options or the prototype. We add the option
     * waitOn value first and then concatenate the prototype waitOn value.
     * Possible values are:
     *
     * Router.configure({
     *  waitOn: Meteor.subscribe('items')
     * });
     *
     * Router.route('someRoute', {
     *  waitOn: function () {
     *    return Meteor.subscribe('item', this.params._id);
     *  }
     * });
     *
     * waitOn => [{}, fn]
     *  fn => could return an object or another array of objects
     * 
     */
    this.waitOn = []
      .concat(Utils.toArray(this.options.waitOn))
      .concat(Utils.toArray(this.waitOn));

    this._waitList = new WaitList;

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
      this.setRegion(this.template);
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
    
    _.each(this.yieldTemplates, function (opts, tmpl) {
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
            //XXX what about the action function? can we pause to stop
            //onAfterAction hooks from running? Not currently.
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
      self._waitList.clear();

      // set the layout first so pages don't appear laggy
      self.layout(self.layoutTemplate);

      self.runHooks('onRun');

      // waitOn
      Deps.autorun(withNoStopsAllowed(function () {
        var waitOn = _.flatten(_.map(self.waitOn, function (fnOrHandle) {
          return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
        }));

        self._waitList.append(waitOn);
      }));

      // data
      Deps.autorun(withNoStopsAllowed(function () {
        if (self.ready()) {
          var data = self.data();
          self.router.data(data);
          self.runHooks('onData');
        }
      }));

      // action
      var action = _.isFunction(self.action) ? self.action : self[self.action];
      Utils.assert(action,
        "You don't have an action named \"" + self.action + "\" defined on your RouteController");

      Deps.autorun(withNoStopsAllowed(function () {
        self.runHooks('onBeforeAction', function (paused) {
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
