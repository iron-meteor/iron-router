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

//XXX where does RouteController get template from? it should try
//to get it from the route itself if it can
IronClientRouter = IronRouter.extends({
  initialize: function () {
    var self = this;

    IronClientRouter.__super__.initialize.apply(this, arguments);

    Meteor.startup(function () {
      setTimeout(function () {
        //XXX how do we get better error handling here?
        if (self.options.autoRender !== false)
          self.autoRender();
        if (self.options.autoStart !== false)
          self.start();
      });
    });
  },

  onRun: function (context, options) {
    var isReactive = options.reactive !== false
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

    return isReactive ? Deps.autorun(run) : run();
  },

  go: function (routeNameOrPath, params, state) {},

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
    // XXX start responding to location changes
  },

  stop: function () {
    // XXX stop responding to location changes
  }
});

Router = new IronClientRouter;
