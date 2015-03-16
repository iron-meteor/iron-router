/*****************************************************************************/
/* Imports */
/*****************************************************************************/
var Controller = Iron.Controller;
var Url = Iron.Url;
var MiddlewareStack = Iron.MiddlewareStack;
var debug = Iron.utils.debug('iron-router:RouteController');

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/
/**
 * Client specific initialization.
 */
RouteController.prototype.init = function (options) {
  RouteController.__super__.init.apply(this, arguments);
  this._computation = null;
  this._paramsDep = new Tracker.Dependency;
  this.location = Iron.Location;
};

RouteController.prototype.getParams = function () {
  this._paramsDep.depend();
  return this.params;
};

RouteController.prototype.setParams = function (value, options) {
  var equals = function (a, b) {
    if (!(a instanceof Array))
      throw new Error("you called equals with a non array value in setParams");
    if (!(b instanceof Array))
      return false;
    if (a.length !== b.length)
      return false;
    for (var i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options))
        return false;
    }

    // now check all of the hasOwn properties of params
    var aKeys = _.keys(a);
    var bKeys = _.keys(b);
    var key;

    if (aKeys.length !== bKeys.length)
      return false;

    for (var i = 0; i < aKeys.length; i++) {
      key = aKeys[i];
      if (!_.has(b, key))
        return false;
      if (!EJSON.equals(a[key], b[key]))
        return false;
    }

    return true;
  };

  // this won't work because the array values are the same
  // most of the time.
  if (equals(this.params, value))
    return;

  this.params = value;

  options = options || {};
  if (options.reactive !== false)
    this._paramsDep.changed();

  return this;
};

/**
 * Let this controller run a dispatch process. This function will be called
 * from the router. That way, any state associated with the dispatch can go on
 * the controller instance.
 */
RouteController.prototype.dispatch = function (stack, url, done) {
  if (this._computation && !this._computation.stopped)
    throw new Error("RouteController computation is already running. Stop it first.");

  var self = this;

  // break the computation chain with any parent comps
  Deps.nonreactive(function () {
    Deps.autorun(function (comp) {
      self._computation = comp;
      stack.dispatch(url, self, done);
    });
  });

  return self;
};

/**
 * Run a route. When the router runs its middleware stack, it can run regular
 * middleware functions or it can run a route. There should only one route
 * object per path as where there may be many middleware functions.
 *
 * For example:
 *
 *   "/some/path" => [middleware1, middleware2, route, middleware3]
 *
 * When a route is dispatched, it tells the controller to _runRoute so that
 * the controller can controll the process. At this point we should already be
 * in a dispatch so a computation should already exist.
 */
RouteController.prototype._runRoute = function (route, url, done) {
  var self = this;


  // this will now be where you can put your subscriptions
  // instead of waitOn. If you use waitOn, it will also
  // add the result to the wait list, but will also use
  // the loading hook.
  //
  // Similar to waitOn, we'll collect these just like hooks. See the comment
  // below on the waitOnList.
  //
  // If you don't want the subscription to affect the readiness of the waitlist
  // then just don't return the subscription handle from the function.
  var subsList = this._collectHooks('subscriptions');
  _.each(subsList, function (subFunc) {
    self.wait(subFunc.call(self));
  });


  // waitOn isn't really a 'hook' but we use the _collectHooks method here
  // because I want an array of values collected in the same order that we
  // collect regular hooks (router global, route option, controller proto,
  // controller inst object. Then we need to map over the results to make
  // sure the thisArg is set to the controller instance.
  var waitOnList = this._collectHooks('waitOn');

  _.each(waitOnList, function (waitOn) {
    self.wait(waitOn.call(self));
  });

  // if we have a waitOn option, the loading hook will be
  // added at the end of the before hook stack, right before
  // the action function.
  var useLoadingHook = waitOnList.length > 0;

  // start the rendering transaction so we record which regions were rendered
  // into so we can clear the unused regions later. the callback function will
  // get called automatically on the next flush, OR if beginRendering is called
  // again before the afterFlush callback.
  var previousLayout;
  var previousMainTemplate;

  var getLayout = function () {
    return Deps.nonreactive(function () {
      return self._layout.template();
    });
  };

  var getMainTemplate = function () {
    return Deps.nonreactive(function () {
      var region = self._layout._regions.main;
      return region && region.template();
    });
  };

  var prevLayout = getLayout();
  var prevMainTemplate = getMainTemplate();

  this.beginRendering(function onCompleteRenderingTransaction (usedRegions) {
    if (self.isStopped)
      return;

    var curLayout = getLayout();
    var curMainTemplate = getMainTemplate();

    // in the case where we're using the same layout and main template
    // across route changes don't automatically clear the unused regions
    // because we could have static content in them that we want to keep!
    if (prevLayout === curLayout && prevMainTemplate == curMainTemplate)
      return;

    var allRegions = self._layout.regionKeys();
    var unusedRegions = _.difference(allRegions, usedRegions);
    _.each(unusedRegions, function (r) { self._layout.clear(r); });
  });

  this.layout(this.lookupOption('layoutTemplate'), {
    data: this.lookupOption('data')
  });

  var stack = new MiddlewareStack;
  var onRunStack = new MiddlewareStack;
  var onRerunStack = new MiddlewareStack;

  onRunStack.append(this._collectHooks('onRun', 'load'), {where: 'client'});
  onRerunStack.append(this._collectHooks('onRerun'), {where: 'client'});

  stack.append(
    function onRun (req, res, next) {
      if (this._computation.firstRun && !RouteController._hasJustReloaded) {
        if (onRunStack.length > 0) {
          onRunStack.dispatch(req.url, this, next);
        } else {
          next();
        }
      } else {
        next();
      }
      RouteController._hasJustReloaded = false;
    },

    function onRerun (req, res, next) {
      if (!this._computation.firstRun) {
        if (onRerunStack.length > 0) {
          onRerunStack.dispatch(req.url, this, next);
        } else {
          next();
        }
      } else {
        next();
      }
    }
  , {where: 'client'});

  // make sure the loading hook is the first one to run
  // before any of the other onBeforeAction hooks.
  if (useLoadingHook) {
    stack.push(_.bind(Iron.Router.hooks.loading, self));
  }

  var beforeHooks = this._collectHooks('onBeforeAction', 'before');
  stack.append(beforeHooks, {where: 'client'});

  // make sure the action stack has at least one handler on it that defaults
  // to the 'action' method
  if (route._actionStack.length === 0)
    route._actionStack.push(route._path, 'action', route.options);

  stack = stack.concat(route._actionStack);

  // the "context" is the current instance of the RouteController
  this._rendered = false;
  stack.dispatch(url, this, done);
  // we put this in an afterFlush to let a redirected route have a chance to
  //   start and to stop this route.
  Deps.afterFlush(function() {
    Iron.utils.warn(self._rendered || self.isStopped,
      "Route dispatch never rendered. Did you forget to call this.next() in an onBeforeAction?");
  });

  // run the after hooks. Note, at this point we're out of the middleware
  // stack way of doing things. So after actions don't call this.next(). They
  // run just like a regular hook. In contrast, before hooks have to call
  // this.next() to progress to the next handler, just like Connect
  // middleware.
  this.runHooks('onAfterAction', 'after');
};

/**
 * The default action for the controller simply renders the main template.
 */
RouteController.prototype.action = function () {
  this.render();
};

/**
 * Returns the name of the main template for this controller. If no explicit
 * value is found we will guess the name of the template.
 */
RouteController.prototype.lookupTemplate = function () {
  return this.lookupOption('template') ||
    (this.router && this.router.toTemplateName(this.route.getName()));
};

/**
 * The regionTemplates for the RouteController.
 */
RouteController.prototype.lookupRegionTemplates = function () {
  return this.lookupOption('yieldRegions') ||
    // XXX: deprecated
    this.lookupOption('regionTemplates') ||
    this.lookupOption('yieldTemplates') || {};
};

/**
 * Overrides Controller.prototype.render to automatically render the
 * controller's main template and region templates or just render a region
 * template if the arguments are provided.
 */
RouteController.prototype.render = function (template, options) {
  this._rendered = true;
  if (arguments.length === 0) {
    var template = this.lookupTemplate();
    var result = RouteController.__super__.render.call(this, template);
    this.renderRegions();
    return result;
  } else {
    return RouteController.__super__.render.call(this, template, options);
  }
};

/**
 * Render all region templates into their respective regions in the layout.
 */
RouteController.prototype.renderRegions = function () {
  var self = this;
  var regionTemplates = this.lookupRegionTemplates();

  debug('regionTemplates: ' + JSON.stringify(regionTemplates));


  // regionTemplates =>
  //   {
  //     "MyTemplate": {to: 'MyRegion'}
  //   }
  _.each(regionTemplates, function (opts, templateName) {
    self.render(templateName, opts);
  });
};

/**
 * Stop the RouteController.
 */
RouteController.prototype.stop = function () {
  RouteController.__super__.stop.call(this);

  if (this._computation)
    this._computation.stop();
  this.runHooks('onStop', 'unload');
  this.isStopped = true;
};

/**
 * Just proxies to the go method of router.
 *
 * It used to have more significance. Keeping because people are used to it.
 */
RouteController.prototype.redirect = function () {
  return this.router.go.apply(this.router, arguments);
};

/**
 * Calls Meteor.subscribe but extends the handle with a wait() method.
 *
 * The wait method adds the subscription handle to this controller's
 * wait list. This is equivalent to returning a subscription handle
 * from the waitOn function. However, using the waitOn function has the
 * benefit that it will be called before any other hooks. So if you want
 * to use the "loading" hooks for example, you'll want the wait list populated
 * before the hook runs.
 *
 * Example:
 *
 *   this.subscribe('item', this.params._id).wait();
 *
 *   if (this.ready()) {
 *     ...
 *   } else {
 *     ...
 *   }
 */
RouteController.prototype.subscribe = function (/* same as Meteor.subscribe */) {
  var self = this;
  var handle = Meteor.subscribe.apply(this, arguments);
  return _.extend(handle, {
    wait: function () {
      self.wait(this);
    }
  });
};

if (Package.reload) {
  // just register the fact that a migration _has_ happened
  Package.reload.Reload._onMigrate('iron-router', function() { return [true, true] });

  // then when we come back up, check if it is set
  var data = Package.reload.Reload._migrationData('iron-router');
  RouteController._hasJustReloaded = data;
}
