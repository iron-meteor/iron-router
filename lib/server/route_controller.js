_.extend(RouteController.prototype, {
  initialize: function (context, options) {
    this.request = context.options.request;
    this.response = context.options.response;
    this.next = context.options.next;
  },

  onRun: function () {
    this.response.end();
  }
});
