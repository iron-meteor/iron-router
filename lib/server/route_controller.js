//XXX It's kind if weird that server controller inherits from class and
//client controller inherits from controller

function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

RouteController = Class.extends({
  initialize: function (context, options) {
    this.request = context.options.request;
    this.response = context.options.response;
    this.params = context.params || [];
    this.route = context.route;
    this.router = context.router;
    this.context = context;
    RouteController.__super__.initialize.call(this);
  },

  run: function () {
    this.response.end();
  }
});
