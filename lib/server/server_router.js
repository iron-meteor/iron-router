var connect = Npm.require('connect');
var Fiber = Npm.require('fibers');

var root = global;

IronServerRouter = extend(IronRouter, {
  constructor: function () {
    var self = this;
    IronServerRouter.__super__.constructor.apply(this, arguments);
    this.start();
  },

  onRun: function (context, options) {
    var self = this
      , response = context.options.response
      , routeName = context.route.name
      , handler = context.route.handler
      , controllerName
      , Controller = options.controller
      , controller
      , action = options.action || 'run'
      , run;

    if (handler) {
      run = function () {
        var controller = new RouteController(context, options);

        try {
          handler.call(controller);
        } finally {
          response.end();
        }
      };
    } else if (Controller) {
      run = function () {
        Controller = _.isString(Controller) ? root[Controller] : Controller;
        controller = new Controller(context, options);

        try {
          controller[action]();
        } finally {
          response.end();
        }
      };
    } else if (Controller = root[classify(routeName + 'Controller')]) {
      run = function () {
        controller = new Controller(context, options);
        try {
          controller[action]();
        } finally {
          response.end();
        }
      };
    } else {
      run = function () {
        controller = new RouteController(context, options);
        try {
          controller.run();
        } finally {
          response.end();
        }
      };
    }

    run();
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
    //XXX unclear what we do here. can we unhook the middleware from connect
    //somehow?
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
