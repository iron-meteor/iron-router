var controller = {
  runActionWithHooks: function () {}
};

var routes = [{
  where: 'client',
  test: function (path) { return path == 'client'; },
  getController: function (path, options) { return controller; }
}, {
  where: 'server',
  test: function (path) { return path == 'server' },
  getController: function () { return controller; }
}];

if (Meteor.isClient) {
  Tinytest.add('IronRouter - client dispatch', function (test) {
    var router = new IronRouter;

    router.routes = routes;

    var runController = null;
    var runCallback = null;

    router.run = function (controller, cb) {
      runController = controller;
      runCallback = cb;
    };

    // 1. onRouteNotFound
    var onRouteNotFoundCalled = false;
    router.onRouteNotFound = function (path, options) {
      onRouteNotFoundCalled = true;
    };

    var onUnhandledCalled = false;
    router.onUnhandled = function (path, options) {
      onUnhandledCalled = true;
    };

    router.dispatch('bogus');
    test.isTrue(onRouteNotFoundCalled, 'onRouteNotFound not called');

    // 2. where !== where
    router.dispatch('server');
    test.isTrue(onUnhandledCalled, 'onUnhandled not called for server route');

    // 3. run method called
    router.dispatch('client', {}, function () {});
    test.isTrue(runController, 'run not called with a controller');
    test.isTrue(runCallback, 'run not called with a callback');
  });

  Tinytest.add('IronRouter - client run', function (test) {
    // 1. onRun option to IronRouter
    var onRunCalled = false;
    var router = new IronRouter({
      onRun: function () {
        onRunCalled = true;
      }
    });
    router.routes = routes;
    controller.where = 'client';
    router.run(controller);
    test.isTrue(onRunCalled, 'onRun option not called');

    // 2. runActionWithHooks
    var router = new IronRouter;
    router.routes = routes;

    var onUnhandledCalled = false;
    router.onUnhandled = function (path, options) {
      onUnhandledCalled = true;
    };
    controller.where = 'server';
    router.run(controller);
    test.isTrue(onUnhandledCalled, 'onUnhandled not called for server controller');
    
    controller.where = 'client';
    var runActionCalled = false;
    controller.runActionWithHooks = function () {
      runActionCalled = true;
    };
    router.run(controller);
    test.isTrue(runActionCalled, 'runActionWithHooks not called');
  });
}

if (Meteor.isServer) {
  Tinytest.add('IronRouter - server dispatch', function (test) {
    var router = new IronRouter;

    router.routes = routes;

    var runController = null;
    var runCallback = null;

    router.run = function (controller, cb) {
      runController = controller;
      runCallback = cb;
    };

    // 1. onRouteNotFound
    var onRouteNotFoundCalled = false;
    router.onRouteNotFound = function (path, options) {
      onRouteNotFoundCalled = true;
    };

    var onUnhandledCalled = false;
    router.onUnhandled = function (path, options) {
      onUnhandledCalled = true;
    };

    router.dispatch('bogus');
    test.isTrue(onRouteNotFoundCalled, 'onRouteNotFound not called');

    // 2. where !== where
    router.dispatch('client');
    test.isTrue(onUnhandledCalled, 'onUnhandled not called for client route');

    // 3. run method called
    router.dispatch('server', {}, function () {});
    test.isTrue(runController, 'run not called with a controller');
    test.isTrue(runCallback, 'run not called with a callback');
  });

  Tinytest.add('IronRouter - server run', function (test) {
    // 1. onRun option to IronRouter
    var onRunCalled = false;
    var router = new IronRouter({
      onRun: function () {
        onRunCalled = true;
      }
    });
    router.routes = routes;
    controller.where = 'server';
    router.run(controller);
    test.isTrue(onRunCalled, 'onRun option not called');

    // 2. runActionWithHooks
    var router = new IronRouter;
    router.routes = routes;

    var onUnhandledCalled = false;
    router.onUnhandled = function (path, options) {
      onUnhandledCalled = true;
    };
    controller.where = 'client';
    router.run(controller);
    test.isTrue(onUnhandledCalled, 'onUnhandled not called for client controller');
    
    controller.where = 'server';
    var runActionCalled = false;
    controller.runActionWithHooks = function () {
      runActionCalled = true;
    };
    router.run(controller);
    test.isTrue(runActionCalled, 'runActionWithHooks not called');
  });
}
