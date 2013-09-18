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