/**
 * Location singleton class for working with HTML5 pushState reactively.
 *
 * XXX Does not support pre IE10 since <ie10 doesn't support pushState. Need to
 * integrate history.js or handle hashes somehow.
 *
 * @api public
 * @exports Location
 */

Location = {
  typeName: 'Location',

  /**
   * Track dependencies on the current state.
   *
   * @api private
   */

  _deps: new Deps.Dependency,


  /**
   * Reactive state property that gets set anytime the browser state changes.
   *
   * @api private
   */

  _state: null,

  /**
   * Set the current state and call deps.changed().
   *
   * @param {Object} state
   * @param {String} title
   * @param {String} url
   * @param {Boolean} [skipReactive] Set the _state property unreactively.
   * @api private
   */

  _setState: function (state, title, url, skipReactive) {
    state = state || {};
    state.path = url;
    state.title = title;

    if (EJSON.equals(this._state, state)) return;
    this._state = state;

    if (skipReactive === true) return;
    else this._deps.changed();
  },

  /**
   * Event map for adding and removing events during start and stop.
   *
   * @api private
   */

  _events: {},

  /**
   * Track whether Location has started yet - events wired up and listening for
   * events.
   *
   * @api private
   */
  isStarted: false,

  /**
   * Reactive accessor for the current state.
   *
   * @api public
   */

  state: function () {
    this._deps.depend();
    return this._state;
  },

  /**
   * Reactive proxy to history.pushState.
   *
   * @api public
   */

  pushState: function (state, title, url, skipReactive) {
    history.pushState(state, title, url);
    this._setState(state, title, url, skipReactive);
  },

  /**
   * Reactive proxy to history.replaceState.
   *
   * @api public
   */

  replaceState: function (state, title, url, skipReactive) {
    history.replaceState(state, title, url);
    this._setState(state, title, url, skipReactive);
  },

  /**
   * Proxy to history.back
   *
   * @api public
   */

  back: function () {
    history.back();
  },

  /**
   * Proxy to history.forward
   *
   * @api public
   */

  forward: function () {
    history.forward();
  },

  /**
   * Proxy to history.go
   *
   * @api public
   */
  go: function (arg) {
    history.go(arg);
  },

  /**
   * Start listening to pushState events and set the initial state.
   *
   * @api public
   */

  start: function () {
    var self = this;

    // only start Location once
    if (self.isStarted) return;

    self._events = {
      'popstate': _.bind(this.onPopState, this)
    };
    
    _.each(self._events, function (handler, event) {
      addEventListener(event, handler, false);
    });

    self.isStarted = true;
    self.replaceState({initial: true}, null, location.pathname + location.search);
  },

  /**
   * Unhook events and mark isStarted false.
   *
   * @api public
   */

  stop: function () {
    _.each(this._events, function (handler, event) {
      removeEventListener(event, handler, false);
    });
    this.isStarted = false;
  },

  /**
   * Returns true if href is of the same origin as the current page.
   *
   * @param {String} href
   * @return {Boolean}
   * @api public
   */

  isSameOrigin: function (href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) 
      origin += ':' + location.port;
    return href.indexOf(origin) == 0;
  },

  /**
   * Event handler for onpopstate. Calls _setState.
   *
   * @param {Object} e The event object
   * @api private
   */

  onPopState: function (e) {
    this._setState(e.state, null, location.pathname + location.search);
  }
};
