var Route = Iron.Route;
var RouteController = Iron.RouteController;

Tinytest.add('Route - findControllerConstructor', function (test) {
  var global = Iron.utils.global;
  var route;
  var router = new Iron.Router({autoStart: false, autoRender: false});

  global.FooController = RouteController.extend({
  });

  route = new Route('/foo');
  route.router = router;
  route.handler = {name: 'Foo'};
  test.equal(route.findControllerConstructor(), global.FooController);

  route = new Route('/bar', {controller: 'FooController'});
  route.router = router;
  test.equal(route.findControllerConstructor(), global.FooController);

  route = new Route('/bar');
  route.router = router;
  test.equal(route.findControllerConstructor(), Iron.RouteController);
});

Tinytest.add('Route - backward api compat', function (test) {
  var router = new Iron.Router({autoStart: false, autoRender: false});

  try {
    var route = new Route('name');
    test.equal(route._path, '/name', 'name of route as first param with no options should work.');
  } catch (e) {
    test.fail('name of route as first param with no options should work.');
  }

  try {
    var route = router.route('/name');
    test.equal(route._path, '/name', 'path as first param works.');
    test.equal(route.getName(), 'name', 'path as first param converted properly to a name too.');
  } catch (e) {
    test.fail('/name as first param does not work');
  }

  try {
    var route = router.route('withpath', {path: '/with/path'});
    test.equal(route._path, '/with/path', 'path option works');
    test.equal(route.getName(), 'withpath', 'first param name with path option works');
  } catch (e) {
    test.fail('first param name with a path option does not work');
  }
});
