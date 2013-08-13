//XXX rewrite to use new onRun functionality. Maybe move onRun into base class.
var connect = Npm.require('connect');
var Fiber = Npm.require('fibers');

var root = global;

ServerRouter = RouterUtils.extend(IronRouter, {
  constructor: function () {
    var self = this;
    IronServerRouter.__super__.constructor.apply(this, arguments);
    this.start();
  },

  onRun: function (controller, context, options) {
    var response = context.options.response;

    try {
      this.runController(controller, context);
    } finally {
      response.end();
    }
  },

  start: function () {
    __meteor_bootstrap__.app
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

// @export Router
Router = new IronServerRouter;
