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

    this._layout = null;
    this._current = null;
    this._currentDep = new Deps.Dependency;
    this._hasJustReloaded = false;
    this._dataDep = new Deps.Dependency;

    ClientRouter.__super__.constructor.apply(this, arguments);

    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoRender !== false)
          self.autoRender();

        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  current: function (opts) {
    if (opts && opts.reactive === false)
      return this._current;
    else {
      this._currentDep.depend();
      return this._current;
    }
  },

  setData: function (data) {
    this._data = data;
    this._dataDep.changed();
  },

  getData: function () {
    this._dataDep.depend();
    return this._data;
  },

  setLayoutTemplate: function (template) {
    this._layout.setTemplate(template);
  },

  setRegionTemplate: function (region, template) {
    this._layout.setRegionTemplate(region, template);
  },

  clearUnusedRegions: function (usedRegions) {
    this._layout._clearUnusedRegions(usedRegions);
  },

  run: function (path, route, options, cb) {
    var self = this;
    var where = Meteor.isClient ? 'client' : 'server';
    Utils.assert(route, 'run requires a route');

    // one last check to see if we should handle the route here
    if (route.where != where) {
      self.onUnhandled(path, route.options);
      return;
    }

    var runRoute = function () {
      Deps.autorun(function (c) {
        self._routeComputation = c;
        route.run(path, options);
      });
    };

    this._current = route;

    if (this._routeComputation) {
      this._routeComputation.stop();
      this._routeComputation.onInvalidate(runRoute);
    } else {
      runRoute();
    }

    if (route == this._current) {
      cb && cb(route);
      this._currentDep.changed();
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
      IronLocation.set(path);
    }
  },

  render: function () {
    var self = this;

    this._layout = UI.render(Layout.extend({
      template: this.options.layoutTemplate,
      data: UI.emboxValue(function () {
        var data = self.getData();
        return _.isFunction(data) ? data() : data;
      }, EJSON.equals)
    }));

    return this._layout;
  },

  autoRender: function () {
    UI.DomRange.insert(this.render().dom, document.body);
  },

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
   * if we don't handle a link, _and_ the server doesn't handle it,
   * do one of two things:
   *   a) if this is the initial route, then it can't be a static asset, so
   *      show notFound or throw an error
   *   b) otherwise, let the server have a go at it, we may end up coming back.
   *
   * @api public
   */
  onRouteNotFound: function (path, options) {
    if (history && ! history.state.initial) {
      this.stop();
      window.location = path;
    } else if (this.options.notFoundTemplate) {
      this.setLayoutTemplate(this.options.layoutTemplate);
      this.setRegionTemplate(this.options.notFoundTemplate);
    } else {
      throw new Error('Oh no! No route found for path: "' + path + '"');
    }
  }
});

/**
 * The main Router instance that clients will deal with
 *
 * @api public
 * @exports Router
 */

Router = new ClientRouter;

if (Meteor._reload) {
  // just register the fact that a migration _has_ happened
  Meteor._reload.onMigrate('iron-router', function() { return [true, true]});

  // then when we come back up, check if it it's set
  var data = Meteor._reload.migrationData('iron-router');
  Router._hasJustReloaded = data;
}
