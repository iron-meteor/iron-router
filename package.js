Package.describe({
  summary: 'Routing specifically designed for Meteor',
<<<<<<< HEAD
  version: '0.9.3',
  git: 'https://github.com/eventedmind/iron-router'
});

Package.on_use(function (api) {
  api.versionsFrom('METEOR@0.9.1');

  api.use('reactive-dict', ['client', 'server']);
  api.use('deps', ['client', 'server']);
  api.use('underscore', ['client', 'server']);
  api.use('ejson', ['client', 'server']);
  api.use('jquery', 'client');
  api.use('webapp', 'server');

  // for helpers
  api.use('blaze', 'client');

  // gives us dynamic layouts
  api.use('iron:layout@0.4.1');

  // in case they have the old version that was
  // automigrated from atmosphere.
  api.use('cmather:iron-router@0.8.2', {weak: true});

  api.add_files('lib/utils.js', ['client', 'server']);
  api.add_files('lib/route.js', ['client', 'server']);
  api.add_files('lib/route_controller.js', ['client', 'server']);
  api.add_files('lib/router.js', ['client', 'server']);

  api.add_files('lib/client/location.js', 'client');
  api.add_files('lib/client/router.js', 'client');
  api.add_files('lib/client/wait_list.js', 'client');
  api.add_files('lib/client/hooks.js', 'client');
  api.add_files('lib/client/route_controller.js', 'client');
  api.add_files('lib/client/ui/helpers.js', 'client');

  api.add_files('lib/server/route_controller.js', 'server');
  api.add_files('lib/server/router.js', 'server');

  api.add_files('lib/version_conflict_error.js');

  Npm.depends({connect: '2.9.0'});

  api.export('RouteController', ['client', 'server']);
  api.export('Route', ['client', 'server']);
  api.export('Router', ['client', 'server']);
  api.export('IronLocation', 'client');

  api.export('Utils', ['client', 'server'], {testOnly: true});
  api.export('IronRouter', ['client', 'server'], {testOnly: true});
  api.export('WaitList', 'client', {testOnly: true});
});

Package.on_test(function (api) {
  api.versionsFrom('METEOR@0.9.1');

  api.use('iron:router', ['client', 'server']);
  api.use('tinytest', ['client', 'server']);
  api.use('test-helpers', ['client', 'server']);
  api.use('reactive-dict', ['client', 'server']);
  api.use('underscore');

  api.add_files('test/test_helpers.js', ['client', 'server']);

  // client and server
  api.add_files('test/both/route.js', ['client', 'server']);
  api.add_files('test/both/route_controller.js', ['client', 'server']);
  api.add_files('test/both/router.js', ['client', 'server']);
  api.add_files('test/both/utils.js', ['client', 'server']);

  // server only
  api.add_files('test/server/router.js', 'server');

  // client only
  api.add_files('test/client/mocks.js', 'client');
  api.add_files('test/client/router.js', 'client');
  api.add_files('test/client/route_controller.js', 'client');
  api.add_files('test/client/wait_list.js', 'client');
=======
  version: "1.0.0-pre2",
  git: "https://github.com/eventedmind/iron-router"
});

Npm.depends({
  'body-parser': '1.8.1'
});

Package.on_use(function (api) {
  api.versionsFrom('METEOR@0.9.2');
  // meteor dependencies
  api.use('underscore');
  api.use('webapp', 'server');
  api.use('deps', 'client');
  api.use('ui');
  api.use('templating');

  // for dynamic scoping with environment variables
  api.use('meteor')

  // main namespace and utils
  api.use('iron:core@1.0.0-pre2');
  api.imply('iron:core');

  // ui layout
  api.use('iron:layout@1.0.0-pre2');

  // connect like middleware stack for client/server
  api.use('iron:middleware-stack@1.0.0-pre2');

  // client and server side url utilities and compiling
  api.use('iron:url@1.0.0-pre2');

  // for reactive urls and pushState in the browser
  api.use('iron:location@1.0.0-pre2');

  // for RouteController which inherits from this
  api.use('iron:controller@1.0.0-pre2');

  api.add_files('lib/current_options.js');
  api.add_files('lib/http_methods.js');
  api.add_files('lib/route_controller.js');
  api.add_files('lib/route_controller_server.js', 'server');
  api.add_files('lib/route_controller_client.js', 'client');
  api.add_files('lib/route.js');
  api.add_files('lib/router.js');
  api.add_files('lib/hooks_client.js', 'client');
  api.add_files('lib/helpers_client.js', 'client');
  api.add_files('lib/router_client.js', 'client');
  api.add_files('lib/router_server.js', 'server');
  api.add_files('lib/plugins.js');
  api.add_files('lib/global_router.js');
  api.add_files('lib/templates.html');
  api.add_files('lib/body_parser_server.js', 'server');

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
>>>>>>> next
});
