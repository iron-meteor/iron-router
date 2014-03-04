Router.hooks = {
  dataNotFound: function (pause) {
    var data = this.data();
    if ((data === null || typeof data === 'undefined') 
        && this.notFoundTemplate) {
      this.render(this.notFoundTemplate);
      this.renderRegions();
      pause();
    }
  },

  loading: function (pause) {
    var self = this;

    if (!this.ready()) {
      if (this.loadingTemplate) {
        this.render(this.loadingTemplate);
        this.renderRegions();
        pause();
      }
    }
  }
};
