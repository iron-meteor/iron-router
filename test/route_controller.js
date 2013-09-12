Tinytest.add('RouteController - constructor options', function (test) {
  var options = {
    route: {},
    path: '/test',
    params: [],
    where: 'where',
    action: 'action',
    before: function () {},
    after: function () {}
  };

  var controller = new RouteController(options);

  test.equal(controller.route, options.route);
  test.equal(controller.path, options.path);
  test.equal(controller.params, options.params);
  test.equal(controller.where, options.where);
  test.equal(controller.action, options.action);
  test.equal(controller.hooks.before[0], options.before);
  test.equal(controller.hooks.after[0], options.after);
});

Tinytest.add('RouteController - inheritance', function (test) {
  var before = function () {};
  var after = function () {};

  var proto = {
    before: before,
    after: after
  };
  var MyController = RouteController.extend(proto);

  test.equal(MyController.hooks.before[0], before);
  test.equal(MyController.hooks.after[0], after);
});

Tinytest.add('RouteController - runHooks', function (test) {
  var before = function () {};
  var after = function () {};

  var proto = {
    before: before,
    after: after
  };
  var MyController = RouteController.extend(proto);

  test.equal(MyController.hooks.before[0], before);
  test.equal(MyController.hooks.after[0], after);
});

