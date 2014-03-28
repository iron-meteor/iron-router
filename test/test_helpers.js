Router.configure({
  autoRender: false,
  autoStart: false
});

// setup some publications to test behaviour
if (Meteor.isServer) {
  Meteor.publish({
    neverReady: function() {}
  });
}