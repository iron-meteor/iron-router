Router.hooks = {
  dataNotFound: function (pause) {
    var data = this.data();
    var tmpl;

    if (!this.ready())
      return;

    if (data === null || typeof data === 'undefined') {
      tmpl = this.lookup('notFoundTemplate');

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
      tmpl = this.lookup('loadingTemplate');

      if (tmpl) {
        this.render(tmpl);
        this.renderRegions();
        pause();
      }
    }
  }
};
