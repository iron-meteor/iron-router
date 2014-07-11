if (Meteor.isClient) {

  readyHandle = new Blaze.ReactiveVar;

  readyHandle.ready = function () {
    return this.get();
  };

  Router.route('home', {
    path: '/',

    waitOn: function () {
      return readyHandle;
    },

    data: function () {
      return Session.get('data');
    },

    action: function () {
      if (this.ready())
        this.render('home');
      else
        this.render('loading');
    }
  });
}
