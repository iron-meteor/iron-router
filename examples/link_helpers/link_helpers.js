Router.route('/', function () {
  this.render('Home');
}, {
  // provide a custom name
  name: 'home'
});

// name defaults to 'one' based on the path
Router.route('/one');

// name defaults to 'two' based on the path
Router.route('/two');
