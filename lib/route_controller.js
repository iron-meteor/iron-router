/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Controller = Iron.Controller;
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/
RouteController = Controller.extend({
  constructor: function (options) {
    RouteController.__super__.constructor.apply(this, arguments);
    this.options = options || {};
    this._onStopCallbacks = [];
    this.init(options);
  }
});

/**
 * Returns an option value following an "options chain" which is this path:
 *
 *   this (which includes the proto chain)
 *   this.options
 *   this.route.options
 *   this.router.options
 */
RouteController.prototype.lookupOption = function (key) {

  // this.options
  if (_.has(this.options, key))
    return this.options[key];

  // "this" object or its proto chain
  if (typeof this[key] !== 'undefined')
    return this[key];

  // see if we have the CurrentOptions dynamic variable set.
  var opts = CurrentOptions.get();
  if (opts && _.has(opts, key))
    return opts[key];

  // this.route.options
  if (this.route && this.route.options && _.has(this.route.options, key))
    return this.route.options[key];

  // this.router.options
  if (this.router && this.router.options && _.has(this.router.options, key))
    return this.router.options[key];
};

/**
 * Returns an array of hook functions for the given hook names. Hooks are
 * collected in this order:
 *
 * router global hooks
 * route option hooks
 * prototype of the controller
 * this object for the controller
 *
 * For example, this.collectHooks('onBeforeAction', 'before')
 * will return an array of hook functions where the key is either onBeforeAction
 * or before.
 *
 * Hook values can also be strings in which case they are looked up in the
 * Iron.Router.hooks object.
 *
 * TODO: Add an options last argument which can specify to only collect hooks
 * for a particular environment (client, server or both).
 */
RouteController.prototype._collectHooks = function (/* hook1, alias1, ... */) {
  var self = this;
  var hookNames = _.toArray(arguments);

  var getHookValues = function (value) {
    if (!value)
      return [];
    var lookupHook = self.router.lookupHook;
    var hooks = _.isArray(value) ? value : [value];
    return _.map(hooks, function (h) { return lookupHook(h); });
  };

  var collectInheritedHooks = function (ctor, hookName) {
    var hooks = [];

    if (ctor.__super__)
      hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor, hookName));
    
    return _.has(ctor.prototype, hookName) ?
      hooks.concat(getHookValues(ctor.prototype[hookName])) : hooks;
  };

  var eachHook = function (cb) {
    for (var i = 0; i < hookNames.length; i++) {
      cb(hookNames[i]);
    }
  };

  var routerHooks = [];
  eachHook(function (hook) {
    var name = self.route && self.route.getName();
    var hooks = self.router.getHooks(hook, name);
    routerHooks = routerHooks.concat(hooks);
  });

  var protoHooks = [];
  eachHook(function (hook) {
    var hooks = collectInheritedHooks(self.constructor, hook);
    protoHooks = protoHooks.concat(hooks);
  });

  var thisHooks = [];
  eachHook(function (hook) {
    if (_.has(self, hook)) {
      var hooks = getHookValues(self[hook]);
      thisHooks = thisHooks.concat(hooks);
    }
  });

  var routeHooks = [];
  if (self.route) {
    eachHook(function (hook) {
      var hooks = getHookValues(self.route.options[hook]);
      routeHooks = routeHooks.concat(hooks);
    });
  }

  var allHooks = routerHooks
    .concat(routeHooks)
    .concat(protoHooks)
    .concat(thisHooks);

  return allHooks;
};

RouteController.prototype.runHooks = function (/* hook, alias1, ...*/ ) {
  var hooks = this._collectHooks.apply(this, arguments);
  for (var i = 0, l = hooks.length; i < l; i++) {
    var h = hooks[i];
    h.call(this);
  }
};

Iron.RouteController = RouteController;
