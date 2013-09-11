Tinytest.add('Route - initialize', function (test) {
  var route
    , handler;

  test.throws(function () {
    // requires a router
    route = new Route;
  });

  test.throws(function () {
    // requires a name
    route = new Route(Router);
  });


  handler = function () {};
  route = new Route(Router, 'test', handler);
  test.equal(route.handler, handler);

  route = new Route(Router, 'test', {}, handler);
  test.equal(route.handler, handler);

  route = new Route(Router, 'test', {handler: handler});
  test.equal(route.handler, handler);

  route = new Route(Router, 'test', {}, handler);
  test.equal(route.router, Router);
  test.equal(route.originalPath, '/test');
  test.isTrue(route.compiledPath);
  test.equal(route.name, 'test');
  test.equal(route.where, 'client');

  route = new Route(Router, 'test', {path: '/posts'}, handler);
  test.equal(route.originalPath, '/posts');
});

Tinytest.add('Route - methods', function (test) {
  var route
    , handler
    , params
    , path
    , url;
 
  route = new Route(Router, 'postShow', {path: '/posts/:id'}, handler);

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
