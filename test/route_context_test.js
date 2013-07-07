var params = {param: 'test'};

TestRoute = Route.extends({
  params: function (path) {
    return params;
  }
});

Tinytest.add('RouteContext - initialize', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false})
    , route
    , options
    , ctx;

  test.throws(function () {
    ctx = new RouteContext;
  });

  test.throws(function () {
    ctx = new RouteContext('/posts');
  });

  test.throws(function () {
    ctx = new RouteContext('/posts', router);
  });

  route = new TestRoute(router, '/posts/:param');
  options = {state: {}};
  ctx = new RouteContext('/posts/1', router, route, options);
  test.equal(ctx.path, '/posts/1');
  test.equal(ctx.router, router);
  test.equal(ctx.route, route);
  test.equal(ctx.state, options.state);
  test.equal(ctx.params, params);
});

Tinytest.add('RouteContext - getState', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false})
    , route
    , ctx;

  route = new TestRoute(router, '/posts/:param');
  ctx = new RouteContext('/posts/1', router, route);
  test.isTrue(typeof ctx.getState() == 'object');
  test.equal(ctx.getState().path, '/posts/1');
});

Tinytest.add('RouteContext - reactive result', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false})
    , route
    , ctx
    , result;

  function firstResult () {
    return 'first';
  }

  function secondResult () {
    return 'second';
  }

  route = new TestRoute(router, '/posts/:param');
  ctx = new RouteContext('/posts/1', router, route);

  Deps.autorun(function () {
    result = ctx.result();
  });

  // empty string if no result function
  test.equal(result, '');

  // result function change trigger reactivity
  ctx.result(firstResult);
  Deps.flush();
  test.equal(result, 'first');

  // result function change triggers reactivity
  ctx.result(secondResult);
  Deps.flush();
  test.equal(result, 'second');
});
