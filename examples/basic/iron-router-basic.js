Router.configure({
  layoutTemplate: 'ApplicationLayout',
  templateNameConverter: 'upperCamelCase'
});

Router.map(function() {
  this.route('page.one', {
    path: '/'
  });

  this.route('page.two', {
    // if the template is different from the name we can specify it directly
    // like this
    template: 'PageTwo',

    // if the path can't be inferred from the name we can provide it here
    path: '/two'
  });

  this.route('three', {
    // server route
    where: 'server',

    action: function() {
      this.response.end('SERVER ROUTE');
    }
  });
});

if (Meteor.isClient) {
}
