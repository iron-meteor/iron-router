IronRouter = function (options) {
  this.configure(options);

  /**
   * The routes array which doubles as a named route index by adding
   * properties to the array.
   *
   * @api public
   */
  this.routes = [];
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
    Utils.assert(_.isFunction(cb),
           'map requires a function as the first parameter');
    cb.call(this);

    //XXX check whether they've put a catch all route at the bottom
    //and if not, maybe automatically add a catch all route and attach to
    //notFound template? This is typically what the user expects.
    return this;
  },

  /**
   * Define a new route. You must name the route, but as a second parameter you
   * can either provide an object of options or a Route instance.
   *
   * @param {String} name The name of the route
   * @param {Object} [options] Options to pass along to the route
   * @return {Route}
   * @api public
   */

  route: function (name, options) {
    var route;

    Utils.assert(_.isString(name), 'name is a required parameter');
    
    if (options instanceof Route)
      route = options;
    else
      route = new Route(this, name, options);

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
    Utils.assert(this.routes[routeName],
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
    Utils.assert(this.routes[routeName], 
      'You called Router.url for a route named "' + routeName + '" but that route doesn\'t seem to exist. Are you sure you created it?');

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

  dispatch: function (path, options, cb) {
    var self = this
      , routes = self.routes
      , route
      , controller
      , where = Meteor.isClient ? 'client' : 'server'
      , i = 0;

    function next () {
      route = routes[i++];

      if (!route) {
        return self.onRouteNotFound(path, options);
      }

      if (route.test(path)) {
        if (route.where !== where) 
          return self.onUnhandled(path, options);

        var controller = route.getController(path, options);
        self.run(controller, cb);
      } else {
        next();
      }
    }

    next();
  },

  run: function (controller, cb) {
    var self = this
      , where = Meteor.isClient ? 'client' : 'server';

    Utils.assert(controller, 'run requires a controller');

    // one last check to see if we should handle the route here
    if (controller.where != where) {
      self.onUnhandled(controller.path, controller.options);
      return;
    }

    // move from client to base
    if (this._currentController)
      this._currentController.runHooks('unload');

    this._currentController = controller;

    if (this.options.onRun)
      this.options.onRun.call(controller);
    else
      controller.runActionWithHooks();
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
    throw new Error('Oh no! No route found for path: "' + path + '"');
  }
};
