Tinytest.add('IronRouter - initialize', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false});
  test.isFalse(router.options.autoRender);
  test.isFalse(router.options.autoStart);
});

Tinytest.add('IronRouter - configure', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false});

  router.configure({
    test: true
  });

  test.isTrue(router.options.test);
  test.isFalse(router.options.autoRender);
  test.isFalse(router.options.autoStart);
});

Tinytest.add('IronRouter - route', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false});

  test.throws(function () {
    // name is a required parameter
    router.route();
  });

  var options = {test: true}
    , handler = function () {};
  router.route('one', options, handler);

  // named and indexed routes
  test.isTrue(router.routes['one']);
  test.equal(router.routes.length, 1);

  test.equal(router.routes['one'].handler, handler);
  test.isTrue(router.routes['one'].options.test);

  var route = new Route(router, 'two');
  router.route('two', route);
  test.equal(router.routes['two'], route);
});

Tinytest.add('IronRouter - path', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false});
  router.route('postShow', {path: '/posts/:id'});
  test.equal(router.path('postShow', {id: 1}), '/posts/1');
});

Tinytest.add('IronRouter - url', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false});
  router.route('postShow', {path: '/posts/:id'});
  test.equal(router.url('postShow', {id: 1}), Meteor.absoluteUrl() + 'posts/1');
});

Tinytest.add('IronRouter - dispatch', function (test) {
  var router = new IronRouter({
      routerOption: true,
      autoRender: false,
      autoStart: false
    })
    , opts = {test:true}
    , onUnhandled = []
    , onRouteNotFound = []
    , onRun = []
    , callstack = [];

  router.map(function () {
    this.route('client', {routeOption: true});
    this.route('redirect', {redirected: true});
    this.route('server', {where: 'server'});
  });

  router.onRun = function (context, options) {
    onRun.push({context: context, options: options});
    callstack.push('onRun');
  };

  router.onUnhandled = function (path, options) {
    onUnhandled.push({path: path, options: options});
  };

  router.onRouteNotFound = function (path, options) {
    onRouteNotFound.push({path: path, options: options});
  };

  if (Meteor.isClient) {
    router.dispatch('/client', opts, function () {
      callstack.push('cb');
    });

    test.equal(callstack[0], 'onRun');
    test.equal(callstack[1], 'cb');
    test.equal(onRun.length, 1);

    // paths with query parameters are matched
    callstack = [];
    router.dispatch('/client?foo=bar', opts, function () {
      callstack.push('cb');
    });

    test.equal(callstack[0], 'onRun');
    test.equal(callstack[1], 'cb');
    test.equal(onRun.length, 2);
    test.equal(onUnhandled.length, 0);
    test.equal(onRouteNotFound.length, 0);

    // onUnhandled gets called if route is found but is on server
    router.dispatch('/server', opts);
    test.equal(onUnhandled.length, 1);
    test.equal(onRouteNotFound.length, 0);

    router.dispatch('/bogus');
    test.equal(onRouteNotFound.length, 1);
  }

  if (Meteor.isServer) {
    var onRouteNotFound = []
      , onUnhandled = [];

    router.dispatch('/server');
    test.equal(onUnhandled.length, 0);
    test.equal(onRouteNotFound.length, 0);

    router.dispatch('/client');
    test.equal(onUnhandled.length, 1);
    test.equal(onRouteNotFound.length, 0);

    router.dispatch('/bogus');
    test.equal(onUnhandled.length, 1);
    test.equal(onRouteNotFound.length, 1);
  }
});

Tinytest.add('IronRouter - run', function (test) {
  var router = new IronRouter({
      routerOption: true,
      autoRender: false,
      autoStart: false
    })
    , opts = {test:true}
    , onRun = []
    , onUnhandled = []
    , callstack = [];

  router.map(function () {
    this.route('client', {routeOption: true});
    this.route('redirect', {redirected: true});
    this.route('server', {where: 'server'});
  });

  router.onRun = function (controller, context, options) {
    callstack.push('onRun');
    onRun.push({context: context, options: options});
  };

  router.onUnhandled = function (path, options) {
    onUnhandled.push({path: path, options: options});
  };

  if (Meteor.isClient) {
    var route = router.routes['client'];
    router.run('/client', route, opts, function () {
      callstack.push('cb');
    });

    test.equal(onRun[0].context.path, '/client');

    // onUnhandled check again
    route = router.routes['server'];
    router.run('/server', route);
    test.equal(onUnhandled.length, 1);

    // context switch
    router.onRun = function (controller, context, options) {
      if (context.path == '/client')
        router.dispatch('/redirect');
    };

    currentCount = -1;

    Deps.autorun(function () {
      currentContext = router.current();
      currentCount++;
    });

    // deps only change once for the final route, not for each step
    // along the way (i.e. redirects inside route handler)
    router.dispatch('/client');
    Deps.flush();
    test.equal(currentCount, 1);

    router.dispatch('/client');
    Deps.flush();
    test.equal(currentCount, 2);
  }

  if (Meteor.isServer) {
    // onUnhandled check again
    route = router.routes['client'];
    router.run('/client', route);
    test.equal(onUnhandled.length, 1);
  }
});

Tinytest.add('IronRouter - Router singleton', function (test) {
  test.isTrue(Router instanceof IronRouter);
});
