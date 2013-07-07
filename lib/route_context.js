function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

/**
 * A simple object that gets created by the router and passed on to the route
 * handler. It has a reactive result method that can be used by the route
 * handler to trigger an invlidation somewhere. This is how the Router renders
 * routes to the page for example.
 *
 * @class RouteContext
 * @extends Class
 */
RouteContext = Class.extends({
  typeName: 'RouteContext',

  /**
   * Initializes a new RouteContext.
   *
   * @param {String} path
   * @param {IronRouter} router
   * @param {Route} route
   * @param {Object} [options]
   * @api public
   */

  initialize: function (path, router, route, options) {
    assert(typeof path === 'string', 'RouteContext requires path parameter');
    assert(router instanceof IronRouter, 'RouteContext requires router parameter');
    assert(route instanceof Route, 'RouteContext requires route parameter');

    options = this.options = options || {}
    this._deps = new Deps.Dependency;
    this._result = null;
    this.path = path;
    this.router = router;
    this.route = route;
    this.state = options.state;
    this.params = route.params(path);
  },

  /**
   * Returns an object that can be used to store state (e.g. pushState on the
   * client). The object includes this.state and this.path
   *
   * @returns {Object}
   * @api public
   */

  getState: function () {
    return _.extend({}, this.state, {
      path: this.path
    });
  },

  /**
   * A reactive result function so that the Router can communicate reactively
   * with a route handler. For example, the Router on the client reactively
   * renders into the page. It binds to this method. If you call result with a
   * function as a parameter, it sets the result function and fires the deps
   * changed. If you call it without a parameter, it calls the result function
   * and creates a dependency. The result function is called in the context of
   * the RouteContext instance.
   *
   * @param {Function} [fn] If provided, sets the result function and calls
   * deps.changed().
   * @return {String|undefined} When no function param provided, returns the
   * result of calling the result function, or an empty string.
   * @api public
   */

  result: function (fn) {
    if (_.isFunction(fn)) {
      this._result = fn;
      this._deps.changed();
    } else {
      this._deps.depend();
      return (this._result && this._result.call(this)) || '';
    }
  }
});
