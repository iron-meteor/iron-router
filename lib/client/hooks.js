Router.hooks = {
  setDataHook: function () {
    var self = this;
    var data = _.isFunction(self.data) ? self.data.call(self) : self.data;
    if (data !== false) {
      self.setData(data);
    }
  },

  autoRenderNotFoundTemplateHook: function () {
    var self = this;
    var data = self.getData();
    if ((data === null || typeof data === 'undefined') 
        && self.notFoundTemplate) {
      self.render(self.notFoundTemplate);
      this.renderYields();
      self.stop();
    }
  },

  autoRenderLoadingTemplateHook: function () {
    var self = this;

    if (!this.ready()) {
      if (this.loadingTemplate) {
        this.render(this.loadingTemplate);
        this.renderYields();
        this.stop();
      }
    }
  },

  autoClearUnusedRegionsHook: function () {
    this.router && this.router.clearUnusedRegions(this._renderedYields);
  }
};
