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
  test.equal(controller.hooks.before[0], options.before);
  test.equal(controller.hooks.after[0], options.after);
});

Tinytest.add('IronRouteController - inheritance', function (test) {
  var before = function () {};
  var after = function () {};

  var proto = {
    before: before,
    after: after
  };
  var MyController = IronRouteController.extend(proto);

  test.equal(MyController.hooks.before[0], before);
  test.equal(MyController.hooks.after[0], after);
});

Tinytest.add('IronRouteController - runHooks', function (test) {
  var hookCalls;

  var before = function () {
    hookCalls.push('protoBefore');
  };

  var after = function () {
    hookCalls.push('protoAfter');
  };

  var proto = {
    before: before,
    after: after
  };
  var MyController = IronRouteController.extend(proto);

  test.equal(MyController.hooks.before[0], before);
  test.equal(MyController.hooks.after[0], after);

  var instance = new MyController({
    before: function () {
      hookCalls.push('optionsBefore');
    },

    after: function () {
      hookCalls.push('optionsAfter');
    }
  });

  hookCalls = [];
  instance.runHooks('before');
  test.equal(hookCalls[0], 'optionsBefore');
  test.equal(hookCalls[1], 'protoBefore');

  hookCalls = [];
  instance.runHooks('after');
  test.equal(hookCalls[0], 'optionsAfter');
  test.equal(hookCalls[1], 'protoAfter');
});

Tinytest.add('IronRouteController - runHooks with arrays', function (test) {
  var hookCalls;

  var MyController = IronRouteController.extend({
    before: [
      function () {
        hookCalls.push('protoBefore 1');
      },

      function () {
        hookCalls.push('protoBefore 2');
      }
    ],

    after: [
      function () {
        hookCalls.push('protoAfter 1');
      },

      function () {
        hookCalls.push('protoAfter 2');
      }
    ]
  });

  var instance = new MyController({
    before: [
      function () {
        hookCalls.push('optionsBefore 1');
      },

      function () {
        hookCalls.push('optionsBefore 2');
      }
    ],

    after: [
      function () {
        hookCalls.push('optionsAfter 1');
      },

      function () {
        hookCalls.push('optionsAfter 2');
      }
    ]
  });

  hookCalls = [];
  instance.runHooks('before');
  test.equal(hookCalls[0], 'optionsBefore 1');
  test.equal(hookCalls[1], 'optionsBefore 2');
  test.equal(hookCalls[2], 'protoBefore 1');
  test.equal(hookCalls[3], 'protoBefore 2');

  hookCalls = [];
  instance.runHooks('after');
  test.equal(hookCalls[0], 'optionsAfter 1');
  test.equal(hookCalls[1], 'optionsAfter 2');
  test.equal(hookCalls[2], 'protoAfter 1');
  test.equal(hookCalls[3], 'protoAfter 2');
});
