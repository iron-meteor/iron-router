Tinytest.add('ClientRouter - start and dispatch', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var _path = IronLocation.path;
  var locationDep = new Deps.Dependency;
  var currentPath;

  // stub out the path method to simulate path changes
  IronLocation.path = function (value) {
    if (value) {
      currentPath = value;
      locationDep.changed();
    } else {
      locationDep.depend();
      return currentPath;
    }
  };

  var _dispatch = router.dispatch;
  var isDispatched = false;
  router.dispatch = function (path, options, done) {
    isDispatched = true;
  };

  router.start();
  test.isTrue(isDispatched, 'no initial dispatch');

  isDispatched = false;
  IronLocation.path('/posts');
  Deps.flush();
  test.isTrue(isDispatched, 'location dep not working');
});

Tinytest.add('ClientRouter - run with computations', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var firstController = {
    runActionWithHooks: function () {}
  };

  var secondController = {
    runActionWithHooks: function () {}
  };

  var redirectDep = new Deps.Dependency;
  var runCount = 0;
  var redirectController = {
    runActionWithHooks: function () {
      redirectDep.depend();
      runCount++;
      // normally this would be this.redirect
      // or Router.go, but since we're testing
      // the run method we'll just call it directly
      router.run(firstController);
    }
  };

  var currentController;
  var routeComputation;

  Deps.autorun(function () {
    currentController = router.current();
  });

  test.isFalse(currentController);

  router.run(firstController);
  routeComputation = router._routeComputation;
  Deps.flush();
  test.equal(currentController, firstController, 'router.current() broken');
  test.isFalse(routeComputation.stopped, 'route comp was stopped');

  router.run(secondController);
  Deps.flush();
  test.isTrue(routeComputation.stopped, 'previous comp not stopped');
  test.equal(currentController, secondController, 'current() broken');
  routeComputation = router._routeComputation;
  test.isFalse(routeComputation.stopped, 'new comp was stopped');

  router.run(redirectController);
  Deps.flush();
  test.equal(currentController, firstController, 'redirect failed');
  routeComputation = router._routeComputation;
  test.isFalse(routeComputation.stopped, 'redirect comp stopped');

  // test the previous computation was torn down
  test.equal(runCount, 1, 'base case for redirect controller');
  redirectDep.changed();
  Deps.flush();
  test.equal(runCount, 1, 'prev controller was run again');
});

// XXX these tests should mostly be in a separate PageManager test, but to get
// us started I'll just put the big tests here. We can break it out later.
Tinytest.add('ClientRouter - rendering', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var div = new OnscreenDiv(router.render());

  router.setLayout('layout');
  Deps.flush();
  test.equal(div.text().trim(), 'layout');

  // render the main template
  router.setTemplate('one');
  Deps.flush();
  test.equal(div.node().children[1].innerText.trim(), 'one');

  // render yield templates
  router.setTemplate('aside', 'aside');
  router.setTemplate('footer', 'footer');
  Deps.flush();
  test.equal(div.node().children[0].innerText.trim(), 'aside');
  test.equal(div.node().children[2].innerText.trim(), 'footer');

  // change the main template
  router.setTemplate('two');
  Deps.flush();
  test.equal(div.node().children[1].innerText.trim(), 'two');

  div.kill();
});

Tinytest.add('ClientRouter - rendering with data', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var div = new OnscreenDiv(router.render());

  var _layout = Template.layout;
  var layoutRenderCount = 0;
  Template.layout = function () {
    layoutRenderCount++;
    return _layout.apply(this, arguments);
  };

  router.setLayout('layout');
  Deps.flush();
  test.equal(div.text().trim(), 'layout');
  test.equal(layoutRenderCount, 1);

  router.setData({
    text: 'one'
  });

  router.setTemplate('data');
  router.setTemplate('data', 'aside');
  router.setTemplate('data', 'footer');
  Deps.flush();

  test.equal(div.node().children[0].innerText.trim(), 'one');
  test.equal(div.node().children[1].innerText.trim(), 'one');
  test.equal(div.node().children[2].innerText.trim(), 'one');

  router.setData({
    text: 'two'
  });

  //XXX This should be fixed so the layout isn't rendered every time you set the
  //global data context. The idea of the global data context is:
  //
  //1) many times all templates want to share a data context so you don't want
  //to call a data function for every render
  //
  //2) if there is no data context you should be able to not set it, thereby not
  //forcing a redraw of existing rendered templates
  //
  //3) what's needed is ability to opt out of data on a per template basis,
  //either in the template or layout. So the render and setLayout methods should
  //have an option for useData: false and by default the layout could have this
  //property set. It could be overridden in the route.
  Deps.flush();
  test.equal(div.node().children[0].innerText.trim(), 'two');
  test.equal(div.node().children[1].innerText.trim(), 'two');
  test.equal(div.node().children[2].innerText.trim(), 'two');
});

Tinytest.add('ClientRouter - go', function (test) {
  test.ok();
});
