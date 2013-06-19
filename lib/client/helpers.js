function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
}

function linkTo (url, text) {
  return '<a href="' + url + '">' + text + '</a>';
}

if (Handlebars) {
  Handlebars.registerHelper('yield', function (name, options) {
    var partials = IronRouter._CurrentPartials.get();
    assert(partials, 'Yield only works when used in a router layout');
    if (arguments.length < 2) name = '__main__';
    return partials[name];
  });

  Handlebars.registerHelper('contentFor', function (name, options) {
    var self = this
      , partials = IronRouter._CurrentPartials.get();

    assert(partials, 'contentFor only works when used in a router template');
    assert(arguments.length >= 2, 'contentFor requires a name');

    if (options.hash && options.hash.value)
      partials[name] = options.hash.value;
    else if (options.fn)
      partials[name] = Spark.isolate(function () {
        return options.fn(self);
      });
    return '';
  });

  Handlebars.registerHelper('linkTo', function (routeName, options) {
    var params = _.keys(options.hash).length ? options.hash : this;

    console.log(options.hash);

    var path = Router.path(routeName, params)
      , text = options.fn(this);
    
    return new Handlebars.SafeString(linkTo(path, text));
  });

  Handlebars.registerHelper('linkToUrl', function (routeName, options) {
    var params = _.keys(options.hash).length ? options.hash : this
      , url = Router.url(routeName, params)
      , text = options.fn(this);
    return new Handlebars.SafeString(linkTo(url, text));
  });

  Handlebars.registerHelper('pathFor', function (routeName, options) {
    var params = _.keys(options.hash).length ? options.hash : this;
    return Router.path(routeName, params);
  });

  Handlebars.registerHelper('urlFor', function (routeName, options) {
    var params = _.keys(options.hash).length ? options.hash : this;
    return Router.url(routeName, params);
  });
}
