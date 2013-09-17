Tinytest.add('ClientRouter - start and dispatch', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var _path = IronLocation.path;
  var locationDep = new Deps.Dependency;
  var currentPath;

  // stub out the path method to simulate path changes
  IronLocation.path = function (value) {
    if (value) {
      currentPath = value;
      locationDep.changed();
    } else {
      locationDep.depend();
      return currentPath;
    }
  };

  var _dispatch = router.dispatch;
  var isDispatched = false;
  router.dispatch = function (path, options, done) {
    isDispatched = true;
  };

  router.start();
  test.isTrue(isDispatched, 'no initial dispatch');

  isDispatched = false;
  IronLocation.path('/posts');
  Deps.flush();
  test.isTrue(isDispatched, 'location dep not working');
});

Tinytest.add('ClientRouter - run with computations', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var firstController = {
    runActionWithHooks: function () {}
  };

  var secondController = {
    runActionWithHooks: function () {}
  };

  var redirectDep = new Deps.Dependency;
  var runCount = 0;
  var redirectController = {
    runActionWithHooks: function () {
      redirectDep.depend();
      runCount++;
      // normally this would be this.redirect
      // or Router.go, but since we're testing
      // the run method we'll just call it directly
      router.run(firstController);
    }
  };

  var currentController;
  var routeComputation;

  Deps.autorun(function () {
    currentController = router.current();
  });

  test.isFalse(currentController);

  router.run(firstController);
  routeComputation = router._routeComputation;
  Deps.flush();
  test.equal(currentController, firstController, 'router.current() broken');
  test.isFalse(routeComputation.stopped, 'route comp was stopped');

  router.run(secondController);
  Deps.flush();
  test.isTrue(routeComputation.stopped, 'previous comp not stopped');
  test.equal(currentController, secondController, 'current() broken');
  routeComputation = router._routeComputation;
  test.isFalse(routeComputation.stopped, 'new comp was stopped');

  router.run(redirectController);
  Deps.flush();
  test.equal(currentController, firstController, 'redirect failed');
  routeComputation = router._routeComputation;
  test.isFalse(routeComputation.stopped, 'redirect comp stopped');

  // test the previous computation was torn down
  test.equal(runCount, 1, 'base case for redirect controller');
  redirectDep.changed();
  Deps.flush();
  test.equal(runCount, 1, 'prev controller was run again');
});

Tinytest.add('ClientRouter - rendering', function (test) {
  test.ok();
});

Tinytest.add('ClientRouter - go', function (test) {
  test.ok();
});
