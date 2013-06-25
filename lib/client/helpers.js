function assert (condition, msg) {
  if (!condition) throw new Error(msg);
}

function linkTo (url, html) {
}

if (Handlebars) {
  Handlebars.registerHelper('linkTo', function (routeName, options) {
  });

  Handlebars.registerHelper('linkToUrl', function (routeName, options) {
  });

  Handlebars.registerHelper('pathFor', function (routeName, options) {
  });

  Handlebars.registerHelper('urlFor', function (routeName, options) {
  });
}
