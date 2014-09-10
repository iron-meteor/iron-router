var MiddlewareStack = Iron.MiddlewareStack;
var Url = Iron.Url;
var Layout = Iron.Layout;
var assert = Iron.utils.assert;
var DEFAULT_NOT_FOUND_TEMPLATE = '__IronRouterNotFound__';

/**
 * Client specific initialization.
 */
Router.prototype.init = function (options) {
  var self = this;

  // the current RouteController from a dispatch
  self._currentController = null;

  // the current() dep
  self._currentDep = new Deps.Dependency;

  // the location computation
  self._locationComputation = null;

  // the ui layout for the router
  self._layout = new Layout({template: self.options.layoutTemplate});

  Meteor.startup(function () {
    setTimeout(function maybeAutoInsertRouter () {
      if (self.options.autoRender !== false)
        self.insert({el: document.body});
    });
  });
};

/**
 * Programmatically insert the router into document.body or a particular
 * element with {el: 'selector'}
 */
Router.prototype.insert = function (options) {
  this._layout.insert(options);
  return this;
};

/**
 * Returns a layout view that can be used in a UI helper to render the router
 * to a particular place.
 */
Router.prototype.createView = function () {
  return this._layout.create();
};

Router.prototype.lookupNotFoundTemplate = function () {
  return this.options.notFoundTemplate || DEFAULT_NOT_FOUND_TEMPLATE;
};

Router.prototype.dispatch = function (url, context, done) {
  assert(typeof url === 'string', "expected url string in router dispatch");

  var self = this;

  // no options to controller here
  var controller = this.createController(url, context);

  if (this._currentController)
    this._currentController.stop();

  this._currentController = controller;

  var result = controller.dispatch(self._stack, url, function (err) {
    if (err)
      throw err;
    else {
      if (!controller.isHandled() && controller.willBeHandledOnServer()) {
        window.location = controller.url;
        return;
      } else if (!controller.isHandled() && !controller.willBeHandledOnServer()) {
        // looks like there's no handlers so let's give a default
        // not found message!
        this.render(self.lookupNotFoundTemplate(), {data: {url: this.url}});
        return;
      } else {
        return done && done(err);
      }
    }
  });

  if (this._currentController == controller)
    this._currentDep.changed();

  return result;
};

/**
 * The current controller object.
 */
Router.prototype.current = function () {
  this._currentDep.depend();
  return this._currentController;
};

/*
 * Scroll to a specific location on the page.
 * Overridable by applications that want to customize this behavior.
 */
Router.prototype._scrollToHash = function (hashValue) {
  var $target = $(hashValue);
  $('html, body').scrollTop($target.offset().top);
};

/**
 * Start reacting to location changes.
 */
Router.prototype.start = function () {
  var self = this;
  self._locationComputation = Deps.autorun(function locationComputation (c) {
    var controller;
    var loc = Iron.Location.get();
    var hash, pathname, search;
    var current = self._currentController;

    // see if only the hash part has changed
    if (current && current.location && current.location.path == loc.path && current.location.hash != loc.hash) {
      self._scrollToHash(loc.hash);
    } else {
      controller = self.dispatch(loc.href);

      // if we're going to the server cancel the url change
      if (controller.willBeHandledOnServer())
        loc.cancelUrlChange();
    }
  });
};

/**
 * Stop all computations and put us in a not started state.
 */
Router.prototype.stop = function () {
  if (!this._isStarted)
    return;

  if (this._locationComputation)
    this._locationComputation.stop();

  if (this._currentController)
    this._currentController.stop();

  this._isStarted = false;
};

/**
 * Go to a given path or route name, optinally pass parameters and options.
 *
 * Example:
 * router.go('itemsShowRoute', {_id: 5}, {hash: 'frag', query: 'string});
 */
Router.prototype.go = function (routeNameOrPath, params, options) {
  var self = this;
  var isPath = /^\/|http/;
  var path;

  if (isPath.test(routeNameOrPath)) {
    // it's a path!
    path = routeNameOrPath;
  } else {
    // it's a route name!
    var route = self.routes[routeNameOrPath];
    assert(route, "No route found named " + JSON.stringify(routeNameOrPath));
    path = route.path(params, options);
  }

  // let Iron Location handle it and we'll pick up the change in
  // Iron.Location.get() computation.
  Iron.Location.go(path, options);
};
