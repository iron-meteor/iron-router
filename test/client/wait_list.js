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


Tinytest.add('WaitList - self referential', function (test) {
  var list = new WaitList;
  var handle = new ReadyHandle;
  
  var times = 0, ready;
  var c = Deps.autorun(function() {
    times += 1;
    if (times > 10)
      return;
    
    // set up dep
    ready = list.ready();
    
    // add to dep
    list.wait(function() {
      return handle.ready();
    });
  });
  
  Deps.flush();
  test.equal(ready, false);
  if (times > 2)
    return test.fail({message: "Autorun ran too many times"});
  
  handle.set(true);
  Deps.flush();
  test.equal(ready, true);
  if (times > 3)
    return test.fail({message: "Autorun ran too many times"});
});

Tinytest.add('WaitList - remains true with unrelated change', function (test) {
  var list = new WaitList;
  var handle = new ReadyHandle;
  var dep = new Deps.Dependency;
  Deps.autorun(function() {
    list.wait(function() { return handle.ready(); });
    
    // add other random dep
    dep.depend();
  });
  
  // this can fail if we aren't careful about keeping ready
  // correct within a flush cycle
  var ready;
  Deps.autorun(function() {
    ready = list.ready();
  })
  
  Deps.flush();
  test.equal(ready, false);
  test.equal(list.ready(), false);
  
  // The other random dep means the outer computation invalidates
  // before the inner computation has a chance to see the new handle val
  dep.changed();
  handle.set(true);
  Deps.flush();
  test.equal(ready, true);
  test.equal(list.ready(), true);
});


