//XXX this waitlist isn't very smart. You just keep adding items to it and if
//its used in a computation, we'll probably get duplicate handles.
WaitList = function () {
  this._dep = new Deps.Dependency;
  this.clear();
};

WaitList.prototype = {
  get: function (idx) {
    return this._list[idx];
  },

  clear: function () {
    this._list = [];
  },

  append: function (list) {
    var self = this;
    list = Utils.toArray(list);
    _.each(list, function (o) {
      self.push(o);
    });
  },

  push: function (o) {
    var self = this;

    if (!o)
      return;

    var res = this._list.push(o);

    // remove the handle if the current computation invalidates
    Deps.active && Deps.onInvalidate(function() { self.pull(o); });

    return res;
  },

  // take o out of the waitlist
  pull: function(o) {
    this._list = _.reject(this._list, function(_o) { return _o === o });
  },

  ready: function () {
    return _.all(this._list, function (handle) {
      return handle.ready();
    });
  }
};
