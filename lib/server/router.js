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

  run: function (controller, cb) {
    var self = this;
    var where = Meteor.isClient ? 'client' : 'server';

    Utils.assert(controller, 'run requires a controller');

    // one last check to see if we should handle the route here
    if (controller.where != where) {
      self.onUnhandled(controller.path, controller.options);
      return;
    }

    if (this._currentController)
      this._currentController.runHooks('unload');

    this._currentController = controller;
    controller.runHooks('load');
    controller.run();

    if (controller == this._currentController) {
      cb && cb(controller);
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
