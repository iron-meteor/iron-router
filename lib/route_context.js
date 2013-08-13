/**
 * A simple object that gets created by the router and passed on to the route
 * handler. It has a reactive result method that can be used by the route
 * handler to trigger an invlidation somewhere. This is how the Router renders
 * routes to the page for example.
 *
 * @constructor RouteContext
 * @param {String} path
 * @param {IronRouter} router
 * @param {Route} route
 * @param {Object} [options]
 * @api private
 */

RouteContext = function (path, router, route, options) {
  RouterUtils.assert(typeof path === 'string', 'RouteContext requires path parameter');
  RouterUtils.assert(router instanceof IronRouter, 'RouteContext requires router parameter');
  RouterUtils.assert(route, 'RouteContext requires route parameter');

  options = this.options = options || {}
  this._deps = new Deps.Dependency;
  this._result = null;
  this.path = path;
  this.router = router;
  this.route = route;
  this.state = options.state;
  this.params = route.params(path);
  this.action = route.action || 'run';
  this.controller = route.controller;
  this.isReactive = route.isReactive;
};

RouteContext.prototype = {
  typeName: 'RouteContext',

  constructor: RouteContext,

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
  }
};
