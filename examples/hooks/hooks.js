var ScrollPositions = new Meteor.Collection(null);

Router.map(function() {
  this.route('userPage', {
    path: '/',
    
    // 9. Redirecting
    before: function() {
      if (Meteor.user() && Meteor.user().admin)
        this.redirect('adminPage');
    }
  });
  
  // if someone wants to explicitly go there
  this.route('login', {
    path: '/login',
    // 7. Session vars
    load: function() {
      Session.set('somethingExpanded', false);
    }
  });
  
  this.route('adminPage', {
    path: '/admin',
    
    // 10. 3rd party API calls that are similar to waitOns:
    waitOn: function() {
      return {
        // this is made up but I do have code conceptually similar to this
        ready: promiseToReady(GoogleApi.call('/foo/bar'));
      }
    }
  });
  
  this.route('post', {
    path: '/posts/:_id',
    // 2. subscribing
    waitOn: function() { return Meteor.subscribe('post', this.params._id); },
    data: function() { return Posts.findOne(this.params._id); },
    
    before: function() {
      // 2.b. complex subscription (join)
      if (this.data())
        this.subscribe('author', this.data().authorId).wait();
    }
  });
});

// 1. waiting filter
Router.before(function() {
  if (! this.ready())
    this.render('loading')
});

// 3. Tracking page views
Router.load(function() {
  mixpanel.track(this.path());
});

// 4. 404 filter
Router.before(function() {
  if (this.ready() && ! this.data())
    this.render('404');
}, {only: 'post'});

// 5. login filter
Router.before(function() {
  if (! Meteor.loggingIn() && ! Meteor.user()) {
    this.render('login');
  }
}, {except: 'login'});


// 6. admin filter
Router.before(function() {
  if (! Metoer.user() || ! Metoer.user().admin)
    this.render('accessDenied');
}, {only: 'adminPage'});


// 8. scroll to top of screen
Router.before(function() {
  $(window).scrollTop(0);
});

// 11. recording views
Router.load(function() {
  Views.insert(this.path());
});

// 12. recording scroll position
Router.unload(function() {
  ScrollPositions.insert({ path: this.path(), position: $(window).scrollTop() });
});