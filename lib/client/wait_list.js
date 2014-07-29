/**
 * A WaitList evaluates a series of functions, each in its own computation. The
 * list is ready() when all of the functions return true. This list is not ready
 * (i.e. this.ready() === false) if at least one function returns false.
 *
 * You add functions by calling the wait(fn) method. Each function is run its
 * own computation. The ready() method is a reactive method but only calls the
 * deps changed function if the overall value of the list changes from true to
 * false or from false to true.
 */
WaitList = function () {
  this._readyDep = new Deps.Dependency;
  this._comps = [];
  this._notReadyCount = 0;
};

/**
 * Pass a function that returns true or false.
 */
WaitList.prototype.wait = function (fn) {
  var self = this;

  var activeComp = Deps.currentComputation;

  // break with parent computation and grab the new comp
  Deps.nonreactive(function () {

    // store the cached result so we can see if it's different from one run to
    // the next.
    var cachedResult = null;

    // create a computation for this handle
    var comp = Deps.autorun(function (c) {
      // let's get the new result coerced into a true or false value.
      var result = !!fn();

      var oldNotReadyCount = self._notReadyCount;

      // if it's the first run and we're false then inc
      if (c.firstRun && !result)
        self._notReadyCount++;
      else if (cachedResult !== null && result !== cachedResult && result === true)
        self._notReadyCount--;
      else if (cachedResult !== null && result !== cachedResult && result === false)
        self._notReadyCount++;

      cachedResult = result;

      if (oldNotReadyCount === 0 && self._notReadyCount > 0)
        self._readyDep.changed();
      else if (oldNotReadyCount > 0 && self._notReadyCount === 0)
        self._readyDep.changed();
    });

    self._comps.push(comp);

    if (activeComp) {
      activeComp.onInvalidate(function () {
        // stop the computation
        comp.stop();

        // remove the computation from the list
        self._comps.splice(_.indexOf(self._comps, comp), 1);

        // subtract from the ready count
        if (cachedResult === false)
          self._notReadyCount--;
      });
    }
  });
};

WaitList.prototype.ready = function () {
  this._readyDep.depend();
  return this._notReadyCount === 0;
};

WaitList.prototype.stop = function () {
  _.each(this._comps, function (c) { c.stop(); });
  this._comps = [];
};
