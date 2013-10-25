/*****************************************************************************/
/* IronRouter */
/*****************************************************************************/
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
    _.extend(this.options, options);
    
    // e.g. before: fn OR before: [fn1, fn2]
    _.each(IronRouter.HOOK_TYPES, function(type) {
      if (self.options[type]) {
        _.each(Utils.toArray(self.options[type]), function(hook) {
          self.addHook(type, hook);
        });
        
        delete self.options[type];
      }
    });
    
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
  
  addHook: function(type, hook, options) {
    options = options || {}

    if (options.only)
      options.only = Utils.toArray(options.only);
    if (options.except)
      options.except = Utils.toArray(options.except);
      
    this._globalHooks[type].push({options: options, hook: hook});
    
    return this;
  },
  
  load: function(hook, options) {
    return this.addHook('load', hook, options);
  },

  before: function(hook, options) {
    return this.addHook('before', hook, options);
  },
  
  after: function(hook, options) {
    return this.addHook('after', hook, options);
  },
  
  unload: function(hook, options) {
    return this.addHook('unload', hook, options);
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

  path: function (routeName, params, options) {
    var route = this.routes[routeName];
    Utils.warn(route,
     'You called Router.path for a route named ' + routeName + ' but that that route doesn\'t seem to exist. Are you sure you created it?');
    return route && route.path(params, options);
  },

  url: function (routeName, params, options) {
    var route = this.routes[routeName];
    Utils.warn(route, 
      'You called Router.url for a route named "' + routeName + '" but that route doesn\'t seem to exist. Are you sure you created it?');
    return route && route.url(params, options);
  },

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
    throw new Error('run not implemented');
  },

  onUnhandled: function (path, options) {
    throw new Error('onUnhandled not implemented');
  },

  onRouteNotFound: function (path, options) {
    throw new Error('Oh no! No route found for path: "' + path + '"');
  }
};
