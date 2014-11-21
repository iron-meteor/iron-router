var assert = Iron.utils.assert;

var env = process.env.NODE_ENV || 'development';

/**
 * Server specific initialization.
 */
Router.prototype.init = function (options) {};

/**
 * Give people a chance to customize the body parser
 * behavior.
 */
Router.prototype.configureBodyParsers = function () {
  Router.onBeforeAction(Iron.Router.bodyParser.json());
  Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({extended: false}));
};

/**
 * Add the router to the server connect handlers.
 */
Router.prototype.start = function () {
  WebApp.connectHandlers.use(this);
  this.configureBodyParsers();
};

/**
 * Create a new controller and dispatch into the stack.
 */
Router.prototype.dispatch = function (url, context, done) {
  var self = this;

  assert(typeof url === 'string', "expected url string in router dispatch");
  assert(typeof context === 'object', "expected context object in router dispatch");

  // assumes there is only one router
  // XXX need to initialize controller either from the context itself or if the
  // context already has a controller on it, just use that one.
  var controller = this.createController(url, context);

  controller.dispatch(this._stack, url, function (err) {
    var res = this.response;
    var req = this.request;
    var msg;

    if (err) {
      if (res.statusCode < 400) 
        res.statusCode = 500;

      if (err.status)
        res.statusCode = err.status;

      if (env === 'development')
        msg = (err.stack || err.toString()) + '\n';
      else
        //XXX get this from standard dict of error messages?
        msg = 'Server error.';

      console.error(err.stack || err.toString());

      if (res.headersSent)
        return req.socket.destroy();

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Length', Buffer.byteLength(msg));
      if (req.method === 'HEAD')
        return res.end();
      res.end(msg);
      return;
    }

    // if there are no client or server handlers for this dispatch
    // then send a 404.
    // XXX we need a solution here for 404s on bad routes.
    //     one solution might be to provide a custom 404 page in the public
    //     folder. But we need a proper way to handle 404s for search engines.
    // XXX might be a PR to Meteor to use an existing status code if it's set
    if (!controller.isHandled() && !controller.willBeHandledOnClient()) {
      return done();
      /*
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      msg = req.method + ' ' + req.originalUrl + ' not found.';
      console.error(msg);
      if (req.method == 'HEAD')
        return res.end();
      res.end(msg + '\n');
      return;
      */
    }

    // if for some reason there was a server handler but no client handler
    // and the server handler called next() we might end up here. We
    // want to make sure to end the response so it doesn't hang.
    if (controller.isHandled() && !controller.willBeHandledOnClient()) {
      res.setHeader('Content-Type', 'text/html');
      if (req.method === 'HEAD')
        res.end();
      res.end("<p>It looks like you don't have any client routes defined, but you had at least one server handler. You probably want to define some client side routes!</p>\n");
    }

    // we'll have Meteor load the normal application so long as
    // we have at least one client route/handler and the done() iterator
    // function has been passed to us, presumably from Connect.
    if (controller.willBeHandledOnClient() && done)
      return done(err);
  });
};
