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

    RouteController.__super__.initialize.call(this);
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
  }
});

RouteController.onBeforeExtends = function (def) {
  Controller.onBeforeExtends.apply(this, arguments);

  if (def.waitOn) {
    this.waitOn(def.waitOn);
    delete def.waitOn;
  }
};

RouteController.onBeforeInclude = function (proto) {
  Controller.onBeforeInclude.apply(this, arguments);

  var _meta = proto._meta;

  if (!_meta) return;

  if (_meta.waitOn) {
    this.waitOn(_meta.waitOn);
  }

  delete def._meta;
};
