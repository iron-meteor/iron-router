ClientRouter = RouterUtils.extend(IronRouter, {
  typeName: 'ClientRouter',

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

  layout: '__defaultLayout__',

  runController: function (controller, action) {
    var self = this;

    RouterUtils.assert(
      controller[action],
      'No action "' + action + '" on controller ' + controller.typeName
    );

    controller.onRender = function (template, data, to) {
      self._partials.set(to, {
        template: template,
        data: data
      });
    };

    self._partials.clear();
    controller.runHooks('before');
    controller[action]();
    controller.runHooks('after');
  },

  getControllerForContext: function (action, context, options) {
    var handler
      , controllerClass
      , controller
      , routeName;

    var classify = function (name) {
      return RouterUtils.classify(name);
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
        window[options.controller] : options.controller;
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

  onRun: function (context, options) {
    var self = this
      , isReactive = options.reactive !== false
      , controller
      , action = context && context.action || 'run';

    controller = self.getControllerForContext(action, context, options);

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

  // onRun should check that the router has been rendered. Otherwise
  // it should not try to set partials and what not.
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

        //html = Spark.isolate(renderPartial);
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

  autoRender: function () {
    document.body.innerHTML = '';
    document.body.appendChild(Spark.render(_.bind(this.render, this)));
  },

  start: function () {
    var self = this;

    if (self.isStarted) return;

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

    self.isStarted = true;
  },

  stop: function () {
    if (this._locationComputation)
      this._locationComputation.stop();

    if (this._eventListener)
      this._eventListener.destroy();

    this.isStarted = false;
  },

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

  onUnhandled: function (path, options) {
    this.stop();
    window.location = path;
  }
});

Location.start();

//@export Router
Router = new ClientRouter;
