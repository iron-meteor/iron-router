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
    assert(this.routes[routeName], 'path: No route found named ' + routeName);
    return this.routes[routeName].path(params);
  },

  url: function (routeName, params) {
    assert(this.routes[routeName], 'url: No route found named ' + routeName);
    return this.routes[routeName].url(params);
  },

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
  },

  run: function (path, route, options, cb, onUnhandled) {
    var self = this
      , context
      , where = Meteor.isClient ? 'client' : 'server';

    assert(path, 'You must run with a path');
    assert(route, 'You must provide a route to the run method');

    // one last check to see if we should handle the route here
    onUnhandled = onUnhandled || self.onUnhandled;
    if (route.where != where)
      onUnhandled && onUnhandled(path, options);

    context = new RouteContext(path, this, route, options);

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

  onUnhandled: function (path, options) {
    throw new Error('onUnhandled not implemented');
  },

  onRouteNotFound: function (path, options) {
    throw new Error('No route found for path: ' + path);
  }
});
