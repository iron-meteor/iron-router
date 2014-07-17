Tinytest.add('RouteController - collectHooks', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});

  router.configure({
    onBeforeAction: function routerOnBeforeAction() {},
    before: function routerBefore() {}
  });

  var C = Iron.RouteController.extend({
    onBeforeAction: function protoOnBeforeAction() {},
    before: function protoBefore() {}
  });

  var route = router.route('/', {
    controller: C,
    onBeforeAction: function routeOnBeforeAction() {},
    before: function routeBefore() {}
  });

  Iron.Router.hooks.testHook = function () {};

  // create some proto hooks
  var c = new C;
  c.router = router;
  c.route = route;

  var hooks = c.collectHooks('onBeforeAction', 'before');

  var hookNames = _.map(hooks, function (h) { return h.name; });

  test.equal(hookNames[0], 'routerOnBeforeAction', 'router onBeforeAction');
  test.equal(hookNames[1], 'routerBefore', 'router before');
  test.equal(hookNames[2], 'routeOnBeforeAction', 'route onBeforeAction');
  test.equal(hookNames[3], 'routeBefore', 'route before');
  test.equal(hookNames[4], 'protoOnBeforeAction', 'proto onBeforeAction');
  test.equal(hookNames[5], 'protoBefore', 'proto before');
});
