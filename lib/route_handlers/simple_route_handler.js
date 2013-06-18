function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

function getTemplateFunction (name, defaultFn) {
  var template = null;

  if (_.isFunction(name))
    template = name;
  else if (_.isString(name))
    template = Template[name];

  if (!template && defaultFn)
    template = defaultFn;

  assert(template, 'Template "' + name + '" not found');
  return template;
}

SimpleRouteHandler = function (context) {
  if (!(this instanceof SimpleRouteHandler))
    return new SimpleRouteHandler(context);

  var options = context.options
    , defaultTemplate = options.template || context.route.name;

  this.context = context;

  _.extend(this, context);

  if (!options.notFoundTemplate)
    options.notFoundTemplate = function () {
      return '<h1>404 - Not Found</h1>';
    };

  if (!options.loadingTemplate)
    options.loadingTemplate = function () {
      return '<h1>Loading...</h1>';
    };

  this.handler = context.route.handler || function () {
    this.render(defaultTemplate, this.options);
  };

  if (options.data)
    this.wrapWithData(options.data);

  if (options.wait)
    this.wrapWithWait(options.wait);

  this.handler.call(this);
};

SimpleRouteHandler.prototype = {
  wait: function (handle, onReady, onWait, context) {
    var isReady = handle.ready();

    if (isReady)
      onReady && onReady.call(context || this);
    else
      onWait && onWait.call(context || this);
  },

  wrapWithData: function (fn) {
    var self = this
      , handler  = self.handler;

    self.handler = function () {
      var data = fn.call(this)
        , template = self.options.template || self.name;
      
      if (data)
        self.render(template, { data: data });
      else
        self.render(self.options.notFoundTemplate);
    };
  },

  wrapWithWait: function (handle) {
    var self = this
      , handler = self.handler;

    self.handler = function () {
      self.wait(handle, handler, function () {
        self.render(self.options.loadingTemplate);
      }, this);
    };
  },

  render: function (template, options) {
    var layout
      , template
      , options = _.extend({}, this.options, options || {})

    //XXX add back named yields
    layout = getTemplateFunction(options.layout, function (data) {
      return data['yield']();
    });

    template = getTemplateFunction(template);

    this.context.result(function () {
      var data = options.data || {}
        , html;

      html = layout({
        'yield': function (name, options) {
          //XXX if data is a function call it here otherwise get it
          //from the options to render
          return template(data);
        }
      });

      return html;
    });
  }
};
