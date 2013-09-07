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

LayoutController = function () {
  this.templates = new ReactiveDict;
  this.layout = new ReactiveVar;
  this.data = new ReactiveVar({});
  this.layout.set('__defaultLayout__');
};

LayoutController.prototype = {
  setLayout: function (layout) {
    assertTemplateExists(layout);
    this.layout.set(layout);
  },

  setTemplate: function (template, to) {
    var self = this;

    to = to || '__main__';
    assertTemplateExists(template);

    Deps.nonreactive(function () {
      if (to !== '__main__' && self.templates.equals(to, undefined)) {
        throw new Error(
          "Sorry, couldn\'t find a yield named \"" + to + "\". Did you define a named yield in your layout like this: {{yield \"" + to + "\"}}?");
      }
    });

    this.templates.set(to, template);
  },

  setData: function (data) {
    this.data.set(data || {});
  },

  helpers: function () {
    var self = this;
    return {
      'yield': function (key, options) {
        var html;

        if (arguments.length < 2)
          key = '__main__';

        html = self.renderTemplate(key);
        return new Handlebars.SafeString(html);
      }
    };
  },

  renderTemplate: function (key) {
    // this makes sure to register a key in the ReactiveDict. When you later
    // call setTemplate('templateName', {to: 'someYield'}) this lets us check
    // whether the yield has been defined, otherwise give a helpful error
    // message
    this.templates.setDefault(key, '');

    // grab the template function from Template or just make the template
    // function return an empty string if no template found
    var template = getTemplateFunction(this.templates.get(key), function () {
      return '';
    });

    var data = this.data.get();
    var helpers = this.helpers();
    var dataContext = _.extend({}, data, helpers);

    return template(dataContext);
  },

  render: function () {
    var self = this;
    return Spark.render(function () {
      return Spark.isolate(function () {
        var layout = getTemplateFunction(self.layout.get());
        var data = self.data.get();
        var helpers = self.helpers();
        var dataContext = _.extend({}, data, helpers);
        return layout(dataContext);
      });
    });
  }
};
