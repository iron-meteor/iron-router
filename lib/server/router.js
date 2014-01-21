var connect = Npm.require('connect');
var Fiber = Npm.require('fibers');

var root = global;

var connectHandlers
  , connect;

if (typeof __meteor_bootstrap__.app !== 'undefined') {
  connectHandlers = __meteor_bootstrap__.app;
} else {
  connectHandlers = WebApp.connectHandlers;
}

ServerRouter = Utils.extend(IronRouter, {
  constructor: function (options) {
    var self = this;
    ServerRouter.__super__.constructor.apply(this, arguments);
    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  start: function () {
    connectHandlers
      .use(connect.query())
      .use(connect.bodyParser())
      .use(_.bind(this.onRequest, this));
  },

  onRequest: function (req, res, next) {
    var self = this;
    Fiber(function () {
      self.dispatch(req.url, {
        request: req,
        response: res,
        next: next
      });
    }).run();
  },

  run: function (path, route, options, cb) {
    var self = this;
    var where = Meteor.isClient ? 'client' : 'server';
    Utils.assert(route, 'run requires a route');

    // one last check to see if we should handle the route here
    if (route.where != where) {
      self.onUnhandled(path, route.options);
      return;
    }

    this._current = route;

    route.run(path, options);

    if (route == this._current) {
      cb && cb(route);
    }
  },

  stop: function () {
  },

  onUnhandled: function (path, options) {
    options.next();
  },

  onRouteNotFound: function (path, options) {
    options.next();
  }
});

Router = new ServerRouter;
