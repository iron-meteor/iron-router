Route = Utils.extend(Route, {
  constructor: function () {
    var self = this;

    Route.__super__.constructor.apply(this, arguments);

    var getOption = function (key) {
      return Utils.pick(self.options[key], self[key]);
    };

    this.loadingTemplate = getOption('loadingTemplate');
    this.notFoundTemplate = getOption('notFoundTemplate');
    this.data = getOption('data');
    this.template = getOption('template') || this.name;
    this.yieldTemplates = getOption('yieldTemplates');
    this.layoutTemplate = getOption('layoutTemplate');
  },

  run: function () {
    this._renderedYields = [];
    this.setLayout(this.layoutTemplate);
    return Route.__super__.run.apply(this, arguments);
  },

  action: function () {
    this.render();
  },

  /**
   * Either specify a template to render or call with no arguments to render the
   * RouteController's template plus all of the yieldTemplates.
   *
   */

  render: function (template, options) {
    var to;
    var template;
    var layout;
    var self = this;

    var addRenderedYield = function (key) {
      if (self._renderedYields) {
        key = key || 'main';
        self._renderedYields.push(key);
      }
    };

    if (arguments.length == 0) {
      this.router && this.router.setRegion('main', this.template);
      addRenderedYield();
      this.renderYields();
    } else {
      options = options || {};
      to = options.to;
      this.router && this.router.setRegion(to, template);
      addRenderedYield(to);
    }
  },
  
  // render all the templates 
  renderYields: function() {
    var self = this;
    
    _.each(this.yieldTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  setLayout: function (template) {
    this.router && this.router.setLayout(template);
  },
});
