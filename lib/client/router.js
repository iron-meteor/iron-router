/**
 * Client side router.
 *
 * @class ClientRouter
 * @exports ClientRouter
 * @extends IronRouter
 */

ClientRouter = Utils.extend(IronRouter, {
  /**
   * @constructor
   * @param {Object} [options]
   * @param {Boolean} [options.autoRender] Automatically render to the body
   * @param {Boolean} [options.autoStart] Automatically start listening to
   * events
   */

  constructor: function (options) {
    var self = this;

    ClientRouter.__super__.constructor.apply(this, arguments);

    this.isRendered = false;

    this._page = new PageManager;

    /**
     * The current RouteController instance. This is set anytime a new route is
     * dispatched. It's a reactive variable which you can get by calling
     * Router.current();
     *
     * @api private
     */
    this._currentController = null;

    /**
     * Dependency to for this._currentController
     *
     * @api private
     */
    this._controllerDep = new Deps.Dependency;

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
   * Reactive accessor for the current RouteController instance. You can also
   * get a nonreactive value by specifiying {reactive: false} as an option.
   *
   * @param {Object} [opts] configuration options
   * @param {Boolean} [opts.reactive] Set to false to enable a non-reactive read.
   * @return {RouteController}
   * @api public
   */

  current: function (opts) {
    if (opts && opts.reactive === false)
      return this._currentController;
    else {
      this._controllerDep.depend();
      return this._currentController;
    }
  },

  setLayout: function (layout) {
    this._page.setLayout(layout);
  },

  setTemplate: function (template, to) {
    this._page.setTemplate(template, to);
  },

  setData: function (data) {
    this._page.setData(data);
  },

  getData: function () {
    return this._page.getData();
  },

  run: function (controller, cb) {
    var self = this
      , args = _.toArray(arguments);

    var runRouteController = function () {
      Deps.autorun(function (c) {
        self._routeComputation = c;
        self.constructor.__super__.run.apply(self, args);
      });
    };

    if (this._routeComputation) {
      this._routeComputation.stop();
      this._routeComputation.onInvalidate(runRouteController);
    } else {
      runRouteController();
    }

    if (controller == this._currentController) {
      cb && cb(controller);
      this._controllerDep.changed();
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
    var isPathRe = /^\/|http/
      , route
      , path
      , onComplete
      , controller
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
      this.dispatch(path, options, done);
    } else {
      route = this.routes[routeNameOrPath];
      Utils.assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params, options);
      controller = route.getController(path, options);
      this.run(controller, done);
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
    return this._page.renderLayout();
  },

  /**
   * Render the router into the body of the page automatically. Calles the
   * render method inside Spark.render to create a renderer and appends to the
   * document body.
   *
   * @api public
   */

  autoRender: function () {
    var self = this;
    var frag = Spark.render(function () {
      return self.render();
    });
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
    
    Deps.autorun(function (c) {
      var location;
      self._locationComputation = c;
      self.dispatch(IronLocation.path(), {state: history.state});
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
  },

  onUnhandled: function (path, options) {
    this.stop();
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
