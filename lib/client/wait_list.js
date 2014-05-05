WaitList = function () {
  var self = this;
  this._list = [];
  this._value = Deps.cache(this._isEveryItemReady, this);
};

WaitList.prototype = {
  constructor: WaitList,

  append: function (list) {
    var self = this;
    list = Utils.toArray(list);
    _.each(list, function (item) { self.push(item); });
  },

  clear: function () {
    this._list = [];
  },

  push: function (item) {
    var self = this;
    var idx;

    if (!item)
      return;

    idx = this._list.push(item);
    this._value.recompute();

    if (Deps.active) {
      Deps.onInvalidate(function () { 
        self.pull(item); 
      });
    }

    return idx;
  },

  pull: function (item) {
    var self = this;
    var idx = self._list.indexOf(item);
    if (idx >= 0) {
      self._list.splice(idx,1);
      return true;
    } else {
      return false;
    }
  },

  ready: function () {
    return this._value.get();
  },

  _isEveryItemReady: function () {
    var list = this._list;
    return _.every(list, function (item) {
      return item && item.ready();
    });
  }
};
