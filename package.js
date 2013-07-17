Package.describe({
  summary: 'Routing for Meteor'
});

Package.on_use(function (api) {
  api.use([
    'meteor',
    'deps',
    'underscore',
    'handlebars',
    'posture',
    'controller'
  ], 'client');

  api.add_files([
    'lib/route_path.js',
    'lib/route_context.js',
    'lib/route.js',
    'lib/router.js'
  ], ['client', 'server']);

  api.add_files([
    'lib/client/location.js',
    'lib/client/route_controller.js',
    'lib/client/client_router.js',
    'lib/client/helpers.js'
  ], 'client');

  api.add_files([
    'lib/server/route_controller.js',
    'lib/server/server_router.js'
  ], 'server');
});

Package.on_test(function (api) {
  api.use('iron-router', ['client', 'server']);
  api.use('reactive-dict', 'client');
  api.use('tinytest', 'client');
  api.use('test-helpers', 'client');


  api.add_files([
    'test/test-helpers.js',
    'test/route_path_test.js',
    'test/route_context_test.js',
    'test/route_test.js',
    'test/router_test.js'
  ], ['client', 'server']);

  api.add_files([
    'test/client/location_test.js',
    'test/client/route_controller_test.js',
    'test/client/client_router_test.js',
  ], 'client');

  api.add_files([
    'test/server/route_controller_test.js',
    'test/server/server_router_test.js',
  ], 'server');
});
