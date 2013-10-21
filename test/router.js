var controller = {
  runActionWithHooks: function () {},
  runHooks: function () {}
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

  //XXX bring back server run test
  /*
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
  */
}

Tinytest.add('IronRouter - before hooks', function (test) {
  var router = typeof ClientRouter === 'undefined' ? new ServerRouter : new ClientRouter;
  var where = typeof ClientRouter === 'undefined' ? 'server' : 'client';

  var firstHookCalled = 0;
  router.before({only: 'one'}, function() { firstHookCalled += 1; })

  var secondHookCalled = 0;
  router.before({except: 'two'}, function() { secondHookCalled += 1; })

  var thirdHookCalled = 0;
  router.before(function() { thirdHookCalled += 1; })

  router.map(function() {
    this.route('one', {where: where});
    this.route('two', {where: where});
    this.route('three', {where: where});
  });

  // mock
  router.setLayout = _.identity;
  router.setTemplate = _.identity;
  var serverOptionsMock = {next: _.identity}; 

  router.dispatch('one', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 1);

  router.dispatch('two', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 2);

  router.dispatch('three', serverOptionsMock);
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 2);
  test.equal(thirdHookCalled, 3);  
});

