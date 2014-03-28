Router.configure({
  debug: true,
  before: function() {
    console.log('before all')
  }
});

Router.map(function() {
  this.route('one', {
    path: '/', 
    load: function() {
      console.log('load one')
    },
    before: function() {
      console.log('before one')
    }
  });
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
