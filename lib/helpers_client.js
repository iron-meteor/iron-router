/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var warn = Iron.utils.warn;
var DynamicTemplate = Iron.DynamicTemplate;

/*****************************************************************************/
/* UI Helpers */
/*****************************************************************************/

/**
 * Render the Router to a specific location on the page instead of the
 * document.body. 
 */
UI.registerHelper('Router', Template.__create__('Router', function () {
  return Router.createView();
}));

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('pathFor', function (options) {
  var opts = options && options.hash;
  warn(opts, 'No options were passed to pathFor');

  opts = opts || {};

  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = opts.route;
  var data = opts.data || this;

  var route = Router.routes[routeName];
  warn(route, "pathFor couldn't find a route named " + JSON.stringify(routeName));

  if (route)
    path = route.path(data, {query: query, hash: hash});

  return path;
});

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('urlFor', function (options) {
  var opts = options && options.hash;
  warn(opts, 'No options were passed to urlFor');

  opts = opts || {};
  var url = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = opts.route;
  var data = opts.data || this;

  var route = Router.routes[routeName];
  warn(route, "urlFor couldn't find a route named " + JSON.stringify(routeName));

  if (route)
    url = route.url(data, {query: query, hash: hash});

  return url;
});

/**
 * Create a link with optional content block.
 *
 * Example:
 *   {{#linkTo route="one" query="query" hash="hash" class="my-cls"}}
 *    <div>My Custom Link Content</div>
 *   {{/linkTo}}
 */
UI.registerHelper('linkTo', Template.__create__('linkTo', function () {
  var opts = DynamicTemplate.getInclusionArguments(this);
  warn(opts, 'No options were passed to linkTo');

  opts = opts || {};
  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = opts.route;
  var data = opts.data || DynamicTemplate.getParentDataContext(this);
  var route = Router.routes[routeName];

  warn(route, "linkTo couldn't find a route named " + JSON.stringify(routeName));

  if (route)
    path = route.path(data, {query: query, hash: hash});

  // anything that isn't one of our keywords we'll assume is an attributed
  // intended for the <a> tag
  var attrs = _.omit(opts, 'route', 'query', 'hash', 'data');
  attrs.href = path;

  return HTML.A(attrs, this.templateContentBlock);
}));
