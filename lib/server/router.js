//XXX This is completely broken now with the new API!

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
  constructor: function () {
    var self = this;
    ServerRouter.__super__.constructor.apply(this, arguments);
    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  run: function (controller, cb, onUnhandled) {
    var response = context.options.response;

    try {
      this.runController(controller, context);
    } finally {
      response.end();
    }
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
