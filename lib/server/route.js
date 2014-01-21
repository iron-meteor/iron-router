Route = Utils.extend(Route, {
  constructor: function () {
    Route.__super__.constructor.apply(this, arguments);
  },

  action: function () {
    this.response.end();
  },

  run: function (path, options) {
    try {
      Route.__super__.run.apply(this, arguments);
    } finally {
      var response = options.response;
      return response && response.end();
    }
  }
});