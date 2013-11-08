/*****************************************************************************/
/* IronRouteController */
/*****************************************************************************/

/**
 * Base class for client and server RouteController.
 */

IronRouteController = function (options) {
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

  options.load = Utils.toArray(options.load);
  options.before = Utils.toArray(options.before);
  options.after = Utils.toArray(options.after);
  options.unload = Utils.toArray(options.unload);
};

IronRouteController.prototype = {
  constructor: IronRouteController,
  
  runHooks: function (hookName, more) {
    var ctor = this.constructor
      , more = Utils.toArray(more);

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
      if (this.stopped)
        break;
      hook.call(this);
    }
  },

  run: function () {
    throw new Error('not implemented');
  },

  action: function () {
    throw new Error('not implemented');
  },

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
