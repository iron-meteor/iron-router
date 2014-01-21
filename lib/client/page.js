//XXX verify data function on yield
//XXX bring back contentFor
//XXX define nested layout behavior
//XXX do we need regions anymore?
//XXX allow layouts to be defined in templates
//XXX error handling
//XXX avi says withData is being deprecated

var MAIN_REGION = 'main';
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

// duplicating from meteor ui/base.js since meteor didn't make public
var findComponentWithProp = function (id, comp) {
  while (comp) {
    if (comp[id])
      return comp;
    comp = comp.parent;
  }
  return null;
};

var getComponentData = function (comp) {
  comp = findComponentWithProp('data', comp);
  return (comp ?
          (typeof comp.data === 'function' ?
           comp.data() : comp.data) :
          null);
};

var findComponentWithRegions = function (cmp) {
  return findComponentWithProp('regions', cmp);
};

Region = UI.Component.extend({
  kind: 'Region',

  init: function () {
    var self = this;
    this.template = new ReactiveVar(this.template);

    //XXX we really shouldn't have to do this
    this.setTemplate = function (value) {
      self.template.set(value);
    };

    this.getTemplate = function () {
      return self.template.get();
    };
  },

  render: function () {
    var self = this;

    return function () {
      var tmpl = self.getTemplate();
      if (!tmpl) return;
      tmpl = UI.isComponent(tmpl) ? tmpl : Template[tmpl];
      return tmpl;
    };
  }
});

Layout = Region.extend({
  kind: 'Layout',

  init: function () {
    var self = this;
    Region.init.apply(this, arguments);
    self.regions = new ReactiveDict;
    self.regionData = new ReactiveDict;

    self.setRegionTemplate = function (region, template) {
      if (arguments.length < 2) {
        template = region;
        region = MAIN_REGION;
      }
      self.regions.set(region, template);
    };

    self.setTemplate = function (template) {
      self.template.set(template || DEFAULT_LAYOUT);
    };

    self.setRegionData = function (region, data) {
      if (arguments.length < 2) {
        data = region;
        region = MAIN_REGION;
      }
      self.regionData.set(region, data);
    };

    self._clearRegion = function (region) {
      self.regions.set(region, null);
    },

    self._clearUnusedRegions = function (usedRegions) {
      var allRegions = _.keys(self.regions.keys);
      var usedRegions = _.filter(usedRegions, function (val) {
        return !!val;
      });

      var unusedRegions = _.difference(allRegions, usedRegions);

      _.each(unusedRegions, function (key) {
        self._clearRegion(key);
      });
    };
  }
});



//XXX making yield a template instead of an instance property on
//    Layouts because otherwise Spacebars compiles the {{> yield}} into
//    a Component.lookup which creates a dependency on the parent data
//    context at the wrong time; so if the data context changes the entire
//    child template is re-rendered. This isn't what we want. Instead, we
//    want only the relevent parts of the child to be re-rendered.
Template.yield = UI.Component.extend({
  init: function () {
    this.region = this.data || function () {
      return MAIN_REGION;
    };
  },

  render: function () {
    var self = this;
    var region = self.region();
    var regionComponent = findComponentWithRegions(self);
    var regions = regionComponent.regions;
    var regionData = regionComponent.regionData;

    return function () {
      var template = regions.get(region);

      return Region.extend({
        region: region,
        template: template,
        data: function () {
          var data = regionData.get(region) || getComponentData(self);
          return data;
        }
      });
    };
  }
});



/*
  _clearRegion: function (key) {
    this.regions[key].setComponent(null);
  },

  _clearUnusedRegions: function (usedRegions) {
    var self = this;
    var allRegions = _.keys(this.regions);
    var usedRegions = _.filter(usedRegions, function (val) {
      return !!val;
    });
    var unusedRegions = _.difference(allRegions, usedRegions);

    _.each(unusedRegions, function (key) {
      self._clearRegion(key);
    });
  }
});
*/
