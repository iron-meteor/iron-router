_.extend(Router.prototype, {
  initialize: function () {

    this.eventListeners = {
      'popstate': _.bind(this.onPopState, this),
      'click': _.bind(this.onClick, this)
    };

    if (this.options.autoStart !== false)
      this.start();

    if (this.options.autoRender !== false)
      this.autoRender();
  },

  render: function () {
    var self = this;
    var route = function () {
      var current = self.current();
      return current ? Spark.isolate(_.bind(current.result, current)) : '';
    };

    return Meteor.render(route);
  },

  autoRender: function () {
    var self = this;
    Meteor.startup(function () {
      document.body.innerHTML = '';
      document.body.appendChild(self.render());
    });
  },

  start: function () {
    var self = this;

    if (self.isStarted) return;
    self.isStarted = true;

    //XXX Can we use UniversalEvents instead of dealing directly
    //with the browser?
    Meteor.startup(function () {
      _.each(self.eventListeners, function (handler, name) {
        addEventListener(name, handler, false);
      });
      self.replace(location.pathname + location.search, null);
    });
  },

  stop: function () {
    _.each(this.eventListeners, function (handler, name) {
      removeEventListener(name, handler, false);
    });
    this.isStarted = false;
  },

  replace: function (path, state) {
    var context = new RouteContext(path, state);
    this.dispatch(context, function () {
      history.replaceState(context.getState(), context.title, context.path);
    });
  },

  go: function (path, state) {
    var context = new RouteContext(path, state);
    this.dispatch(context, function () {
      // XXX we only push state if its a client route so do we
      // handle that here?
      history.pushState(context.getState(), context.title, context.path);
    });
  },

  isSameOrigin: function (href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  },

  onPopState: function (e) {
    if (e.state) this.replace(e.state.path, e.state);
  },

  //XXX This is a mess. Replace.
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

    this.go(orig);
  }
});
