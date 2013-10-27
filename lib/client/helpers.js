if (Handlebars) {
  Handlebars.registerHelper('pathFor', function (routeName, params, options) {

    if (arguments.length == 2) {
      options = params;
      params = this;
    }

    var hash = options.hash.hash;
    var query = _.omit(options.hash, 'hash');

    return Router.path(routeName, params, {
      query: query,
      hash: hash
    });
  });

  Handlebars.registerHelper('urlFor', function (routeName, params, options) {
    if (arguments.length == 2) {
      options = params;
      params = this;
    }

    var hash = options.hash.hash;
    var query = _.omit(options.hash, 'hash');

    return Router.url(routeName, params, {
      query: query,
      hash: hash
    });
  });

  Handlebars.registerHelper('renderRouter', function (options) {
    return new Handlebars.SafeString(Router.render());
  });

  Handlebars.registerHelper('currentRouteController', function () {
    return Router.current();
  });

  Handlebars.registerHelper('link', function (options) {
    var hash = options.hash || {};
    var route = hash.route;
    var params = hash.params || this;
    var query = hash.query;
    var urlHash = hash.hash;
    var cls = hash['class'] || '';

    var path = Router.path(route, params, {
      query: query,
      hash: urlHash
    });

    var html = '<a href="' + path + '" class="' + cls + '">';
    html += options.fn(this);
    html += '</a>'

    return new Handlebars.SafeString(html);
  });
}
