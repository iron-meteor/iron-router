/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var MiddlewareStack = Iron.MiddlewareStack;
var Url = Iron.Url;
var Layout = Iron.Layout;
var warn = Iron.utils.warn;
var assert = Iron.utils.assert;

Router = function (options) {
  // keep the same api throughout which is:
  // fn(url, context, done);
  function router (req, res, next) {
    //XXX this assumes no other routers on the parent stack which we should probably fix
    router.dispatch(req.url, {
      request: req,
      response: res
    }, next);
  }

  // the main router stack
  router._stack = new MiddlewareStack;

  // for storing global hooks like before, after, etc.
  router._globalHooks = {};

  // backward compat and quicker lookup of Route handlers vs. regular function
  // handlers.
  router.routes = [];

  // to make sure we don't have more than one route per path
  router.routes._byPath = {};

  // always good to have options
  this.configure.call(router, options);

  // add proto properties to the router function
  _.extend(router, this.constructor.prototype);

  // let client and server side routing doing different things here
  this.init.call(router, options);

  Meteor.startup(function () {
    Meteor.defer(function () {
      if (router.options.autoStart !== false)
        router.start();
    });
  });

  return router;
};

Router.prototype.init = function (options) {};

Router.prototype.configure = function (options) {
  var self = this;

  options = options || {};

  var toArray = function (value) {
    if (!value)
      return [];

    if (_.isArray(value))
      return value;

    return [value];
  };

  // e.g. before: fn OR before: [fn1, fn2]
  _.each(Iron.Router.HOOK_TYPES, function eachHookType (type) {
    if (options[type]) {
      _.each(toArray(options[type]), function eachHook (hook) {
        self.addHook(type, hook);
      });

      delete options[type];
    }
  });

  this.options = this.options || {};
  _.extend(this.options, options);

  return this;
};

/**
 * Just to support legacy calling. Doesn't really serve much purpose.
 */
Router.prototype.map = function (fn) {
  return fn.call(this);
};

/*
 * XXX removing for now until this is thought about more carefully.
Router.prototype.use = function (path, fn, opts) {
  if (typeof path === 'function') {
    opts = fn || {};
    opts.mount = true;
    opts.where = opts.where || 'server';
    this._stack.push(path, opts);
  } else {
    opts = opts || {};
    opts.mount = true;
    opts.where = opts.where || 'server';
    this._stack.push(path, fn, opts);
  }

  return this;
};
*/

//XXX seems like we could put a params method on the route directly and make it reactive
Router.prototype.route = function (path, fn, opts) {
  var typeOf = function (val) { return Object.prototype.toString.call(val); };
  assert(typeOf(path) === '[object String]' || typeOf(path) === '[object RegExp]', "Router.route requires a path that is a string or regular expression.");

  if (typeof fn === 'object') {
    opts = fn;
    fn = opts.action;
  }

  var route = new Route(path, fn, opts);

  opts = opts || {};

  // don't mount the route
  opts.mount = false;

  // stack expects a function which is exactly what a new Route returns!
  var handler = this._stack.push(path, route, opts);

  handler.route = route;
  route.handler = handler;
  route.router = this;

  assert(!this.routes._byPath[handler.path],
    "A route for the path " + JSON.stringify(handler.path) + " already exists by the name of " + JSON.stringify(handler.name) + ".");
  this.routes._byPath[handler.path] = route;

  this.routes.push(route);

  if (typeof handler.name === 'string')
    this.routes[handler.name] = route;

  return route;
};

/**
 * Find the first route for the given url and options.
 */
Router.prototype.findFirstRoute = function (url) {
  var isMatch;
  var route;
  for (var i = 0; i < this.routes.length; i++) {
    route = this.routes[i];

    // only matches if the url matches AND the
    // current environment matches.
    isMatch = route.handler.test(url, {
      where: Meteor.isServer ? 'server' : 'client'
    });

    if (isMatch)
      return route;
  }

  return null;
};

Router.prototype.path = function (routeName, params, options) {
  var route = this.routes[routeName];
  warn(route, "You called Router.path for a route named " + JSON.stringify(routeName) + " but that route doesn't seem to exist. Are you sure you created it?");
  return route && route.path(params, options);
};

Router.prototype.url = function (routeName, params, options) {
  var route = this.routes[routeName];
  warn(route, "You called Router.url for a route named " + JSON.stringify(routeName) + " but that route doesn't seem to exist. Are you sure you created it?");
  return route && route.url(params, options);
};

/**
 * Create a new controller for a dispatch.
 */
Router.prototype.createController = function (url, context) {
  // see if there's a route for this url and environment
  // it's possible that we find a route but it's a client
  // route so we don't instantiate its controller and instead
  // use an anonymous controller to run the route.
  var route = this.findFirstRoute(url);
  var controller;

  context = context || {};

  if (route)
    // let the route decide what controller to use
    controller = route.createController({layout: this._layout});
  else
    // create an anonymous controller
    controller = new RouteController({layout: this._layout});

  controller.router = this;
  controller.configureFromUrl(url, context, {reactive: false});
  return controller;
};

Router.prototype.setTemplateNameConverter = function (fn) {
  this._templateNameConverter = fn;
  return this;
};

Router.prototype.setControllerNameConverter = function (fn) {
  this._controllerNameConverter = fn;
  return this;
};

Router.prototype.toTemplateName = function (str) {
  if (this._templateNameConverter)
    return this._templateNameConverter(str);
  else
    return Iron.utils.classCase(str);
};

Router.prototype.toControllerName = function (str) {
  if (this._controllerNameConverter)
    return this._controllerNameConverter(str);
  else
    return Iron.utils.classCase(str) + 'Controller';
};

/**
 *
 * Add a hook to all routes. The hooks will apply to all routes,
 * unless you name routes to include or exclude via `only` and `except` options
 *
 * @param {String} [type] one of 'load', 'unload', 'before' or 'after'
 * @param {Object} [options] Options to controll the hooks [optional]
 * @param {Function} [hook] Callback to run
 * @return {IronRouter}
 * @api public
 *
 */

Router.prototype.addHook = function(type, hook, options) {
  var self = this;

  options = options || {};

  var toArray = function (input) {
    if (!input)
      return [];
    else if (_.isArray(input))
      return input;
    else
      return [input];
  }

  if (options.only)
    options.only = toArray(options.only);
  if (options.except)
    options.except = toArray(options.except);

  var hooks = this._globalHooks[type] = this._globalHooks[type] || [];

  var hookWithOptions = function () {
    var thisArg = this;
    var args = arguments;
    // this allows us to bind hooks to options that get looked up when you call
    // this.lookupOption from within the hook. And it looks better to keep
    // plugin/hook related options close to their definitions instead of
    // Router.configure. But we use a dynamic variable so we don't have to
    // pass the options explicitly as an argument and plugin creators can
    // just use this.lookupOption which will follow the proper lookup chain from
    // "this", local options, dynamic variable options, route, router, etc.
    return CurrentOptions.withValue(options, function () {
      return self.lookupHook(hook).apply(thisArg, args);
    });
  };

  hooks.push({options: options, hook: hookWithOptions});
  return this;
};

/**
 * If the argument is a function return it directly. If it's a string, see if
 * there is a function in the Iron.Router.hooks namespace. Throw an error if we
 * can't find the hook.
 */
Router.prototype.lookupHook = function (nameOrFn) {
  var fn = nameOrFn;

  // if we already have a func just return it
  if (_.isFunction(fn))
    return fn;

  // look up one of the out-of-box hooks like
  // 'loaded or 'dataNotFound' if the nameOrFn is a
  // string
  if (_.isString(fn)) {
    if (_.isFunction(Iron.Router.hooks[fn]))
      return Iron.Router.hooks[fn];
  }

  // we couldn't find it so throw an error
  throw new Error("No hook found named: " + nameOrFn);
};

/**
 *
 * Fetch the list of global hooks that apply to the given route name.
 * Hooks are defined by the .addHook() function above.
 *
 * @param {String} [type] one of IronRouter.HOOK_TYPES
 * @param {String} [name] the name of the route we are interested in
 * @return {[Function]} [hooks] an array of hooks to run
 * @api public
 *
 */

Router.prototype.getHooks = function(type, name) {
  var self = this;
  var hooks = [];

  _.each(this._globalHooks[type], function(hook) {
    var options = hook.options;

    if (options.except && _.include(options.except, name))
      return [];

    if (options.only && ! _.include(options.only, name))
      return [];

    hooks.push(hook.hook);
  });

  return hooks;
};

Router.HOOK_TYPES = [
  'onRun',
  'onRerun',
  'onBeforeAction',
  'onAfterAction',
  'onStop',

  // not technically a hook but we'll use it
  // in a similar way. This will cause waitOn
  // to be added as a method to the Router and then
  // it can be selectively applied to specific routes
  'waitOn',
  'subscriptions',

  // legacy hook types but we'll let them slide
  'load', // onRun
  'before', // onBeforeAction
  'after', // onAfterAction
  'unload' // onStop
];

/**
 * A namespace for hooks keyed by name.
 */
Router.hooks = {};


/**
 * A namespace for plugin functions keyed by name.
 */
Router.plugins = {};

/**
 * Auto add helper mtehods for all the hooks.
 */

_.each(Router.HOOK_TYPES, function (type) {
  Router.prototype[type] = function (hook, options) {
    this.addHook(type, hook, options);
  };
});

/**
 * Add a plugin to the router instance.
 */
Router.prototype.plugin = function (nameOrFn, options) {
  var func;

  if (typeof nameOrFn === 'function')
    func = nameOrFn;
  else if (typeof nameOrFn === 'string')
    func = Iron.Router.plugins[nameOrFn];

  if (!func)
    throw new Error("No plugin found named " + JSON.stringify(nameOrFn));

  // fn(router, options)
  func.call(this, this, options);

  return this;
};

Iron.Router = Router;
