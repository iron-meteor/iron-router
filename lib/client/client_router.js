//XXX Tom - option to turn off responding to click events
function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1, str.length);
}

function classify (str) {
  var re = /_|-|\./;
  return _.map(str.split(re), function (word) {
    return capitalize(word);
  });
}

var root = this;

IronClientRouter = IronRouter.extends({
  initialize: function () {
    var self = this;

    IronClientRouter.__super__.initialize.apply(this, arguments);

    Meteor.startup(function () {
      setTimeout(function () {
        if (self.options.autoRender !== false)
          self.autoRender();
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  onRun: function (context, options) {
    var self = this
      , isReactive = options.reactive !== false
      , routeName = context.route.name
      , handler = context.route.handler
      , controllerName
      , Controller = options.controller
      , controller
      , action = options.action || 'run'
      , run;


    function runController (controller, action) {
      assert(controller[action], 'No action on controller named ' + action);
      controller.runBeforeHooks();
      controller[action]();
      controller.runAfterHooks();
    }

    if (handler) {
      run = function () {
        var controller = new RouteController(context, options);
        handler.call(controller);
      };
    } else if (Controller) {
      run = function () {
        Controller = _.isString(Controller) ? root[Controller] : Controller;
        controller = new Controller(context, options);
        runController(controller, action);
      };
    } else if (Controller = root[classify(routeName + 'Controller')]) {
      run = function () {
        controller = new Controller(context, options);
        runController(controller, action);
      };
    } else {
      run = function () {
        controller = new RouteController(context, options);
        runController(controller, 'run');
      };
    }

    function maybeRunReactively () {
      if (isReactive) {
        Deps.autorun(function (c) {
          self._routeComputation = c;
          run();
        });
      } else {
        run();
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
      assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params);
      this.run(path, route, {state: state}, function () {
        Location.pushState(state, null, path, true /* skipReactive */);
      });
    }
  },

  render: function () {
    var self = this;
    var result = function () {
      var context = self.current();
      return context ? context.result() : '';
    };
    return Meteor.render(result);
  },

  autoRender: function () {
    document.body.innerHTML = '';
    document.body.appendChild(this.render());
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
Router = new IronClientRouter;
