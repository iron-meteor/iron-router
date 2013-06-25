function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

Route = Class.extends({
  initialize: function (router, name, options, handler) {
    var path;

    assert(_.isObject(router),
      'Route constructor requires a router as the first parameter');

    assert(_.isString(name),
      'Route constructor requires a name as the second parameter');

    if (_.isFunction(options))
      options = { handler: options };

    if (_.isFunction(handler))
      options.handler = handler;

    options = this.options = options || {};
    path = options.path || ('/' + name);

    this.router = router;
    this.originalPath = path;
    this.compiledPath = new RoutePath(path, options).compile();
    this.name = name;
    this.where = options.where || 'client';
    this.handler = this.handler || options.to || options.handler;
  },

  test: function (path) {
    return this.compiledPath.test(path);
  },

  params: function (path) {
    return this.compiledPath.params(path);
  },

  path: function (params) {
    return this.compiledPath.resolve(params);
  },

  url: function (params) {
    var path = this.path(params);
    if (path[0] === '/')
      path = path.slice(1, path.length);
    return Meteor.absoluteUrl() + path;
  }
});
