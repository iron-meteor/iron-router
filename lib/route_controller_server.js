/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Fiber = Npm.require('fibers');
var Controller = Iron.Controller;
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/

/**
 * Server specific initialization.
 */
RouteController.prototype.init = function (options) {};

/**
 * Let this controller run a dispatch process. This function will be called
 * from the router. That way, any state associated with the dispatch can go on
 * the controller instance. Note: no result returned from dispatch because its
 * run inside its own fiber. Might at some point move the fiber stuff to a
 * higher layer.
 */
RouteController.prototype.dispatch = function (stack, url, done) {
  var self = this;
  Fiber(function () {
    stack.dispatch(url, self, done);
  }).run();
};

/**
 * Run a route on the server. When the router runs its middleware stack, it
 * can run regular middleware functions or it can run a route. There should
 * only one route object per path as where there may be many middleware
 * functions.
 *
 * For example:
 *
 *   "/some/path" => [middleware1, middleware2, route, middleware3]
 *
 * When a route is dispatched, it tells the controller to _runRoute so that
 * the controller can control the process. At this point we should already be
 * in a dispatch so a computation should already exist.
 */
RouteController.prototype._runRoute = function (route, url, done) {
  var self = this;
  var stack = new MiddlewareStack;

  var onRunHooks = this._collectHooks('onRun', 'load');
  stack = stack.append(onRunHooks, {where: 'server'});

  var beforeHooks = this._collectHooks('onBeforeAction', 'before');
  stack.append(beforeHooks, {where: 'server'});

  // make sure the action stack has at least one handler on it that defaults
  // to the 'action' method
  if (route._actionStack.length === 0) {
    route._actionStack.push(route._path, 'action', route.options);
  }

  stack = stack.concat(route._actionStack);
  stack.dispatch(url, this, done);

  // run the after hooks.
  this.next = function () {};
  this.runHooks('onAfterAction', 'after');
};
