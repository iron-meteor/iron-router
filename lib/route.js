//XXX Path helpers for handlebars path and url
//  - Need to support query params too
//  - Need to support object and array params
function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

Route = function (router, name, options, handler) {
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
  this.handler = this.handler || options.to || options.handler;
};

Route.prototype = {
  constructor: Route,

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
    return Meteor.absoluteUrl() + this.path(params);
  }
};
