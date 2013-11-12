Tinytest.add('ClientRouter - run computations', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var c1 = new RouteController;
  var c2 = new RouteController;
  var routerRuns = [];

  Deps.autorun(function (c) {
    routerRuns.push(router.current());
  });

  test.equal(routerRuns[0], null, 'router.current() starts off as null');

  var c1Runs = [];
  c1.run = function () {
    c1Runs.push(Deps.currentComputation);
  };

  router.run(c1);
  Deps.flush();
  test.equal(routerRuns[1], c1, 'router comp not invalidated');
  test.equal(c1Runs.length, 1, 'c1 controller not run');

  // simulate a dependency invalidating the run's computation like if you relied
  // on a reactive data source in a before hook or action function.
  c1Runs[0].invalidate();
  Deps.flush();

  test.equal(routerRuns.length, 2, 'run comp should not invalidate route comp');
  test.equal(c1Runs.length, 2, 'run comp was not rerun');

  var c2Runs = [];
  c2.run = function () {
    c2Runs.push(Deps.currentComputation);
  };

  var oldComp = c1Runs[1];
  router.run(c2);
  Deps.flush();

  var newComp = c2Runs[0];
  test.equal(routerRuns.length, 3, 'router comp not invalidated');
  test.equal(c2Runs.length, 1, 'c3 controller not run');
  test.isTrue(oldComp.stopped, 'old run comp not stopped');
  test.isFalse(newComp.stopped, 'new run comp is stopped');
});

Tinytest.add('ClientRouter - rendering', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false,
    layoutTemplate: 'layout'
  });

  var frag = Spark.render(function () {
    return router.render();
  });

  var div = new OnscreenDiv(frag);

  try {
    router.setLayout('layout');
    Deps.flush();
    test.equal(div.text().trim(), 'layout', 'layout not rendered');

    router.setLayout(null);
    Deps.flush();
    test.equal(div.text().trim(), '', 'layout did not change');

    router.setLayout('layout');
    Deps.flush();
    test.equal(div.text().trim(), 'layout', 'layout did not change back');

    var counts = {};

    var _one = Template.one;
    Template.one = function () {
      counts.one = counts.one || 0;
      counts.one++;
      return _one.apply(this, arguments);
    };

    var _two = Template.two;
    Template.two = function () {
      counts.two = counts.two || 0;
      counts.two++;
      return _two.apply(this, arguments);
    };

    var _aside = Template.aside;
    Template.aside = function () {
      counts.aside = counts.aside || 0;
      counts.aside++;
      return _aside.apply(this, arguments);
    };

    var _footer = Template.footer;
    Template.footer = function () {
      counts.footer = counts.footer || 0;
      counts.footer++;
      return _footer.apply(this, arguments);
    };

    router.setTemplate('aside', /* to */ 'aside');
    router.setTemplate('one', /* to main */ undefined);
    router.setTemplate('footer', /* to */ 'footer');
    Deps.flush();

    test.equal(counts.aside, 1);
    test.equal(counts.one, 1);
    test.equal(counts.footer, 1);

    router.setTemplate('aside', /* to */ 'aside');
    router.setTemplate('two', /* to main */ undefined);
    router.setTemplate('footer', /* to */ 'footer');
    Deps.flush();

    test.equal(counts.aside, 1, 'tmpl should have alrady been rendered');
    test.equal(counts.two, 1);
    test.equal(counts.footer, 1, 'tmpl should have already been rendered');

  } finally {
    div.kill();
  }
});

Tinytest.add('ClientRouter - before hooks', function (test) {
  var router = new ClientRouter({
    autoStart: false,
    autoRender: false
  });

  var where = 'client';

  var firstHookCalled = 0;
  router.before(function() { firstHookCalled += 1; }, {only: 'one'})

  var secondHookCalled = 0;
  router.before(function() { secondHookCalled += 1; }, {except: 'two'})

  var thirdHookCalled = 0;
  router.configure({before: function() { thirdHookCalled += 1; }})

  var fourthHookCalled = 0;
  router.before(function(){ fourthHookCalled += 1 })

  router.map(function() {
    this.route('one', {where: where});
    this.route('two', {where: where});
    this.route('three', {where: where});
  });

  router.setLayout = _.identity;
  router.setTemplate = _.identity;

  router.dispatch('one');
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 1);
  test.equal(fourthHookCalled, 1);

  router.dispatch('two');
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 1);
  test.equal(thirdHookCalled, 2);
  test.equal(fourthHookCalled, 2);

  router.dispatch('three');
  test.equal(firstHookCalled, 1);
  test.equal(secondHookCalled, 2);
  test.equal(thirdHookCalled, 3);  
  test.equal(fourthHookCalled, 3);
});


Tinytest.add('ClientRouter - load hooks', function (test) {
  var router = new ClientRouter({
    autoStart: false,
    autoRender: false
  });
  
  var oneLoadHookCalled = 0;
  var oneBeforeHookCalled = 0;
  var twoLoadHookCalled = 0;
  var twoBeforeHookCalled = 0;
  
  router.map(function() {
    this.route('one', {
      load: function() { oneLoadHookCalled += 1; },
      before: function() { oneBeforeHookCalled += 1; }
    });
    this.route('two', {
      load: function() { 
        twoLoadHookCalled += 1;
        this.redirect('one');
      },
      before: function() { twoBeforeHookCalled += 1; },
    });
  });
  
  router.setLayout = _.identity;
  router.setTemplate = _.identity;
  
  router.dispatch('one');
  test.equal(oneLoadHookCalled, 1);
  test.equal(oneBeforeHookCalled, 1);
  
  router.dispatch('two');
  test.equal(oneLoadHookCalled, 2);
  test.equal(oneBeforeHookCalled, 2);
  test.equal(twoLoadHookCalled, 1);
  // show have redirected before this happens
  test.equal(twoBeforeHookCalled, 0);
  
});