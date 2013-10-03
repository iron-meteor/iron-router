var dep = new Deps.Dependency;
var popped = ('state' in window.history && window.history.state !== null);
var initialUrl = location.href;

function onclick (e) {
  var el = e.currentTarget
    , href
    , path
    , hash;

  if (el.nodeName === 'A') {
    href = el.href;
    path = el.pathname + el.search + el.hash;

    if (e.isDefaultPrevented())
      return;

    if (!IronLocation.isSameOrigin(href) || e.ctrlKey || el.target == '_blank')
      return;

    e.preventDefault();

    IronLocation.set(path);
  }
}

function onpopstate (e) {
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
  return href.indexOf(origin) === 0;
};

IronLocation.get = function () {
  dep.depend();
  return location;
};

IronLocation.path = function () {
  dep.depend();
  return location.pathname + location.search + location.hash;
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

  $(window).bind('popstate', onpopstate);
  $(document).delegate('a', 'click', onclick);
  this.isStarted = true;
};

IronLocation.stop = function () {
  $(window).unbind('popstate', onpopstate);
  $(window).undelegate('a', 'click', onclick);
  this.isStarted = false;
};

IronLocation.start();
