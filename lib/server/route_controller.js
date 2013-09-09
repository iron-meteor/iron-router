RouteController = Utils.extend(IronRouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;
  },

  run: function () {
    this.response.end();
  }
});
