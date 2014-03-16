// uiManager api tests
// hot code reload
// run (deps changed and current changed)
var LocationMock = function() {
  this._path = Meteor.absoluteUrl('one');
}

_.extend(LocationMock.prototype, {
  start: function() {},
  set: function(path, options) {
    console.log('set')
    this._path = path;
  },
  path: function() {
    return this._path;
  }
});
