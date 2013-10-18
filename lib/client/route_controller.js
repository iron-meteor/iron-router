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
     * A place to store subscription and other handles we intend to wait on in
     * downstream before hooks. We start the list off with whatever we got from
     * waitOn.
     */
    this._waitList = waitOn;
  },

  /**
   * Stop running this controller and redirect to a new path. Same parameters as
   * those of Router.go.
   *
   * @api public
   */

  redirect: function (/* args */) {
    this.stop();
    return this.router.go.apply(this.router, arguments);

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

  layoutTemplate: '__defaultLayout__',

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

  data: false,

  getData: function () {
    return this.router.getData();
  },

  setData: function (data) {
    this.router.setData(data);
  },

  /**
   * Wait on one or more subscriptions. Actually, anything with a ready method
   * will work. Handles defined here will be used automatically in the run
   * method to wait on certain subscriptions before rendering. It can be useful
   * when the data is required to determine whether to render the page. This can
   * be overridden by passing a waitOn option to the render method. If you want
   * to delay evaluation you can provide a function instead that won't be
   * executed at controller creation time.
   *
   * Examples:
   *  waitOn: handle
   *  waitOn: [handle1, handle2]
   *  waitOn: function () { return handle1; }
   *  waitOn: function () { return [handle1, handle2] }
   *
   * @type {Array|Object|Function}
   * @api public
   */

  waitOn: null,

  /*
   * Calls Meteor.subscribe but adds a wait method to the returned handle
   * object. If the user calls wait on the result, the subscription handle is
   * added to the RouteController's list of subscriptions to wait for. Then,
   * downstream before hooks can call this.wait(onReady, onWait).
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
   * Examples:
   *  this.render();
   *
   *  this.render('myTemplate');
   *
   *  this.render('myTemplate', {
   *    to: 'namedYield'
   *  });
   *
   *  this.render({
   *    'asideTemplate': { to: 'aside' },
   *    'mainTemplate': {} // render into main region
   *  });
   *
   * @param {String|Function|Object} [template] Optional template to render or
   * an object (map) of templates to named yields.
   * @param {Object} [options] Render options for a single template.
   * @param {String} [options.to] Render the template to a given named yield.
   * @param {Array|Object} [options.waitOn] Wait on one or more subscriptions
   * before rendering. If the loadingTemplate is defined then render that while
   * we're waiting.
   * @param {String|Function} [options.loadingTemplate]
   * @param {String|Function} [options.notFoundTemplate]
   * @api public
   */

  render: function (template, options) {
    var to
      , template
      , layout
      , self = this;

    if (_.isObject(template) && arguments.length === 1) {
      _.each(template, function (options, templateName) {
        self.render(templateName, options);
      });

      return;
    } 
    
    options = options || {};
    template = template || this.template;
    to = options.to;

    this.router.setTemplate(template, to);
  },

  setLayout: function (template) {
    this.router.setLayout(template);
  },

  runActionWithHooks: function () {
    var self = this
      , args = _.toArray(arguments);

    var action = _.isFunction(self.action) ? self.action : self[self.action];

    Utils.assert(action,
      "Uh oh, you don't seem to have an action named \"" + this.action + "\" defined on your RouteController");

    var setDataHook = function () {
      var self = this;
      var data = _.isFunction(self.data) ? self.data.call(self) : self.data;
      if (data !== false) {
        self.setData(data);
      }
    };

    var autoRenderNotFoundTemplateHook = function () {
      var self = this;
      // in case getData changes and suddenly returns null or undefined
      Deps.autorun(function () {
        var data = self.getData();
        if ((data === null || typeof data === 'undefined') 
            && self.notFoundTemplate) {
          self.render(self.notFoundTemplate);
          self.stop();
        }
      });
    };

    var autoRenderLoadingTemplateHook = function () {
      var self = this;
      
      var onReady = function () {
        // let a downstream hook handle the data part
      };

      var onWait = function () {
        if (self.loadingTemplate) {
          self.render(self.loadingTemplate);
          self.stop();
        }
      };

      self.wait(onReady, onWait);
    };

    if (this.layoutTemplate) {
      this.setLayout(this.layoutTemplate);
    } else {
      throw new Error('No layout template specified');
    }

    Deps.autorun(function () {
      self.stopped = false;

      self.runHooks('before', [
        autoRenderLoadingTemplateHook,
        setDataHook,
        autoRenderNotFoundTemplateHook,
      ]);

      if (self.stopped) {
        self.isFirstRun = false;
        return;
      }

      action.call(self);

      //XXX: clear unused yield regions here?
      self.runHooks('after');

      self.isFirstRun = false;
    });
  },

  /**
   * The default action for the controller. Called by the Router. Calls the main
   * render method and then the render method for each template specified in
   * yieldTemplates.
   *
   * @api public
   */
  run: function () {
    var self = this;

    this.render();

    if (this.yieldTemplates) {
      _.each(this.yieldTemplates, function (options, template) {
        self.render(template, options);
      });
    }
  },

  /**
   * Wait on an object or an array of object's with a ready handle.
   *
   * @param {Array|Object} [handles] optional
   * @param {Function} onReady
   * @param {Function} [onWait] optional 
   */

  wait: function (handles, onReady, onWait) {
    var isReady = true;
    var self = this;

    // if no handles are passed we'll assume you want the wait list
    // wait(onReady, onWait, undefined)
    if (_.isFunction(handles) && arguments.length <= 2) {
      onWait = onReady; 
      onReady = handles;
      handles = this._waitList;
    }

    if (!handles || handles.length === 0)
      return onReady.call(this);

    // let's make sure handles is an array
    handles = Utils.toArray(handles);

    // each handle could potentially be a function that returns a handle or an
    // array of handles.
    handles = _.map(handles, function(handle) {
      return (_.isFunction(handle)) ? handle.call(self) : handle;
    });
    
    if (!handles)
      throw new Error(
        'It looks like your waitOn function is not returning anything!');

    isReady = _.all(_.flatten(handles), function (handle) {
        return !handle || handle.ready();
    });
    
    onWait = onWait || function () {};
    return isReady ? onReady.call(this) : onWait.call(this);
  }
});
