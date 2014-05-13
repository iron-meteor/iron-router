WaitList = function (valueFunc) {
  this._valueFunc = valueFunc;
};

WaitList.prototype = {
  constructor: WaitList,

  ready: function () {
    return _.all(this._valueFunc(), function (item) {
      return item && item.ready();
    });
  }.reactive(),

  stop: function () {
    this.ready.stop();
  }
};
