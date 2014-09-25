Tinytest.add('RouteController - runHooks', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});
  var hookCalls = [];

  router.configure({
    onBeforeAction: function routerOnBeforeAction() {
      hookCalls.push('routerOnBeforeAction');
    },
    before: function routerBefore() {
      hookCalls.push('routerBefore');
    }
  });

  var C = Iron.RouteController.extend({
    onBeforeAction: function protoOnBeforeAction() {
      hookCalls.push('protoOnBeforeAction');
    },
    before: function protoBefore() {
      hookCalls.push('protoBefore');
    }
  });

  var route = router.route('/', {
    controller: C,
    onBeforeAction: function routeOnBeforeAction() {
      hookCalls.push('routeOnBeforeAction');
    },
    before: function routeBefore() {
      hookCalls.push('routeBefore');
    }
  });

  Iron.Router.hooks.testHook = function () {};

  // create some proto hooks
  var c = new C;
  c.router = router;
  c.route = route;

  var hooks = c.runHooks('onBeforeAction', 'before');

  test.equal(hookCalls[0], 'routerOnBeforeAction', 'router onBeforeAction');
  test.equal(hookCalls[1], 'routerBefore', 'router before');
  test.equal(hookCalls[2], 'routeOnBeforeAction', 'route onBeforeAction');
  test.equal(hookCalls[3], 'routeBefore', 'route before');
  test.equal(hookCalls[4], 'protoOnBeforeAction', 'proto onBeforeAction');
  test.equal(hookCalls[5], 'protoBefore', 'proto before');
});
