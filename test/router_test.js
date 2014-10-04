Tinytest.add('Router - createController', function (test) {
  test.ok();
});

Tinytest.add('Router - dispatch - current', function (test) {
  var calls = [];
  var call;
  var origDispatch = Iron.RouteController.prototype.dispatch;

  Iron.RouteController.prototype.dispatch = function (stack, url, done) {
    calls.push({
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

      test.isNull(current, 'current is null until a flush');
      Deps.flush();
      test.instanceOf(current, Iron.RouteController, 'current is instance of Iron.RouteController');
      test.equal(current.request, req, 'request is set');
      test.equal(current.response, res, 'response is set');

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

      test.equal(calls.length, 1, 'dispatch call was made');

      var call = calls[0];
      var current = calls[0].thisArg;
      test.instanceOf(current, Iron.RouteController, 'thisArg is a RouteController');
      test.equal(current.request, req, 'request is set');
      test.equal(current.response, res, 'response is set');
      test.instanceOf(call.stack, Iron.MiddlewareStack, 'stack is a MiddlewareStack');
     

    }
  } finally {
    Iron.RouteController.prototype.dispatch = origDispatch;
  }
});

Tinytest.add('Router - dispatch - error handling', function (test) {
});

Tinytest.add('Router - dispatch - notFound and unhandled', function (test) {
  // hard to test at this point as they don't pass off to functions
});

if (Meteor.isClient) {
  // See https://github.com/EventedMind/iron-router/issues/869
  // XXX @tmeasday this isn't passing for me but I can't figure out why
  Tinytest.add('Router - redirection maintains reactivity', function(test) {
    var router = new Iron.Router({autoRender: false, autoStart: false});
  
    var twoActionRan = 0;
    var dep = new Deps.Dependency;

    router.route('/one', function () {
      dep.depend();
      router.go('two');
    });

    router.route('/two', function () {
      dep.depend();
      twoActionRan += 1;
    });

    router.start();
    router.go('one');
    Deps.flush();
    test.equal(twoActionRan, 1, "redirected route action should have run once");
  
    dep.changed();
    Deps.flush();
    test.equal(twoActionRan, 2, "redirected route action should rerun if computation invalidated");
  });
}
