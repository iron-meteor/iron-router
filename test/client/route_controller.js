//TODO Add back tests for run and stop
//TODO Test out of box hooks separately
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

MockRouter.prototype.clearUnusedRegions = function (used) {
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
