Tinytest.add('RouteContext - constructor', function (test) {
  var options
    , ctx;

  var params = {param: 'test'};

  var route = {
    params: function (path) { return params; }
  };

  test.throws(function () {
    ctx = new RouteContext;
  });

  test.throws(function () {
    ctx = new RouteContext('/posts');
  });

  test.throws(function () {
    ctx = new RouteContext('/posts', Router);
  });

  options = {state: {}};
  ctx = new RouteContext('/posts/1', Router, route, options);
  test.equal(ctx.path, '/posts/1');
  test.equal(ctx.router, Router);
  test.equal(ctx.route, route);
  test.equal(ctx.state, options.state);
  test.equal(ctx.params, params);

});

Tinytest.add('RouteContext - getState', function (test) {
  var route
    , ctx;

  var params = {param: 'test'};

  var route = {
    params: function (path) { return params; }
  };

  ctx = new RouteContext('/posts/1', Router, route);
  test.isTrue(typeof ctx.getState() == 'object');
  test.equal(ctx.getState().path, '/posts/1');
});
