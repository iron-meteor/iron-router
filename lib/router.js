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

  dispatch: function (path, state, cb) {
    var self = this
      , routes = self.routes
      , route
      , i = 0;

    function next () {
      route = routes[i++];
      if (!route) return self.onUnhandled(path, state);
      if (route.test(path)) {
        self.run(path, route, state, cb);
      } else next();
    }

    next();
  },

  run: function (path, route, state, cb) {
    var self = this
      , context;

    assert(path, 'You must run with a path');
    assert(route, 'You must provide a route to the run method');

    context = new RouteContext(path, this, route, state);

    this._current = context;
    this.onRun(context, _.extend({}, self.options, route.options));

    if (context == this._current) {
      cb && cb(context);
      this._deps.changed();
    }
  },

  current: function () {
    this._deps.depend();
    return this._current;
  },

  onRun: function (context, options) {
    throw new Error('onRun not implemented');
  },

  onUnhandled: function (path, state) {
    throw new Error('Unhandled path: ' + path);
  }
});
