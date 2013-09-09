IronRouteController = function (router, options) {
  var routerOptions
    , routeOptions
    , self = this;

  if (!(router instanceof IronRouter))
    throw new Error('IronRouteController requires a Router as the first parameter');

  options = this.options = options || {};

  var getOption = function (key) {
    return Utils.pick(self.options[key], self[key]);
  };

  this.router = router;

  this.route = options.route;
  this.path = options.path;

  this.params = options.params || [];
  this.where = options.where || 'client';
  this.action = options.action || 'run';

  this.hooks = {};
  this.hooks.before = Utils.toArray(options.before);
  this.hooks.after = Utils.toArray(options.after);
};

IronRouteController.prototype = {
  constructor: IronRouteController,

  /**
   * Run the hooks for the given name (e.g. before/after)
   *
   * @param {String} name The name of the hooks to run (e.g. before/after)
   * @api public
   */

  runHooks: function (hookName) {
    var ctor = this.constructor
      , instanceHooks = this.hooks[hookName]
      , inheritedHooks
      , allHooks;

    /*
     * Collect hooks from top of inheritance chain to bottom.
     *
     * Given the inheritance chain:
     * CtorA.hooks.before => [1, 2]
     *  CtorB.hooks.before => [3,4]
     *    CtorC.hooks.before => [5,6]
     * 
     * Result will be: [1,2,3,4,5,6]
     */
    var collectInheritedHooks = function (ctor) {
      var hooks = [];

      if (ctor.__super__)
        hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor));
      
      return ctor.hooks && ctor.hooks[hookName] ?
        hooks.concat(ctor.hooks[hookName]) : hooks;
    };

    inheritedHooks = collectInheritedHooks(this.constructor);

    allHooks = instanceHooks.concat(inheritedHooks);

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      if (this.stopped)
        break;
      hook.call(this);
    }
  },

  // only difference with client is it runs reactively
  // run before hooks
  // run action
  // run after hooks

  // the client route controller is going to completely blow away whatever
  // method we have here. there's no way to call super. So, we'll need to either
  // implement inheritance on the ClientRouteController, probably better to do
  // this. follow the pattern used in Router.
  // Called by the router
  runActionWithHooks: function () {
    var actionFn = this[this.action];

    Utils.assert(actionFn,
      "Uh oh, you don'\t seem to have an action named \"" + this.action + "\" defined on your RouteController");

    this.stopped = false;
    this.runHooks('before');

    if (this.stopped) {
      this.stopped = false;
      this.isFirstRun = false;
    } else {
      actionFn.call(this);
      this.runHooks('after');
      this.isFirstRun = false;
    }
  },

  /**
   * The default action for the controller. Called by the Router. Calls the main
   * render method and then the render method for each template specified in
   * renderTemplates.
   *
   * @api public
   */

  run: function () {
    // do the before and after hook stuff here. Might also consider moving the
    // reactivity stuff here? No, because no reacitivity on server.
    throw new Error('not implemented');
  },

  /**
   * Set the stopped property on the controller to true. This would typically be
   * used in a before filter or hook. If the controller is marked as stopped, it
   * tells the router not to call the controller's action or afterRun callbacks
   * and hooks. This property is not used internally by the controller.
   *
   * @api public
   */
  stop: function() {
    this.stopped = true;
  }
};

_.extend(IronRouteController, {
  /**
   * Inherit from IronRouteController
   *
   * @param {Object} definition Prototype properties for inherited class.
   */

  extend: function (definition) {
    return Utils.extend(this, definition);
  },

  /*
   * Arg can be an array or a function
   */
  before: function (fn) {
    this.hooks = this.hooks || {};
    this.hooks.before = this.hooks.before || [];
    this.hooks.before = this.hooks.before.concat(Utils.toArray(fn));
  },

  after: function (fn) {
    this.hooks = this.hooks || {};
    this.hooks.after = this.hooks.after || [];
    this.hooks.after = this.hooks.after.concat(Utils.toArray(fn));
  }
});
