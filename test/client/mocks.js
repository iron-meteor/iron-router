LocationMock = function() {
  this._path = '/one';
}

_.extend(LocationMock.prototype, {
  start: function() {},
  set: function(path, options) {
    this._path = path;
  },
  path: function() {
    return this._path;
  }
});

// XXX: probably record what this does
UIMock = function() {}
_.each([
  'setRegion',
  'clearRegion',
  'getRegionKeys',
  'getData',
  'setData',
  'render',
  'insert',
  'layout'
], function (method) {
  // nothing for now
  UIMock.prototype[method] = function() {};
});