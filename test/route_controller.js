Tinytest.add('IronRouteController - constructor options', function (test) {
  var options = {
    route: {},
    path: '/test',
    params: [],
    where: 'where',
    action: 'action',
    before: function () {},
    after: function () {}
  };

  var controller = new IronRouteController(options);

  test.equal(controller.route, options.route);
  test.equal(controller.path, options.path);
  test.equal(controller.params, options.params);
  test.equal(controller.where, options.where);
  test.equal(controller.action, options.action);
});

Tinytest.add('IronRouteController - inheritance', function (test) {
  var before = function () {};
  var after = function () {};

  var proto = {
    before: before,
    after: after
  };
  var MyController = IronRouteController.extend(proto);

  //XXX test inheritance of hooks
});

//XXX bring back hook tests
