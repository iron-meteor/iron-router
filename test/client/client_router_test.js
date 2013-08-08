//XXX onRun method
//XXX render
//XXX go
//XXX autoRender
//XXX Router singleton is defined
//XXX runController
//XXX getControllerForContext returns right controller for circumstance
//XXX default layout is used if none provided

// Stop location from using the browser's history API.
// We can test without affecting the browser.
Location.pushState = function (state, title, url, skipReactive) {
  this._setState(state, title, url, skipReactive);
};

Location.replaceState = function (state, title, url) {
  this._setState(state, title, url);
};

Tinytest.add('ClientRouter - render', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });

  var renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));

  // default layout is empty
  test.equal(renderedRouter.text().trim(), '');
  renderedRouter.kill();

  router.configure({
    layout: 'layout'
  });

  // provide a layout
  renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));
  test.equal(renderedRouter.text().trim(), 'Layout');
  renderedRouter.kill();

  // layout not found
  router.configure({
    layout: 'bogus'
  });

  test.throws(function () {
    Spark.render(_.bind(router.render, router));
  });
});

Tinytest.add('ClientRouter - onRun', function (test) {
  var calls = {};

  var router = new ClientRouter({
    autoRender: false,
    autoStart: true
  });

  router.map(function () {
    this.route('one', {
      path: '/',
      template: 'one'
    });

    this.route('two', {
      path: '/two',
    });

    this.route('reactive', {
      path: '/reactive',
      controller: 'ReactiveController',
      action: 'run'
    });

    this.route('nonreactive', {
      reactive: false,
      path: '/nonreactive'
    });

    this.route('handler', {
      path: '/handler'
    }, function () {
      Meteor._ensure(calls, 'handler');
      calls.handler.thisArg = this;
    });
  });
});

Tinytest.add('ClientRouter - basic filter', function (test) {
  var router = new ClientRouter({
    autoRender: false,
    autoStart: false
  });
  
  var renderedRouter = new OnscreenDiv(Spark.render(_.bind(router.render, router)));
  test.equal(renderedRouter.text().trim(), '');
  
  router.map(function () {
    this.route('one', {path: '/'})
  });
  
  router.configure({
    before: function() {
      if (Session.get('stop')) {
        this.render('two');
        this.stop();
      }
    }
  });
  
  Session.set('stop', false);
  router.start();
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'One');
  
  Session.set('stop', true);
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'Two');
  
  Session.set('stop', false);
  Deps.flush();
  test.equal(renderedRouter.text().trim(), 'One');
});
