ReadyHandle = function () {
  this._ready = false;
  this._dep = new Deps.Dependency;
};

ReadyHandle.prototype.set = function (value) {
  this._ready = value;
  this._dep.changed();
};

ReadyHandle.prototype.ready = function () {
  this._dep.depend();
  return this._ready;
};

Tinytest.add('WaitList - all', function (test) {
  list = new WaitList;

  var h1 = new ReadyHandle;
  var h2 = new ReadyHandle;

  var comp = Deps.autorun(function (c) {
    list.wait(function () { return h1.ready(); });
    list.wait(function () { return h2.ready(); });
  });

  var result;

  Deps.autorun(function (c) {
    result = list.ready();
  });

  test.isFalse(result, 'list should not be ready');
  test.equal(list._notReadyCount, 2);

  h1.set(true);
  Deps.flush();
  test.isFalse(result, 'list should still not be ready');
  test.equal(list._notReadyCount, 1);

  h2.set(true)
  Deps.flush();
  test.isTrue(result, 'list should be ready');
  test.equal(list._notReadyCount, 0);

  test.equal(list._comps.length, 2);
  comp.invalidate();
  Deps.flush();
  test.equal(list._comps.length, 2, 'comps list should not grow');
});


Tinytest.add('WaitList - infinite invalidation loop', function (test) {
  var list = new WaitList;
  var handle = new ReadyHandle;
  
  var times = 0, ready;
  var c = Deps.autorun(function() {
    times += 1;
    if (times > 10)
      return;
    
    // initial ready value is: true
    // because there's no items in the list
    ready = list.ready();
    
    
    // this should throw an exception because it would cause an infinite
    // loop.
    test.throws(function () {
      list.wait(function() {
        return handle.ready();
      });
    });
  });
});

Tinytest.add('WaitList - ready state must always be accurate', function (test) {
  var list = new WaitList;
  var handle = new ReadyHandle;
  var dep = new Deps.Dependency;

  var wait = true;
  var outerComputation = Deps.autorun(function() {
    if (wait)
      list.wait(function() { return handle.ready(); });
    
    // add other random dep
    dep.depend();
  });
  
  // this can fail if we aren't careful about keeping ready
  // correct within a flush cycle
  var ready;
  var readyComputation = Deps.autorun(function() {
    ready = list.ready();
  })
  
  test.equal(ready, false, "initial ready state is false");
  test.equal(list.ready(), false, "initial ready state is false when calling list.ready()");
  
  // invalidate outerComputation and schedule a recompute
  // on next flush
  dep.changed();

  // set the handle value to true
  handle.set(true);

  // force a recompute now instead of on the next tick
  // what should happen is that the inner computation is removed
  // from the list and the overall ready count decremented by one.
  // then when the item is added again its value is true so the ready
  // count should remain 0.
  Deps.flush();

  test.equal(list.ready(), true, "list.ready() should be up to date");
  
  Deps.flush();
  test.equal(ready, true, "ready computation should rerun on next flush");

  // now try it going false, but being removed
  wait = false
  dep.changed();
  handle.set(false);

  // force a recompute now instead of on the next tick
  // what should happen is that the inner computation is removed
  // from the list and the overall ready count decremented by one.
  // then when the item is added again its value is true so the ready
  // count should remain 0.
  Deps.flush();

  test.equal(list.ready(), true, "list.ready() should be up to date");
  
  Deps.flush();
  test.equal(ready, true, "ready computation should rerun on next flush");
});


