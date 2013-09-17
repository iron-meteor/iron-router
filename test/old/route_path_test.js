var paths = {
  explicit: '/posts',
  required: '/posts/:param',
  multi: '/posts/:paramOne/:paramTwo',
  optional: '/posts/:paramOne/:paramTwo?',
  wildcard: '/posts/*',
  namedWildcard: '/posts/:file(*)',
  regex: /^\/commits\/(\d+)\.\.(\d+)/
};

Tinytest.add('RoutePath - initialize', function (test) {
  // initialize requires a path parameter
  test.throws(function () {
    new RoutePath;
  });
});

Tinytest.add('RoutePath - explicit path', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.explicit).compile();

  test.isTrue(routePath.test('/posts'));
  test.isFalse(routePath.test('/posts/paramOne'));

  test.isTrue(routePath.exec('/posts'));
  test.isNull(routePath.exec('/posts/paramOne'));

  path = routePath.resolve();
  test.equal(path, '/posts');

  params = routePath.params('/posts');
  test.equal(params, []);
});

Tinytest.add('RoutePath - required param', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.required).compile();

  test.isTrue(routePath.test('/posts/1'));
  test.isFalse(routePath.test('/posts/1/2'));

  test.isTrue(routePath.exec('/posts/1'));
  test.isNull(routePath.exec('/posts/1/2'));

  path = routePath.resolve({param: 1});
  test.equal(path, '/posts/1');

  params = routePath.params('/posts/1');
  test.equal(params.param, '1');
});

Tinytest.add('RoutePath - multiple params', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.multi).compile();

  test.isTrue(routePath.test('/posts/1/2'));
  test.isFalse(routePath.test('/posts/1/2/3'));

  test.isTrue(routePath.exec('/posts/1/2'));
  test.isNull(routePath.exec('/posts/1/2/3'));

  path = routePath.resolve({paramOne: 1, paramTwo: 2});
  test.equal(path, '/posts/1/2');
  
  params = routePath.params('/posts/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
});

Tinytest.add('RoutePath - optional params', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.optional).compile();

  test.isTrue(routePath.test('/posts/1'));
  test.isTrue(routePath.test('/posts/1/2'));
  test.isFalse(routePath.test('/posts/1/2/3'));

  test.isTrue(routePath.exec('/posts/1'));
  test.isTrue(routePath.exec('/posts/1/2'));
  test.isNull(routePath.exec('/posts/1/2/3'));

  path = routePath.resolve({paramOne: 1});
  test.equal(path, '/posts/1');

  path = routePath.resolve({paramOne: 1, paramTwo: 2});
  test.equal(path, '/posts/1/2');

  params = routePath.params('/posts/1');
  test.equal(params.paramOne, '1');
  test.isUndefined(params.paramTwo);

  params = routePath.params('/posts/1/2');
  test.equal(params.paramOne, '1');
  test.equal(params.paramTwo, '2');
});

Tinytest.add('RoutePath - wildcard params', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.wildcard).compile();
  test.isTrue(routePath.test('/posts/1/2/3'));
  test.isFalse(routePath.test('/posts'));

  test.isTrue(routePath.exec('/posts/1/2/3'));
  test.isTrue(routePath.exec('/posts/1'));
  test.isNull(routePath.exec('/bogus'));
  
  params = ['1-test'];
  path = routePath.resolve(params);
  test.equal(path, '/posts/1-test');

  params = routePath.params('/posts/1-test');
  test.equal(params[0], '1-test');
});

Tinytest.add('RoutePath - named wildcard params', function (test) {
  var routePath
    , params
    , path;

  routePath = new RoutePath(paths.namedWildcard).compile();
  test.isTrue(routePath.test('/posts/file.txt'));
  test.isFalse(routePath.test('/posts'));

  test.isTrue(routePath.exec('/posts/file.txt'));
  test.isTrue(routePath.exec('/posts/long-file/name.txt'));
  test.isNull(routePath.exec('/posts'));

  params = { file: 'file.txt' };
  path = routePath.resolve(params);
  test.equal(path, '/posts/file.txt');

  params = routePath.params('/posts/file.txt');
  test.equal(params.file, 'file.txt');
});

Tinytest.add('RoutePath - regex path', function (test) {
  var routePath
    , params
    , path;

  // matches paths like this: /commits/1..2
  routePath = new RoutePath(paths.regex).compile();
  test.isTrue(routePath.test('/commits/1..2'));

  params = routePath.params('/commits/1..2');
  test.equal(params[0], '1');
  test.equal(params[1], '2');
});

Tinytest.add('RoutePath - query params', function (test) {
  var routePath
    , path;

  routePath = new RoutePath(paths.required).compile();

  path = routePath.resolve({
    query: 'q=test',
    param: 'one'
  });

  test.equal(path, '/posts/one?q=test');

  path = routePath.resolve({
    query: {
      q: 'test',
      q2: 'another'
    },
    param: 'one'
  });

  test.equal(path, '/posts/one?q=test&q2=another');

  params = routePath.params('/posts/one?q=test&q2=another');
  test.equal(params.param, 'one');
  test.equal(params.q, 'test');
  test.equal(params.q2, 'another');
});

Tinytest.add('RoutePath - resolve function param values', function (test) {
  var routePath
    , path;

  routePath = new RoutePath(paths.required).compile();

  path = routePath.resolve({
    param: function () {
      return 'one';
    }
  });

  test.equal(path, '/posts/one');
});
