Router.map(function() {
  this.route('one', {path: '/'});
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
