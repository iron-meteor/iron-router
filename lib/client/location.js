Location = Class.extends();

Location.extend({
  _deps: new Deps.Dependency,

  _state: null,

  _setState: function (state, title, url, skipReactive) {
    state = state || {};
    state.path = url;
    state.title = title;
    this._state = state;

    if (skipReactive === true) return;
    else this._deps.changed();
  },

  _events: {},

  isStarted: false,

  state: function () {
    this._deps.depend();
    return this._state;
  },

  pushState: function (state, title, url, skipReactive) {
    history.pushState(state, title, url);
    this._setState(state, title, url, skipReactive);
  },

  replaceState: function (state, title, url) {
    history.replaceState(state, title, url);
    this._setState(state, title, url);
  },

  back: function () {
    history.back();
  },

  forward: function () {
    history.forward();
  },

  go: function (arg) {
    history.go(arg);
  },

  start: function () {
    var self = this;

    if (self.isStarted) return;

    self._events = {
      'popstate': _.bind(this.onPopState, this)
    };
    
    Meteor.startup(function () {
      _.each(self._events, function (handler, event) {
        addEventListener(event, handler, false);
      });

      self.isStarted = true;
      self.replaceState({}, null, location.pathname + location.search);
    });
  },

  stop: function () {
    _.each(this._events, function (handler, event) {
      removeEventListener(event, handler, false);
    });
    this.isStarted = false;
  },

  isSameOrigin: function (href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) 
      origin += ':' + location.port;
    return href.indexOf(origin) == 0;
  },

  onPopState: function (e) {
    this._setState(e.state, null, location.pathname + location.search);
  }
});
