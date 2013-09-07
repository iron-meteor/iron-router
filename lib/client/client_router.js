/**
 * Client side router.
 *
 * @class ClientRouter
 * @exports ClientRouter
 * @extends IronRouter
 */

//XXX no need for inheritance here. this is the same router
//and we are just making things weird with inheritance.
ClientRouter = RouterUtils.extend(IronRouter, {
  typeName: 'ClientRouter',

  /**
   * @constructor
   * @param {Object} [options]
   * @param {Boolean} [options.autoRender] Automatically render to the body
   * @param {Boolean} [options.autoStart] Automatically start listening to
   * events
   */

  //XXX very confusing!
  constructor: function (options) {
    var self = this;

    ClientRouter.__super__.constructor.apply(this, arguments);

    self.isRendered = false;
    self._renderer = new RouterRenderer;

    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoRender !== false)
          self.autoRender();
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  /**
   * Hook method called from the Router's run method. This methods drives
   * running the controller for a route. The controller can be run in a reactive
   * or nonreactive context. If you pass options.reactive = false, then the
   * controller will be run normally. Otherwise it will be run in a reactive
   * computation.
   *
   * @param {RouteController} controller
   * @param {RouteContext} context
   * @param {Object} [options]
   * @api protected
   */

  onRun: function (controller, context, options) {
    var self = this
      , isReactive = context.isReactive !== false;

    var maybeRunReactively = function () {
      if (isReactive) {
        Deps.autorun(function (c) {
          self._routeComputation = c;
          self._partials.clear();
          self.runController(controller, context);
        });
      } else {
        self._partials.clear();
        self.runController(controller, context);
      }
    };

    //XXX fix this up to use the new renderer.
    controller.onRender = function (template, options) {
      options = options || {};
      self._partials.set(options.to, {
        template: template,
        data: options.data
      });
    };

    // there is a route computation from a previous route so lets tear it down
    if (self._routeComputation) {
      self._routeComputation.stop();
      //XXX if previous route computation is valid but we call stop on it, that
      //should also mark it as invalid (right away), so the onInvalidate
      //callback should get called again. The test case is whether the new
      //computation is stopped as well. If it's not, I think we're in good
      //shape.
      self._routeComputation.onInvalidate(maybeRunReactively);
    } else {
      maybeRunReactively();
    }
  },

  /**
   * Wrapper around Location.go that accepts a routeName or a path as the first
   * parameter. This method can accept client and server side routes.
   *
   * Examples:
   *
   *  1. Router.go('/posts', {state: 'true'});
   *  2. Router.go('postIndex', [param1, param2], {state});
   *
   * @param {String} routeNameOrPath
   * @param {Array|Object} [params]
   * @param {Object} [state]
   * @param {Boolean} [replaceState]
   * @api public
   */

  go: function (routeNameOrPath, params, options) {
    //XXX clean up this regular expression. Also clean api here to accept
    //options as the last param. options.query & options.state for url state.

    var isPathRe = /^\/|http/
      , route
      , path
      , state
      , onComplete
      , done = function() {
        options = options || {};
        IronLocation.set(path, {
          replaceState: options.replaceState,
          state: options.state,
          skipReactive: true
        });
      };

    if (isPathRe.test(routeNameOrPath)) {
      path = routeNameOrPath;
      options = params;
      // issue here is in the dispatch process we might want to
      // make a server request so therefore not call this method yet, so
      // we need to push the state only after we've decided it's a client
      // request, otherwise let the browser handle it and send off to the
      // server
      this.dispatch(path, {state: state}, done);
    } else {
      route = this.routes[routeNameOrPath];
      RouterUtils.assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params);
      this.run(path, route, {state: state}, done);
    }
  },

  /**
   * Returns an html string or a document fragment with the router's layout.
   * This method also sets up the 'yield' helper on the layout. This is so that
   * the yield helper has a reference to the router through the closure.
   *
   * @returns {String|DocumentFragment}
   * @api public
   */

  render: function () {
    this.isRendered = true;
    return this._renderer.render();
  },

  /**
   * Render the router into the body of the page automatically. Calles the
   * render method inside Spark.render to create a renderer and appends to the
   * document body.
   *
   * @api public
   */

  autoRender: function () {
    var frag = this.render();
    document.body.appendChild(frag);
  },


  /**
   * Start listening to click events and set up a Deps.autorun for location
   * changes. If already started the method just returns.
   *
   * @api public
   */

  start: function () {
    var self = this;

    if (self.isStarted) return;

    self.isStarted = true;

    self._eventListener = new UniversalEventListener(
      _.bind(self.onClick, self));

    //XXX listener.installHandler(node, type) for A tags and children to make
    //work with IE<8
    self._eventListener.addType('click');
    
    Deps.autorun(function (c) {
      var location;
      self._locationComputation = c;
      location = IronLocation.get();
      //XXX cleanup for new location

      // we need to dispatch the entire thing here
      // maybe a getParts like Geoff has
      // for pathname + hash + querystring
      self.dispatch(location.pathname, {state: history.state});
    });
  },

  /**
   * Remove click event listener and stop listening for location changes.
   *
   * @api public
   */

  stop: function () {
    this.isStarted = false;

    if (this._locationComputation)
      this._locationComputation.stop();

    if (this._eventListener)
      this._eventListener.destroy();
  },

  /**
   * onclick event handler. Calls go for the path automatically.
   *
   * @param {Object} event Event object from the DOM click event
   */

  //XXX should this be on the Location object or client_router?
  //it needs to be in the router to support server routes
  //also it should only affect this router right? so maybe the router should
  //have its own liverange.
  onClick: function (event) {
    var el = event.currentTarget
      , href
      , path;

    if (el.nodeName === 'A') {
      href = el.href;
      path = el.pathname + el.search;

      if (event.isPropagationStopped())
        return;

      if (!IronLocation.isSameOrigin(href))
        return;

      event.preventDefault();

      // We call go here because the path might be a server side route. We could
      // change the url and then set location but we just do it here.
      // XXX Maybe change this entire method to be in Location and just let the
      // router respond to url changes.

      //XXX add hash params here too.
      // /posts/5#anchorTag goes here. Right now this won't work.
      this.go(path);
    }
  },

  /**
   * If the route is unhandled on the client, try sending the request to the
   * server. If instead the route is not found (on client or server) the
   * IronRouter will throw an exception.
   *
   * @param {String} path
   * @param {Object} [options]
   * @api public
   */

  onUnhandled: function (path, options) {
    this.stop();

    //XXX this should be on the Location object.
    window.location = path;
  }
});

/**
 * The main Router instance that clients will deal with
 *
 * @api public
 * @exports Router
 */

Router = new ClientRouter;
