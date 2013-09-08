_.extend(RouteController.prototype, {
  _init: function () {
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;
  },

  run: function () {
    this.response.end();
  }
});
