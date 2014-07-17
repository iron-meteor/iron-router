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
