RouteMatch = function (route, path, options) {
  var self = this;

  this.route = route;
  this.params = route.params(path);
  this.router = route.router;
  this.options = options || {};

  this._renderedYields = [];
  this._waitList = new WaitList;
  this._stopped = false;
  this._data = route.data;

  this.data = function () {
    return _.isFunction(self._data) ? self._data.call(self) : self._data;
  };
};

RouteMatch.prototype = {
  constructor: RouteMatch,

  render: function (template, options) {
    var to;
    var template;
    var layout;
    var self = this;

    var addRenderedYield = function (key) {
      if (self._renderedYields) {
        key = key || 'main';
        self._renderedYields.push(key);
      }
    };

    if (arguments.length == 0) {
      this.router.setRegionTemplate('main', this.route.template);
      addRenderedYield();
      this.renderYields();
    } else {
      options = options || {};
      to = options.to;
      this.router.setRegionTemplate(to, template);
      addRenderedYield(to);
    }
  },

  renderYields: function () {
    var self = this;

    _.each(this.yieldTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  setLayout: function (template) {
    this.router.setLayoutTemplate(template);
  },

  stop: function () {
    this._stopped = true;
  },

  redirect: function () {
    this.stop();
    return this.router.go.apply(this.router, arguments);
  },

  ready: function () {
    return this._waitList.ready();
  },

  /*
   * Calls Meteor.subscribe but adds a wait method to the returned handle
   * object. If the user calls wait on the result, the subscription handle is
   * added to the RouteController's wait list.
   */

  subscribe: function (/* same as Meteor.subscribe */) {
    var self = this;

    var waitApi = (function () {
      return {
        wait: function () {
          self._waitList.push(this);
        }
      };
    })();

    var handle = Meteor.subscribe.apply(this, arguments);
    return _.extend(handle, waitApi);
  },

  wait: function (handle) {
    handle = _.isFunction(handle) ? handle.call(this) : handle;
    this._waitList.append(handle);
    return this;
  }
};