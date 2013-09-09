if (Handlebars) {
  Handlebars.registerHelper('pathFor', function (routeName, options) {
    var params = this;
    var hash = options.hash.hash;
    var query = _.omit(options.hash, 'hash');

    return Router.path(routeName, params, {
      query: query,
      hash: hash
    });
  });

  Handlebars.registerHelper('urlFor', function (routeName, options) {
    var params = this;
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
}
