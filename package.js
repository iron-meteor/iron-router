Package.describe({
  summary: 'Routing specifically designed for Meteor',
  version: '0.8.2'
});

Package.on_use(function (api) {
  api.use('reactive-dict', ['client', 'server']);
  api.use('deps', ['client', 'server']);
  api.use('underscore', ['client', 'server']);
  api.use('ejson', ['client', 'server']);
  api.use('jquery', 'client');

  // default ui manager
  // use unordered: true becuase of circular dependency

  // for helpers
  api.use('ui', 'client');
 
  // gives us dynamic layouts
  api.use('iron-layout');

  // imply dynamic layouts as well so users can use them directly!
  api.imply('iron-layout');


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

  api.use('webapp', 'server');
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
  api.use('iron-router', ['client', 'server']);
  api.use('tinytest', ['client', 'server']);
  api.use('test-helpers', ['client', 'server']);
  api.use('reactive-dict', ['client', 'server']);

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
});
