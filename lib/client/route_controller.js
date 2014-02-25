RouteController = Utils.extend(RouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);

    var self = this;

    //XXX clean up this options parsing somehow. Maybe with
    //a configure method like on Router.
    var getOption = function (key) {
      return Utils.pick(self.options[key], self[key]);
    };

    this.loadingTemplate = getOption('loadingTemplate');
    this.notFoundTemplate = getOption('notFoundTemplate');
    this.data = getOption('data');
    this.template = getOption('template') || (this.route && this.route.name);
    this.yieldTemplates = getOption('yieldTemplates');
    this.layoutTemplate = getOption('layoutTemplate');
    
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
    this.waitOn = []
      .concat(Utils.toArray(this.options.waitOn))
      .concat(Utils.toArray(this.waitOn));

    this._waitList = new WaitList;

    // proxy these methods to the router
    _.each([
      'layout',
      'setRegion',
      'clearRegion'
    ], function (routerApiMethod) {
      self[routerApiMethod] = function () {
        if (!self.router)
          throw new Error("No router defined on RouteController");
        return self.router[routerApiMethod].apply(self.router, arguments);
      };
    });
  },

  ready: function () {
    return this._waitList.ready();
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   * @api public
   */

  redirect: function (/* args */) {
    return Router.go.apply(this.router, arguments);
  },

  /**
   * Used to specify additional templates to render into named yield regions.
   * The default run method will first render the main template and then use
   * this property to render additional templates. Only used in the 'run'
   * method.
   *
   * Example:
   *
   *  yieldTemplates: {
   *    'asideTemplateName': {to: 'aside', data: {}, waitOn: Sub},
   *    'footerTemplateName': {to: 'footer'}
   *  }
   *
   * @type {Object|null}
   * @api public
   */

  //XXX regionTemplates acceptable too?
  yieldTemplates: null,

  //XXX accept layout too?
  layoutTemplate: null,

  /**
   * The default template to render
   *
   * @type {String|Function}
   * @api public
   */

  template: null,

  /**
   * Optional template to be used while waiting. If specified, the loading
   * template is used automatically in the run method. You can also use it
   * manually.
   *
   * @type {String|Function}
   * @api public
   */

  //XXX this should be totally up to the hook and not defined here.
  //change options parsing to add option values to the instance to make this
  //easier, or pull from the options object at runtime.
  loadingTemplate: null,

  /**
   * Optional template to be used if data returns a falsy value. Used
   * automatically in the run method. You can also use it manually.
   *
   * @type {String|Function}
   * @api public
   */

  //XXX see comment above on loadingTemplate
  notFoundTemplate: null,

  /**
   * A default data object or function to be used as the data context in
   * rendering.
   *
   * @type {Object|Function}
   * @api public
   */

  //TODO: fix up data api
  data: {},

  waitOn: null,

  /*
   * Calls Meteor.subscribe but adds a wait method to the returned handle
   * object. If the user calls wait on the result, the subscription handle is
   * added to the RouteController's wait list.
   */


  //XXX move into subscription class? look into arunoda's work.
  subscribe: function (/* same as Meteor.subscribe */) {
    var self = this;

    var waitApi = (function () {
      return {
        wait: function () {
          self._waitList.push(this);
          added = true;
        }
      };
    })();

    var handle = Meteor.subscribe.apply(this, arguments);
    return _.extend(handle, waitApi);
  },

  /**
   * Either specify a template to render or call with no arguments to render the
   * RouteController's template plus all of the yieldTemplates.
   * 
   * XXX can we have some lifecycle callbacks here? would be nice to give
   * iron-transitioner a place to plug in. Maybe onSetRegion(fn)?
   */

  render: function (template, options) {
    var to;
    var template;
    var layout;
    var self = this;

    var addRenderedYield = function (key) {
      if (self._renderedYields) {
        //XXX doesn't this creap into the ui manager?
        key = key || 'main';
        self._renderedYields.push(key);
      }
    };

    if (arguments.length == 0) {
      this.setRegion(this.template);
      addRenderedYield();
      this.renderYields();
    } else {
      options = options || {};
      to = options.to;
      this.setRegion(to, template);
      addRenderedYield(to);
    }
  },
  
  // render all the templates 
  // XXX renderRegions?
  renderYields: function() {
    var self = this;
    
    _.each(this.yieldTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  _run: function () {
    var self = this;
    // make sure the controller is stopped if it's
    // already running
    this.stop();

    self.stopped = false;

    //XXX clean this up
    if (!Router._hasJustReloaded)
      this.runHooks('load');
    Router._hasJustReloaded = false;

    // in case a load hook stopped the contoller
    if (this.stopped)
      return;

    this._computation = Deps.autorun(function () {
      var args = _.toArray(arguments);
      var action = _.isFunction(self.action) ? self.action : self[self.action];

      Utils.assert(action,
        "You don't have an action named \"" + self.action + "\" defined on your RouteController");

      self._renderedYields = [];

      // when the waitlist status changes it will get cleared and then
      // populated again from any before hooks or action functions. For
      // subscriptions, we take advantage of the fact that Meteor won't subscribe
      // again to the same subscription because of a computation rerun.
      // XXX this is suspect
      self._waitList.clear();

      /*
       * Each waitOn value could be an object, array or function. Because it's a
       * concatenation of waitOn options from Router -> Route -> RouteController.
       * So by the time we're done here we should just have a list of objects.
       */
      var waitOn = _.flatten(_.map(self.waitOn, function (fnOrHandle) {
        return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
      }));

      self._waitList.append(waitOn);

      //XXX move this
      self.layout(self.layoutTemplate);

      //XXX these should not be required, and move data into a special
      //data function
      // Step 1: Run the before hooks
      self.runHooks('before', [
        //Router.hooks.autoRenderLoadingTemplateHook,
        //Router.hooks.setDataHook,
        //Router.hooks.autoRenderNotFoundTemplateHook,
      ]);

      if (self.stopped) {
        self.isFirstRun = false;
        return;
      }

      // Step 2: If we're not stopped, run the action
      action.call(self);

      // Step 3: Run the after hooks
      self.runHooks('after', [
        Router.hooks.autoClearUnusedRegionsHook
      ]);
    });
    
    // We've run at least once
    self.isFirstRun = false;
  },

  stop: function (cb) {
    this.stopped = true;

    // don't call the unload hooks on the first run
    // only after we called stop at a later point.
    if (!this.isFirstRun)
      this.runHooks('unload');

    if (this._computation) {
      this._computation.stop();
      if (cb)
        this._computation.onInvalidate(cb);
    } else {
      cb && cb();
    }
  },

  wait: function (handle) {
    handle = _.isFunction(handle) ? handle.call(this) : handle;
    // handle could be an object or a array if a function returned an array
    this._waitList.append(handle);
  },

  action: function () {
    this.render();
  }
});
