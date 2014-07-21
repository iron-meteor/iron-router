Router.configure({
  // optionally specify a not found template for the dataNotFound hook.
  notFoundTemplate: 'DataNotFound'
});

Router.plugin('dataNotFound');

Router.route('/', function () {
  // if data is falsy the dataNotFoundPlugin above will render a not found
  // template. Change data to a non-falsy value to see the actual home
  // template.
  this.render('Home', {data: null});
});
