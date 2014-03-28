RouteController = function (router, route, options) {
  var self = this;

  if (!(router instanceof IronRouter))
    throw new Error('RouteController requires a router');

  if (!(route instanceof Route))
    throw new Error('RouteController requires a route');

  options = this.options = options || {};

  this.router = router;
  this.route = route;

  this.path = options.path || '';
  this.params = options.params || [];
  this.where = options.where || 'client';
  this.action = options.action || this.action;

  Utils.rewriteLegacyHooks(this.options);
  Utils.rewriteLegacyHooks(this);
};

RouteController.prototype = {
  constructor: RouteController,

  /**
   * Returns the value of a property, searching for the property in this lookup
   * order:
   *
   *   1. RouteController options
   *   2. RouteController prototype
   *   3. Route options
   *   4. Router options
   */
  lookupProperty: function (key) {
    var value;

    if (!_.isString(key))
      throw new Error('key must be a string');

    // 1. RouteController options
    if (typeof (value = this.options[key]) !== 'undefined')
      return value;

    // 2. RouteController instance
    if (typeof (value = this[key]) !== 'undefined')
      return value;

    var opts;
    
    // 3. Route options
    opts = this.route.options;
    if (opts && typeof (value = opts[key]) !== 'undefined')
      return value;

    // 4. Router options
    opts = this.router.options;
    if (opts && typeof (value = opts[key]) !== 'undefined')
      return value;

    // 5. Oops couldn't find property
    return undefined;
  },

  runHooks: function (hookName, more, cb) {
    var self = this;
    var ctor = this.constructor;

    if (!_.isString(hookName))
      throw new Error('hookName must be a string');

    if (more && !_.isArray(more))
      throw new Error('more must be an array of functions');

    var isPaused = false;

    var lookupHook = function (nameOrFn) {
      var fn = nameOrFn;

      // if we already have a func just return it
      if (_.isFunction(fn))
        return fn;

      // look up one of the out-of-box hooks like
      // 'loaded or 'dataNotFound' if the nameOrFn is a
      // string
      if (_.isString(fn)) {
        if (_.isFunction(Router.hooks[fn]))
          return Router.hooks[fn];
      }

      // we couldn't find it so throw an error
      throw new Error("No hook found named: ", nameOrFn);
    }; 

    // concatenate together hook arrays from the inheritance
    // heirarchy, starting at the top parent down to the child.
    var collectInheritedHooks = function (ctor) {
      var hooks = [];

      if (ctor.__super__)
        hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor));
      
      return Utils.hasOwnProperty(ctor.prototype, hookName) ?
        hooks.concat(ctor.prototype[hookName]) : hooks;
    };


    // get a list of hooks to run in the following order:
    // 1. RouteController option hooks
    // 2. RouteController proto hooks (including inherited super to child)
    // 3. RouteController object hooks
    // 4. Router global hooks
    // 5. Route option hooks
    // 6. more

    var toArray = Utils.toArray;
    var routerHooks = this.router.getHooks(hookName, this.route.name);

    var opts;
    opts = this.route.options;
    var routeOptionHooks = toArray(opts && opts[hookName]);

    opts = this.options;
    var optionHooks = toArray(opts && opts[hookName]);

    var protoHooks = collectInheritedHooks(this.constructor);

    var objectHooks;
    // don't accidentally grab the prototype hooks!
    // this makes sure the hook is on the object itself
    // not on its constructor's prototype object.
    if (_.has(this, hookName))
      objectHooks = toArray(this[hookName])
    else
      objectHooks = [];

    var allHooks = optionHooks
      .concat(protoHooks)
      .concat(objectHooks)
      .concat(routeOptionHooks)
      .concat(routerHooks)
      .concat(more);

    var isPaused = false;
    var pauseFn = function () {
      isPaused = true;
    };

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      var hookFn = lookupHook(hook);

      if (!isPaused && !this.isStopped)
        hookFn.call(self, pauseFn, i);
    }

    cb && cb.call(self, isPaused);
    return isPaused;
  },

  action: function () {
    throw new Error('not implemented');
  },

  stop: function (cb) {
    return this._stopController(cb);
  },

  _stopController: function (cb) {
    var self = this;

    if (this.isStopped)
      return;

    self.isRunning = false;
    self.runHooks('onStop');
    self.isStopped = true;
    cb && cb.call(self);
  },

  _run: function () {
    throw new Error('not implemented');
  }
};

_.extend(RouteController, {
  /**
   * Inherit from RouteController
   *
   * @param {Object} definition Prototype properties for inherited class.
   */

  extend: function (definition) {
    Utils.rewriteLegacyHooks(definition);

    return Utils.extend(this, definition, function (definition) {
      var klass = this;

      
      /*
        Allow calling a class method from javascript, directly in the subclass
        definition.

        Instead of this:
          MyController = RouteController.extend({...});
          MyController.before(function () {});

        You can do:
          MyController = RouteController.extend({
            before: function () {}
          });
       
        And in Coffeescript you can do:
         MyController extends RouteController
           @before function () {}
       */
    });
  }
});
