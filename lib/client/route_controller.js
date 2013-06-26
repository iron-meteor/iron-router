function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

RouteController = Controller.extends({
  typeName: 'RouteController',

  loadingTemplate: null,

  notFoundTemplate: null,

  initialize: function (context, options) {
    options = this.options = options || {};
    context = context || {};

    this.params = context.params || [];
    this.route = context.route;
    this.router = context.router;
    this.template = 
      this.template || options.template || (this.route && this.route.name);

    this.layout = this.layout || options.layout; 

    this.loadingTemplate = this.loadingTemplate || options.loadingTemplate;
    this.notFoundTemplate = this.notFoundTemplate || options.notFoundTemplate;
    this.context = context;

    //XXX for options, we probably want to have local options and class level
    //options that are defined for all instances. In this case, if I extend
    //a super class and define before filter in that, I probably want all
    //instances to have it. But if I create a new instance of RouteController
    //and pass data as an option, it would be weird to have that affect all
    //future instances.
    if (options.before) {
      this.class.before(options.before);
    }

    if (options.after) {
      this.class.after(options.after);
    }

    RouteController.__super__.initialize.call(this, options);
  },

  runBeforeHooks: function () {
    var self = this
      , hooks = this._meta && this._meta.before;

    if (hooks) {
      _.each(hooks, function (hook) {
        hook.call(self);
      });
    }
  },

  runAfterHooks: function () {
    var self = this
      , hooks = this._meta && this._meta.after;

    if (hooks) {
      Deps.afterFlush(function () {
        _.each(hooks, function (hook) {
          hook.call(self);
        });
      });
    }
  },

  run: function () {
    var self = this;

    function render () {
      var data = self._meta.data || {};
      self.render({data: data});
    }

    function renderWithWait () {
      self.wait(self._meta.waitOn, function () {
        render();
      }, function () {
        if (self.loadingTemplate)
          self.render({template: self.loadingTemplate, data: {}});
        else
          console.warn('loadingTemplate not specified on controller');
      });
    }

    this._meta.waitOn ? renderWithWait() : render();
  },

  render: function () {
    var self = this
      , args = arguments;

    // this connects us to the reactive output of the router render
    // method so we can render to an arbitrary region of the dom
    return this.context.result(function () {
      return RouteController.__super__.render.apply(self, args);
    });
  },

  wait: function (handle, onReady, onWait, thisArg) {
    var isReady = handle.ready();

    if (isReady)
      onReady && onReady.call(thisArg || this);
    else
      onWait && onWait.call(thisArg || this);
  }
});

RouteController.extend({
  waitOn: function (handle) {
    var meta = this._meta();
    meta.waitOn = handle;
  },

  before: function (fn) {
    var meta = this._meta();
    meta.before = meta.before || [];

    if (_.isArray(fn))
      meta.before = meta.before.concat(fn);
    else
      meta.before.push(fn);
  },

  after: function (fn) {
    var meta = this._meta();
    meta.after = meta.after || [];

    if (_.isArray(fn))
      meta.after = meta.after.concat(fn);
    else
      meta.after.push(fn);
  }
});

RouteController.onBeforeExtends = function (def) {
  Controller.onBeforeExtends.apply(this, arguments);

  if (def.waitOn) {
    this.waitOn(def.waitOn);
    delete def.waitOn;
  }

  if (def.before) {
    this.before(def.before);
    delete def.before;
  }

  if (def.after) {
    this.after(def.after);
    delete def.after;
  }
};

RouteController.onBeforeInclude = function (proto) {
  Controller.onBeforeInclude.apply(this, arguments);

  var _meta = proto._meta;

  if (!_meta) return;

  if (_meta.waitOn) {
    this.waitOn(_meta.waitOn);
  }

  if (_meta.before)
    this.before(_meta.before);

  if (_meta.after)
    this.after(_meta.after);

  delete def._meta;
};
