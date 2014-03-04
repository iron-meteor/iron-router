RouteController = Utils.extend(RouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);
    this.request = this.options.request;
    this.response = this.options.response;
    this.next = this.options.next;

    this._dataValue = this.data || {};

    this.data = function (value) {
      if (value)
        this._dataValue = value;
      else
        return _.isFunction(this._dataValue) ? this._dataValue.call(this) : this._dataValue;
    };
  },

  _run: function () {
    var self = this
      , args = _.toArray(arguments);

    try {
      var action = _.isFunction(self.action) ? self.action : self[self.action];
      Utils.assert(action,
        "You don't have an action named \"" + self.action + "\" defined on your RouteController");

      this.runHooks('onRun');
      this.runHooks('onBeforeAction');
      action.call(this);
      this.runHooks('onAfterAction');

    } catch (e) {
      this.response.writeHead(500, {'Content-Type': 'text/html'});
      console.error(e.toString());
    } finally {
      this.response.end();
    }
  },

  action: function () {
    this.response.end();
  }
});
