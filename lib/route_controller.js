/**
 * ctor api changes
 *  1. router and route params are not options they are required
 *  2. hooks are looked up at runtime not at ctor time
 *  3. change lookup order for certain options (or change to methods)
 *    - create lookup method called lookupProperty that does this!
 *
 *  
 * NOTES:
 *  - search for each option to make sure we're not missing something!
 */
RouteController = function (router, route, options) {
  var self = this;

  if (!(router instanceof Router))
    throw new Error('RouteController requires a router');

  if (!(route instanceof RouteController))
    throw new Error('RouteController requires a route');

  options = this.options = options || {};

  this.router = router;
  this.route = route;

  this.path = options.path || '';
  this.params = options.params || [];
  this.where = options.where || 'client';
  this.action = options.action || this.action;

  /*
  
  //XXX All of this should happen at hook run time
  //XXX is this even used?
  this.hooks = {};
  options.onRun = Utils.toArray(options.load || options.onRun);
  options.onData = Utils.toArray(options.onData);
  options.onBeforeAction = Utils.toArray(options.before || options.onBeforeAction);
  options.onAfterAction = Utils.toArray(options.after || options.onAfterAction);
  options.onStop = Utils.toArray(options.unload || options.onStop);


  // backward compat for hooks
  if (this.before) {
    if (this.onBeforeAction)
      throw new Error("Choose 'before' or 'onBeforeAction' but not both");
    this.onBeforeAction = this.before;
  }

  if (this.after) {
    if (this.onAfterAction)
      throw new Error("Choose 'after' or 'onAfterAction' but not both");
    this.onAfterAction = this.after;
  }

  if (this.load) {
    if (this.onRun)
      throw new Error("Choose 'load' or 'onRun' but not both");
    this.onRun = this.load;
  }

  if (this.unload) {
    if (this.onStop)
      throw new Error("Choose 'unload' or 'onStop' but not both");
    this.onStop = this.unload;
  }
  */
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

  /**
   * Calls the iterator for each property value in the same lookup order as the
   * lookupProperty function:
   *
   *  1. options
   *  2. proto
   *  3. route options
   *  4. router options
   *
   */

  forEachProperty: function (key, iterator) {
    var value;

    if (!_.isString(key))
      throw new Error('key must be a string');

    if (!_.isFunction(iterator))
      throw new Error('iterator must be a function');

    // 1. RouteController options
    if (typeof (value = this.options[key]) !== 'undefined') {
      iterator.call(this, value);
    }

    // 2. RouteController instance
    if (typeof (value = this[key]) !== 'undefined') {
      iterator.call(this, value);
    }

    var opts;
    
    // 3. Route options
    opts = this.route.options;
    if (opts && typeof (value = opts[key]) !== 'undefined')
      iterator.call(this, value);

    // 4. Router options
    opts = this.router.options;
    if (opts && typeof (value = opts[key]) !== 'undefined')
      iterator.call(this, value);
  },
  
  lookupHook: function (nameOrFn) {
    var fn = nameOrFn;

    // if we already have a func just return it
    if (_.isFunction(fn))
      return fn;

    if (_.isFunction(Router.hooks[nameOrFn]))
      return Router.hooks[nameOrFn];

    // we couldn't find it so throw an error
    throw new Error("No hook found named: ", nameOrFn);
  },

  runHooks: function (hookName, more, cb) {
    var self = this;
    var ctor = this.constructor;

    if (_.isFunction(more) && arguments.length == 2) {
      cb = more;
      more = [];
    } 

    more = Utils.toArray(more);

    var collectInheritedHooks = function (ctor) {
      var hooks = [];

      if (ctor.__super__)
        hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor));
      
      return Utils.hasOwnProperty(ctor.prototype, hookName) ?
        hooks.concat(ctor.prototype[hookName]) : hooks;
    };

    var prototypeHooks = collectInheritedHooks(this.constructor);
    var routeHooks = this.options[hookName];
    var globalHooks = 
      this.route ? this.router.getHooks(hookName, this.route.name) : [];

    var objectHooks = Utils.toArray(this[hookName]);

    var allHooks = globalHooks.concat(routeHooks).concat(prototypeHooks).concat(objectHooks).concat(more)

    var isPaused = false;
    var pauseFn = function () {
      isPaused = true;
    };

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      var hookFn = self.lookupHook(hook);

      if (!isPaused && !this.isStopped)
        hookFn.call(self, pauseFn, i);
    }

    cb && cb.call(self, isPaused);
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
