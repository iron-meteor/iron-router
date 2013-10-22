IronRouter = function (options) {
  var self = this;
  
  this.configure(options);

  /**
   * The routes array which doubles as a named route index by adding
   * properties to the array.
   *
   * @api public
   */
  this.routes = [];
  
  this._globalHooks = {};
  _.each(IronRouter.HOOK_TYPES, function(type) { self._globalHooks[type] = []; });
};

IronRouter.HOOK_TYPES = ['load', 'before', 'after', 'unload'];

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
    var self = this;
    
    this.options = this.options || {};
    
    // e.g. before: fn OR before: [fn1, fn2]
    _.each(IronRouter.HOOK_TYPES, function(type) {
      if (self.options[type]) {
        _.each(Utils.toArray(self.options[type]), function(hook) {
          self._globalHooks[type].push({hook: hook});
        });
        
        delete self.options[type];
      }
    });
    
    _.extend(this.options, options);
    return this;
  },


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
  
  addHook: function(type, options, hook) {
    if (_.isFunction(options)) {
      hook = options;
      options = {};
    }

    if (options.only)
      options.only = Utils.toArray(options.only);
    if (options.except)
      options.except = Utils.toArray(options.except);
    
    this._globalHooks[type].push({options: options, hook: hook});
    
    return this;
  },
  
  load: function(options, hook) {
    return this.addHook('load', options, hook);
  },

  before: function(options, hook) {
    return this.addHook('before', options, hook);
  },
  
  after: function(options, hook) {
    return this.addHook('after', options, hook);
  },
  
  unload: function(options, hook) {
    return this.addHook('unload', options, hook);
  },
  
  /**
   *
   * Fetch the list of global hooks that apply to the given route name.
   * Hooks are defined by the .addHook() function above.
   *
   * @param {String} [type] one of 'load', 'unload', 'before' or 'after'
   * @param {String} [name] the name of the route we are interested in
   * @return {[Function]} [hooks] an array of hooks to run
   * @api public
   *
   */
    
  getHooks: function(type, name) {
    var hooks = [];
    
    _.each(this._globalHooks[type], function(hook) {
      var options = hook.options;
      
      if (options.except && _.include(options.except, name))
        return;
      
      if (options.only && ! _.include(options.only, name))
        return;
      
      hooks.push(hook.hook);
    });
    
    return hooks;
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
    Utils.warn(this.routes[routeName],
     'You called Router.path for a route named ' + routeName + ' but that that route doesn\'t seem to exist. Are you sure you created it?');

    var route = this.routes[routeName];
    return route && route.path(params, options);
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
    //XXX reimplement on server
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
