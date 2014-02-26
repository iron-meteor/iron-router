//XXX client side behavior might be the same now?
//XXX create separate test for SparkUIManager

Tinytest.add('IronRouter - before hooks', function (test) {
  var router = new IronRouter({
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


Tinytest.add('IronRouter - load hooks', function (test) {
  var router = new IronRouter({
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
