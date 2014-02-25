if (typeof Spark !== 'undefined') {
  var MAIN_YIELD = 'main';
  var DEFAULT_LAYOUT = '__defaultLayout__';

  var getTemplateFunction = function (template, defaultFn) {
    if (_.isFunction(template))
      return template;
    else if (Template[template])
      return Template[template];
    else if (defaultFn)
      return defaultFn;
    else
      throw new Error('Oops, no template found named "' + template + '"');
  };

  var assertTemplateExists = function (template) {
    if (_.isFunction(template))
      return true;
    else if (!Template[template])
      throw new Error('Uh oh, no template found named "' + template + '"');
  };

  Template.__define__(DEFAULT_LAYOUT,Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"yield"]]]]));

  var ReactiveVar = function (value) {
    this._dep = new Deps.Dependency;
    this._value = value || null;
  };

  ReactiveVar.prototype = {
    set: function (value) {
      if (EJSON.equals(value, this._value))
        return;

      this._value = value;
      this._dep.changed();
    },

    get: function () {
      this._dep.depend();
      return this._value;
    },

    equals: function (other) {
      this._dep.depend();
      return EJSON.equals(this._value, other);
    }
  };

  SparkUIManager = function () {
    this.yieldsToTemplates = new ReactiveDict;
    this.layout = new ReactiveVar;
    this._data = new ReactiveVar({});
    this.layout.set(DEFAULT_LAYOUT);
    this._yields = {};
  };

  SparkUIManager.prototype = {
    render: function (props) {
      return this.renderLayout();
    },

    insert: function (parent) {
      var self = this;
      var frag = Spark.render(function () {
        return self.render();
      });

      parent = parent || document.body;
      parent.appendChild(frag);
    },

    template: function (layout) {
      var self = this;
      layout = layout || DEFAULT_LAYOUT;
      assertTemplateExists(layout);
      Deps.nonreactive(function () {
        var oldLayout = self.layout.get();

        // reset because we have a new layout now
        if (oldLayout !== layout)
          self._yields = {};
      });

      this.layout.set(layout);
    },

    setRegion: function (key, value) {
      var self = this;
      var to = key;
      var template = value;

      to = to || MAIN_YIELD;

      // make sure the yield region was declared otherwise the user may have
      // tried to render into a named yield that was never declared in the
      // layout. Let's provide them a helpful warning if that happens.

      // If we're already in a flush we want to schedule the yield check for after
      // the next flush, not this one. The flush we're currently in is caused by a
      // location change which triggers the router's dispatch process. Then, we
      // add this check to the current flush's afterFlushCallbacks queue which
      // caues it to be executed as soon as all our code is done running, instead
      // of after the next flush which is what we want. There might be a better
      // pattern here.
      Meteor.defer(function () {
        Deps.afterFlush(function () {
          var isYieldDeclared = self._yields[to];
          var help;

          if (!isYieldDeclared) {
            if (to == MAIN_YIELD)
              help = 'Sorry, couldn\'t find the main yield. Did you define it in one of the rendered templates like this: {{yield}}?';
            else
              help = 'Sorry, couldn\'t find a yield named "' + to + '". Did you define it in one of the rendered templates like this: {{yield "' + to + '"}}?';

            if (console && console.warn)
              console.warn(help);
            else if (console && console.error)
              console.error(help);
            else
              throw new Error(help);
          }
        });
      });

      this.yieldsToTemplates.set(to, template);
    },

    clearRegion: function (key) {
      this.yieldsToTemplates.set(key, null);
    },

    getRegionKeys: function () {
      return _.keys(this.yieldsToTemplates.keys);
    },

    data: function (value) {
      if (value)
        this._data.set(value);
      else
        return this._data.get();
    },

    helpers: function () {
      var self = this;
      return {
        'yield': function (key, options) {
          var html;

          if (arguments.length < 2)
            key = null;

          html = self._renderTemplate(key);
          return new Handlebars.SafeString(html);
        }
      };
    },

    _renderTemplate: function (key) {
      var self = this;

      key = key || MAIN_YIELD;

      // register that this named yield was used so we can check later that all
      // setTemplate calls were for a yield region that exists.
      this._yields[key] = true;


      return Spark.isolate(function () {
        // grab the template function from Template or just make the template
        // function return an empty string if no template found
        var template = getTemplateFunction(self.yieldsToTemplates.get(key), function () {
          return '';
        });

        var data = self.data();
        var helpers = self.helpers();
        var dataContext = _.extend({}, data, helpers);

        return template(dataContext);
      });
    },

    renderLayout: function () {
      var self = this;

      var html = Spark.isolate(function () {
        var layout = getTemplateFunction(self.layout.get());
        var data = self.data();
        var helpers = self.helpers();
        var dataContext = _.extend({}, data, helpers);
        var html = layout(dataContext);
        return html;
      });

      return html;
    }
  };
}
