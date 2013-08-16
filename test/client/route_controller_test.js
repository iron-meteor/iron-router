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

Tinytest.add('RouteController - wait', function (test) {

  var router = Router;
  var route = new Route(Router, 'test');
  var context = new RouteContext('/test', router, route);
  var controller = new RouteController(context);

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
    controller.wait(handle, onReady, onWait);
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
    controller.wait(getHandle, onReady, onWait);
  });

  test.isTrue(onWaitCalled);
  first.mark();
  Deps.flush();
  
  test.isFalse(onReadyCalled);

  second.mark();
  Deps.flush();
  
  test.isTrue(onReadyCalled);
});

Tinytest.add('RouteController - render', function (test) {
  var ctx = {};
  var opts = {
    template: 'one',

    loadingTemplate: 'loading',

    data: {},

    renderTemplates: {
      aside: {to: 'aside'}
    }
  };

  var controller = new RouteController(ctx, opts);

  // render uses controller's default template set in options
  // if none specified in the render method
  var onRenderCalled = false;
  controller.onRender = function (template, options) {
    onRenderCalled = true;
    test.equal(template, 'one');
  };
  controller.render();
  test.isTrue(onRenderCalled);

  // render a specific template with options
  var data = {};
  onRenderCalled = false;
  controller.onRender = function (template, options) {
    test.equal(template, 'aside');
    test.equal(options.to, 'aside');
    test.equal(options.data, data);
    onRenderCalled = true;
  };

  controller.render('aside', {to: 'aside', data: data});


  // render loading template if there is one and we're waiting
  handle = new Subscription;
  onRenderCalled = false;
  controller.onRender = function (template, options) {
    test.equal(template, 'loading');
    onRenderCalled = true;
  };

  Deps.autorun(function () {
    controller.render('one', {waitOn: handle});
  });
  
  test.isTrue(onRenderCalled);

  onRenderCalled = false;
  controller.onRender = function (template, options) {
    test.equal(template, 'one');
    onRenderCalled = true;
  };

  handle.mark();
  Deps.flush();
  test.isTrue(onRenderCalled);

  // render notFound template if data returns falsy value and
  // a notFoundTemplate is set
  onRenderCalled = false;
  controller.onRender = function (template, options) {
    test.equal(template, 'notFound');
    onRenderCalled = true;
  };

  controller.render('one', {
    notFoundTemplate: 'notFound',
    data: null
  });

  test.isTrue(onRenderCalled);

  // render called with a map of templates to named yields
  onRenderCalled = false;
  var onRenderCalledCount = 0;
  controller.onRender = function (template, options) {
    onRenderCalledCount++;
    onRenderCalled = true;
  };

  controller.render({
    one: { to: 'aside' },
    two: { to: 'footer' }
  });

  test.isTrue(onRenderCalled);
  test.equal(onRenderCalledCount, 2);
});

Tinytest.add('RouteController - run', function (test) {
  var ctx = {};
  var opts = {
    template: 'one',

    data: {},

    renderTemplates: {
      aside: {to: 'aside'}
    }
  };

  var controller = new RouteController(ctx, opts);

  var renderCount = 0;
  var rendered = [];
  var onRenderCalled = false;
  controller.onRender = function (template, options) {
    onRenderCalled = true;
    renderCount++;
    rendered.push(template);
  };

  controller.run();

  test.isTrue(onRenderCalled);
  // first render the main template
  test.equal(_.indexOf(rendered, 'one'), 0);

  // then render each of the renderTemplates
  test.equal(_.indexOf(rendered, 'aside'), 1);
});

Tinytest.add('RouteController - runHooks', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var calls = [];

  var Controller = RouteController.extend({
    before: [
      function () {
        calls.push('before');
      },

      function () {
        calls.push('before');
      }
    ]
  });

  var route = new Route(router, 'test');
  var context = new RouteContext('/test', router, route);
  var inst = new Controller(context);
  inst.runHooks('before');
  test.equal(calls.length, 2, 'both before filters called');
});

Tinytest.add('ClientRouter - stop and redirect in filter', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var afterFilterCalled = false;
  var handlerCalled = false;

  router.map(function () {
    this.route('filters', {
      path: '/',
      before: [
        function () {
          this.redirect('two');
        }
      ],

      after: [
        function () {
          afterFilterCalled = true;
        }
      ]
    }, function handler () {
      handlerCalled = true;
    });

    this.route('two');
  });

  router.start();
  Deps.flush();
  test.isFalse(afterFilterCalled);
  test.isFalse(handlerCalled);
});

Tinytest.add('RouteController - inheritance', function (test) {
  var handle = new Subscription;
  var router = Router;
  var route = new Route(Router, 'test');
  var context = new RouteContext('/test', router, route);
  var ApplicationController = RouteController.extend({
    template: 'one',
    loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    waitOn: handle,
    renderTemplates: {
      aside: { to: 'aside'}
    }
  });

  var inst = new ApplicationController(context);
  test.equal(inst.template, 'one');
  test.equal(inst.loadingTemplate, 'loading');
  test.equal(inst.notFoundTemplate, 'notFound');
  test.equal(inst.waitOn, handle);
  test.equal(inst.renderTemplates.aside.to, 'aside');
});
