function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

IronRouter = Class.extends({
  initialize: function (options) {
    this.configure(options);
    this.routes = [];
    this._current = null;
    this._deps = new Deps.Dependency;
    this.initialize();
  },

  configure: function (options) {
    this.options = this.options || {};
    _.extend(this.options, options);
  },

  map: function (cb) {
    assert(_.isFunction(cb),
           'map requires a function as the first parameter');
    cb.call(this);
  },

  route: function (name, options, handler) {
    var route;

    assert(_.isString(name), 'name is a required parameter');
    
    if (options instanceof Route)
      route = options;
    else
      route = new Route(this, name, options, handler);

    this.routes[name] = route;
    this.routes.push(route);
    return route;
  },

  path: function (routeName, params) {
    assert(this.routes[routeName], 'No route found named ' + routeName);
    return this.routes[routeName].path(params);
  },

  url: function (routeName, params) {
    assert(this.routes[routeName], 'No route found named ' + routeName);
    return this.routes[routeName].url(params);
  },

  dispatch: function (path, context, cb) {
    var self = this
      , routes = self.routes
      , route;

    function next () {
      route = routes[i++];
      if (!route) return self.onUnhandled(url, context);
      if (route.test(url)) {
        self.run(route, _.extend(context, { path: path }), cb);
      } else next();
    }

    next();
  },

  run: function (route, context) {
    assert(route, 'You must provide a route to the run method');

    context = _.extend(context || {}, {
      router: this,
      route: route,
      params: route.params(context.path),
      options: _.extend({}, this.options, route.options);
    });

    this._current = context;

    function handle () {
      self.onRun(context);

      if (context == self._current) {
        cb && cb(context);
        self._deps.changed();
      }
    }

    if (computation = Deps.currentComputation) {
      computation.onInvalidate(handle);
      computation.stop();
    } else handle();
  },

  current: function () {
    this._deps.depend();
    return this._current;
  },

  onRun: function (context) {
    throw new Error('onRun not implemented');
  },

  onUnhandled: function (context) {
    throw new Error(context.path + ' not handled');
  }
});
