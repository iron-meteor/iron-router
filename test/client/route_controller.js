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
};

MockRouter.prototype.setTemplate = function(name, to) {
  to = to || '__main__';
  this.rendered[to] = name;
};

MockRouter.prototype.setLayout = function(name) {
  this.layout = name;
};

MockRouter.prototype.setData = function(data) {
  this.data = data;
};

MockRouter.prototype.getData = function() {
  return this.data;
};

MockRouter.prototype.clearUnusedYields = function (used) {
  this.usedYields = used;
};

Tinytest.add('RouteController - wait and ready', function (test) {
  var controller = new RouteController;

  var sub1 = new Subscription;
  var sub2 = new Subscription;

  controller.wait(sub1);
  controller.wait(sub2);

  var ready = false;
  Deps.autorun(function () {
    ready = controller.ready();
  });

  test.isFalse(ready, 'controller should be waiting on two subs');

  sub1.mark();
  Deps.flush();
  test.isFalse(ready, 'controller should be waiting on one more sub');

  sub2.mark();
  Deps.flush();
  test.isTrue(ready, 'controller should be ready now');
});

Tinytest.add('RouteController - run', function (test) {
  var calls = {};
  var logCall = function (key) {
    calls[key] = calls[key] || 0;
    calls[key]++;
  };

  var sub1 = new Subscription;

  var C = RouteController.extend({
    waitOn: function () {
      return sub1;
    },

    before: [function () {
      logCall('upstreamBefore');
      if (!this.ready())
        this.stop();

    }, function () {
      logCall('downstreamBefore');
    }],

    action: function () {
      logCall('action');
    },

    after: function () {
      logCall('after');
    }
  });

  var inst = new C;
  
  Deps.autorun(function () {
    inst.run();
  });

  test.equal(calls['upstreamBefore'], 1);
  test.isFalse(calls['downstreamBefore']);
  test.isFalse(calls['action']);
  test.isFalse(calls['after']);

  sub1.mark();
  Deps.flush();

  test.equal(calls['upstreamBefore'], 2);
  test.equal(calls['downstreamBefore'], 1);
  test.equal(calls['action'], 1);
  test.equal(calls['after'], 1);
});

// really not a lot to test here, but here goes
Tinytest.add('RouteController - render', function (test) {
  var router = new MockRouter;
  var controller = new RouteController({router: router});
  
  controller.render('template');
  test.equal(router.rendered.__main__, 'template', 'main tmpl not rendered');
  
  controller.render('template', {to: 'aside'});
  test.equal(router.rendered.aside, 'template', 'yield tmpl not rendered');
});

Tinytest.add('RouteController - autoRenderLoadingHook', function (test) {
  var router = new MockRouter;
  var handle = new Subscription;
  var controller = new RouteController({
    router: router,
    waitOn: handle,
    loadingTemplate: 'loading',
    template: 'template'
  });
  
  Deps.autorun(function() {
    controller.run();
  });
  
  test.equal(router.rendered.__main__, 'loading');
  
  handle.mark();
  Deps.flush();
  test.equal(router.rendered.__main__, 'template');
});

Tinytest.add('RouteController - autoRenderNotFoundHook', function (test) {
  var router = new MockRouter;
  var dataDep = new Deps.Dependency;
  var found = null;
  var controller = new RouteController({
    router: router,
    template: 'template',
    notFoundTemplate: 'notFound',
    yieldTemplates: {
      one: {to: 'one'}
    },
    data: function() {
      dataDep.depend();
      return found;
    }
  });
  
  Deps.autorun(function() {
    controller.run();
  });
  
  test.equal(router.rendered.__main__, 'notFound');
  test.equal(router.rendered.one, 'one');
  
  found = true;
  dataDep.changed();
  Deps.flush();
  test.equal(router.rendered.__main__, 'template');
  test.equal(router.rendered.one, 'one');
  test.equal(router.data, true);
});
