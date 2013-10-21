Tinytest.add('ClientRouter - run computations', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var c1 = new RouteController;
  var c2 = new RouteController;
  var routerRuns = [];

  Deps.autorun(function (c) {
    routerRuns.push(router.current());
  });

  test.equal(routerRuns[0], null, 'router.current() starts off as null');

  var c1Runs = [];
  c1.run = function () {
    c1Runs.push(Deps.currentComputation);
  };

  router.run(c1);
  Deps.flush();
  test.equal(routerRuns[1], c1, 'router comp not invalidated');
  test.equal(c1Runs.length, 1, 'c1 controller not run');

  // simulate a dependency invalidating the run's computation like if you relied
  // on a reactive data source in a before hook or action function.
  c1Runs[0].invalidate();
  Deps.flush();

  test.equal(routerRuns.length, 2, 'run comp should not invalidate route comp');
  test.equal(c1Runs.length, 2, 'run comp was not rerun');

  var c2Runs = [];
  c2.run = function () {
    c2Runs.push(Deps.currentComputation);
  };

  var oldComp = c1Runs[1];
  router.run(c2);
  Deps.flush();

  var newComp = c2Runs[0];
  test.equal(routerRuns.length, 3, 'router comp not invalidated');
  test.equal(c2Runs.length, 1, 'c3 controller not run');
  test.isTrue(oldComp.stopped, 'old run comp not stopped');
  test.isFalse(newComp.stopped, 'new run comp is stopped');
});

//XXX todo: rendering and re-rendering
