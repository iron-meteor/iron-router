Package.describe({
  summary: 'Routing for Meteor'
});

Npm.depends({'connect': '2.7.10'});

Package.on_use(function (api) {
  api.use([
    'deps',
    'underscore',
    'handlebars'
  ], 'client');

  api.add_files([
    'lib/route_path.js',
    'lib/route_context.js',
    'lib/route.js',
    'lib/route_handlers/simple_route_handler.js',
    'lib/router.js',
  ], ['client', 'server']);

  api.add_files([
    'lib/client/router.js',
    'lib/client/helpers.js'
  ], 'client');
  
  api.add_files([
    'lib/server/router.js'
  ], 'server');

  api.add_files([
    'router.js'
  ], ['client', 'server']);
});

Package.on_test(function (api) {
  api.use([
    'router', 
    'reactive-dict', 
    'tinytest', 
    'test-helpers'
  ], ['client', 'server']);
  
  api.use([
    'http'
  ], 'server')
  
  // api.add_files('test/router_tests.js', 'client');
  api.add_files('test/router_server_tests.js', 'server');
});
