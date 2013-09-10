Package.describe({
  summary: 'Routing specifically designed for Meteor'
});

Package.on_use(function (api) {
  api.use([
    'reactive-dict',
    'meteor',
    'deps',
    'underscore',
    'ejson'
  ], ['client', 'server']);

  api.use([
    'templating',
    'handlebars',
    'jquery'
  ], 'client');

  api.add_files([
    'lib/utils.js',
    'lib/route.js',
    'lib/route_controller.js',
    'lib/router.js'
  ], ['client', 'server']);

  api.add_files([
    'lib/client/location.js',
    'lib/client/page_controller.js',
    'lib/client/router.js',
    'lib/client/default_layout.html',
    'lib/client/route_controller.js',
    'lib/client/helpers.js'
  ], 'client');

  api.add_files([
    'lib/server/route_controller.js',
    'lib/server/router.js'
  ], 'server');

  // for backward compat before Meteor linker changes
  if (typeof api.export !== 'undefined') {
    api.use('webapp', 'server');
    Npm.depends({connect: '2.7.10'});

    api.export([
     'RouteController',
     'Router'
    ], ['client', 'server']);

    api.export([
      'IronLocation'
    ], 'client');

    api.export([
     'Utils'
    ], ['client', 'server'], {testOnly: true});
  }
});

Package.on_test(function (api) {
  api.use([
    'iron-router',
    'tinytest',
    'test-helpers',
    'templating',
    'reactive-dict'
  ], ['client']);

  api.add_files([
    'test/test_helpers.js',
    'test/router_utils_test.js',
    'test/route_path_test.js',
    'test/route_context_test.js',
    'test/route_test.js',
    'test/router_test.js',
  ], ['client']);

  api.add_files([
    'test/client/test_templates.html',
    'test/client/route_controller_test.js',
    'test/client/client_router_test.js'
  ], 'client');
});
