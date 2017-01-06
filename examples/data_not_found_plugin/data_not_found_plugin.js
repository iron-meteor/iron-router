Router.configure({
  notFoundTemplate: "DataNotFound"
});

Router.route('/', function () {
  this.render('Home');
}, {
  data: function () {
    // if data is falsy the dataNotFoundPlugin above will render a not found
    // template. Change data to a non-falsy value to see the actual home
    // template.
    return null;
  }
});
