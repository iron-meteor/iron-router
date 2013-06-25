RouteContext = function (path, router, route, state) {
  this._deps = new Deps.Dependency;
  this._result = null;

  this.path = path;
  this.router = router;
  this.route = route;
  this.state = state;
  this.params = route.params(path);
};

RouteContext.prototype = {
  constructor: RouteContext,

  getState: function () {
    return _.extend({}, this.state, {
      path: this.path
    });
  },

  result: function (fn) {
    if (_.isFunction(fn)) {
      this._result = fn;
      this._deps.changed();
    } else {
      this._deps.depend();
      return (this._result && this._result.call(this)) || '';
    }
  }
};
