Tinytest.add('Router - API', function (test) {
  test.isTrue(Router);
});

/*
Tinytest.add('Router - reactivity in run', function (test) {
  var router
    , firstRoute
    , secondRoute
    , currentCount = -1
    , runs = []
    , dict = new ReactiveDict;

  dict.set('value', 1);

  router = new Router({
    autoStart: false,
    autoRender: false,
    routeHandler: function (context) {
      context.route.handler(context);
    }
  });

  secondRoute = new Route(router, 'second', function (context) {
    Deps.autorun(function () {
      runs.push({
        context: context,
        value: dict.get('value')
      });
    });
  });

  firstRoute = new Route(router, 'first', function (context) {
    Deps.autorun(function () {
      runs.push({
        context: context,
        value: dict.get('value')
      });

      // run a new route from within this one
      router.run(secondRoute);
    });
  });

  Deps.autorun(function () {
    var current = router.current();
    currentCount++;
  });

  router.run(firstRoute);
  Deps.flush();

  test.equal(runs.length, 2);
  // even though we redirected in the first route, the router should
  // only change the current once, at the end of all the runs
  test.equal(currentCount, 1);

  dict.set('value', 2);
  Deps.flush();

  // old route shouldn't be run again since we redirected
  test.equal(runs.length, 3);
  test.equal(currentCount, 1);

  router.run(secondRoute);
  Deps.flush();

  test.equal(runs.length, 4);
  test.equal(currentCount, 2);
});
*/
