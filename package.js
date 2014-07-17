Package.describe({
  name: 'router',
  summary: 'Routing specifically designed for Meteor',
  version: "0.9.0",
  githubUrl: "https://github.com/eventedmind/iron-router"
});

Package.on_use(function (api) {
  // meteor dependencies
  api.use('underscore');
  api.use('webapp', 'server');
  api.use('deps', 'client');
  api.use('ui');
  api.use('templating');

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

  api.addFiles('lib/utils.js');
  api.addFiles('lib/http_methods.js');


  api.addFiles('lib/route_controller.js');
  api.addFiles('lib/route_controller_server.js', 'server');
  api.addFiles('lib/route_controller_client.js', 'client');

  api.addFiles('lib/route.js');

  api.addFiles('lib/router.js');
  api.addFiles('lib/router_client.js', 'client');
  api.addFiles('lib/router_server.js', 'server');

  api.addFiles('lib/hooks_client.js', 'client');

  api.addFiles('lib/helpers_client.js', 'client');

  api.addFiles('lib/plugins.js');

  api.addFiles('lib/global_router.js');

  // symbol exports
  api.export('Router');
  api.export('RouteController');
});

Package.on_test(function (api) {
  api.use('iron:router');
  api.use('tinytest');
  api.use('test-helpers');

  api.addFiles('test/helpers.js');
  api.addFiles('test/route_test.js');
  api.addFiles('test/router_test.js');
  api.addFiles('test/route_controller_test.js');
});
