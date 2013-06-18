function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

Router = function (options) {
  this.configure(options);
  this.routes = [];
  this._current = null;
  this._deps = new Deps.Dependency;
  this.initialize();
};

Router.prototype = {
  constructor: Router,

  initialize: function () {
    // potentially different behavior on client and server
  },

  configure: function (options) {
    this.options = this.options || {
      routeHandler: SimpleRouteHandler
    };
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

  // should we just create a context if it's not already an instance
  // of one? It's a little confusing that a context gets created in the
  // client code on replace or go
  dispatch: function (context, cb) {
    var self = this
      , routes = self.routes
      , route
      , i = 0;

    function next () {
      var current;

      route = routes[i++];

      if (!route) return self.onUnhandled(context);

      if (route.test(context.path)) {
        self.run(route, context, cb);
      } else
        next();
    }

    next();
  },

  run: function (route, context, cb) {
    var self = this
      , computation
      , handler = self.options.routeHandler
      , current;

    context = context || {};
    current = this._current = _.extend(context, {
      router: self,
      route: route,
      params: route.params(context.path),
      options: _.extend({}, this.options, route.options)
    });
   
    function handle () {
      handler(current);

      if (current == self._current) {
        cb && cb(current);
        self._deps.changed();
      }
    }

    if (computation = Deps.currentComputation) {
      computation.onInvalidate(handle);
      computation.stop();
    } else {
      handle();
    }
  },

  current: function () {
    this._deps.depend();
    return this._current;
  },

  onUnhandled: function (context) {
    throw new Error(context.path + ' not handled');
  }
};
