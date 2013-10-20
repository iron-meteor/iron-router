IronRouteController = function (options) {
  var self = this;

  options = this.options = options || {};

  var getOption = function (key) {
    return Utils.pick(self.options[key], self[key]);
  };

  this.router = options.router;
  this.route = options.route;
  this.path = options.path;
  this.params = options.params || [];
  this.where = options.where || 'client';
  this.action = options.action || 'run';
  this.hooks = {};
  this._ready = true;

  options.load = Utils.toArray(options.load);
  options.before = Utils.toArray(options.before);
  options.after = Utils.toArray(options.after);
  options.unload = Utils.toArray(options.unload);

  /*
   * waitOn can come from the options or the prototype. We add the option
   * waitOn value first and then concatenate the prototype waitOn value.
   * Possible values are:
   *
   * Router.configure({
   *  waitOn: Meteor.subscribe('items')
   * });
   *
   * Router.route('someRoute', {
   *  waitOn: function () {
   *    return Meteor.subscribe('item', this.params._id);
   *  }
   * });
   *
   * waitOn => [{}, fn]
   *  fn => could return an object or another array of objects
   * 
   */
  var waitOn = []
    .concat(Utils.toArray(this.options.waitOn))
    .concat(Utils.toArray(this.waitOn));

  /*
   * Now make sure we've called all of our waitOn functions so the
   * subscriptions run and we get the handles which will be used in the
   * waitList.
   */
  waitOn = _.flatten(_.map(waitOn, function (item) {
    return _.isFunction(item) ? item.call(self) : item;
  }));

  /*
   * A place to store subscription and other handles we intend to wait on. You
   * can see if all objects in the list are ready by calling the ready() method
   * of the controller instance.
   */
  this._waitList = waitOn;
};

IronRouteController.prototype = {
  constructor: IronRouteController,

  runHooks: function (hookName, more) {
    var ctor = this.constructor
      , instanceHooks = this.hooks[hookName]
      , more = Utils.toArray(more)
      , inheritedHooks
      , allHooks;

    var collectInheritedHooks = function (ctor) {
      var hooks = [];

      if (ctor.__super__)
        hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor));
      
      return ctor.prototype[hookName] ?
        hooks.concat(ctor.prototype[hookName]) : hooks;
    };

    var prototypeHooks = collectInheritedHooks(this.constructor);

    allHooks = this.options[hookName].concat(prototypeHooks).concat(more);

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      if (this.stopped)
        break;
      hook.call(this);
    }
  },

  wait: function (handles) {
    handles = _.isFunction(handles) ? handles.call(this) : handles;
    this._waitList = this._waitList.concat(Utils.toArray(handles));
  },

  ready: function () {
    var self = this;

    var handles = this._waitList;
    
    /*
     * At this point each handle could be a function or an object.
     */

    handles = _.map(handles, function (handle) {
      return (_.isFunction(handle)) ? handle.call(self) : handle;
    });

    /*
     * Flatten the array in case a function returned an array of handles
     */

    handles = _.flatten(handles);

    /*
     * Now get rid of the falsy handles
     */
    handles = _.filter(handles, function (handle) {
      return handle;
    });

    /*
     * Goal here is to wait for all reactive ready() methods to return true
     * But to isolate those invalidations to this area and only present one
     * invalidation when the entire state changes.
     */

    var currentComputation = Deps.currentComputation;

    Deps.autorun(function () {
      var isReady = _.all(handles, function (handle) {
        if (!handle.ready)
          throw new Error('handle must have a ready() method');

        console.log('handle.ready(): ', handle.ready());
        return handle.ready();
      });

      if (isReady !== self._ready) {
        console.log('isReady: ', isReady, 'self._ready: ', self._ready);
        self._ready = isReady;
        currentComputation && currentComputation.invalidate();
      } else {
        console.log('already ready');
      }
    });

    return this._ready;
  },

  runActionWithHooks: function () {
    throw new Error('not implemented');
  },

  run: function () {
    throw new Error('not implemented');
  },

  stop: function() {
    this.stopped = true;
  }
};

_.extend(IronRouteController, {
  /**
   * Inherit from IronRouteController
   *
   * @param {Object} definition Prototype properties for inherited class.
   */

  extend: function (definition) {
    return Utils.extend(this, definition, function (definition) {
      var klass = this;
      
      /*
        Allow calling a class method from javascript, directly in the subclass
        definition.

        Instead of this:
          MyController = RouteController.extend({...});
          MyController.before(function () {});

        You can do:
          MyController = RouteController.extend({
            before: function () {}
          });
       
        And in Coffeescript you can do:
         MyController extends RouteController
           @before function () {}
       */
    });
  }
});
