function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

IronRouter.include({
  onRun: function (context) {
    // here is where we do the magic with an action controller
    // 3 cases
    //  1. handler provided on route
    //    - create anonymous routecontroller
    //    - call the method in the context of the routecontroller
    //  2. controller provided in options
    //    - create new instance of controller with context passed as
    //      ctor options
    //    - call run on the controller
    //
    //  3. nothing provided. look for a controller instance by name. create
    //     a new instance passing options as ctor.
  },

  go: function (routeNameOrPath, params, state) {
    // just dispatch a path? Why do we need this on the client?
    // This should be client or server? If on server maybe it just
    // does a redirect.
  },

  render: function () {
    var self = this;
    var result = function () {
      var context = self.current();
      return context ? Spark.isolate(_.bind(context.result, context)) : '';
    };
    return Meteor.render(route);
  },

  autoRender: function () {
    var self = this;
    Meteor.startup(function () {
      document.body.innerHTML = '';
      document.body.appendChild(self.render());
    });
  },

  start: function () {
    // XXX start responding to location changes
  },

  stop: function () {
    // XXX stop responding to location changes
  }
});

// couple of duties
// 1. respond to url changes
// 2. call dispatch on the router with the path, nothing more complicated than
//    that
// 3. handle click events?
// 4. control where to render the results
