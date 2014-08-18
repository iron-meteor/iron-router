Package.describe({
  summary: 'Routing specifically designed for Meteor',
  version: "0.9.0",
  git: "https://github.com/eventedmind/iron-router"
});

Package.on_use(function (api) {
  // meteor dependencies
  api.use('underscore');
  api.use('webapp', 'server');
  api.use('deps', 'client');
  api.use('ui');
  api.use('templating');

  // for dynamic scoping with environment variables
  api.use('meteor')

  // main namespace and utils
  api.use('iron:core');
  api.imply('iron:core');

  // connect like middleware stack for client/server
  api.use('iron:middleware-stack');

  // client and server side url utilities and compiling
  api.use('iron:url');

  // for reactive urls and pushState in the browser
  api.use('iron:location');

  // for RouteController which inherits from this
  api.use('iron:controller');

  api.add_files('lib/current_options.js');
  api.add_files('lib/http_methods.js');
  api.add_files('lib/route_controller.js');
  api.add_files('lib/route_controller_server.js', 'server');
  api.add_files('lib/route_controller_client.js', 'client');
  api.add_files('lib/route.js');
  api.add_files('lib/router.js');
  api.add_files('lib/router_client.js', 'client');
  api.add_files('lib/router_server.js', 'server');
  api.add_files('lib/hooks_client.js', 'client');
  api.add_files('lib/helpers_client.js', 'client');
  api.add_files('lib/plugins.js');
  api.add_files('lib/global_router.js');
  api.add_files('lib/templates.html');

  // symbol exports
  api.export('Router');
  api.export('RouteController');
});

Package.on_test(function (api) {
  api.use('iron-router');
  api.use('tinytest');
  api.use('test-helpers');

  api.add_files('test/helpers.js');
  api.add_files('test/route_test.js');
  api.add_files('test/router_test.js');
  api.add_files('test/route_controller_test.js');
});
