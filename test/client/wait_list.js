/**
 * We'll assume the underlying deps-ext stuff works, so here we'll only test
 * that ready() method returns true when all ready functions in the list return
 * true.
 */
Tinytest.add('WaitList', function (test) {
  var one = new ReactiveValue(false);
  one.ready = function () { return this.get(); };

  var two = new ReactiveValue(false);
  two.ready = function () { return this.get(); };

  var waitlist = new WaitList(function () {
    return [one, two];
  });

  test.isFalse(waitlist.ready(), "waitlist should not be ready yet");
  
  one.set(true);
  Deps.flush();
  test.isFalse(waitlist.ready(), "waitlist still shouldn't be ready");

  two.set(true);
  test.isTrue(waitlist.ready(), "waitlist should be ready even before flush");

  Deps.flush();
  test.isTrue(waitlist.ready(), "waitlist should be ready now!");
});
