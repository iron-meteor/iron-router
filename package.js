Package.describe({
  summary: 'Routing specifically designed for Meteor'
});

Package.on_use(function (api) {
  api.use('reactive-dict', ['client', 'server']);
  api.use('deps', ['client', 'server']);
  api.use('underscore', ['client', 'server']);
  api.use('ejson', ['client', 'server']);

  api.use('ui', 'client');
  api.use('templating', 'client');
  api.use('handlebars', 'client');
  api.use('jquery', 'client');

  api.add_files('lib/utils.js');
  api.add_files('lib/wait_list.js');
  api.add_files('lib/route_match.js');
  api.add_files('lib/route.js');
  api.add_files('lib/router.js');

  api.add_files('lib/client/location.js', 'client');
  api.add_files('lib/client/page.js', 'client');
  api.add_files('lib/client/route.js', 'client');
  api.add_files('lib/client/router.js', 'client');
  api.add_files('lib/client/default_layout.html', 'client');
  api.add_files('lib/client/helpers.html', 'client');
  api.add_files('lib/client/helpers.js', 'client');

  api.add_files('lib/server/route_match.js', 'server');
  api.add_files('lib/server/route.js', 'server');
  api.add_files('lib/server/router.js', 'server');

  // for backward compat before Meteor linker changes
  if (typeof api.export !== 'undefined') {
    api.use('webapp', 'server');
    Npm.depends({connect: '2.7.10'});

    //api.export('RouteController', ['client', 'server']);
    api.export('Route');
    api.export('Router');

    api.export('IronLocation', 'client');
    api.export('Page', 'client');

    api.export('Utils', ['client', 'server'], {testOnly: true});
    api.export('IronRouter', ['client', 'server'], {testOnly: true});
    api.export('ClientRouter', 'client', {testOnly: true});
    api.export('ServerRouter', 'server', {testOnly: true});
    api.export('RouteMatch', ['client', 'server'], {testOnly: true});
  }
});

Package.on_test(function (api) {
  api.use('iron-router', ['client', 'server']);
  api.use('tinytest', ['client', 'server']);
  api.use('test-helpers', ['client', 'server']);
  api.use('reactive-dict', ['client', 'server']);

  api.use('templating', 'client');

  api.add_files('test/test_helpers.js', ['client', 'server']);
  api.add_files('test/route.js', ['client', 'server']);
  api.add_files('test/route_controller.js', ['client', 'server']);
  api.add_files('test/router.js', ['client', 'server']);

  api.add_files('test/server/router.js', 'server');

  api.add_files('test/client/templates.html', 'client');
  api.add_files('test/client/router.js', 'client');
  api.add_files('test/client/route_controller.js', 'client');
});
