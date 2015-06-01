var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;
var assert = Iron.utils.assert;

/*****************************************************************************/
/* Both */
/*****************************************************************************/
Route = function (path, fn, options) {
  var route = function (req, res, next) {
    var controller = this;
    controller.request = req;
    controller.response = res;
    route.dispatch(req.url, controller, next);
  }

  if (typeof fn === 'object') {
    options = fn;
    fn = options.action;
  }

  options = options || {};

  if (typeof path === 'string' && path.charAt(0) !== '/') {
    path = options.path ? options.path : '/' + path
  }

  // extend the route function with properties from this instance and its
  // prototype.
  _.extend(route, this.constructor.prototype);

  // always good to have options
  options = route.options = options || {};

  // the main action function as well as any HTTP VERB action functions will go
  // onto this stack.
  route._actionStack = new MiddlewareStack;

  // any before hooks will go onto this stack to make sure they get executed
  // before the action stack.
  route._beforeStack = new MiddlewareStack;
  route._beforeStack.append(route.options.onBeforeAction);
  route._beforeStack.append(route.options.before);

  // after hooks get run after the action stack
  route._afterStack = new MiddlewareStack;
  route._afterStack.append(route.options.onAfterAction);
  route._afterStack.append(route.options.after);


  // track which methods this route uses
  route._methods = {};

  if (typeof fn === 'string') {
    route._actionStack.push(path, _.extend(options, {
      template: fn
    }));
  } else if (typeof fn === 'function' || typeof fn === 'object') {
    route._actionStack.push(path, fn, options);
  }

  route._path = path;
  return route;
};

/**
 * The name of the route is actually stored on the handler since a route is a
 * function that has an unassignable "name" property.
 */
Route.prototype.getName = function () {
  return this.handler && this.handler.name;
};

/**
 * Returns an appropriate RouteController constructor the this Route.
 *
 * There are three possibilities:
 *
 *  1. controller option provided as a string on the route
 *  2. a controller in the global namespace with the converted name of the route
 *  3. a default RouteController
 *
 */
Route.prototype.findControllerConstructor = function () {
  var self = this;

  var resolve = function (name, opts) {
    opts = opts || {};
    var C = Iron.utils.resolve(name);
    if (!C || !RouteController.prototype.isPrototypeOf(C.prototype)) {
      if (opts.supressErrors !== true)
        throw new Error("RouteController '" + name + "' is not defined.");
      else
        return undefined;
    } else {
      return C;
    }
  };

  var convert = function (name) {
    return self.router.toControllerName(name);
  };

  var result;
  var name = this.getName();

  // the controller was set directly
  if (typeof this.options.controller === 'function')
    return this.options.controller;

  // was the controller specified precisely by name? then resolve to an actual
  // javascript constructor value
  else if (typeof this.options.controller === 'string')
    return resolve(this.options.controller);

  // is there a default route controller configured?
  else if (this.router && this.router.options.controller) {
    if (typeof this.router.options.controller === 'function')
      return this.router.options.controller;

    else if (typeof this.router.options.controller === 'string')
      return resolve(this.router.options.controller);
  }

  // otherwise do we have a name? try to convert the name to a controller name
  // and resolve it to a value
  else if (name && (result = resolve(convert(name), {supressErrors: true})))
    return result;

  // otherwise just use an anonymous route controller
  else
    return RouteController;
};


/**
 * Create a new controller for the route.
 */
Route.prototype.createController = function (options) {
  options = options || {};
  var C = this.findControllerConstructor();
  options.route = this;
  var instance = new C(options);
  return instance;
};

Route.prototype.setControllerParams = function (controller, url) {
};

/**
 * Dispatch into the route's middleware stack.
 */
Route.prototype.dispatch = function (url, context, done) {
  // call runRoute on the controller which will behave similarly to the previous
  // version of IR.
  assert(context._runRoute, "context doesn't have a _runRoute method");
  return context._runRoute(this, url, done);
};

/**
 * Returns a relative path for the route.
 */
Route.prototype.path = function (params, options) {
  return this.handler.resolve(params, options);
};

/**
 * Return a fully qualified url for the route, given a set of parmeters and
 * options like hash and query.
 */
Route.prototype.url = function (params, options) {
  var path = this.path(params, options);
  var host = (options && options.host) || Meteor.absoluteUrl();

  if (host.charAt(host.length-1) === '/');
    host = host.slice(0, host.length-1);
  return host + path;
};

/**
 * Return a params object for the route given a path.
 */
Route.prototype.params = function (path) {
  return this.handler.params(path);
};

/**
 * Add convenience methods for each HTTP verb.
 *
 * Example:
 *  var route = router.route('/item')
 *    .get(function () { })
 *    .post(function () { })
 *    .put(function () { })
 */
_.each(HTTP_METHODS, function (method) {
  Route.prototype[method] = function (fn) {
    // track the method being used for OPTIONS requests.
    this._methods[method] = true;

    this._actionStack.push(this._path, fn, {
      // give each method a unique name so it doesn't clash with the route's
      // name in the action stack
      name: this.getName() + '_' + method.toLowerCase(),
      method: method,

      // for now just make the handler where the same as the route, presumably a
      // server route.
      where: this.handler.where,
      mount: false
    });

    return this;
  };
});

Iron.Route = Route;
