Tinytest.add('Utils - inherits', function (test) {

  var parentCtorCalled = false
    , childCtorCalled = false;

  function Parent () {
    parentCtorCalled = true;
  }

  Parent.prototype = {
    constructor: Parent,
    parentMethod: function () { return 'parentMethod'; },
    toString: function () { return 'Parent'; }
  };

  Parent.classProperty = true;

  function Child () {
    childCtorCalled = true;
    Child.__super__.constructor.apply(this, arguments);
  }

  RouterUtils.inherits(Child, Parent);

  _.extend(Child.prototype, {
    constructor: Child,
    childMethod: function () { return 'childMethod' },
    toString: function () { return 'Child' }
  });

  var c = new Child;

  // override method
  test.equal(c.toString(), 'Child');

  // inherit method
  test.equal(c.parentMethod(), 'parentMethod');

  // new methods
  test.equal(c.childMethod(), 'childMethod');

  // constructors
  test.isTrue(childCtorCalled, 'child ctor not called');
  test.isTrue(parentCtorCalled, 'parent ctor not called');

  // class property copy
  test.isTrue(Child.classProperty, 'class property not inherited');
});

Tinytest.add('Utils - extend', function (test) {
  var parentCtorCalled = false
    , childCtorCalled = false;

  function Parent () {
    parentCtorCalled = true;
  }

  Parent.prototype = {
    constructor: Parent,
    toString: function () { return 'Parent'; },
    parentMethod: function () { return 'parentMethod'; }
  };

  Parent.classProperty = true;

  var Child = RouterUtils.extend(Parent, {
    constructor: function () {
      childCtorCalled = true;
      Child.__super__.constructor.apply(this, arguments);
    },
    toString: function () { return 'Child'; },
    childMethod: function () { return 'childMethod'; }
  });

  var c = new Child;

  // override method
  test.equal(c.toString(), 'Child');

  // inherit method
  test.equal(c.parentMethod(), 'parentMethod');

  // new methods
  test.equal(c.childMethod(), 'childMethod');

  // constructors
  test.isTrue(childCtorCalled, 'child ctor not called');
  test.isTrue(parentCtorCalled, 'parent ctor not called');

  // class property copy
  test.isTrue(Child.classProperty, 'class property not inherited');
});

Tinytest.add('Utils - capitalize', function (test) {
  var str = 'lower';
  test.equal(RouterUtils.capitalize(str), 'Lower');
});

Tinytest.add('Utils - classify', function (test) {
  test.equal(RouterUtils.classify('postsShow'), 'PostsShow');
  test.equal(RouterUtils.classify('posts-show'), 'PostsShow');
  test.equal(RouterUtils.classify('posts_show'), 'PostsShow');
});

Tinytest.add('Utils - global', function (test) {
  if (Meteor.isServer) {
    test.equal(RouterUtils.global(), global);
  }

  if (Meteor.isClient) {
    test.equal(RouterUtils.global(), window);
  }
});

Tinytest.add('Utils - resolveValue', function (test) {
  var global = Meteor.isServer ? global : window;

  test.throws(function () {
    RouterUtils.resolveValue('App');
  });
  global.App = {};
  test.equal(RouterUtils.resolveValue('App'), global.App);

  test.throws(function () {
    RouterUtils.resolveValue('App.controllers');
  });
  global.App.controllers = {};
  test.equal(RouterUtils.resolveValue('App.controllers'),
             global.App.controllers);

  test.throws(function () {
    RouterUtils.resolveValue('App.controllers.Fn');
  });

  global.App.controllers.Fn = function () {};
  test.equal(RouterUtils.resolveValue('App.controllers.Fn'),
             global.App.controllers.Fn);

  // an actual value should resolve immediately.
  var fn = function () {};
  test.equal(RouterUtils.resolveValue(fn), fn);
});

// delayed inheritance mechanism
Tinytest.addAsync('Utils - create', function (test, onComplete) {
  var global = Meteor.isServer ? global : window;

  global.Child = RouterUtils.create({
    extend: 'Super',
    childMethod: function () { return 'childMethod'; }
  });

  global.Child.childClassProperty = 'childClassProperty';

  global.Super = RouterUtils.create({
    superMethod: function () { return 'superMethod'; }
  });

  // test Child.prototype is created but we are not inheriting yet
  var c = new Child;
  test.equal(c.childMethod(), 'childMethod');
  test.throws(function () { c.superMethod() });

  setTimeout(function () {
    // test that child inherits from super properly.
    var c = new Child;
    test.equal(c.childMethod(), 'childMethod');
    test.equal(c.superMethod(), 'superMethod');
    test.equal(Child.childClassProperty, 'childClassProperty');
    // just making sure we didn't clobber the parent somehow
    var p = new Super;
    test.equal(p.superMethod(), 'superMethod');
    test.throws(function () {
      // childMethod shouldn't exist on the parent
      p.childMethod();
    });

    onComplete();
  });
});
