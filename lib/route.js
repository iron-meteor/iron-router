function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

/**
 * Container class for route information.
 *
 * @class Route
 * @extends Class
 */

Route = Class.extends({
  typeName: 'Route',

  /**
   * Initialize a new Route instance.
   *
   * Example: 
   *  new Route(router, 'postShow', {path: '/posts/:_id'});
   *  new Route(router, 'postShow', {path: '/posts/:_id'}, function () {});
   *  new Route(router, 'postShow', {path: '/posts/:_id', handler: function () {}});
   *
   * @param {IronRouter} router
   * @param {String} name The name will be used as the default path if none is
   * specified in the options. For example, 'test' will become '/test'
   * @param {Object} [options]
   * @param {String} [options.path]
   * @param {Function} [options.handler]
   * @param {Function} [handler] Handler function can be passed as the last
   * parameter or as an option. A handler function is not required but will be
   * used by the Router if one is provided.
   * @api public
   */

  initialize: function (router, name, options, handler) {
    var path;

    assert(router instanceof IronRouter);

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
    this.handler = this.handler || options.handler;
  },

  /**
   * Returns true if the given path matches this route's compiled path. Proxies
   * to the RoutePath instance stored in compiledPath.
   *
   * @param {String} path
   * @return {Boolean}
   * @api public
   */

  test: function (path) {
    return this.compiledPath.test(path);
  },

  /**
   * Returns an array or object of params given a path. Proxies to the RoutePath
   * instance stored in compiledPath.
   *
   * @param {String} path
   * @return {Array|Object}
   * @api public
   */

  params: function (path) {
    return this.compiledPath.params(path);
  },

  /**
   * Returns a path given a params object or array. Proxies to the RoutePath
   * instance stored in compiledPath.
   *
   * Example:
   *  route = new Route(router, 'postShow', {path: '/posts/:id'});
   *  route.path({id: 5}) => '/posts/5'
   *
   * @param {Array|Object} params
   * @return {String}
   * @api public
   */

  path: function (params) {
    return this.compiledPath.resolve(params);
  },

  /**
   * Returns an absolute url given a params object or array. Uses
   * Meteor.absoluteUrl() for the root url.
   *
   * Example:
   *  route = new Route(router, 'postShow', {path: '/posts/:id'});
   *  route.url({id: 5}) => 'http://www.eventedmind.com/posts/5'
   *
   * @param {Array|Object} params
   * @return {String}
   * @api public
   */

  url: function (params) {
    var path = this.path(params);
    if (path[0] === '/')
      path = path.slice(1, path.length);
    return Meteor.absoluteUrl() + path;
  }
});
