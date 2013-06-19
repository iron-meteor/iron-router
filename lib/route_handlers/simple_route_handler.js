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

  // should include route, router, params, options
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

  //XXX this should be reactive
  this.handler.call(this);
};

SimpleRouteHandler.prototype = {
  run: function () {
    //XXX Here is where we will run in a reactive context and call all the
    //before filters if we have any. Need to be smart here and know whether
    //the router has changed routes on us. if so, don't continue running
    //the filters or the rest of the route.
  },

  wait: function (handle, onReady, onWait, context) {
    var isReady = handle.ready();

    if (isReady)
      onReady && onReady.call(context || this);
    else
      onWait && onWait.call(context || this);
  },

  wrapWithData: function (data) {
    var self = this
      , handler  = self.handler;

    self.handler = function () {
      var template = self.options.template || self.name;

      data = _.isFunction(data) ? data() : data;
      
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

  render: function (templateName, options) {
    var self = this;

    self.context.result(function () {
      var options = _.extend({}, self.options, options || {})
        , data = options.data
        , templateData
        , layoutData
        , events = options.events
        , partials
        , layout
        , template;

      layout = getTemplateFunction(options.layout, function (data) {
        return data['yield']();
      });

      template = getTemplateFunction(templateName);

      return Spark.isolate(function () {
        var data = _.isFunction(options.data) ? options.data() : options.data;
        data = data || {};

        return IronRouter._CurrentPartials.withPartials(
          function (partials) {
            partials['__main__'] = getTemplateFunction(template)(data);

            return Spark.labelBranch('Route.' + self.route.name, function () {
              var html
                , landmarkOptions;

              landmarkOptions = {
                // no need to do anything with callbacks for now
              };

              function onLandmark (landmark) {
                var html = Spark.isolate(function () {
                  return layout(layoutData);
                });

                if (events)
                  html = Spark.attachEvents(events, html);

                return html;
              }

              html = Spark.createLandmark(landmarkOptions, onLandmark);
              html = Spark.setDataContext(data, html);

              return html;
          });
        });
      });
    });
  }
};

/*
this.context.result(function () {
  return Spark.isolate(function () {
    var data = _.isFunction(options.data) ? options.data() : options.data || {}
      , layoutData = {}
      , templateData = {}
      , partials = {}
      , layout
      , html;

    layout = getTemplateFunction(options.layout, function (data) {
      return data['yield']();
    });

    _.extend(templateData, data, {
      'contentFor': function (name, options) {
        assert(arguments.length >= 2, 'contentFor requires a name');
        if (options.hash && options.hash.value)
          partials[name] = options.hash.value;
        else if (options.fn)
          partials[name] = Spark.isolate(function () {
            return options.fn(templateData);
          });
        return '';
      }
    });

    _.extend(layoutData, data, {
      'yield': function (name, options) {
        if (arguments.length < 2) name = '__main__';
        return partials[name];
      }
    });

    partials['__main__'] = getTemplateFunction(template)(templateData);

    var html = layout(layoutData);

    //XXX wrap entire thing in a set of route annotations including
    //landmark, basically creating a dynamically created template.
    if (options.events) {
      html = Spark.attachEvents(options.events, html);
    }

    return html;
  });
});
*/
