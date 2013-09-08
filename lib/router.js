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
   * The current RouteController instance. This is set anytime a new route is
   * dispatched. It's a reactive variable which you can get by calling
   * Router.current();
   *
   * @api private
   */
  this._currentController = null;

  /**
   * Dependency to for this._currentController
   *
   * @api private
   */
  this._controllerDep = new Deps.Dependency;
};


IronRouter.prototype = {
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

  path: function (routeName, params, options) {
    RouterUtils.assert(this.routes[routeName],
     'You called Router.path for a route named ' + routeName + ' but that that route doesn\'t seem to exist. Are you sure you created it?');

    return this.routes[routeName].path(params, options);
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

  url: function (routeName, params, options) {
    RouterUtils.assert(this.routes[routeName], 
      'You called Router.url for a route named "' + routeName + '" but that route doesn\'t seem to exist. Are you sure you created it?');

    //XXX better handling of query params
    return this.routes[routeName].url(params, options);
  },

  /**
   * Finds a route for the given path and runs it if found. If the route is
   * found but is for a different environment (client vs. server) the
   * onUnhandled function is called. If the route is not found at all (on client
   * or server) the onRouteNotFound method is called. These functions are
   * overridden on the client and server IronRouters.
   *
   * @param {String} path The path to dispatch
   * @param {Object} [options] Options to pass along to the run method
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
      , controller
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

        var controller = route.getController(path, options);
        self.run(controller, cb, onUnhandled);
      } else {
        next();
      }
    }

    next();
  },

  run: function (controller, cb, onUnhandled) {
    var self = this
      , context
      , controller
      , action = controller.action
      , where = Meteor.isClient ? 'client' : 'server';

    RouterUtils.assert(controller, 'run requires a controller');

    // one last check to see if we should handle the route here
    onUnhandled = onUnhandled || self.onUnhandled;
    if (controller.where != where) {
      onUnhandled && onUnhandled(controller);
      return;
    }

    this._currentController = controller;
    
    RouterUtils.assert(
      controller[action],
      'Oops, no action "' + action + '" defined on RouteController');

    controller.stopped = false;
/*
    if (controller.isFirstRun)
      controller.onBeforeRun();
    else
      controller.onBeforeRerun();

    controller.runHooks('before');

    // if the user stopped the controller in a before filter or hook then don't
    // run the rest of the controller.
    if (controller.stopped) return;
*/    
    controller[action]();

/*
    controller.runHooks('after');

    if (controller.isFirstRun)
      controller.onAfterRun();
    else
      controller.onAfterRerun();
*/

    // this._currentController may have been reassigned in the onRun function
    // because the user redirected
    if (controller == this._currentController) {
      cb && cb(controller);
      this._controllerDep.changed();
    }
  },

  /**
   * Reactive accessor for the current RouteController instance. You can also
   * get a nonreactive value by specifiying {reactive: false} as an option.
   *
   * @param {Object} [opts] configuration options
   * @param {Boolean} [opts.reactive] Set to false to enable a non-reactive read.
   * @return {RouteController}
   * @api public
   */

  current: function (opts) {
    if (opts && opts.reactive === false)
      return this._currentController;
    else {
      this._controllerDep.depend();
      return this._currentController;
    }
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

  onUnhandled: function (controller) {
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
    throw new Error('Oh no! No route found for path: "' + path + '"');
  }
};
