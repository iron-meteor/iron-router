function assert (condition, msg) {
  if (!condition) throw new Error(msg);
}

function linkTo (url, html) {
  return '<a href="' + url + '">' + html + '</a>';
}

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
  Handlebars.registerHelper('linkTo', function (routeName, context, options) {
    var params = getParams.apply(this, arguments)
      , html
      , path;

    options = arguments[arguments.length-1];
    html = options.fn(this);

    console.log(params);

    path = Router.path(routeName, params);

    return new Handlebars.SafeString(
      linkTo(path, html)
    );
  });

  Handlebars.registerHelper('linkToUrl', function (routeName, context, options) {
    var params = getParams.apply(this, arguments)
      , html;
    options = arguments[arguments.length-1];
    html = options.fn(this);
    return new Handlebars.SafeString(
      linkTo(Router.path(routeName, params), html)
    );
  });

  Handlebars.registerHelper('pathFor', function (routeName, context, options) {
    var params = getParams.apply(this, arguments);
    return Router.path(routeName, params);
  });

  Handlebars.registerHelper('urlFor', function (routeName, context, options) {
    var params = getParams.apply(this, arguments);
    return Router.url(routeName, params);
  });
}
