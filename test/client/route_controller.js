// lookupFns.waitOn
// render
// renderRegions
// wait
var createRouter = function () {
  return new IronRouter({
    autoRender: false,
    autoStart: false
  });
};

var createController = function (proto, opts) {
  var createRouter = function () {
    return new IronRouter({
      autoRender: false,
      autoStart: false
    });
  };
  var route = new Route(Router, 'test', {});

  var R = RouteController.extend(proto || {});
  return new R(Router, route, opts);
};

Tinytest.add('Client RouteController - Router UI API', function (test) {
  var c = createController();
  var router = c.router;

  var calls = [];
  router.layout = function () {
    calls.push('layout');
  };

  router.setRegion = function () {
    calls.push('setRegion');
  };

  router.clearRegion = function () {
    calls.push('clearRegion');
  };

  c.layout();
  test.equal(calls[0], 'layout', 'layout not proxied to router');

  c.setRegion();
  test.equal(calls[1], 'setRegion', 'setRegion not proxied to router');

  c.clearRegion();
  test.equal(calls[2], 'clearRegion', 'clearRegion not proxied to router');
});

Tinytest.add('Client RouteController - data', function (test) {
  var cWithDataFunc = createController({
    data: function () {
      return 'value';
    }
  });

  var cWithDataValue = createController({
    data: 'value'
  });

  var cWithNoData = createController();

  var value;

  value = cWithDataFunc.data();
  test.equal(value, 'value', "couldn't get value from data function");

  value = cWithDataValue.data();
  test.equal(value, 'value', "couldn't get value from data value");

  value = cWithNoData.data();
  test.isNull(value, "controller with no data should give null value");
});

Tinytest.add('Client RouteController - _run order', function (test) {
  var calls = [];

  var c = createController({
    onRun: function () {
      calls.push('onRun');
    },

    onStop: function () {
      calls.push('onStop');
    },

    waitOn: function () {
      calls.push('waitOn');
    },

    data: function () {
      calls.push('data');
    },

    onData: function () {
      calls.push('onData');
    },

    onBeforeAction: function () {
      calls.push('onBeforeAction');
    },

    action: function () {
      calls.push('action');
    },

    onAfterAction: function () {
      calls.push('onAfterAction');
    }
  });

  c.router.layout = function () {
    calls.push('layout');
  };

  c.router.setRegion = function () {
  };

  c.router.setData = function () {
  };

  c.router.clearUnusedRegions = function () {
  };

  // make sure onRun hook gets called again
  c.router._hasJustReloaded = false;
  c._run();

  test.equal(calls, [
    'layout',
    'onRun',
    'waitOn',
    'data',
    'onData',
    'onBeforeAction',
    'action',
    'onAfterAction'
  ], 'run order seems wrong');
});

Tinytest.add('Client RouteController - _run then stop', function (test) {
  var c = createController();
  c._run();
  test.isFalse(c._computation.stopped, "doesn't look like the controller's computation si running.");
  c.stop();
  test.isTrue(c._computation.stopped, "stop() didn't stop the controller's computation.");
});

Tinytest.add('Client RouteController - _run computation isolation', function (test) {
  var calls = {};
  var totalCalls = 0;
  var logCall = function (name) {
    totalCalls++;
    calls[name] = calls[name] || 0;
    calls[name]++;
  };

  var deps = {};
  _.each(['onRun', 'waitOn', 'data', 'action', 'onStop'], function (name) {
    deps[name] = new Deps.Dependency;
  });

  var c = createController({
    onRun: function () {
      deps.onRun.depend();
      logCall('onRun');
    },

    waitOn: function () {
      deps.waitOn.depend();
      logCall('waitOn');
    },

    data: function () {
      deps.data.depend();
      logCall('data');
    },

    onBeforeAction: function () {
      logCall('onBeforeAction');
    },

    action: function () {
      logCall('action');
      deps.action.depend();
    },

    onAfterAction: function () {
      logCall('onAfterAction');
    }
  });

  c._run();

  // everything but onStop
  test.equal(totalCalls, 6, 'first run');

  // now invalidate the onRun dep
  deps.onRun.changed();
  Deps.flush();
  test.equal(totalCalls, 7, 'only onRun should have rerun');
  test.equal(calls.onRun, 2, 'onRun should rerun');

  // okay now the waitOn function!
  deps.waitOn.changed();
  Deps.flush();
  test.equal(totalCalls, 8, 'only waitOn should have rerun');
  test.equal(calls.waitOn, 2, 'waitOn should rerun');

  // whoop whoop, now the data function!
  deps.data.changed();
  Deps.flush();
  test.equal(totalCalls, 9, 'only data should have rerun');
  test.equal(calls.data, 2, 'data should rerun');

  // almost! now the action functions!
  deps.action.changed();
  Deps.flush();
  // 9 to 12 is because action invalidtes
  // onBeforeAction, action, onAfterAction
  test.equal(totalCalls, 12, 'only action should have rerun');
  test.equal(calls.action, 2, 'action should rerun');
  test.equal(calls.onBeforeAction, 2, 'onBeforeAction should rerun');
  test.equal(calls.onAfterAction, 2, 'onAfterAction should rerun');
});

Tinytest.add('Client RouteController - lookup', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});
  var value;

  // Default lookup should be unchanged

  // undefined
  value = inst.lookup('myProperty');
  test.isUndefined(value, 'property should be undefined');

  // router options
  Router.options.myProperty = 'myRouterValue';
  value = inst.lookup('myProperty');
  test.equal(value, 'myRouterValue', 'property should be on router options');

  // route options
  route.options.myProperty = 'myRouteValue';
  value = inst.lookup('myProperty');
  test.equal(value, 'myRouteValue', 'property should be on route options');

  // route controller instance
  inst.myProperty = 'myInstanceValue';
  value = inst.lookup('myProperty');
  test.equal(value, 'myInstanceValue', 'property should be on instance');

  // route controller options
  inst.options.myProperty = 'myOptionsValue';
  value = inst.lookup('myProperty');
  test.equal(value, 'myOptionsValue', 'property should be on instance options');

  // Custom lookup functions

  // template: options.template undefined
  value = inst.lookup('template');
  test.equal(value, 'test', 'should default to route name if options.template is undefined')

  // template: options.template set
  inst.options.template = 'myTemplate';
  value = inst.lookup('template');
  test.equal(value, 'myTemplate', 'should return options.template if defined')

  // regionTemplates: options.regionTemplates = options.yieldTemplates = undefined
  value = inst.lookup('regionTemplates');
  test.equal(value, {}, 'should return undefined if regionTemplates = yieldTemplates = undefined')

  // regionTemplates: options.yieldTemplates is set, options.regionTemplates = undefined
  inst.options.yieldTemplates = {'myFooter': {to: 'footer'}};
  value = inst.lookup('regionTemplates');
  test.equal(value, {'myFooter': {to: 'footer'}}, 'should return yieldTemplates if regionTemplate = undefined')

  // regionTemplates: options.regionTemplates is set
  inst.options.regionTemplates = {'myHeader': {to: 'header'}};
  value = inst.lookup('regionTemplates');
  test.equal(value, {'myHeader': {to: 'header'}}, 'should return regionTemplate if defined')



});