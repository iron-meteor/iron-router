//XXX onRun hook is not called at all
//XXX onData, onBeforeAction, onAfterAction called twice. But action only called
//once.

// mock out:
//  Router.go
//  uiManager for router

// lookupTemplate
// lookupLayoutTemplate
// lookupRegionTemplates
// lookupWaitOn
// render
// renderRegions
// wait
// stop (stops computation)
// _run
//  - no stops allowed
//  - proper deps isolation
//  - proper hooks called

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

  console.log(calls);

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
