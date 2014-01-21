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

  run: function (path, options) {
    var self = this;
    self.router.setLayoutTemplate(this.layoutTemplate);
    Route.__super__.run.apply(self, arguments);
  },

  setData: function (data) {
    var self = this;
    Deps.autorun(function () {
      self.router.setData(data);
    });
  },

  runHook: function (hook, routeMatch) {
    Deps.autorun(function () {
      hook.call(routeMatch);
    });
  },

  runAction: function (routeMatch) {
    var action = _.isFunction(this.action) ? this.action : this[this.action];
    Deps.autorun(function () {
      action.call(routeMatch);
    })
  },

  action: function () {
    // This function should be called in the thisArg context of a RouteMatch
    // instance.
    this.render();
  }
});
