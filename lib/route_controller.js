RouteController = function (options) {
  var self = this;

  options = this.options = options || {};

  var getOption = function (key) {
    return Utils.pick(self.options[key], self[key]);
  };

  this.router = options.router;
  this.route = options.route;
  this.path = options.path;
  this.params = options.params || [];
  this.where = options.where || 'client';
  this.action = options.action || this.action;
  this.hooks = {};

  options.onRun = Utils.toArray(options.load || options.onRun);
  options.onData = Utils.toArray(options.onData);
  options.onBeforeAction = Utils.toArray(options.before || options.onBeforeAction);
  options.onAfterAction = Utils.toArray(options.after || options.onAfterAction);
  options.onStop = Utils.toArray(options.unload || options.onStop);
};

RouteController.prototype = {
  constructor: RouteController,
  
  runHooks: function (hookName, more) {
    var self = this;
    this.forEachHook(hookName, more, function (hook, idx) {
      hook.call(self);
    });
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

  forEachHook: function (hookName, more, cb) {
    var self = this;
    var ctor = this.constructor;

    if (arguments.length == 2) {
      cb = more;
      more = [];
    } else if (arguments.length < 2) {
      throw new Error('No callback provided to eachHooks');
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

    var allHooks = globalHooks.concat(routeHooks).concat(prototypeHooks).concat(more);

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      if (this.isStopped)
        break;
      else {
        var hookFn = self.lookupHook(hook);
        cb.call(this, hookFn, i);
      }
    }
  },

  action: function () {
    throw new Error('not implemented');
  },

  stop: function() {
    throw new Error('not implemented');
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
