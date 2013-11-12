Tinytest.add('IronRouteController - inheritance', function (test) {
  var App = IronRouteController.extend({
    action: function () {
      return 'app';
    }
  });

  var Child = App.extend({
    action: function () {
      var superVal = Child.__super__.action.call(this);
      return [superVal, 'child'];
    }
  });

  var inst = new Child;
  test.equal(inst.action(), ['app', 'child']);
});

Tinytest.add('IronRouteController - runHooks', function (test) {
  var calls = [];
  var call = function (idx) {
    return function () {
      calls.push(idx);
    };
  };

  var opts = {
    before: [call(0)]
  };

  var A = IronRouteController.extend({
    before: [call(1), call(2)]
  });

  var B = A.extend({
    before: [call(3), call(4)]
  });

  var C = B.extend({
  });

  /*
   * Given:
   *  A prototype['before'] => [f1, f2]
   *    B inherits A proto['before'] => [f3, f4]
   *      C inherits B proto['before'] => []
   *  
   *  Router options => [f5, f6]
   *  Route options => [f7, f8]
   *
   *  runHooks('before') => [f1..f8]
   *    
   */

  test.equal(calls.length, 0, 'call list not empty');
  var cInst = new C(opts);
  cInst.runHooks('before');

  for (var i = 0; i < 5; i++) {
    test.equal(calls[i], i, 'runHooks has the wrong exec order');
  }

  test.equal(calls.length, 5, 'runHooks collected to many hooks');
});
