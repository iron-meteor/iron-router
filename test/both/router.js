/*****************************************************************************/
/* Mocks and Stubs */
/*****************************************************************************/
var controllerMock = {
  run: function () {},
  runHooks: function () {}
};

var routes = [{
  where: 'client',
  test: function (path) { return path == 'client'; },
  newController: function (path, options) { return EJSON.clone(controllerMock); },
  path: function (params, options) {
    return [params, options];
  },
  url: function (params, options) {
    return [params, options];
  }
}, {
  where: 'server',
  test: function (path) { return path == 'server' },
  newController: function () { return EJSON.clone(controllerMock); },
  path: function (params, options) {
    return [params, options];
  },
  url: function (params, options) {
    return [params, options];
  }
}];

// simulate the named routes
routes.client = routes[0];
routes.server = routes[1];

/*****************************************************************************/
/* Client and Server */
/*****************************************************************************/
Tinytest.add('Router - path', function (test) {
  var router = Router;
  router.routes = routes;

  var params = [];
  var opts = {};
  var res = router.path('client', params, opts);

  test.equal(res[0], params);
  test.equal(res[1], opts);
});

Tinytest.add('Router - url', function (test) {
  var router = Router;
  router.routes = routes;

  var params = [];
  var opts = {};

  var res = router.url('client', params, opts);

  test.equal(res[0], params);
  test.equal(res[1], opts);
});

/*****************************************************************************/
/* Client */
/*****************************************************************************/
if (Meteor.isClient) {
  Tinytest.add('Router - client dispatch', function (test) {
    var router = Router;

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
}

/*****************************************************************************/
/* Server */
/*****************************************************************************/
if (Meteor.isServer) {
  Tinytest.add('Router - server dispatch', function (test) {
    var router = Router;

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
}
