/**
 * Root component for a page. A page has a master layout which can yield one or
 * more regions. A region is just a variable component. The mental model might
 * look like this:
 *
 * Page ->
 *  Layout ->
 *    RegionA -> Template
 *    RegionB -> Template
 *    RegionC -> Template
 *
 *  The layout and regions can vary independently.
 */

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

Region = UI.Component.extend({
  kind: 'Region',

  init: function () {
    // unclear what should go in here vs prototype. I need access to the
    // instance object from Page regions object.
  },

  render: function () {
    var self = this;

    return function () {
      var cmp = self.component.get();
      if (!cmp) return;
      cmp = UI.isComponent(cmp) ? cmp : Template[cmp];
      return cmp;
    };
  },

  setComponent: function (cmp) {
    this.component.set(cmp);
  }
});

Page = UI.Component.extend({
  kind: 'Page',

  init: function () {
    this.regions = {};
    this.data = new ReactiveVar(null);
    this.layout = new ReactiveVar(this.layoutTemplate || DEFAULT_LAYOUT);
  },

  render: function () {
    var self = this;

    return function () {
      var layout = self.layout.get();
      layout = UI.isComponent(layout) ? layout : Template[layout];
      layout = layout.extend({

        /**
         * Create a region in the layout to render a template into. The template
         * rendered into the region can change.
         */
        'yield': function (key, options) {
          if (!_.isString(key))
            key = MAIN_REGION;
          return self._ensureRegion(key);
        }

      }).withData(function () {
        return self.getData();
      });

      return layout;
    };
  },

  setLayout: function (template) {
    template = template || DEFAULT_LAYOUT;
    this.layout.set(template);
  },

  setData: function (data) {
    this.data.set(data);
  },

  getData: function () {
    return this.data.get();
  },

  setRegion: function (key, cmp) {
    this._ensureRegion(key);
    this.regions[key].setComponent(cmp);
  },

  _ensureRegion: function (key) {
    var region = this.regions[key] = this.regions[key] || Region.extend({
      name: key,
      layout: this,

      //XXX this doesn't feel right. where is the best place to put this? init
      //won't work because then we don't have a reference to the instance (and
      //we need one in setRegion)
      component: new ReactiveVar
    });

    return region;
  },

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
