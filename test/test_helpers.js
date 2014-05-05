Router.configure({
  autoRender: false,
  autoStart: false,
  supressWarnings: true 
});

// setup some publications to test behaviour
if (Meteor.isServer) {
  Meteor.publish({
    neverReady: function() {}
  });
}
