Router.helpers = {};

_.extend(Router.helpers, {
  pathFor: function (routeName, params, options) {
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
  },

  urlFor: function (routeName, params, options) {
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
  }
});

//XXX clean this up

var Handlebars = Package.ui.Handlebars;
_.each(Router.helpers, function (helper, name) {
  Handlebars.registerHelper(name, helper);
});
