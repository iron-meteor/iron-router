Tinytest.add('Router - createController', function (test) {
  test.ok();
});

// XXX: this test fails on the server because of the check that a single route
//   must be defined or the server short-circuits and displays an error.
Meteor.isClient && Tinytest.add('Router - dispatch - current', function (test) {
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
    var req = {url: '/test'};
    var res = {
      setHeader: function () {},
      end: function () {}
    };
    var next = function () {};
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

    // XXX FIXME
    if (Meteor.isServer) {
      router(req, res, next);

      if (calls.length < 1) {
        test.fail("dispatch call was not made");
      } else {
        var call = calls[0];
        var current = calls[0].thisArg;
        test.instanceOf(current, Iron.RouteController, 'thisArg is a RouteController');
        test.equal(current.request, req, 'request is set');
        test.equal(current.response, res, 'response is set');
        test.instanceOf(call.stack, Iron.MiddlewareStack, 'stack is a MiddlewareStack');
      }
    }
  } finally {
    Iron.RouteController.prototype.dispatch = origDispatch;
  }
});

if (Meteor.isClient) {
  Tinytest.add('Router - dispatch - same route', function (test) {
    // if we go from one url to the next and its the same route, we don't
    // need to create a new controller instance. this tests that we keep
    // the same controller around, and that the getParams dep works
    // correctly.
    //
    // the rules are that the controller's computation should be the same
    // and the action function should rerun. how do we test helper dependency?
    // we can do that in dynamic template.

    var calls = [];
    var router = new Iron.Router({autoRender: false, autoStart: false});
    var prevComp;
    var newComp;

    router.route('/items/:id', function () {
      calls.push({
        thisArg: this,
        id: this.params.id
      });
    });

    var prevController;

    prevController = router.dispatch('/items/1', {});
    prevComp = prevController._computation;
    Deps.flush();
    test.isTrue(calls[0], "action function not called");
    test.equal(calls[0].id, "1", "this.params.id is incorrect");

    var getParamsValues = [];
    Tracker.autorun(function () {
      getParamsValues.push(prevController.getParams());
    });

    test.isTrue(getParamsValues[0], 'no params from getParams()');
    test.equal(getParamsValues[0].id, "1", "id param is incorrect");

    newController = router.dispatch('/items/2', {});
    newComp = newController._computation;
    Deps.flush();
    test.isTrue(calls[1], "action function not called");
    test.equal(calls[1].id, "2", "this.params.id is incorrect");

    test.isTrue(getParamsValues[1], 'no params from getParams()');
    test.equal(getParamsValues[1].id, "2", "id param is incorrect");

    test.equal(newController, prevController, "new controller should be the same instance as the old controller");
    test.notEqual(prevComp, newComp, "new computation should have been created");
  });
}

Tinytest.add('Router - dispatch - error handling', function (test) {
  // TODO?
});

Tinytest.add('Router - dispatch - notFound and unhandled', function (test) {
  // TODO?
});

if (Meteor.isClient) {
  // See https://github.com/EventedMind/iron-router/issues/869
  // XXX this test should be fixed so that it produces the same outcome. right now it only passes on the first one
  // and it's changing the url which it should not do. maybe this means we need to mock out the location.go stuff, or
  // have an option where the url doesn't change in iron:location?
  /*
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
  */
}
