Package.describe({
  name: 'iron:router',
  summary: 'Routing specifically designed for Meteor',
  version: '1.1.2',
  git: 'https://github.com/iron-meteor/iron-router'
});

Npm.depends({
  'body-parser': '1.12.4'
});

Package.on_use(function (api) {
  api.versionsFrom('METEOR@0.9.2');
  // meteor dependencies
  api.use('underscore');
  api.use('webapp', 'server');
  api.use('deps', 'client');
  api.use('ui');
  api.use('templating');

  // for cloning
  api.use('ejson');

  // for dynamic scoping with environment variables
  api.use('meteor');

  // main namespace and utils
  api.use('iron:core@1.0.11');
  api.imply('iron:core');

  // ui layout
  api.use('iron:layout@1.0.12');

  // connect like middleware stack for client/server
  api.use('iron:middleware-stack@1.1.0');

  // client and server side url utilities and compiling
  api.use('iron:url@1.1.0');

  // for reactive urls and pushState in the browser
  api.use('iron:location@1.0.11');

  // for RouteController which inherits from this
  api.use('iron:controller@1.0.12');

  api.add_files('lib/current_options.js');
  api.add_files('lib/http_methods.js');
  api.add_files('lib/route_controller.js');
  api.add_files('lib/route_controller_server.js', 'server');
  api.add_files('lib/route_controller_client.js', 'client');
  api.add_files('lib/route.js');
  api.add_files('lib/router.js');
  api.add_files('lib/hooks.js');
  api.add_files('lib/helpers.js');
  api.add_files('lib/router_client.js', 'client');
  api.add_files('lib/body_parser_server.js', 'server');
  api.add_files('lib/router_server.js', 'server');
  api.add_files('lib/plugins.js');
  api.add_files('lib/global_router.js');
  api.add_files('lib/templates.html');

  // symbol exports
  api.export('Router');
  api.export('RouteController');
});

Package.on_test(function (api) {
  api.use('iron:router');
  api.use('tinytest');
  api.use('test-helpers');

  api.add_files('test/helpers.js');
  api.add_files('test/route_test.js');
  api.add_files('test/router_test.js');
  api.add_files('test/route_controller_test.js');
});
