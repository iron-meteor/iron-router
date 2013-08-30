// a super simple publication that just counts the amount of times it's been called

var calledTimes = 0;
Meteor.publish('counter', function() {
  console.log('counter called')
  calledTimes += 1;
  this.ready();
});

Meteor.methods({
  resetCounter: function() {
    calledTimes = 0;
  },
  counterValue: function() {
    return calledTimes;
  }
});