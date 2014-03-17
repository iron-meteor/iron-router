// TODO -- add basic tests

Tinytest.add('Waitlist - removes subs when computation invalidates', function(test) {
  var waitlist = new WaitList;
  
  Session.set('skip', false);
  Deps.autorun(function() {
    if (! Session.get('skip'))
      waitlist.push(Meteor.subscribe('neverReady'));
  });
  test.isFalse(waitlist.ready());
  test.equal(waitlist._list.length, 1);
  
  Session.set('skip', true);
  Deps.flush();
  test.isTrue(waitlist.ready());
  test.equal(waitlist._list.length, 0);
});
