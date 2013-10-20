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
    return this.router.getData();
  },

  setData: function (data) {
    this.router.setData(data);
  },

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
      var data = self.getData();
      if ((data === null || typeof data === 'undefined') 
          && self.notFoundTemplate) {
        self.render(self.notFoundTemplate);
        self.stop();
      }
    };

    var autoRenderLoadingTemplateHook = function () {
      var self = this;

      if (!this.ready()) {
        if (this.loadingTemplate) {
          this.render(this.loadingTemplate);
          this.stop();
        }
      }
    };

    this.setLayout(this.layoutTemplate);

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

  //XXX move into an action function and create method for rendering or clearing
  //specific regions.
  run: function () {
    var self = this;

    this.render();

    if (this.yieldTemplates) {
      _.each(this.yieldTemplates, function (options, template) {
        self.render(template, options);
      });
    }
  }
});
