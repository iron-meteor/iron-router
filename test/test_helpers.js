Router.configure({
  autoRender: false,
  autoStart: false
});

if (Meteor.isServer) {
  Meteor.publish('/posts', function () {
    this.ready();
  });

  Meteor.publish('/posts/show', function (id) {
    this.ready();
  });
}
