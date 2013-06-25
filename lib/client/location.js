var Location = {
  isStarted: false,

  currentDep: new Deps.Dependency,

  _current: null,

  current: function (value) {
    if (value) {
      if (this._current !== value) {
        this._current = value;
        this.currentDep.changed();
      }
    } else {
      this.currentDep.depend();
      return this._current;
    }
  },

  events: {
    'popstate': _.bind(this.onPopState, this),
    'click': _.bind(this.onClick, this)
  },

  start: funciton () {
    var self = this;

    if (self.started) return;
    self.isStarted = true;

    Meteor.startup(function () {
      _.each(self.events, function (handler, event) {
        addEventListener(event, handler, false);
      });

      self.current({
        path: location.pathname + location.search,
        state: {
          //XXX does this belong here?
          path: location.pathname + location.search
        }
      });
    });
  },

  stop: function () {
    _.each(this.events, function (handler, event) {
      removeEventListener(event, handler, false);
    });
    this.isStarted = false;
  },

  isSameOrigin: function (href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  },

  onPopState: function (e) {
    if (e.state)
      this.current({
        path: e.state.path,
        state: e.state
      });
  },

  onClick: function (e) {
    var base = '';

    var which = function (e) {
      e = e || window.event;
      return null == e.which
        ? e.button
        : e.which;
    };

    if (1 != which(e)) {
      return;
    }

    if (e.defaultPrevented) {
      return;
    }

    var el = e.target;

    // if we clicked something inside an A tag, we want to get
    // the actual A tag so we can get its href. But this is really
    // we should be able to use DomUtils here.

    while (el && 'A' != el.nodeName) el = el.parentNode;

    if (!el || 'A' != el.nodeName) return;

    var href = el.href;
    var path = el.pathname + el.search;

    if (el.hash || '#' == el.getAttribute('href')) return;

    if (!this.isSameOrigin(href)) {
      return;
    }
    var orig = path;
    path = path.replace(base, '');

    if (base && orig == path) {
      return;
    }

    e.preventDefault();

    //XXX how do we wire this up to the router?
  }
};

