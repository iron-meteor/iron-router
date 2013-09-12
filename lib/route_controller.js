IronRouteController = function (options) {
  var routerOptions
    , routeOptions
    , self = this;

  options = this.options = options || {};

  var getOption = function (key) {
    return Utils.pick(self.options[key], self[key]);
  };

  this.router = options.router;
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

  runHooks: function (hookName, more) {
    var ctor = this.constructor
      , instanceHooks = this.hooks[hookName]
      , more = Utils.toArray(more)
      , inheritedHooks
      , allHooks;

    /*
     * Collect hooks from top of inheritance chain to bottom.
     *
     *Given the inheritance chain:
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

  runActionWithHooks: function () {
    throw new Error('not implemented');
  },

  run: function () {
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

      if (definition.before) {
        klass.before(definition.before);
        delete definition.before;
      }

      if (definition.after) {
        klass.after(definition.after);
        delete definition.after;
      }
    });
  },

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
