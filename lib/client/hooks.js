Router.hooks = {
  renderNotFoundTemplate: function () {
    var self = this;
    var data = self.getData();
    if ((data === null || typeof data === 'undefined') 
        && self.notFoundTemplate) {
      self.render(self.notFoundTemplate);
      this.renderYields();
      self.stop();
    }
  },

  renderLoadingTemplate: function () {
    var self = this;

    if (!this.ready()) {
      if (this.loadingTemplate) {
        this.render(this.loadingTemplate);
        this.renderRegions();
      }
    }
  }
};
