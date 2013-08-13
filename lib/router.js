/**
 * The main Router class which runs on both client and server.
 *
 * @constructor IronRouter
 * @exports IronRouter
 * @param {Object} [options]
 * @api public
 */

IronRouter = function (options) {
  this.configure(options);

  /**
   * The routes array which doubles as a named route index by adding
   * properties to the array.
   *
   * @api public
   */
  this.routes = [];

  /**
   * The current context. This is set anytime a new route is dispatched. It's
   * a reactive variable which you can get by calling Router.current();
   *
   * @api private
   */
  this._current = null;

  /**
   * Dependency to track dependencies on this._current
   *
   * @api private
   */
  this._deps = new Deps.Dependency;
};


IronRouter.prototype = {
  typeName: 'IronRouter',

  constructor: IronRouter,

  /**
   * Configure instance with options. This can be called at any time. If the
   * instance options object hasn't been created yet it is created here.
   *
   * @param {Object} options
   * @return {IronRouter}
   * @api public
   */

  configure: function (options) {
    this.options = this.options || {};
    _.extend(this.options, options);
    return this;
  },

  /**
   * Convenience function to define a bunch of routes at once. In the future we
   * might call the callback with a custom dsl.
   *
   * Example:
   *  Router.map(function () {
   *    this.route('posts');
   *  });
   *
   *  @param {Function} cb
   *  @return {IronRouter}
   *  @api public
   */

  map: function (cb) {
    RouterUtils.assert(_.isFunction(cb),
           'map requires a function as the first parameter');
    cb.call(this);
    return this;
  },

  /**
   * Define a new route. You must name the route, but as a second parameter you
   * can either provide an object of options or a Route instance.
   *
   * @param {String} name The name of the route
   * @param {Object} [options] Options to pass along to the route
   * @param {Function} [handler] A handler function for the route. This usually
   * isn't required as a handler is automatically created for you if one doesn't
   * exist. Behavior is different on client and server.
   * @return {Route}
   * @api public
   */

  route: function (name, options, handler) {
    var route;

    RouterUtils.assert(_.isString(name), 'name is a required parameter');
    
    if (options instanceof Route)
      route = options;
    else
      route = new Route(this, name, options, handler);

    this.routes[name] = route;
    this.routes.push(route);
    return route;
  },

  /**
   * Returns a path for a given routeName and params object. Used in Handlebars
   * path helper for example.
   *
   * Example:
   *  Router.route('postShow', {path: '/posts/:id'});
   *  Router.path('postShow', {id: 5, query: {q: 'search'}) =>
   *  '/posts/5?q=search'
   * 
   * @param {String} routeName The name of the route to use.
   * @param {Array|Object} params
   * @return {String}
   * @api public
   */

  //XXX fix up error handling here.
  path: function (routeName, params) {
    RouterUtils.assert(this.routes[routeName],
     'You called Router.path for a route named ' + routeName + ' but that that route doesn\'t seem to exist. Are you sure you created it?');
    return this.routes[routeName].path(params);
  },

  /**
   * Returns a full url for a given routeName and params object. Used in
   * Handlebars url helper for example.
   *
   * Example:
   *  Router.route('postShow', {path: '/posts/:id'});
   *  Router.url('postShow', {id: 5, query: {q: 'search'}) =>
   *  'http://www.eventedmind.com/posts/5?q=search'
   */

  url: function (routeName, params) {
    RouterUtils.assert(this.routes[routeName], 'url: No route found named ' + routeName);
    return this.routes[routeName].url(params);
  },

  /**
   * Finds a route for the given path and runs it if found. If the route is
   * found but is for a different environment (client vs. server) the
   * onUnhandled function is called. If the route is not found at all (on client
   * or server) the onRouteNotFound method is called. These functions are
   * overridden on the client and server IronRouters.
   *
   * @param {String} path The path to dispatch
   * @param {Object} [options] Options to pass along to the onRun method
   * @param {Function} [cb] Optional callback to call if the path was 
   * successfully dispatched. Note that if a redirect occurs the original 
   * callback will not be called.
   * @param {Function} [onUnhandled] Optional override for onUnhandled function.
   * For example, the client router overrides this to unhook client event
   * handlers and make a request to the server.
   * @return {IronRouter}
   * @api public
   */

  dispatch: function (path, options, cb, onUnhandled) {
    var self = this
      , routes = self.routes
      , route
      , where = Meteor.isClient ? 'client' : 'server'
      , i = 0;

    function next () {
      route = routes[i++];
      onUnhandled = onUnhandled || self.onUnhandled;

      if (!route) {
        return self.onRouteNotFound(path, options);
      }

      if (route.test(path)) {
        if (route.where !== where) 
          return onUnhandled(path, options);
        self.run(path, route, options, cb, onUnhandled);
      } else next();
    }

    next();
    return this;
  },

  /**
   * Creates a new RouteContext and runs the given route for the given path by
   * calling the onRun method of the router. After onRun completes, if the
   * context hasn't changed in the mean time (i.e. the route handler calls run
   * again before this function has completed), the deps.changed() method is called
   * causing callers that are dependent on Router.current() to be rerun. This
   * method also double checks that the given route is supposed to be run in the
   * current environment (client or server). If not, the onUnhandled function of
   * router is called. Typically, this method shouldn't be called directly. You
   * should be calling the dispatch method instead.
   *
   * @param {String} path
   * @param {Route} route
   * @param {Object} [options]
   * @param {Function} [cb] Optional callback to call if the path was 
   * successfully dispatched. Note that if a redirect occurs the original 
   * callback will not be called.
   * @param {Function} [onUnhandled] Optional override for onUnhandled function.
   * For example, the client router overrides this to unhook client event
   * handlers and make a request to the server.
   * @return {IronRouter}
   * @api public
   */

  run: function (path, route, options, cb, onUnhandled) {
    var self = this
      , context
      , controller
      , where = Meteor.isClient ? 'client' : 'server';

    RouterUtils.assert(path, 'You must run with a path');
    RouterUtils.assert(route, 'You must provide a route to the run method');

    // one last check to see if we should handle the route here
    onUnhandled = onUnhandled || self.onUnhandled;
    if (route.where != where)
      onUnhandled && onUnhandled(path, options);

    context = new RouteContext(path, this, route, options);
    controller = this.getControllerForContext(context, options);

    this._current = context;

    this.onRun(controller, context, options);

    if (context == this._current) {
      cb && cb(context);
      this._deps.changed();
    }
    return this;
  },

  /**
   * Get a controller instance for the given action, context and options. There
   * are four cases:
   *
   *  1) handler is defined directly on a route
   *  2) controller option is defined on the route
   *  3) intelligently find the controller class in global namespace
   *  4) create a new anonymous controller
   *
   * @param {String} action
   * @param {RouteContext} context
   * @param {Object} [options]
   * @return {RouteController}
   * @api private
   */

  getControllerForContext: function (context, options) {
    var handler
      , controllerClass
      , controller
      , action
      , routeName;

    var classify = function (name) {
      return RouterUtils.classify(name);
    };

    var getControllerFromWindow = function (name) {
      var controller = window[name];
      if (typeof controller === 'undefined')
        throw new Error('controller "' + name + '" is not defined on window');
      return controller;
    };

    action = context.action = context.action || 'run';

    // case 1: handler defined directly on the route
    if (handler = (context.route && context.route.handler)) {
      controller = new RouteController(context, options);
      controller[action] = handler;
      return controller;
    }

    // case 2: controller option is defined on the route
    if (context.controller) {
      controllerClass = _.isString(context.controller) ?
        getControllerFromWindow(context.controller) : context.controller;
      controller = new controllerClass(context, options);
      return controller;
    }

    // case 3: intelligently find the controller class in global namespace
    routeName = context.route && context.route.name;

    if (routeName) {
      controllerClass = window[classify(routeName + 'Controller')];

      if (controllerClass) {
        controller = new controllerClass(context, options);
        return controller;
      }
    }

    // case 4: nothing found so create a default controller
    return new RouteController(context, options);
  },

  /**
   * Run a controller with a given context. Calls the before and after hooks
   * and attaches to the onRender callback to render results into the router's
   * layout.
   *
   * @param {RouteController} controller
   * @param {RouteContext} context
   * @api private
   */

  runController: function (controller, context) {
    var self = this
      , action = context.action;

    RouterUtils.assert(
      controller[action],
      'No action "' + action + '" on controller ' + controller.typeName
    );

    // Since runController can be reactive, this resets the controller to a non
    // stopped state on each run.
    controller.stopped = false;

    if (controller.isFirstRun)
      controller.onBeforeRun();
    else
      controller.onBeforeRerun();

    controller.runHooks('before');

    // if the user stopped the controller in a before filter or hook then don't
    // run the rest of the controller.
    if (controller.stopped) return;
    
    controller[action]();
    controller.runHooks('after');

    if (controller.isFirstRun)
      controller.onAfterRun();
    else
      controller.onAfterRerun();

    controller.isFirstRun = false;
  },

  /**
   * Reactive accessor for the current context.
   *
   * @return {RouteContext}
   * @api public
   */

  current: function () {
    this._deps.depend();
    return this._current;
  },

  /**
   * Called by the run method to run a context which by this point should
   * include the path and route. Should be overridden in client and server
   * routers since the behavior will be different on client vs. server.
   *
   * @param {RouteContext} context
   * @param {Object} [options]
   * @api public
   */

  onRun: function (context, options) {
    throw new Error('onRun not implemented');
  },

  /**
   * Called from the dispatch or run method when a route was found but not
   * handled in the current environment (e.g. client or server). Should be
   * overridden in client and server routers.
   *
   * @param {String} path
   * @param {Object} [options]
   * @api public
   */

  onUnhandled: function (path, options) {
    throw new Error('onUnhandled not implemented');
  },

  /**
   * Called from the dispatch method when a route was not found for the given
   * dispatched path. This method can be overridden in client and server routers
   * but doesn't have to be.
   *
   * @param {String} path
   * @param {Object} [options]
   * @api public
   */

  onRouteNotFound: function (path, options) {
    throw new Error('No route found for path: ' + path);
  }
};
