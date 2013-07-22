function getParams (routeName, context, options) {
  var params;

  switch(arguments.length) {
    case 3:
      params = context;
      break;
    case 2:
      options = context;
      params = _.keys(options.hash).length ? options.hash : this;
      break;
    case 1:
      params = this;
      break;
    default:
      throw new Error('No routeName provided');
  }

  if (params === window) params = [];

  return params;
}

if (Handlebars) {
  Handlebars.registerHelper('pathFor', function (routeName, context, options) {
    var params = getParams.apply(this, arguments);
    return Router.path(routeName, params);
  });

  Handlebars.registerHelper('urlFor', function (routeName, context, options) {
    var params = getParams.apply(this, arguments);
    return Router.url(routeName, params);
  });

  Handlebars.registerHelper('currentRoute', function (options) {
    return Router.current();
  });
}
