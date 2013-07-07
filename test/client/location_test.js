Tinytest.add('Location - All', function (test) {
  Location.start();

  var state
    , stateCount = 0;

  Deps.autorun(function () {
    state = Location.state();
    stateCount++;
  });

  test.isTrue(state);
  test.equal(stateCount, 1);

  Location.pushState({one:true}, 'one', '/posts');
  Deps.flush();
  test.equal(stateCount, 2);
  test.isTrue(state.one);
  test.equal(state.title, 'one');
  test.equal(state.path, '/posts');

  Location.pushState({two:true}, 'two', '/posts/5');
  Deps.flush();
  test.equal(stateCount, 3);
  test.isTrue(state.two);
  test.equal(state.title, 'two');
  test.equal(state.path, '/posts/5');

  //XXX Need to test back, forward and replaceState but for some reason when you
  //go back or forward, Deps doesn't work. The next instruction is executed
  //before autorun is run. Need to come back to this.
});
