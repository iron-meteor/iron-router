var dep = new Deps.Dependency;
// XXX: we have to store the state internally (rather than just calling out
// to window.location) due to an android 2.3 bug. See:
//   https://github.com/EventedMind/iron-router/issues/350
var currentState = {
  path: location.pathname + location.search + location.hash,
  // we set title to null because that can be triggered immediately by a "noop"
  // popstate that happens on load -- if it's already null, nothing's changed.
  title: null
};

function onpopstate (e) {
  setState(e.originalEvent.state, null, location.pathname + location.search + location.hash);
}

IronLocation = {};

IronLocation.origin = function () {
  return location.protocol + '//' + location.host;
};

IronLocation.isSameOrigin = function (href) {
  var origin = IronLocation.origin();
  return href.indexOf(origin) === 0;
};

IronLocation.get = function () {
  dep.depend();
  return currentState;
};

IronLocation.path = function () {
  dep.depend();
  return currentState.path;
};

IronLocation.set = function (url, options) {
  options = options || {};

  var state = options.state || {};

  if (/^http/.test(url))
    href = url;
  else {
    if (url.charAt(0) !== '/')
      url = '/' + url;
    href = IronLocation.origin() + url;
  }

  if (!IronLocation.isSameOrigin(href))
    window.location = href;
  else if (options.where === 'server')
    window.location = href;
  else if (options.replaceState)
    IronLocation.replaceState(state, options.title, url, options.skipReactive);
  else
    IronLocation.pushState(state, options.title, url, options.skipReactive);
};

// store the state for later access
setState = function(newState, title, url, skipReactive) {
  newState = _.extend({}, newState);
  newState.path = url;
  newState.title = title;

  if (!skipReactive && ! EJSON.equals(currentState, newState))
    dep.changed();

  currentState = newState;
}

IronLocation.pushState = function (state, title, url, skipReactive) {
  setState(state, title, url, skipReactive);

  if (history.pushState)
    history.pushState(state, title, url);
  else
    window.location = url;
};

IronLocation.replaceState = function (state, title, url, skipReactive) {
  // allow just the state or title to be set
  if (arguments.length < 2)
    title = currentState.title;
  if (arguments.length < 3)
    url = currentState.path;

  setState(state, title, url, skipReactive);

  if (history.replaceState)
    history.replaceState(state, title, url);
  else
    window.location = url;
};

IronLocation.bindEvents = function(){
  $(window).on('popstate.iron-router', onpopstate);
};

IronLocation.unbindEvents = function(){
  $(window).off('popstate.iron-router');
};

IronLocation.start = function () {
  if (this.isStarted)
    return;

  IronLocation.bindEvents();
  this.isStarted = true;
  // store the fact that this is the first route we hit.
  // this serves two purposes
  //   1. We can tell when we've reached an unhandled route and need to show a
  //      404 (rather than bailing out to let the server handle it)
  //   2. Users can look at the state to tell if the history.back() will stay
  //      inside the app (this is important for mobile apps).
  if (history.replaceState)
    history.replaceState({initial: true}, null, location.pathname + location.search + location.hash);
};

IronLocation.stop = function () {
  IronLocation.unbindEvents();
  this.isStarted = false;
};
