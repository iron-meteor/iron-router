RouteController = Utils.extend(IronRouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;
  },

  runActionWithHooks: function () {
    var self = this
      , args = _.toArray(arguments);

    try {
      RouteController.__super__.runActionWithHooks.apply(this, args);
    } finally {
      this.response.end();
    }
  },

  run: function () {
    this.response.end();
  }
});
