//XXX onRun method
//XXX render
//XXX go
//XXX autoRender
//XXX Router singleton is defined
//XXX runController
//XXX getControllerForContext returns right controller for circumstance
//XXX default layout is used if none provided

var getGlobal = function () {
  return typeof window === 'undefined' ? global : window;
};
// Stop location from using the browser's history API.
// We can test without affecting the browser.
Location.pushState = function (state, title, url, skipReactive) {
  this._setState(state, title, url, skipReactive);
};

Location.replaceState = function (state, title, url) {
  this._setState(state, title, url);
};

Tinytest.add('ClientRouter - render', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));

  // default layout is empty
  test.equal(renderedRouter.text().trim(), '');
  renderedRouter.kill();

  router.configure({
    layout: 'layout'
  });

  // provide a layout
  renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));
  test.equal(renderedRouter.text().trim(), 'Layout');
  renderedRouter.kill();

  // layout not found
  router.configure({
    layout: 'bogus'
  });

  test.throws(function () {
    Spark.render(_.bind(router.render, router));
  });
});

Tinytest.add('ClientRouter - getControllerForContext', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  // case 1: handler defined directly on the route
  var handler = function () {};
  var route = new Route(router, 'test', {}, handler);
  var context = new RouteContext('/test', router, route, {});
  var controller = router.getControllerForContext(context);
  // default run method assigned to handler
  test.equal(controller.run, handler, 'default run method assigned to handler');

  var global = getGlobal();
  global.TestController = RouteController.extend();

  // case 2: controller option defined on route as string
  route = new Route(router, 'test', {
    controller: 'TestController'
  });
  context = new RouteContext('/test', router, route, {});
  controller = router.getControllerForContext(context);
  test.equal(controller.run, global.TestController.prototype.run);

  // case 2a: controller defined as option with actual symbol
  route = new Route(router, 'test', {
    controller: TestController
  });
  context = new RouteContext('/test', router, route, {});
  controller = router.getControllerForContext(context);
  test.equal(controller.run, global.TestController.prototype.run);

  // case 3: find controller in global namespace
  context = new RouteContext('/test', router, route, {});
  controller = router.getControllerForContext(context);
  test.equal(controller.run, global.TestController.prototype.run);

  // case 4: nothing found so create default controller;
  route = new Route(router, 'bogus', {});
  context = new RouteContext('/bogus', router, route);
  controller = router.getControllerForContext(context);
  test.isTrue(controller instanceof RouteController);
});

Tinytest.add('ClientRouter - runController', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  //XXX kind of janky
  var calls = {
    total: 0
  };

  var logCall = function (name) {
    calls[name] = calls[name] || 0;
    calls[name]++;
    calls.total++;
  };

  router._partials = {
    set: function (to, options) {},
    get: function (key) {},
    clear: function () {}
  };

  var isHandlerCalled = false;

  var TestController = RouteController.extend({
    before: function () {logCall('before');},
    after: function () {logCall('after');},
    onBeforeRun: function () { logCall('onBeforeRun'); },
    onBeforeRerun: function () { logCall('onBeforeRerun'); },
    onAfterRun: function () { logCall('onAfterRun'); },
    onAfterRerun: function () { logCall('onAfterRerun'); },
    testAction: function () { logCall('testAction'); }
  });

  var route = new Route(router, 'test', {
    controller: TestController,
    action: 'testAction'
  });

  var context = new RouteContext('/test', router, route);
  var controller = router.getControllerForContext(context);
  router.runController(controller, context);

  test.equal(calls.onBeforeRun, 1);
  test.equal(calls.before, 1);
  test.equal(calls.onAfterRun, 1);
  test.equal(calls.after, 1);
  test.isFalse(calls.onBeforeRerun);
  test.isFalse(calls.onAfterRerun);
  test.isFalse(controller.isFirstRun);

  router.runController(controller, context);
  test.equal(calls.onBeforeRun, 1);
  test.equal(calls.onAfterRun, 1);
  test.equal(calls.onBeforeRerun, 1);
  test.equal(calls.onAfterRerun, 1);
  test.equal(calls.before, 2);
  test.equal(calls.after, 2);
});

Tinytest.add('ClientRouter - onRun', function (test) {
  //XXX test reactivity
  //XXX tear down previous computation

  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var runs = 0;
  var handler = function () {
    var reactiveVar = Session.get('testVar');
    runs++;
  };

  var route = new Route(router, 'test', {}, handler);
  var context = new RouteContext('/test', router, route, {});
  var controller = router.getControllerForContext(context);
  router.onRun(controller, context);

  test.equal(runs, 1);

  Session.set('testVar', Random.id());
  Deps.flush();
  test.equal(runs, 2);

  var prevComputation = router._routeComputation;
  test.isFalse(prevComputation.stopped);

  route = new Route(router, 'another', {}, handler);
  context = new RouteContext('/another', router, route, {});
  controller = router.getControllerForContext(context);
  router.onRun(controller, context);
  Deps.flush();

  var newComputation = router._routeComputation;
  test.isTrue(prevComputation.stopped);
  test.equal(runs, 3);

  route = new Route(router, 'notReactive', {
    reactive: false
  }, handler);
  context = new RouteContext('/notReactive', router, route, {});
  router.onRun(controller, context);
  Deps.flush();
  test.equal(runs, 4);

  Session.set('testVar', Random.id());
  Deps.flush();
  test.equal(runs, 4);
});

Tinytest.add('ClientRouter - basic filter', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });
  
  var renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));
  test.equal(renderedRouter.text().trim(), '');
  
  router.map(function () {
    this.route('one', {path: '/'})
  });
  
  router.configure({
    before: function() {
      if (Session.get('stop')) {
        this.render('two');
        this.stop();
      }
    }
  });
  
  Session.set('stop', false);
  router.start();
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'One');
  
  Session.set('stop', true);
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'Two');
  
  Session.set('stop', false);
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'One');
});
