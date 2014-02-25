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

  stop: function (cb) {
    var self = this;

    // noop if we're already stopped
    if (this.isStopped)
      return;

    var onStop = function () {
      self.isRunning = false;
      self.runHooks('onStop');
      cb && cb.call(self);
      self.isStopped = true;
    };

    if (this._computation) {
      this._computation.stop();
      if (cb)
        this._computation.onInvalidate(onStop);
    } else {
      onStop();
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
  },

  _run: function () {
    var self = this;

    // once we're stopped it's all over.
    if (self.isStopped)
      return;

    // can't recursively call _run
    if (self.isRunning)
      return;

    // okay let's kick things off by setting
    // our running state to true before we start
    // calling out to other functions.
    self.isRunning = true;

    // outer most computation is just used to stop inner computations from one
    // place. i don't expect this computation to be invalidated during the run.
    self._computation = Deps.autorun(function () {
      self._renderedRegions = [];
      self._waitList.clear();

      // set the layout first so pages don't appear laggy
      self.layout(self.layoutTemplate);

      self.runHooks('onRun');

      // doesn't actually block anything, just runs the
      // waitOn function and populates the wait list. runs in its own
      // computation.
      self._runWaitOn();

      // once the controller is in a ready() state it will set the global data
      // context and run the onData hooks.
      self._runSetData();

      // this will run right away but may run again if data dependencies
      // cause invalidations. Runs the action along with onBeforeAction and
      // onAfterAction hooks.
      self._runAction();
    });
  },

  _runWaitOn: function () {
    var self = this;

    if (!self.isRunning)
      throw new Error("Only _run should call _runWaitOn");

    Deps.autorun(function () {
      var waitOn = _.flatten(_.map(self.waitOn, function (fnOrHandle) {
        return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
      }));

      self._waitList.append(waitOn);
    });
  },

  _runSetData: function () {
    var self = this;

    if (!self.isRunning)
      throw new Error("Only _run should call _runSetData");

    Deps.autorun(function () {
      if (self.ready()) {
        var data = _.isFunction(self.data) ? self.data.call(self) : self.data;
        if (!self.router)
          throw new Error("Can't set data because no router is defined on RouteController");
        self.router.data(data);

        self.runHooks('onData');
      }
    });
  },

  _runAction: function () {
    var self = this;

    if (!self.isRunning)
      throw new Error("Only _run should call _runAction");

    var action = _.isFunction(self.action) ? self.action : self[self.action];

    Utils.assert(action,
      "You don't have an action named \"" + self.action + "\" defined on your RouteController");

    Deps.autorun(function () {
      self.runHooks('onBeforeAction');
      action.call(self);
      self.runHooks('onAfterAction', [
        function clearUnusedRegions () {
          if (this.router) {
            this.router.clearUnusedRegions(this._renderedRegions);
          }
        }
      ]);
    });
  }
});
