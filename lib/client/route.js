Route = Utils.extend(Route, {
  constructor: function () {
    var self = this;

    Route.__super__.constructor.apply(this, arguments);

    var getOption = function (key) {
      return Utils.pick(self.options[key], self[key]);
    };

    var getTemplateOption = function (key) {
      return Route.classifyTemplateName(getOption(key));
    };

    this.data = getOption('data');
    this.yieldTemplates = getTemplateOption('yieldTemplates');

    this.loadingTemplate = getTemplateOption('loadingTemplate');
    this.notFoundTemplate = getTemplateOption('notFoundTemplate');
    this.template = getTemplateOption('template') || Route.classifyTemplateName(this.name);
    this.layoutTemplate = getTemplateOption('layoutTemplate');
  },

  run: function () {
    var self = this;
    this._renderedYields = [];
    this.setLayout(this.layoutTemplate);

    var data = function () {
      return _.isFunction(self.data) ? self.data.call(self) : self.data;
    };

    // the data function could get called multiple times if the context is used
    // from multiple yield regions. emboxing the data function makes sure that
    // multiple calls to the data function only runs the inner function once,
    // until the data has actually changed. This prevents expensive queries from
    // getting run over and over.
    var emboxedData = UI.emboxValue(data, EJSON.equals);
    this.router.setData(emboxedData);
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
      this.router.setRegionTemplate('main', this.template);
      addRenderedYield();
      this.renderYields();
    } else {
      options = options || {};
      to = options.to;
      this.router.setRegionTemplate(to, template);
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
    this.router.setLayoutTemplate(template);
  },

  stop: function () {
  },

  redirect: function (/* args */) {
    this.stop();
    this.router.go.apply(this.router, arguments);
  }
});
