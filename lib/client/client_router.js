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

    if (handler) {
      run = function () {
        var controller = new RouteController(context, options);
        handler.call(controller);
      };
    } else if (Controller) {
      run = function () {
        Controller = _.isString(Controller) ? root[Controller] : Controller;
        controller = new Controller(context, options);
        controller[action]();
      };
    } else if (Controller = root[classify(routeName + 'Controller')]) {
      run = function () {
        controller = new Controller(context, options);
        controller[action]();
      };
    } else {
      run = function () {
        controller = new RouteController(context, options);
        controller.run();
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
  // XXX how does a server side route work?
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
      this.dispatch(path, state, function () {
        Location.pushState(state, null, path, true /* skipReactive */);
      });
    } else {
      route = this.routes[routeNameOrPath];
      assert(route, 'No route found named ' + routeNameOrPath);
      path = route.path(params);
      this.run(path, route, state, function () {
        Location.pushState(state, null, path, true /* skipReactive */);
      });
    }
  },

  render: function () {
    var self = this;
    var result = function () {
      var context = self.current();
      return context ? Spark.isolate(_.bind(context.result, context)) : '';
    };
    return Meteor.render(result);
  },

  autoRender: function () {
    document.body.innerHTML = '';
    document.body.appendChild(this.render());
  },

  start: function () {
    var self = this;
    Deps.autorun(function (c) {
      var state;
      self._locationComputation = c;
      state = Location.state();
      self.dispatch(state.path, state);
    });
  },

  stop: function () {
    if (this._locationComputation)
      this._locationComputation.stop();
  }
});

Router = new IronClientRouter;
