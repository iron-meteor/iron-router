var env = process.env.NODE_ENV || 'development';

/**
 * Server specific initialization.
 */
Router.prototype.init = function (options) {};

/**
 * Add the router to the server connect handlers.
 */
Router.prototype.start = function () {
  WebApp.connectHandlers.use(this);
};

/**
 * Create a new controller and dispatch into the stack.
 */
Router.prototype.dispatch = function (url, options) {
  var self = this;

  options = options || {};

  // assumes there is only one router
  var controller = this.createController(url, options);
  options.thisArg = controller;

  // save away the original
  var done = options.next;

  options.next = function (err) {
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
    if (!controller.isHandled() && !controller.isHandledOnClient()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      msg = req.method + ' ' + req.originalUrl + ' not found.';
      console.error(msg);
      if (req.method == 'HEAD')
        return res.end();
      res.end(msg + '\n');
      return;
    }

    // nothing else handled? punt out to the next Connect middleware handler
    // which is probably Meteor.
    // XXX what happens if we call this.response.end and then this calls into
    // the next middleware handler?
    if (done)
      done(err);
  };

  controller.dispatch(url, this._stack, options);
};
