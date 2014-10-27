/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var warn = Iron.utils.warn;
var DynamicTemplate = Iron.DynamicTemplate;
var debug = Iron.utils.debug('iron:router <helpers>');

/*****************************************************************************/
/* UI Helpers */
/*****************************************************************************/

/**
 * Render the Router to a specific location on the page instead of the
 * document.body. 
 */
UI.registerHelper('Router', new Blaze.Template('Router', function () {
  return Router.createView();
}));

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('pathFor', function (options) {
  var routeName;

  if (arguments.length > 1) {
    routeName = arguments[0];
    options = arguments[1] || {};
  } 

  var opts = options && options.hash;

  opts = opts || {};

  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = routeName || opts.route;
  var data = _.extend({}, opts.data || this);

  var route = Router.routes[routeName];
  warn(route, "pathFor couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    path = route.path(data, {query: query, hash: hash});
  }

  return path;
});

/**
 * Returns a relative path given a route name, data context and optional query
 * and hash parameters.
 */
UI.registerHelper('urlFor', function (options) {
  var routeName;

  if (arguments.length > 1) {
    routeName = arguments[0];
    options = arguments[1] || {};
  } 

  var opts = options && options.hash;

  opts = opts || {};
  var url = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = routeName || opts.route;
  var data = _.extend({}, opts.data || this);

  var route = Router.routes[routeName];
  warn(route, "urlFor couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    url = route.url(data, {query: query, hash: hash});
  }

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
UI.registerHelper('linkTo', new Blaze.Template('linkTo', function () {
  var self = this;
  var opts = DynamicTemplate.getInclusionArguments(this);

  if (typeof opts !== 'object')
    throw new Error("linkTo options must be key value pairs such as {{#linkTo route='my.route.name'}}. You passed: " + JSON.stringify(opts));

  opts = opts || {};
  var path = '';
  var query = opts.query;
  var hash = opts.hash;
  var routeName = opts.route;
  var data = _.extend({}, opts.data || DynamicTemplate.getParentDataContext(this));
  var route = Router.routes[routeName];
  var paramKeys;

  warn(route, "linkTo couldn't find a route named " + JSON.stringify(routeName));

  if (route) {
    _.each(route.handler.compiledUrl.keys, function (keyConfig) {
      var key = keyConfig.name;
      if (_.has(opts, key)) {
        data[key] = EJSON.clone(opts[key]);

        // so the option doesn't end up on the element as an attribute
        delete opts[key];
      }
    });

    path = route.path(data, {query: query, hash: hash});
  }

  // anything that isn't one of our keywords we'll assume is an attributed
  // intended for the <a> tag
  var attrs = _.omit(opts, 'route', 'query', 'hash', 'data');
  attrs.href = path;

  return Blaze.With(function () {
    return DynamicTemplate.getParentDataContext(self);
  }, function () {
    return HTML.A(attrs, self.templateContentBlock);
  });
}));
