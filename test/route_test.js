Tinytest.add('Route - initialize', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false})
    , route
    , handler;

  test.throws(function () {
    // requires a router
    route = new Route;
  });

  test.throws(function () {
    // requires a name
    route = new Route(router);
  });


  handler = function () {};
  route = new Route(router, 'test', handler);
  test.equal(route.handler, handler);

  route = new Route(router, 'test', {}, handler);
  test.equal(route.handler, handler);

  route = new Route(router, 'test', {handler: handler});
  test.equal(route.handler, handler);

  route = new Route(router, 'test', {}, handler);
  test.equal(route.router, router);
  test.equal(route.originalPath, '/test');
  test.isTrue(route.compiledPath);
  test.equal(route.name, 'test');
  test.equal(route.where, 'client');

  route = new Route(router, 'test', {path: '/posts'}, handler);
  test.equal(route.originalPath, '/posts');
});

Tinytest.add('Route - methods', function (test) {
  var router = new IronRouter({autoRender: false, autoStart: false})
    , route
    , handler
    , params
    , path
    , url;
 
  route = new Route(router, 'postShow', {path: '/posts/:id'}, handler);

  // little leaky as we're reaching into compiledPath (RoutePath) but faster
  // than stubbing all the methods.

  test.isTrue(route.test('/posts/5'));

  params = route.params('/posts/5');
  test.equal(params.id, '5');

  path = route.path({id: 5});
  test.equal(path, '/posts/5');

  url = route.url({id: 5});
  test.equal(url, Meteor.absoluteUrl() + 'posts/5');
});
