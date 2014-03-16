Router.configure({
  debug: true
});

Router.map(function() {
  this.route('one', {path: '/', before: function() {
    console.log('one')
  }});
  this.route('two');
  this.route('three', {
    where: 'server',
    action: function() {
      this.response.end('SERVER ROUTE');
    }
  });
})

if (Meteor.isClient) {
}
