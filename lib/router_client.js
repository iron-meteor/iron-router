var MiddlewareStack = Iron.MiddlewareStack;
var Url = Iron.Url;
var Layout = Iron.Layout;
var assert = Iron.utils.assert;
var DEFAULT_NOT_FOUND_TEMPLATE = '__IronRouterNotFound__';
var NO_ROUTES_TEMPLATE = '__IronRouterNoRoutes__';

/**
 * Client specific initialization.
 */
Router.prototype.init = function (options) {
  var self = this;

  // the current RouteController from a dispatch
  self._currentController = null;

  // the current route
  self._currentRoute = null;

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
  if (this.options.notFoundTemplate)
    return this.options.notFoundTemplate;

  return (this.routes.length === 0) ? NO_ROUTES_TEMPLATE : DEFAULT_NOT_FOUND_TEMPLATE;
};

Router.prototype.lookupLayoutTemplate = function () {
  return this.options.layoutTemplate;
};

Router.prototype.dispatch = function (url, context, done) {
  var self = this;

  assert(typeof url === 'string', "expected url string in router dispatch");

  var controller = this._currentController;
  var route = this.findFirstRoute(url);
  var prevRoute = this._currentRoute;

  this._currentRoute = route;


  // even if we already have an existing controller we'll stop it
  // and start it again. But since the actual controller instance
  // hasn't changed, the helpers won't need to rerun.
  if (this._currentController)
    this._currentController.stop();

  //XXX Instead of this, let's consider making all RouteControllers
  //    singletons that get configured at dispatch. Will revisit this
  //    after v1.0.
  if (controller && route && prevRoute === route) {
    // this will change the parameters dep so anywhere you call
    // this.getParams will rerun if the parameters have changed
    controller.configureFromUrl(url, context);
  } else {
    // Looks like we're on a new route so we'll create a new
    // controller from scratch.
    controller = this.createController(url, context);
  }

  this._currentController = controller;

  controller.dispatch(self._stack, url, function onRouterDispatchCompleted (err) {
    if (err)
      throw err;
    else {
      if (!controller.isHandled()) {
        // if we aren't at the initial state, we haven't yet given the server
        //   a true chance to handle this URL. We'll try.
        //   if the server CAN'T handle the router, we'll be back,
        //   but as the very first route handled on the client,
        //   and so initial will be true.
        var state = Deps.nonreactive(function () { return controller.location.get().options.historyState; });

        if (state && state.initial === true) {
          // looks like there's no handlers so let's give a default
          // not found message! Use the layout defined in global config
          // if we have one.
          //
          // NOTE: this => controller
          this.layout(this.lookupOption('layoutTemplate'), {data: {url: this.url}});

          var errorTemplate;

          if (self.routes.length === 0) {
            errorTemplate = this.lookupOption('noRoutesTemplate') || NO_ROUTES_TEMPLATE;
          } else {
            errorTemplate = this.lookupOption('notFoundTemplate') || DEFAULT_NOT_FOUND_TEMPLATE;
          }

          this.render(errorTemplate, {data: {url: this.url}});
          this.renderRegions();

          // kind of janky but will work for now. this makes sure
          // that any downstream functions see that this route has been
          // handled so we don't get into an infinite loop with the
          // server.
          controller.isHandled = function () { return true; };
        }

        return done && done.call(controller);
      }
    }
  });

  // Note: even if the controller didn't actually change I change the
  // currentDep since if we did a dispatch, the url changed and that
  // means either we have a new controller OR the parameters for an
  // existing controller have changed.
  if (this._currentController == controller)
    this._currentDep.changed();

  return controller;
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
  try {
    var $target = $(hashValue);
    $('html, body').scrollTop($target.offset().top);
  } catch (e) {
    // in case the hashValue is bogus just bail out
  }
};

/**
 * Start reacting to location changes.
 */
Router.prototype.start = function () {
  var self = this;
  var prevLocation;

  self._locationComputation = Deps.autorun(function onLocationChange (c) {
    var controller;
    var loc = Iron.Location.get();
    var hash, pathname, search;
    var current = self._currentController;

    if (!current || (prevLocation && prevLocation.path !== loc.path)) {
      controller = self.dispatch(loc.href, null, function onRouterStartDispatchCompleted (error) {
        // if we're going to the server cancel the url change
        if (!this.isHandled()) {
          loc.cancelUrlChange();
          window.location = loc.path;
        }
      });
    } else {
      self._scrollToHash(loc.hash);
      // either the query or hash has changed so configure the current
      // controller again.
      current.configureFromUrl(loc.href);
    }

    prevLocation = loc;
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

  options = options || {};

  if (isPath.test(routeNameOrPath)) {
    // it's a path!
    path = routeNameOrPath;
  } else {
    // it's a route name!
    var route = self.routes[routeNameOrPath];
    assert(route, "No route found named " + JSON.stringify(routeNameOrPath));
    path = route.path(params, _.extend(options, {throwOnMissingParams: true}));
  }

  // let Iron Location handle it and we'll pick up the change in
  // Iron.Location.get() computation.
  Iron.Location.go(path, options);
};
