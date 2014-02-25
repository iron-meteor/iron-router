//XXX Combining ordering with reactivity is confusing.
//  - Currently we have before, action, after hooks which are less and less
//  relevant if any of those functions can rerun at any time. It might make more
//  sense to have lifecycle callbacks:
//    - onFirstRun
//    - onAfterAction (called each time the action is run)
//    - onStop (called when route is stopped)
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
    this.data = getOption('data');
    this.template = getOption('template') || (this.route && this.route.name);
    this.yieldTemplates = getOption('yieldTemplates');
    this.layoutTemplate = getOption('layoutTemplate');
    
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

  ready: function () {
    return this._waitList.ready();
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   * @api public
   */

  redirect: function (/* args */) {
    return Router.go.apply(this.router, arguments);
  },

  yieldTemplates: null,

  layoutTemplate: null,

  template: null,

  data: {},

  waitOn: null,

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
   * XXX can we have some lifecycle callbacks here? would be nice to give
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

  _run: function () {
    var self = this;
    // make sure the controller is stopped if it's
    // already running
    this.stop();

    self.stopped = false;

    //XXX clean this up
    if (!Router._hasJustReloaded)
      this.runHooks('load');
    Router._hasJustReloaded = false;

    // in case a load hook stopped the contoller
    if (this.stopped)
      return;

    // create an outer computation that we can use to stop all of the
    // inner computations when we stop this controller.
    this._computation = Deps.autorun(function () {
      var args = _.toArray(arguments);
      var action = _.isFunction(self.action) ? self.action : self[self.action];

      Utils.assert(action,
        "You don't have an action named \"" + self.action + "\" defined on your RouteController");

      self._renderedRegions = [];
      self._waitList.clear();

      /**
       * 1. Set the layout
       *
       * Do this first so the page does't appear laggy.
       */
      self.layout(self.layoutTemplate);


      /**
       * 2. Get the initial wait list from waitOn
       * Get the initial wait list handles before we set
       * data. This means, anything added to the wait list in a
       * waitOn function will cause the controller to wait before setting data
       * global data context.
       *
       */
      Deps.autorun(function () {
        /*
         * Each waitOn value could be an object, array or function. Because it's a
         * concatenation of waitOn options from Router -> Route -> RouteController.
         * So by the time we're done here we should just have a list of objects.
         */
        var waitOn = _.flatten(_.map(self.waitOn, function (fnOrHandle) {
          return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
        }));

        self._waitList.append(waitOn);
      });

      /**
       * 3. Set the global data context.
       *
       * This will wait until all handles in the wait list are ready.
       */
      Deps.autorun(function () {
        if (self.ready()) {
          var data = _.isFunction(self.data) ? self.data.call(self) : self.data;
          if (!self.router)
            throw new Error("Can't set data because no router is defined on RouteController");
          self.router.data(data);
        }
      });

      /**
       * 4. Run before hooks each in its own computation.
       *
       * The forEachHook method wil ensure we iterate over all hooks defined
       * from options, inheritance and the prototype. It will also perform a
       * lookup into the Router.hooks namespace if a hook is a string name such
       * as "renderLoadingTemplate".
       */
      self.forEachHook('before', function (hook) {
        Deps.autorun(function () {
          hook.call(self);
        });
      });

      if (self.stopped) {
        self.isFirstRun = false;
        return;
      }

      /**
       * 5. Run the action in its own computation.
       */

      Deps.autorun(function () {
        action.call(self);
      });

      /**
       * 6. Run the after hooks each in its own computation.
       * XXX clearUnusedYields doesn't really work in the new model because it
       * will only clear the regions from the last pass.
       */
      self.forEachHook('after', [
        function clearUnusedRegions () {
          if (this.router) {
            this.router.clearUnusedRegions(this._renderedRegions);
          }
        }
      ], function (hook) {
        Deps.autorun(function () {
          hook.call(self);
        });
      });
    });
    
    // We've run at least once
    self.isFirstRun = false;
  },

  stop: function (cb) {
    this.stopped = true;

    // don't call the unload hooks on the first run
    // only after we called stop at a later point.
    // XXX revisit
    if (!this.isFirstRun)
      this.runHooks('unload');

    if (this._computation) {
      this._computation.stop();
      if (cb)
        this._computation.onInvalidate(cb);
    } else {
      cb && cb();
    }
  },

  wait: function (handle) {
    handle = _.isFunction(handle) ? handle.call(this) : handle;
    // handle could be an object or a array if a function returned an array
    this._waitList.append(handle);
  },

  action: function () {
    if (this.ready())
      this.render();
  }
});
