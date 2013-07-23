/**
 * Client side router.
 *
 * @class ClientRouter
 * @extends IronRouter
 */

//@export ClientRouter
ClientRouter = RouterUtils.extend(IronRouter, {
  typeName: 'ClientRouter',

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

    self._partials = new YieldPartialDict;

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
   * The default layout for the router.
   *
   * @type {String|Function}
   */

  layout: '__defaultLayout__',

  /**
   * Run the specified action on a controller. Calls the before and after hooks
   * and attaches to the onRender callback to render results into the router's
   * layout.
   *
   * @param {RouteController} controller
   * @param {String} action
   * @api private
   */

  runController: function (controller, action) {
    var self = this;

    RouterUtils.assert(
      controller[action],
      'No action "' + action + '" on controller ' + controller.typeName
    );

    controller.onRender = function (template, options) {
      options = options || {};
      self._partials.set(options.to, {
        template: template,
        data: options.data
      });
    };
    controller.stopped = false;

    self._partials.clear();

    if (controller.isFirstRun)
      controller.onBeforeRun();
    else
      controller.onBeforeRerun();

    controller.runHooks('before');
    if (controller.stopped) return;
    
    controller[action]();
    controller.runHooks('after');

    if (controller.isFirstRun)
      controller.onAfterRun();
    else
      controller.onAfterRerun();

    controller.isFirstRun = false;
  },

  /**
   * Get a controller instance for the given action, context and options. There
   * are four cases:
   *
   *  1) handler is defined directly on a route
   *  2) controller option is defined on the route
   *  3) intelligently find the controller class in global namespace
   *  4) create a new anonymous controller
   *
   * @param {String} action
   * @param {RouteContext} context
   * @param {Object} [options]
   * @return {RouteController}
   * @api private
   */

  getControllerForContext: function (action, context, options) {
    var handler
      , controllerClass
      , controller
      , routeName;

    var classify = function (name) {
      return RouterUtils.classify(name);
    };

    var getControllerFromWindow = function (name) {
      var controller = window[name];
      if (typeof controller === 'undefined')
        throw new Error('controller "' + name + '" is not defined on window');
      return controller;
    };

    context = context || {};
    options = options || {};

    // case 1: handler defined directly on the route
    if (context.route && context.route.handler) {
      controller = new RouteController(context, options);
      controller[action] = handler;
      return controller;
    }

    // case 2: controller option is defined on the route
    if (options.controller) {
      controllerClass = _.isString(options.controller) ?
        getControllerFromWindow(options.controller) : options.controller;
      controller = new controllerClass(context, options);
      return controller;
    }

    // case 3: intelligently find the controller class in global namespace
    routeName = context.route && context.route.name;

    if (routeName) {
      controllerClass = window[classify(routeName + 'Controller')];

      if (controllerClass) {
        controller = new controllerClass(context, options);
        return controller;
      }
    }

    // case 4: nothing found so create a default controller
    return new RouteController(context, options);
  },

  /**
   * Hook method called from the Router's run method. This methods drives
   * running the controller for a route. The controller can be run in a reactive
   * or nonreactive context. If you pass options.reactive = false, then the
   * controller will be run normally. Otherwise it will be run in a reactive
   * computation.
   *
   * @param {RouteContext} context
   * @param {Object} [options]
   * @api protected
   */

  onRun: function (context, options) {
    var self = this
      , isReactive = options.reactive !== false
      , controller
      , action = options && options.action || 'run';

    controller = self.getControllerForContext(action, context, options);
    controller.isFirstRun = true;

    var maybeRunReactively = function () {
      if (isReactive) {
        Deps.autorun(function (c) {
          self._routeComputation = c;
          self.runController(controller, action);
        });
      } else {
        self.runController(controller, action);
      }
    }

    if (self._routeComputation) {
      self._routeComputation.onInvalidate(maybeRunReactively);
      self._routeComputation.stop();
    } else {
      maybeRunReactively();
    }
  },

  // Wrapper around Location.go that also allows passing
  // a route name. Based on type of first parameter.
  // 1. Router.go('/posts', {state: 'true'});
  // 2. Router.go('postIndex', [param1, param2], {state});

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
   * @api public
   */

  go: function (routeNameOrPath, params, state) {
    var isPathRe = /^\/|http/
      , route
      , path
      , state
      , onComplete;

    if (isPathRe.test(routeNameOrPath)) {
      path = routeNameOrPath;
      state = params;
      // issue here is in the dispatch process we might want to
      // make a server request so therefore not call this method yet, so
      // we need to push the state only after we've decided it's a client
      // request, otherwise let the browser handle it and send off to the
      // server
      this.dispatch(path, {state: state}, function () {
        Location.pushState(state, null, path, true /* skipReactive */);
      });
    } else {
      route = this.routes[routeNameOrPath];
      RouterUtils.assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params);
      this.run(path, route, {state: state}, function () {
        Location.pushState(state, null, path, true /* skipReactive */);
      });
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
    var self = this
      , layout
      , layoutHelpers;

    layout = RouterUtils.getTemplateFunction(
      this.options.layout || this.layout);

    layoutHelpers = {
      'yield': function (key, options) {
        var html;

        if (arguments.length < 2)
          key = null;

        function renderPartial () {
          var partial = self._partials.get(key);
          RouterUtils.assert(
            partial, 
            'No yield named "' + key + '" found. Are you sure it\'s in your main layout template?'
          );
          return partial.render();
        }

        html = renderPartial();
        return new Handlebars.SafeString(html);
      }
    };

    if (layout.helpers) {
      layout.helpers(layoutHelpers);
      return layout();
    } else {
      return layout(layoutHelpers);
    }
  },

  /**
   * Render the router into the body of the page automatically. Calles the
   * render method inside Spark.render to create a renderer and appends to the
   * document body.
   *
   * @api public
   */

  autoRender: function () {
    document.body.innerHTML = '';
    document.body.appendChild(Spark.render(_.bind(this.render, this)));
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
      _.bind(this.onClick, this));

    //XXX listener.installHandler(node, type) for A tags and children to make
    //work with IE<8
    self._eventListener.addType('click');
    
    Deps.autorun(function (c) {
      var state;
      self._locationComputation = c;
      state = Location.state();
      self.dispatch(state.path, {state: state});
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

  onClick: function (event) {
    var el = event.currentTarget
      , href
      , path;

    if (el.nodeName === 'A') {
      href = el.href;
      path = el.pathname + el.search;

      if (el.hash || el.getAttribute('href') == '#')
        return;

      if (!Location.isSameOrigin(href))
        return;

      event.stopImmediatePropagation();
      event.preventDefault();

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
    window.location = path;
  }
});

/**
 * Tell Location to start listening for pushState events
 */
Location.start();

/**
 * The main Router instance that clients will deal with
 *
 * @api public
 */

//@export Router
Router = new ClientRouter;
