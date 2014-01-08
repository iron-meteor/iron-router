var dep = new Deps.Dependency;
var popped = false;
// XXX: we have to store the state internally (rather than just calling out
// to window.location) due to an android 2.3 bug. See:
//   https://github.com/EventedMind/iron-router/issues/350
var currentState = {
  path: location.pathname + location.search + location.hash
};

function onclick (e) {
  var el = e.currentTarget;
  var which = _.isUndefined(e.which) ? e.button : e.which;
  var href = el.href;
  var path = el.pathname + el.search + el.hash;

  // we only want to handle clicks on links which:
  //  - are with the left mouse button with no meta key pressed
  if (which !== 1)
    return;

  if (e.metaKey || e.ctrlKey || e.shiftKey) 
    return;
  
  // - haven't been cancelled already
  if (e.isDefaultPrevented())
    return;
  
  // - aren't in a new window
  if (el.target)
    return;
  
  // - aren't external to the app
  if (!IronLocation.isSameOrigin(href)) 
    return;
  
  // note that we _do_ handle links which point to the current URL
  // and links which only change the hash.
  e.preventDefault();
  IronLocation.set(path);
}

function onpopstate (e) {
  setState(e.state, null, location.pathname + location.search + location.hash);
  
  if (popped)
    dep.changed();
}

IronLocation = {};

IronLocation.options = {
  "linkSelector": 'a[href]'
};

IronLocation.configure = function(options){
  if (this.isStarted){
    IronLocation.unbindEvents();
  }
  _.extend(this.options, options);
  
  if(this.isStarted){
    IronLocation.bindEvents();
  }
};

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
    IronLocation.replaceState(state, options.title, url);
  else
    IronLocation.pushState(state, options.title, url);

  if (options.skipReactive !== true)
    dep.changed();
};

// store the state for later access
setState = function(newState, title, url) {
  currentState = newState || {};
  currentState.path = url;
  currentState.title = title;
}

IronLocation.pushState = function (state, title, url) {
  popped = true;
  setState(state, title, url);
  
  if (history.pushState)
    history.pushState(state, title, url);
  else
    window.location = url;
};

IronLocation.replaceState = function (state, title, url) {
  popped = true;
  setState(state, title, url);
  
  if (history.replaceState)
    history.replaceState(state, title, url);
  else
    window.location = url;
};

IronLocation.bindEvents = function(){
  $(window).on('popstate', onpopstate);
  $(document).on('click', this.options.linkSelector, onclick);
};

IronLocation.unbindEvents = function(){
  $(window).off('popstate', onpopstate);
  $(window).off('click', this.options.linkSelector, onclick);
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

IronLocation.start();
