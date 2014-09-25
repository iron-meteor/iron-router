Router.route('/', {
  name: 'home'
});

Router.route('/posts', {
  controller: 'PostController',
  action: 'index'
});

Router.route('/posts/:_id', {
  controller: 'PostController',
  action: 'show'
});

if (Meteor.isClient) {
  ApplicationController = RouteController.extend({
    layoutTemplate: 'AppLayout',

    onBeforeAction: function () {
      console.log('app before hook!');
      this.next();
    },

    action: function () {
      console.log('this should be overridden!');
    }
  });

  HomeController = ApplicationController.extend({
    action: function () {
      this.render('Home');
    }
  });

  PostController = ApplicationController.extend({
    show: function () {
      this.render('PostShow');
    },

    index: function () {
      this.render('PostIndex');
    }
  });
}
