IronRouter = Utils.extend(IronRouter, {
  constructor: function (options) {
    var self = this;

    IronRouter.__super__.constructor.apply(this, arguments);
    self.options.linkSelector = self.options.linkSelector || 'a[href]';
    
    this.isRendered = false;

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

    /**
      * Did the URL we are looking at come from a hot-code-reload 
      *  (and thus should we treat is as not new?)
      * 
      * @api private
      */
    this._hasJustReloaded = false;

    Meteor.startup(function () {
      Meteor.defer(function () {
        if (self.options.autoRender !== false)
          self.autoRender();
        if (self.options.autoStart !== false)
          self.start();
      });
    });

    // proxy these methods to the underlying ui manager object
    _.each([
      'layout',
      'setRegion',
      'clearRegion',
      'getData',
      'setData'
    ], function (uiApiMethod) {
      self[uiApiMethod] = function () {
        if (!self._ui)
          throw new Error("No uiManager is configured on the Router");
        return self._ui[uiApiMethod].apply(self._ui, arguments);
      };
    });
  },

  configure: function (options) {
    options = options || {};

    IronRouter.__super__.configure.apply(this, arguments);

    if (options.uiManager && this.isRendered)
      throw new Error("Can't set uiManager after Router has been rendered");
    else if (options.uiManager) {
      this._ui = options.uiManager;
    }

    return this;
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

  clearUnusedRegions: function (usedYields) {
    if (!this._ui)
      throw new Error('No ui manager has been set');

    var self = this;
    var layout = this._ui;

    var allYields = layout.getRegionKeys();
    usedYields = _.filter(usedYields, function (val) {
      return !!val;
    });

    var unusedYields = _.difference(allYields, usedYields);

    _.each(unusedYields, function (key) {
      layout.clearRegion(key);
    });
  },

  run: function (controller, cb) {
    IronRouter.__super__.run.apply(this, arguments);

    if (controller == this._currentController) {
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
    var self = this;
    var isPathRe = /^\/|http/
    var route;
    var path;
    var onComplete;
    var controller;
    var done;
    
    // after the dispatch is complete, set the IronLocation
    // path and state which will update the browser's url.
    done = function() {
      options = options || {};
      self._location.set(path, {
        replaceState: options.replaceState,
        state: options.state,
        skipReactive: true
      });
    };

    if (isPathRe.test(routeNameOrPath)) {
      path = routeNameOrPath;
      options = params;
      
      // if the path hasn't changed (at all), we are going to do nothing here
      if (path === self._location.path()) {
        if (self.options.debug)
          console.log("You've navigated to the same path that you are currently at. Doing nothing");
        return;
      }
      
      // issue here is in the dispatch process we might want to
      // make a server request so therefore not call this method yet, so
      // we need to push the state only after we've decided it's a client
      // request, otherwise let the browser handle it and send off to the
      // server
      self.dispatch(path, options, done);
    } else {
      route = self.routes[routeNameOrPath];
      Utils.assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params, options);
      controller = route.newController(path, options);
      self.run(controller, done);
    }
  },

  render: function () {
    //XXX this probably needs to be reworked since _ui.render() returns an
    //inited component which doesnt work with Shark rendering pipeline.
    if (!this._ui)
      throw new Error("No uiManager configured on Router");
    this.isRendered = true;
    return this._ui.render();
  },

  autoRender: function () {
    if (!this._ui)
      throw new Error("No uiManager configured on Router");
    this._ui.insert(document.body, UI.body, {
      template: this.options.layoutTemplate
    });
  },

  bindEvents: function () {
    $(document).on('click.ironRouter', this.options.linkSelector, _.bind(this.onClick, this));
  },

  unbindEvents: function () {
    $(document).off('click.ironRouter', this.options.linkSelector);
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
    
    self._location = self.options.location || IronLocation;
    self._location.start();
    
    self.bindEvents();

    Deps.autorun(function (c) {
      var location;
      self._locationComputation = c;
      self.dispatch(self._location.path(), {state: history.state});
    });
  },

  /**
   * Remove click event listener and stop listening for location changes.
   *
   * @api public
   */

  stop: function () {
    this.isStarted = false;

    this.unbindEvents();
    this._location.stop();

    if (this._locationComputation)
      this._locationComputation.stop();
  },

  /**
   * If we don't handle a link but the server does, bail to the server
   *
   * @api public
   */
  onUnhandled: function (path, options) {
    this.stop();
    window.location = path;
  },
  
  /**
   * if we don't handle a link, _and_ the  server doesn't handle it,
   * do one of two things:
   *   a) if this is the initial route, then it can't be a static asset, so 
   *      show notFound or throw an error
   *   b) otherwise, let the server have a go at it, we may end up coming back.
   *
   * @api public
   */
  onRouteNotFound: function (path, options) {
    if (this._location.path() !== path) {
      this.stop();
      window.location = path;
    } else if (this.options.notFoundTemplate) {
      var notFoundRoute = new Route(this, '__notfound__', _.extend(options || {}, {path: path}));
      this.run(new RouteController(this, notFoundRoute, {
        layoutTemplate: this.options.layoutTemplate,
        template: this.options.notFoundTemplate
      }));
    } else {
      throw new Error('Oh no! No route found for path: "' + path + '"');
    }
  },
  
  onClick: function(e) {
    var el = e.currentTarget;
    var which = _.isUndefined(e.which) ? e.button : e.which;
    var href = el.href;
    var path = el.pathname + el.search + el.hash;

    // ie9 omits the leading slash in pathname - so patch up if it's missing
    path = path.replace(/(^\/?)/,"/");

    // we only want to handle clicks on links which:
    // - haven't been cancelled already
    if (e.isDefaultPrevented())
      return;

    //  - are with the left mouse button with no meta key pressed
    if (which !== 1)
      return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) 
      return;

    // - aren't in a new window
    if (el.target)
      return;

    // - aren't external to the app
    if (!IronLocation.isSameOrigin(href)) 
      return;

    // note that we _do_ handle links which point to the current URL
    // and links which only change the hash.
    e.preventDefault();
    this.go(path);
  }
});

/**
 * The main Router instance that clients will deal with
 *
 * @api public
 * @exports Router
 */

Router = new IronRouter;

if (Meteor._reload) {
  // just register the fact that a migration _has_ happened
  Meteor._reload.onMigrate('iron-router', function() { return [true, true]});
  
  // then when we come back up, check if it it's set
  var data = Meteor._reload.migrationData('iron-router');
  Router._hasJustReloaded = data;
}
