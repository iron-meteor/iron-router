Tinytest.add('Router - createController', function (test) {
  test.ok();
});

Tinytest.add('Router - dispatch and current', function (test) {
  var calls = [];
  var call;
  var origDispatch = Iron.RouteController.prototype.dispatch;

  Iron.RouteController.prototype.dispatch = function (url, stack, opts) {
    calls.push({
      opts: opts,
      thisArg: this,
      url: url,
      stack: stack
    });
  };

  try {
    var router = new Iron.Router({autoRender: false, autoStart: false});
    var req = {url: '/test'}, res = {}, next = function () {};
    var current;

    if (Meteor.isClient) {
      Deps.autorun(function (c) {
        current = router.current();
      });

      router(req, res, next);

      test.equal(calls.length, 1, 'RouteController dispatch method called');
      call = calls[0];
      test.equal(call.url, '/test', 'dispatch url is set');
      test.instanceOf(call.thisArg, Iron.RouteController, 'thisArg is a RouteController');
      test.instanceOf(call.stack, Iron.MiddlewareStack, 'stack is a MiddlewareStack');
      
      var opts = call.opts;
      test.equal(opts.req, req, 'options request is set');
      test.equal(opts.res, res, 'options response is set');
      test.instanceOf(opts.thisArg, Iron.RouteController, 'thisArg set to controller');

      test.isNull(current, 'current is null until a flush');
      Deps.flush();
      test.instanceOf(current, Iron.RouteController, 'current is instance of Iron.RouteController');

      var oldCurrent = current;

      var stopped = false;
      oldCurrent.stop = function () { stopped = true; };

      router(req, res, next);
      test.isTrue(stopped, 'previous controller stopped');
      Deps.flush();
      test.isTrue(oldCurrent !== current, 'current controller is not the old controller');
    }

    if (Meteor.isServer) {
      router(req, res, next);

      test.equal(calls.length, 1, 'RouteController dispatch method called');
      call = calls[0];
      test.equal(call.url, '/test', 'dispatch url is set');
      test.instanceOf(call.thisArg, Iron.RouteController, 'thisArg is a RouteController');
      test.instanceOf(call.stack, Iron.MiddlewareStack, 'stack is a MiddlewareStack');
      
      var opts = call.opts;
      test.equal(opts.req, req, 'options request is set');
      test.equal(opts.res, res, 'options response is set');
      test.instanceOf(opts.thisArg, Iron.RouteController, 'thisArg set to controller');
    }
  } finally {
    Iron.RouteController.prototype.dispatch = origDispatch;
  }
});

Tinytest.add('Router - dispatch error handling', function (test) {
});
