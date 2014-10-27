Tinytest.add('RouteController - lookupOption', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});
  var route = router.route('/', {});
  var inst = route.createController({});
  inst.router = router;
  var value;

  // undefined
  value = inst.lookupOption('myOption');
  test.isUndefined(value, 'property should be undefined');

  // router options
  router.options.myOption = 'myRouterValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myRouterValue', 'property should be on router options');

  // XXX: CurrentOptions dynamic var

  // route controller instance
  inst.myOption = 'myInstanceValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myInstanceValue', 'property should be on instance');

  // XXX: this order has changed since 0.9.x - either revert or document heavily
  // route controller options : 
  inst.options.myOption = 'myOptionsValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myOptionsValue', 'property should be on instance options');

  // route options
  route.options.myOption = 'myRouteValue';
  value = inst.lookupOption('myOption');
  test.equal(value, 'myRouteValue', 'property should be on route options');
});

Tinytest.add('RouteController - hooks - inheritance order', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});
  var hookCalls = [];

  router.configure({
    onAfterAction: function routerOnAfterAction() {
      hookCalls.push('routerOnAfterAction');
    }
  });
  
  var Parent = Iron.RouteController.extend({
    onAfterAction: function protoOnAfterAction() {
      hookCalls.push('parentOnAfterAction');
    }
  });

  var C = Parent.extend({
    onAfterAction: function protoOnAfterAction() {
      hookCalls.push('protoOnAfterAction');
    }
  });

  var route = router.route('/', {
    controller: C,
    onAfterAction: function routeOnAfterAction() {
      hookCalls.push('routeOnAfterAction');
    }
  });

  // create some proto hooks
  var c = new C;
  c.router = router;
  c.route = route;

  var hooks = c.runHooks('onAfterAction');

  test.equal(hookCalls[0], 'routerOnAfterAction', 'router onAfterAction');
  test.equal(hookCalls[1], 'routeOnAfterAction', 'route onAfterAction');
  test.equal(hookCalls[2], 'parentOnAfterAction', 'proto onAfterAction');
  test.equal(hookCalls[3], 'protoOnAfterAction', 'proto onAfterAction');
});

Tinytest.add('RouteController - hooks - pausing in before hooks', function (test) {
});
