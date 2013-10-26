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
  getController: function (path, options) { return EJSON.clone(controllerMock); },
  path: function (params, options) {
    return [params, options];
  },
  url: function (params, options) {
    return [params, options];
  }
}, {
  where: 'server',
  test: function (path) { return path == 'server' },
  getController: function () { return EJSON.clone(controllerMock); },
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
Tinytest.add('IronRouter - path', function (test) {
  var router = new IronRouter;
  router.routes = routes;

  var params = [];
  var opts = {};
  var res = router.path('client', params, opts);

  test.equal(res[0], params);
  test.equal(res[1], opts);
});

Tinytest.add('IronRouter - url', function (test) {
  var router = new IronRouter;
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
}

/*****************************************************************************/
/* Server */
/*****************************************************************************/
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
}

Tinytest.add('IronRouter - before hooks', function (test) {
  var router = typeof ClientRouter === 'undefined' ? new ServerRouter : new ClientRouter;
  var where = typeof ClientRouter === 'undefined' ? 'server' : 'client';

  var firstHookCalled = 0;
  router.before(function() { firstHookCalled += 1; }, {only: 'one'})

  var secondHookCalled = 0;
  router.before(function() { secondHookCalled += 1; }, {except: 'two'})

  var thirdHookCalled = 0;
  router.configure({before: function() { thirdHookCalled += 1; }})

  var fourthHookCalled = 0;
  router.before(function(){ fourthHookCalled += 1 })

  router.map(function() {
    this.route('one', {where: where});
    this.route('two', {where: where});
    this.route('three', {where: where});
  });

  // mock
  router.setLayout = _.identity;
  router.setTemplate = _.identity;
  var serverOptionsMock = {next: _.identity, response: {end: _.identity}}; 

  router.dispatch('one', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 1);
  test.equal(fourthHookCalled, 1);

  router.dispatch('two', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 2);
  test.equal(fourthHookCalled, 2);

  router.dispatch('three', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 2);
  test.equal(thirdHookCalled, 3);  
  test.equal(fourthHookCalled, 3);

});

