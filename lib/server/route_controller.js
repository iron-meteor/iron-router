RouteController = Utils.extend(IronRouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;
  },

  run: function () {
    var self = this
      , args = _.toArray(arguments);

    try {
      var action = _.isFunction(this.action) ? this.action : this[this.action];

      Utils.assert(action,
        "Uh oh, you don't seem to have an action named \"" + this.action + "\" defined on your RouteController");

      this.stopped = false;

      this.runHooks('before');

      if (this.stopped) {
        this.isFirstRun = false;
        return;
      }

      action.call(this);
      this.runHooks('after');
      this.isFirstRun = false;
    } finally {
      this.response.end();
    }
  },

  action: function () {
    this.response.end();
  }
});
