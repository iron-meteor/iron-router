/*****************************************************************************/
/* WaitList */
/*****************************************************************************/
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

    return res;
  },

  ready: function () {
    return _.all(this._list, function (handle) {
      return handle.ready();
    });
  }
};

/*****************************************************************************/
/* Predefined Hooks */
/*****************************************************************************/
var setDataHook = function () {
  var self = this;
  var data = _.isFunction(self.data) ? self.data.call(self) : self.data;
  if (data !== false) {
    self.setData(data);
  }
};

var autoRenderNotFoundTemplateHook = function () {
  var self = this;
  var data = self.getData();
  if ((data === null || typeof data === 'undefined') 
      && self.notFoundTemplate) {
    self.render(self.notFoundTemplate);
    this.renderYields();
    self.stop();
  }
};

var autoRenderLoadingTemplateHook = function () {
  var self = this;

  if (!this.ready()) {
    if (this.loadingTemplate) {
      this.render(this.loadingTemplate);
      this.renderYields();
      this.stop();
    }
  }
};

var autoClearUnusedYieldsHook = function () {
  this.router && this.router.clearUnusedYields(this._renderedYields);
};

/*****************************************************************************/
/* RouteController */
/*****************************************************************************/
RouteController = Utils.extend(IronRouteController, {
  constructor: function () {
    RouteController.__super__.constructor.apply(this, arguments);

    var self = this;

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
  },

  ready: function () {
    return this._waitList.ready();
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   *
   * @api public
   */

  redirect: function (/* args */) {
    this.stop();
    return this.router && this.router.go.apply(this.router, arguments);
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

  yieldTemplates: null,

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

  loadingTemplate: null,

  /**
   * Optional template to be used if data returns a falsy value. Used
   * automatically in the run method. You can also use it manually.
   *
   * @type {String|Function}
   * @api public
   */

  notFoundTemplate: null,

  /**
   * A default data object or function to be used as the data context in
   * rendering.
   *
   * @type {Object|Function}
   * @api public
   */

  data: {},

  getData: function () {
    return this.router && this.router.getData();
  },

  setData: function (data) {
    this.router && this.router.setData(data);
  },

  waitOn: null,

  /*
   * Calls Meteor.subscribe but adds a wait method to the returned handle
   * object. If the user calls wait on the result, the subscription handle is
   * added to the RouteController's wait list.
   */

  subscribe: function (/* same as Meteor.subscribe */) {
    var self = this;

    var waitApi = (function () {
      var added = false;

      return {
        wait: function () {
          // make idempotent
          if (!added) {
            self._waitList.push(this);
            added = true;
          }
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
   */

  render: function (template, options) {
    var to;
    var template;
    var layout;
    var self = this;

    var addRenderedYield = function (key) {
      if (self._renderedYields) {
        key = key || '__main__';
        self._renderedYields.push(key);
      }
    };

    if (arguments.length == 0) {
      this.router && this.router.setTemplate(this.template);
      addRenderedYield();
      
      this.renderYields();
    } else {
      options = options || {};
      to = options.to;
      this.router && this.router.setTemplate(template, to);
      addRenderedYield(to);
    }
  },
  
  // render all the templates 
  renderYields: function() {
    var self = this;
    
    _.each(this.yieldTemplates, function (opts, tmpl) {
      self.render(tmpl, opts)
    });
  },

  setLayout: function (template) {
    this.router && this.router.setLayout(template);
  },

  run: function () {
    var self = this;
    var args = _.toArray(arguments);
    var action = _.isFunction(this.action) ? this.action : this[this.action];

    Utils.assert(action,
      "You don't have an action named \"" + this.action + "\" defined on your RouteController");

    this.stopped = false;

    this._renderedYields = [];

    // when the waitlist status changes it will get cleared and then
    // populated again from any before hooks or action functions. For
    // subscriptions, we take advantage of the fact that Meteor won't subscribe
    // again to the same subscription because of a computation rerun.
    this._waitList.clear();

    /*
     * Each waitOn value could be an object, array or function. Because it's a
     * concatenation of waitOn options from Router -> Route -> RouteController.
     * So by the time we're done here we should just have a list of objects.
     */
    var waitOn = _.flatten(_.map(this.waitOn, function (fnOrHandle) {
      return _.isFunction(fnOrHandle) ? fnOrHandle.call(self) : fnOrHandle;
    }));

    this._waitList.append(waitOn);

    this.setLayout(this.layoutTemplate);

    // Step 1: Run the before hooks
    this.runHooks('before', [
      autoRenderLoadingTemplateHook,
      setDataHook,
      autoRenderNotFoundTemplateHook,
    ]);

    if (this.stopped) {
      this.isFirstRun = false;
      return;
    }

    // Step 2: If we're not stopped, run the action
    action.call(this);

    // Step 3: Run the after hooks
    this.runHooks('after', [
      autoClearUnusedYieldsHook
    ]);

    // We've run at least once
    this.isFirstRun = false;
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
