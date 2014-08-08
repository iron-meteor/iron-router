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

Tinytest.add('ClientRouter - go to server routes', function (test) {
  var router = mockedRouter(), handledServerRoutes = 0;
  
  router.map(function() {
    this.route('one')
    this.route('two', {
      where: 'server',
      path: 'two'
    });
  });
  
  router.onUnhandled = function() {
    handledServerRoutes += 1;
  }
  
  router.start();
  
  test.equal(handledServerRoutes, 0);

  router.go('two');
  test.equal(handledServerRoutes, 1);

  router.go('/two');
  test.equal(handledServerRoutes, 2);
});

// See https://github.com/EventedMind/iron-router/issues/753
Tinytest.add('ClientRouter - redirection maintains reactivity', function(test) {
  var router = mockedRouter();
  
  var onBeforeActionRan = 0, dep = new Deps.Dependency;
  router.map(function() {
    this.route('one', { onBeforeAction: function() { 
      // XXX: @cmather -- can't do this because client_router calls out to 
      //   `Router` -- surely a controller should be using `this.router`?
      // this.redirect('two');
      
      router.go('two');
    }});
    this.route('two', { onBeforeAction: function() {
      onBeforeActionRan += 1;
      dep.depend();
    }});
  });
  
  router.start();
  router.go('one');
  Deps.flush();
  test.equal(onBeforeActionRan, 1, "onBeforeAction not run for redirected route");
  
  dep.changed();
  Deps.flush();
  test.equal(onBeforeActionRan, 2, "onBeforeAction not run again for redirected route");
});