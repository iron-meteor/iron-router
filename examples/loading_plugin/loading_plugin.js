Router.configure({
  // Optionally configure a template to use.
  // The default loading text to use is "Loading..."
  loadingTemplate: 'Loading'
});

Router.plugin('loading');

Router.route('/', function () {
  this.render('Home');
}, {
  waitOn: function () {
    // the loading plugin will render the loading template
    // until this subscription is ready
    return Meteor.subscribe('items');
  }
});

if (Meteor.isServer) {
  Meteor.publish('items', function () {
    var self = this;
    // send the "ready" message in 2 seconds.
    setTimeout(function () {
      self.ready();
    }, 2000);
  });
}
