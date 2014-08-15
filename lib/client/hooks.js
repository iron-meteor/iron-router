Router.hooks = {
  dataNotFound: function (pause) {
    var tmpl;

    if (!this.ready())
      return;
    
    // there was never a data function defined at all
    // XXX: it would be more "correct" to call this.lookupProperty('data'),
    //   but it gets overridden by a data() in client/route_controller
    //   that's always defined. We should fix this
    if (this._dataValue === null || typeof this._dataValue === 'undefined')
      return;

    var data = this.data();

    // Checking data.count allows us to specify Meteor.Collection instance in data function
    if (data === null || typeof data === 'undefined' || (data.count && data.count() === 0)) {
      tmpl = this.lookupProperty('notFoundTemplate');

      if (tmpl) {
        this.render(tmpl);
        this.renderRegions();
        pause();
      }
    }
  },

  loading: function (pause) {
    var self = this;
    var tmpl;

    if (!this.ready()) {
      tmpl = this.lookupProperty('loadingTemplate');

      if (tmpl) {
        this.render(tmpl);
        this.renderRegions();
        pause();
      }
    }
  }
};
