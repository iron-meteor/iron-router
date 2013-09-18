Subscription = function () {
  this._ready = false;
  this._deps = new Deps.Dependency;
};

Subscription.prototype.ready = function () {
  this._deps.depend();
  return this._ready;
};

Subscription.prototype.mark = function () {
  this._ready = true;
  this._deps.changed();
};

MockRouter = function() {
  this.rendered = {};
  this.layout = null;
  this.data = null;
}

MockRouter.prototype.setTemplate = function(name, to) {
  to = to || '__main__';
  this.rendered[to] = name;
}

MockRouter.prototype.setLayout = function(name) {
  this.layout = name;
}

MockRouter.prototype.setData = function(data) {
  this.data = data;
}


Tinytest.add('RouteController - wait', function (test) {
  var controller = new RouteController;

  var onReadyCalled = false;
  var onReady = function () {
    onReadyCalled = true;
  };

  var onWaitCalled = false;
  var onWait = function () {
    onWaitCalled = true;
  };

  var handle = new Subscription;

  Deps.autorun(function () {
    controller.wait([handle], onReady, onWait);
  });

  test.isTrue(onWaitCalled);

  handle.mark();
  Deps.flush();

  test.isTrue(onReadyCalled);


  // test multiple handles
  var first = new Subscription;
  var second = new Subscription;

  onReadyCalled = false;
  onWaitCalled = true;
  Deps.autorun(function () {
    controller.wait([first, second], onReady, onWait);
  });

  test.isTrue(onWaitCalled);
  first.mark();
  Deps.flush();
  
  test.isFalse(onReadyCalled);

  second.mark();
  Deps.flush();
  
  test.isTrue(onReadyCalled);

  // test function
  var first = new Subscription;
  var second = new Subscription;

  onReadyCalled = false;
  onWaitCalled = true;

  function getHandle () {
    return [first, second];
  }

  Deps.autorun(function () {
    controller.wait([getHandle], onReady, onWait);
  });

  test.isTrue(onWaitCalled);
  first.mark();
  Deps.flush();
  
  test.isFalse(onReadyCalled);

  second.mark();
  Deps.flush();
  
  test.isTrue(onReadyCalled);
});

// really not a lot to test here, but here goes
Tinytest.add('RouteController - render', function (test) {
  var router = new MockRouter;
  var controller = new RouteController({router: router});
  
  controller.render('template');
  test.equal(router.rendered.__main__, 'template');
  
  controller.render('template', {to: 'aside'});
  test.equal(router.rendered.aside, 'template');
  
  controller.render({
    'other': {},
    'andAnother': {to: 'aside'}
  });
  test.equal(router.rendered.__main__, 'other');
  test.equal(router.rendered.aside, 'andAnother');
});

Tinytest.add('RouteController - runActionWithHooks - loading', function (test) {
  var router = new MockRouter;
  var handle = new Subscription;
  var controller = new RouteController({
    router: router,
    waitOn: handle,
    loadingTemplate: 'loading',
    template: 'template'
  });
  
  Deps.autorun(function() {
    controller.runActionWithHooks();
  });
  
  test.equal(router.rendered.__main__, 'loading');
  
  handle.mark();
  Deps.flush();
  test.equal(router.rendered.__main__, 'template');
});

Tinytest.add('RouteController - runActionWithHooks - notFound', function (test) {
  var router = new MockRouter;
  var dataDep = new Deps.Dependency;
  var found = null;
  var controller = new RouteController({
    router: router,
    template: 'template',
    notFoundTemplate: 'notFound',
    data: function() {
      dataDep.depend();
      return found;
    }
  });
  
  Deps.autorun(function() {
    controller.runActionWithHooks();
  });
  
  test.equal(router.rendered.__main__, 'notFound');
  
  found = true;
  dataDep.changed();
  Deps.flush();
  test.equal(router.rendered.__main__, 'template');
  test.equal(router.data, true);
});
