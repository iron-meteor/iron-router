/*
 * Tests for Route
 */

var paths = {
  explicit: '/posts',
  required: '/posts/:param',
  multi: '/posts/:paramOne/:paramTwo',
  optional: '/posts/:paramOne/:paramTwo?',
  simpleOptional: '/:param?',
  twoOptional: '/:paramOne?/:paramTwo?',
  mixedOptional: '/:paramOne?/:paramTwo/:paramThree?',
  wildcard: '/posts/*',
  namedWildcard: '/posts/:file(*)',
  regex: /^\/commits\/(\d+)\.\.(\d+)/
};

Tinytest.add('Route - matching', function (test) {
  var route = new Route(Router, 'explicit', {
    path: paths.explicit
  });
  test.isTrue(route.test('/posts'));
  test.isTrue(route.exec('/posts'));
  test.isTrue(route.test('/posts/'));
  test.isFalse(route.test('/posts/1'));
  test.isNull(route.exec('/posts/1'));

  route = new Route(Router, 'required', {
    path: paths.required
  });
  test.isTrue(route.test('/posts/1'));
  test.isTrue(route.exec('/posts/1'));
  test.isTrue(route.test('/posts/1/'));
  test.isTrue(route.exec('/posts/1/'));
  test.isFalse(route.test('/posts/1/2'));
  test.isNull(route.exec('/posts/1/2'));

  route = new Route(Router, 'multi', {
    path: paths.multi
  });
  test.isTrue(route.test('/posts/1/2'));
  test.isTrue(route.exec('/posts/1/2'));
  test.isTrue(route.test('/posts/1/2/'));
  test.isTrue(route.exec('/posts/1/2/'));
  test.isFalse(route.test('/posts/1/2/3'));
  test.isNull(route.exec('/posts/1/2/3'));

  route = new Route(Router, 'optional', {
    path: paths.optional
  });
  test.isTrue(route.test('/posts/1'));
  test.isTrue(route.exec('/posts/1'));
  test.isTrue(route.test('/posts/1/2'));
  test.isTrue(route.exec('/posts/1/2'));
  test.isTrue(route.test('/posts/1/2/'));
  test.isTrue(route.exec('/posts/1/2/'));
  test.isFalse(route.test('/posts/1/2/3'));
  test.isNull(route.exec('/posts/1/2/3'));

  route = new Route(Router, 'simpleOptional', {
    path: paths.simpleOptional
  });
  test.isTrue(route.test('/'));
  test.isTrue(route.exec('/'));
  test.isTrue(route.test('/1'));
  test.isTrue(route.exec('/1'));
  test.isTrue(route.test('/1/'));
  test.isTrue(route.exec('/1/'));
  test.isFalse(route.test('/1/2'));
  test.isNull(route.exec('/1/2'));

  route = new Route(Router, 'twoOptional', {
    path: paths.twoOptional
  });
  test.isTrue(route.test('/'));
  test.isTrue(route.exec('/'));
  test.isTrue(route.test('/1'));
  test.isTrue(route.exec('/1'));
  test.isTrue(route.test('/1/'));
  test.isTrue(route.exec('/1/'));
  test.isTrue(route.test('/1/2'));
  test.isTrue(route.exec('/1/2'));
  test.isTrue(route.test('/1/2/'));
  test.isTrue(route.exec('/1/2/'));
  test.isFalse(route.test('/1/2/3'));
  test.isNull(route.exec('/1/2/3'));

  route = new Route(Router, 'mixedOptional', {
    path: paths.mixedOptional
  });
  test.isFalse(route.test('/'));
  test.isNull(route.exec('/'));
  test.isTrue(route.test('/1'));
  test.isTrue(route.exec('/1'));
  test.isTrue(route.test('/1/'));
  test.isTrue(route.exec('/1/'));
  test.isTrue(route.test('/1/2'));
  test.isTrue(route.exec('/1/2'));
  test.isTrue(route.test('/1/2/'));
  test.isTrue(route.exec('/1/2/'));
  test.isTrue(route.test('/1/2/3'));
  test.isTrue(route.exec('/1/2/3'));
  test.isTrue(route.test('/1/2/3/'));
  test.isTrue(route.exec('/1/2/3/'));
  test.isFalse(route.test('/1/2/3/4'));
  test.isNull(route.exec('/1/2/3/4'));

  route = new Route(Router, 'wildcard', {
    path: paths.wildcard
  });
  test.isTrue(route.test('/posts/1/2'));
  test.isTrue(route.exec('/posts/1/2'));
  test.isTrue(route.test('/posts/1/2/3'));
  test.isTrue(route.exec('/posts/1/2/3'));
  test.isTrue(route.test('/posts/1/2/3/4'));
  test.isTrue(route.exec('/posts/1/2/3/4'));

  route = new Route(Router, 'namedWildcard', {
    path: paths.namedWildcard
  });
  test.isTrue(route.test('/posts/path/to/file'));
  test.isTrue(route.exec('/posts/path/to/file'));

  route = new Route(Router, 'regex', {
    path: paths.regex
  });
  test.isTrue(route.test('/commits/123..456'));
  test.isTrue(route.exec('/commits/123..456'));
});

Tinytest.add('Route - params', function (test) {
  var route = new Route(Router, 'explicit', {
    path: paths.explicit
  });

  test.isNull(route.params());
  test.isTrue(route.params('/posts') instanceof Array);

  route = new Route(Router, 'required', {
    path: paths.required
  });

  var params = route.params('/posts/1');
  test.equal(params.param, "1");

  route = new Route(Router, 'multi', {
    path: paths.multi
  });
  params = route.params('/posts/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');

  route = new Route(Router, 'optional', {
    path: paths.optional
  });
  params = route.params('/posts/1');
  test.equal(params.paramOne, '1');
  test.isUndefined(params.paramTwo);

  params = route.params('/posts/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
  
  route = new Route(Router, 'simpleOptional', {
    path: paths.simpleOptional
  });
  
  params = route.params('/');
  test.isUndefined(params.param);

  params = route.params('/1');
  test.equal(params.param, '1');

  route = new Route(Router, 'twoOptional', {
    path: paths.twoOptional
  });

  params = route.params('/');
  test.isUndefined(params.paramOne);
  test.isUndefined(params.paramTwo);

  params = route.params('/1');
  test.equal(params.paramOne, '1');
  test.isUndefined(params.paramTwo);

  params = route.params('/1/');
  test.equal(params.paramOne, '1');
  test.isUndefined(params.paramTwo);

  params = route.params('/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');

  route = new Route(Router, 'mixedOptional', {
    path: paths.mixedOptional
  });

  params = route.params('/1');
  test.isUndefined(params.paramOne);
  test.equal(params.paramTwo, '1');
  test.isUndefined(params.paramThree);

  params = route.params('/1/');
  test.isUndefined(params.paramOne);
  test.equal(params.paramTwo, '1');
  test.isUndefined(params.paramThree);

  params = route.params('/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
  test.isUndefined(params.paramThree);

  params = route.params('/1/2/');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
  test.isUndefined(params.paramThree);

  params = route.params('/1/2/3');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
  test.equal(params.paramThree, '3');

  route = new Route(Router, 'wildcard', {
    path: paths.wildcard
  });
  params = route.params('/posts/some/wildcard/path');
  test.equal(params[0], 'some/wildcard/path');

  route = new Route(Router, 'namedWildcard', {
    path: paths.namedWildcard
  });
  params = route.params('/posts/some/file/path');
  test.equal(params.file, 'some/file/path');

  route = new Route(Router, 'regex', {
    path: paths.regex
  });
  params = route.params('/commits/123..456');
  test.equal(params[0], '123');
  test.equal(params[1], '456');
});

Tinytest.add('Route - params with query and hash', function (test) {
  var route = new Route(Router, 'optional', {
    path: paths.optional
  });

  var params;

  params = route.params('/posts/1?q=s#anchorTag');
  test.equal(params.paramOne, '1');
  test.isUndefined(params.paramTwo);
  test.equal(params.q, 's');
  test.equal(params.hash, 'anchorTag');

  params = route.params('/posts/1/2?q=s#anchorTag');
  test.equal(params.paramTwo, '2');
});

Tinytest.add('Route - resolve', function (test) {
  var route = new Route(Router, 'required', {
    path: paths.required
  });

  var params;
  var options;

  params = {
    param: '1'
  };
  test.equal(route.resolve(params), '/posts/1');

  params = {
    param: 1
  };
  test.equal(route.resolve(params), '/posts/1');

  params = {
    param: '1'
  };
  options = {
    query: {
      q: 's'
    },
    hash: 'anchorTag'
  };
  test.equal(route.resolve(params, options), '/posts/1?q=s#anchorTag');

  params = {
    param: 1
  };
  options = {
    query: {
      q: 2
    },
    hash: 3
  };
  test.equal(route.resolve(params, options), '/posts/1?q=2#3', 
    'Must be able to resolve integer-formatted (non-string) params');

  test.equal(route.resolve(), null);

  route = new Route(Router, 'optional', {
    path: paths.optional
  });
  params = {
    paramOne: 'a',
    paramTwo: 'b'
  };
  test.equal(route.resolve(params), '/posts/a/b');
  params = {
    paramOne: 'a'
  };
  test.equal(route.resolve(params), '/posts/a');

  route = new Route(Router, 'simpleOptional', {
    path: paths.simpleOptional
  });
  params = {
    param: 'a'
  };
  test.equal(route.resolve(params), '/a');
  params = {};
  test.equal(route.resolve(params), '/');
  test.equal(route.resolve(), '/');

  route = new Route(Router, 'twoOptional', {
    path: paths.twoOptional
  });
  test.equal(route.resolve({}), '/');
  test.equal(route.resolve(), '/');
  params = {
    paramOne: 'a'
  };
  test.equal(route.resolve(params), '/a');
  params = {
    paramOne: 'a',
    paramTwo: 'b'
  };
  test.equal(route.resolve(params), '/a/b');
  params = {
    paramTwo: 'b'
  };
  test.equal(route.resolve(params), '/b');

  route = new Route(Router, 'mixedOptional', {
    path: paths.mixedOptional
  });
  test.equal(route.resolve({}), null);
  test.equal(route.resolve(), null);
  params = {
    paramOne: 'a'
  };
  test.equal(route.resolve(params), null);
  params = {
    paramOne: 'a',
    paramTwo: 'b'
  };
  test.equal(route.resolve(params), '/a/b');
  params = {
    paramTwo: 'b'
  };
  test.equal(route.resolve(params), '/b');
  params = {
    paramTwo: 'b',
    paramThree: 'c'
  };
  test.equal(route.resolve(params), '/b/c');
  params = {
    paramOne: 'a',
    paramThree: 'c'
  };
  test.equal(route.resolve(params), null);
  params = {
    paramThree: 'c'
  };
  test.equal(route.resolve(params), null);
  params = {
    paramOne: 'a',
    paramTwo: 'b',
    paramThree: 'c'
  };
  test.equal(route.resolve(params), '/a/b/c');

  route = new Route(Router, 'wildcard', {
    path: paths.wildcard
  });
  params = ['some/file/path'];
  test.equal(route.resolve(params), '/posts/some/file/path');
});

Tinytest.add('Route - normalizePath', function (test) {
  var route = new Route(Router, 'explicit', {
    path: paths.explicit
  });

  test.equal(route.normalizePath('/posts'), '/posts');
  test.equal(route.normalizePath('posts'), '/posts');
  test.equal(route.normalizePath(Meteor.absoluteUrl('posts')), '/posts');
  test.equal(route.normalizePath('/posts?q=s'), '/posts');
  test.equal(route.normalizePath('/posts#anchorTag'), '/posts');
});

Tinytest.add('Route - newController', function (test) {
  var route;
  var root = Utils.global;

  root.TestController = function (router, route, options)  {
    if (arguments.length < 2)
      throw new Error('Argument length check');

    this.options = options;
    this.router = router;
    this.route = route; 
  };

  var testGetController = function (route) {
    var controller = route.newController('/test', {option: true});
    test.isTrue(controller instanceof TestController);
    test.equal(controller.route, route);
    test.equal(controller.router, Router);
    test.isTrue(controller.options.option);
  };

  // case 1: controller option
  var route = new Route(Router, 'test', {
    controller: root.TestController,
    template: 'template'
  });
  testGetController(route);

  // case 1a: controller option as string
  var route = new Route(Router, 'test', {
    controller: 'TestController',
    template: 'template'
  });
  testGetController(route);

  root.App = {};
  root.App.TestController = root.TestController;
  // case 1b: controller option as namespaced string
  var route = new Route(Router, 'test', {
    controller: 'App.TestController',
    template: 'template'
  });
  testGetController(route);

  // case 2: resolve controller intelligently 
  var route = new Route(Router, 'test', {
    template: 'template'
  });
  testGetController(route);

  // case 3: anonymous controller
  // case 2: resolve controller intelligently 
  var route = new Route(Router, 'anon', {
    template: 'template'
  });
  var controller = route.newController('/anon', {option: true});
  test.isTrue(controller instanceof RouteController, 'Anonymous controller not created');
  test.equal(controller.route, route);
  test.isTrue(controller.options.option);
});

Tinytest.add('Route - rewriteLegacyHooks', function (test) {
  var options = {
    load: function () {},
    before: function () {},
    after: function () {},
    unload: function () {}
  };

  var route = new Route(Router, 'explicit', options);

  test.equal(route.options.onRun, options.load);
  test.equal(route.options.onBeforeAction, options.before);
  test.equal(route.options.onAfterAction, options.after);
  test.equal(route.options.onStop, options.unload);
});
