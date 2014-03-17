Tinytest.add('Utils - resolveValue', function (test) {
  var global = (function () { return this; })();

  global.outer = {
    inner: 'value'
  };

  var res = Utils.resolveValue('outer.inner');
  test.equal(res, 'value', 'unable to resolveValue on global object');
});

Tinytest.add('Utils - capitalize', function (test) {
  test.equal(Utils.capitalize('lower'), 'Lower');
  test.equal(Utils.capitalize('Lower'), 'Lower');
  test.equal(Utils.capitalize('lowerSomething'), 'LowerSomething');
  test.equal(Utils.capitalize('lower-something'), 'Lower-something');
});

Tinytest.add('Utils - upperCamelCase', function (test) {
  test.equal(Utils.upperCamelCase('postsShow'), 'PostsShow');
  test.equal(Utils.upperCamelCase('posts-show'), 'PostsShow');
  test.equal(Utils.upperCamelCase('posts_show'), 'PostsShow');
});

Tinytest.add('Utils - camelCase', function (test) {
  test.equal(Utils.camelCase('PostsShow'), 'postsShow');
  test.equal(Utils.camelCase('posts-show'), 'postsShow');
  test.equal(Utils.camelCase('Posts-show'), 'postsShow');
  test.equal(Utils.camelCase('posts_show'), 'postsShow');
});
