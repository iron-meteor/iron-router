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
    this.waitOn = []
      .concat(Utils.toArray(this.options.waitOn))
      .concat(Utils.toArray(this.waitOn));
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

    var onDataReady = function () {
      var data = _.isFunction(self.data) ? self.data.call(self) : self.data;

      if (data !== false) {
        self.setData(data);
      }

      this.stopped = false;

      this.runHooks('before', function () {
        if ((data === null || typeof data === 'undefined') 
            && self.notFoundTemplate) {
          self.render(self.notFoundTemplate);
          self.stop();
        }
      });

      if (this.stopped) {
        this.isFirstRun = false;
        return;
      }

      action.call(this);
      this.runHooks('after');
      this.isFirstRun = false;
    };

    var onWaiting = function () {
      if (self.loadingTemplate) {
        self.render(self.loadingTemplate);
        self.stop();
      }
    };

    if (this.layoutTemplate) {
      this.setLayout(this.layoutTemplate);
    } else {
      throw new Error('No layout template specified');
    }

    Deps.autorun(function () {
      self.wait(self.waitOn, onDataReady, onWaiting);
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
   * Wait on one or more subscriptions. Must be run in a reactive computation in
   * order to work property. Calls the onReady method when all handles are
   * ready. Otherwise calls the onWait function.
   *
   * Examples:
   *
   *  this.wait(function () { return handle; }, onReady, onWait);
   *  this.wait(function () { return [handle1, handle2]}, onReady, onWait );
   *  this.wait(handle, onReady, onWait);
   *
   * @param {Array|SubscriptionHandle|Function} handles
   * @param {Function} onReady Function to be called when all handles are ready
   * @param {Function} [onWait] Function to call while waiting
   * @api public
   */

  wait: function (handles, onReady, onWait) {
    var isReady = true
      , self = this;

    if (!handles)
      return onReady.call(this);
    
    // each handle could potentially be a function that returns handles, check
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
