Router.hooks = {
  dataNotFound: function (pause) {
    var tmpl;

    if (!this.ready())
      return;
    
    if (!this._hasData())
      return;

    var data = this.data();

    if (data === false || data === null || typeof data === 'undefined') {
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
