var dep = new Deps.Dependency;
var popped = ('state' in window.history && window.history.state !== null);
var initialUrl = location.href;

function addListener (el, name, handler) {
  if (el.addEventListener)
    el.addEventListener(name, handler, false);
  else if (el.attachEvent)
    el.attachEvent('on' + name, handler);
  else
    el['on' + name] = handler;
}

function removeListener (el, name, handler) {
  if (el.addEventListener)
    el.removeEventListener(name, handler, false);
  else if (el.detachEvent)
    el.detachEvent('on' + name, handler);
  else
    el['on' + name] = null;
}

function onClick (e) {
  var el = e.target
    , href
    , path
    , hash;

  if (el.nodeName === 'A') {
    href = el.href;
    path = el.pathname + el.search + el.hash;

    if (e.defaultPrevented)
      return;

    if (!IronLocation.isSameOrigin(href))
      return;

    e.preventDefault();

    IronLocation.set(path);
  }
}

function onPopState (e) {
  var initialPop = !popped && location.href == initialUrl;
  popped = true;

  if (!initialPop)
    dep.changed();
}

IronLocation = {};

IronLocation.origin = function () {
  return location.protocol + '//' + location.host;
};

IronLocation.isSameOrigin = function (href) {
  var origin = IronLocation.origin();
  return href.indexOf(href) === 0;
};

IronLocation.get = function () {
  dep.depend();
  return location;
};

IronLocation.set = function (url, options) {
  options = options || {};

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
    IronLocation.replaceState(options.state, options.title, url);
  else
    IronLocation.pushState(options.state, options.title, url);

  if (options.skipReactive !== true)
    dep.changed();
};

IronLocation.pushState = function (state, title, url) {
  if (history.pushState)
    history.pushState(state, title, url);
  else
    window.location = url;
};

IronLocation.replaceState = function (state, title, url) {
  if (history.replaceState)
    history.replaceState(state, title, url);
  else
    window.location = url;
};

IronLocation.start = function () {
  if (this.isStarted)
    return;
  addListener(window, 'popstate', onPopState);
  addListener(document, 'click', onClick);
  this.isStarted = true;
};

IronLocation.stop = function () {
  removeListener(window, 'popstate', onPopState);
  removeListener(document, 'click', onClick);
  this.isStarted = false;
};



IronLocation.start();
