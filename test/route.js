/*
 * Tests for Route
 */

var paths = {
  explicit: '/posts',
  required: '/posts/:param',
  multi: '/posts/:paramOne/:paramTwo',
  optional: '/posts/:paramOne/:paramTwo?',
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
  test.isFalse(route.test('/posts/1/2'));
  test.isNull(route.exec('/posts/1/2'));

  route = new Route(Router, 'multi', {
    path: paths.multi
  });
  test.isTrue(route.test('/posts/1/2'));
  test.isTrue(route.exec('/posts/1/2'));
  test.isFalse(route.test('/posts/1/2/3'));
  test.isNull(route.exec('/posts/1/2/3'));

  route = new Route(Router, 'optional', {
    path: paths.optional
  });
  test.isTrue(route.test('/posts/1'));
  test.isTrue(route.exec('/posts/1'));
  test.isTrue(route.test('/posts/1/2'));
  test.isTrue(route.exec('/posts/1/2'));

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
    param: '1'
  };
  options = {
    query: {
      q: 's'
    },
    hash: 'anchorTag'
  };
  test.equal(route.resolve(params, options), '/posts/1/?q=s#anchorTag');

  // required parameter
  test.throws(function () {
    route.resolve({});
  });
});

Tinytest.add('Route - normalizePath', function (test) {
  var route = new Route(Router, 'explicit', {
    path: paths.explicit
  });

  test.equal(route.normalizePath('/posts'), '/posts');
  test.equal(route.normalizePath('posts'), '/posts');
  test.equal(route.normalizePath('http://localhost:3000/posts'), '/posts');
  test.equal(route.normalizePath('/posts?q=s'), '/posts');
  test.equal(route.normalizePath('/posts#anchorTag'), '/posts');
});

Tinytest.add('Route - getController', function (test) {
  var route;
  var root = Utils.global();

  root.TestController = function (options)  {
    if (arguments.length < 1)
      throw new Error('Argument length check');

    this.options = options;
  };

  var testGetController = function (route) {
    var controller = route.getController('/test', {option: true});
    test.isTrue(controller instanceof TestController);
    test.equal(controller.options.route, route);
    test.equal(controller.options.template, 'template');
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
  var controller = route.getController('/anon', {option: true});
  test.isTrue(controller instanceof RouteController);
  test.equal(controller.options.route, route);
  test.equal(controller.options.template, 'template');
  test.isTrue(controller.options.option);
});
