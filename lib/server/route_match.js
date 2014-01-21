RouteMatch = Utils.extend(RouteMatch, {
  constructor: function () {
    RouteMatch.__super__.constructor.apply(this, arguments);
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;
  }
});