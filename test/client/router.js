// uiManager api tests
// hot code reload
// run (deps changed and current changed)

var mockedRouter = function() {
  var router = new IronRouter({
    autoStart: false,
    autoRender: false
  });
  
  router.configure({ location: new LocationMock, uiManager: new UIMock });
  return router;
}


Tinytest.add('ClientRouter - onRun hooks', function (test) {
  var router = mockedRouter();
  
  router.map(function() {
    this.route('one', {
      onRun: function() { oneRunHookCalled += 1; },
      onBeforeAction: function() { oneBeforeHookCalled += 1; }
    });
    this.route('two', {
      onRun: function() { 
        twoRunHookCalled += 1;
        router.go('one');
      },
      onBeforeAction: function() { twoBeforeHookCalled += 1; },
    });
    this.route('three');
  });
  
  router.onRun(function() {
    onRunHookCalledAt = router._location.path();
  });
  
  router.start();
  
  var oneRunHookCalled = 0;
  var oneBeforeHookCalled = 0;
  var twoRunHookCalled = 0;
  var twoBeforeHookCalled = 0;
  var onRunHookCalledAt;
  
  router.go('one');
  test.equal(oneRunHookCalled, 1);
  test.equal(oneBeforeHookCalled, 1);
  test.equal(onRunHookCalledAt, '/one');
  
  router.go('two');
  test.equal(oneRunHookCalled, 2);
  test.equal(oneBeforeHookCalled, 2);
  test.equal(twoRunHookCalled, 1);
  // show have redirected before this happens
  test.equal(twoBeforeHookCalled, 0);
  
  // we are redirected to one, so this comes up
  test.equal(onRunHookCalledAt, '/one');

  router.go('three');
  test.equal(onRunHookCalledAt, '/three');

  router.go('one');
  test.equal(onRunHookCalledAt, '/one');
});

Tinytest.add('ClientRouter - onStop hooks', function (test) {
  var router = mockedRouter();
  
  var stopCalledAt = null;
  router.map(function() {
    this.route('one', {
      onStop: function() {
        stopCalledAt = router._location.path();
      }
    });
    this.route('two');
  });
  
  router.start();
  test.isNull(stopCalledAt);
  
  router.go('two');
  test.equal(stopCalledAt, '/one');
});

Tinytest.add('ClientRouter - calling same route twice does not write to history', function (test) {
  var router = mockedRouter();
  
  router.map(function() {
    this.route('one');
    this.route('two');
  });
  
  var location = new LocationMock;
  var setCalled = 0, oldSet = location.set
  location.set = function() {
    setCalled += 1;
    oldSet.apply(this, arguments);
  }
  
  router.configure({ location: location });
  
  // starting the router doesn't set the url
  router.start();
  test.equal(setCalled, 0);
  
  router.go(router.path('one'));
  test.equal(setCalled, 0);
  router.go(router.path('two'));
  test.equal(setCalled, 1);
  router.go(router.path('one'));
  test.equal(setCalled, 2);
  router.go(router.path('one'));
  test.equal(setCalled, 2);
});

// SEE IR#276 for detailed discussion
Tinytest.add('ClientRouter - router is not sensitive to invalidation timing', function (test) {
  var ready = new ReactiveVar('ready');
  var data = new ReactiveVar('data');
  
  // this one actually does render
  var router = new IronRouter({
    autoStart: false,
    autoRender: false
  });
  router.configure({
    uiManager: new BlazeUIManager
  });
  router.map(function() {
    this.route('one', {
      path: '/',
      data: function() {
        // depend on ready
        if (ready.get())
          return true;
        else
          return false;
      },
        
      action: function() {
        // depend first on data, then ready
        if (data.get())
          if (ready.get())
            this.render();
      }
    });
  });
  
  Template.one.created = function() {
    test.equal(this, true);
  }
  
  router.start();
  // don't actually do anything with it, but at least use it
  Router.render()
  router.go('one');

  // now, simulate data and ready events coming in the same tick
  data.set(true);
  ready.set(true);
  Deps.flush(); // this will trigger the one template to be created
});