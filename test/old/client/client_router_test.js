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

Tinytest.add('ClientRouter - onRun old comp stopped', function (test) {
  /*
   * Test Case 1: If previous route computation, stop it and create new
   * computation. New computation should not be stopped.
   */
  
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var handler = function () {};
  var route = new Route(router, 'test', {}, handler);
  var context = new RouteContext('/test', router, route, {});
  var controller = router.getControllerForContext(context);

  router.onRun(controller, context);
  var oldComputation = router._routeComputation;
  
  Deps.flush();

  // at this point the computation has been set up and the route is done
  // running. now we create a new computation, make sure it's not stopped, and
  // the previous computation is stopped.
  router.onRun(controller, context);
  var newComputation = router._routeComputation;
  test.notEqual(oldComputation, newComputation, 'New computation equals old computation');

  // new computation should not be stopped
  test.isFalse(newComputation.stopped, 'new comp should not be stopped');

  // old computation should be stopped
  test.isTrue(oldComputation.stopped, 'old comp should be stopped');
});

Tinytest.add('ClientRouter - onRun with old comp invalidated', function (test) {
  /*
   * Test Case 2: Previous computation gets invalidated. Previous computation
   * should be stopped, and the new route should create a new computation which
   * should not be stopped.
   */

  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var handler = function () {};
  var route = new Route(router, 'test', {}, handler);
  var context = new RouteContext('/test', router, route, {});
  var controller = router.getControllerForContext(context);

  router.onRun(controller, context);
  var oldComputation = router._routeComputation;
  
  Deps.flush();

  // now we'll invalidate the old computation, simulation and update to a Mong
  // document, for example.
  oldComputation.invalidate();

  // But we won't flush yet. Now let's run a new route.
  router.onRun(controller, context);
  var newComputation = router._routeComputation;

  // okay, now the old computation should still have been stopped
  // but the new one should be created and not stopped.
  test.notEqual(oldComputation, newComputation, 'New computation equals old computation');

  // new computation should not be stopped
  test.isFalse(newComputation.stopped, 'new comp should not be stopped');

  // old computation should be stopped
  test.isTrue(oldComputation.stopped, 'old comp should be stopped');
});

Tinytest.add('ClientRouter - onRun same subscription with new route', function (test) {
  /*
   * Test Case 1: The same subscription shouldn't be set up twice. In other
   * words, we don't break Meteor's subscription optimization which says if the
   * new subscription is the same as the old one, don't create a new one.
   */
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var subscribeToPosts = function () {
    Meteor.subscribe('/posts');
  };

  var findAllPostsSubscriptions = function () {
    return _.where(_.values(Meteor.connection._subscriptions), {
      name: '/posts'
    });
  };

  var route = new Route(router, 'test', {}, subscribeToPosts);
  var context = new RouteContext('/test', router, route, {});
  var controller = router.getControllerForContext(context);

  router.onRun(controller, context);
  Deps.flush();

  var sub = findAllPostsSubscriptions()[0];

  // okay now we'll run the same route again. we want to see if a new
  // subscription gets created, or if it's the same. it should be the same.
  router.onRun(controller, context);


  // at this point, the old route has been stopped and the new route has run,
  // although it hasn't been flushed yet. so the old subscription should
  // temporarily be marked as inactive, but gets marked as active again when the
  // new route runs. test that the subscription has the same id and that there
  // is only one subscription for /posts.

  test.isFalse(sub.inactive, 'old subscription never got reactivated');

  var subs = findAllPostsSubscriptions();
  test.equal(subs.length, 1, 'new post subscription was not supposed to be created');
});

Tinytest.add('ClientRouter - onRun subscription stop', function (test) {
  /*
   * Test Case 2: Subscriptions from previous route computations should be
   * stopped automatically, unless it is the same subscription on the new
   * computation.
   */
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var subscribeToPostOne = function () {
    Meteor.subscribe('/post', 1);
  };

  var subscribeToPostTwo = function () {
    Meteor.subscribe('/post', 2);
  };

  var findSubscriptionsByName = function (name) {
    return _.where(_.values(Meteor.connection._subscriptions), {
      name: name
    });
  };

  var findSubscriptionByNameAndParams = function (name, params) {
    return _.find(_.values(Meteor.connection._subscriptions), function (s) {
      return s.name === name
        && _.difference(s.params, params).length === 0;
    });
  };

  var firstRoute = new Route(router, 'test', {}, subscribeToPostOne);
  var context = new RouteContext('/test', router, firstRoute, {});
  var controller = router.getControllerForContext(context);
  router.onRun(controller, context);

  // first subscription has been set up and is active
  var subs = findSubscriptionsByName('/post');
  test.equal(subs.length, 1, 'should only be one sub at this point');
  test.isFalse(subs[0].inactive, 'sub should be active');

  // now go to the new route
  var secondRoute = new Route(router, 'test', {}, subscribeToPostTwo);
  context = new RouteContext('/test', router, secondRoute, {});
  controller = router.getControllerForContext(context);
  router.onRun(controller, context);

  // there should be two subscriptions at this point
  // but one should be active and the other inactive

  var firstSub = findSubscriptionByNameAndParams('/post', [1]);
  test.isTrue(firstSub.inactive, 'first sub should be inactive');

  var secondSub = findSubscriptionByNameAndParams('/post', [2]);
  test.isFalse(secondSub.inactive, 'second sub should be active');
});
