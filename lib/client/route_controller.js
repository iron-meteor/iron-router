/**
 * Handles logic for a particular route. Responsibilities include rendering a
 * template, waiting on data before rendering, before and after hooks.
 *
 * @constructor RouteController
 * @param {RouteContext} context
 * @param {Object} [options]
 */

//@export RouteController
RouteController = function (context, options) {
  context = context || {};
  options = this.options = options || {};

  this.params = context.params || [];
  this.route = context.route;
  this.router = context.router;
  this.context = context;
  this.before = []
    .concat(RouterUtils.toArray(options.before))
    .concat(RouterUtils.toArray(this.before));

  this.after = []
    .concat(RouterUtils.toArray(options.after))
    .concat(RouterUtils.toArray(this.after));

  this.template = options.template || 
    this.template || (this.route && this.route.name);
  this.loadingTemplate = options.loadingTemplate || this.loadingTemplate;
  this.notFoundTemplate = options.notFoundTemplate || this.notFoundTemplate;
  this.data = options.data || this.data;
};

RouteController.prototype = {
  typeName: 'RouteController',

  constructor: RouteController,

  waitOn: null,

  renderTemplates: null,

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
   * @type {Boolean|Object|Function}
   * @api public
   */

  data: true,

  /**
   * Wait on one or more subscriptions. Actually, anything with a ready method
   * will work. Handles defined here will be used automatically in the run
   * method to wait on certain subscriptions before rendering. It can be useful
   * when the data is required to determine whether to render the page. This can
   * be overridden by passing a waitOn option to the render method.
   *
   * @type {Array|Object} An array of subscriptions or a single subscription.
   * @api public
   */

  waitOn: null,

  /**
   * Before hooks to run before the controller action is called. The Router will
   * typically call the runHooks method to call these functions. This property
   * is defined for inheritance. Each instance gets its own copy of before hooks
   * at constructor time. This means that before hooks added to the prototype
   * after constructor time will not be used in the instance.
   *
   * @type Array
   * @api public
   */

  before: [],

  /**
   * After hooks to run after the controller action is called. The Router will
   * typically call the runHooks method to call this function. This property is
   * defined for inheritance. Each instance gets its own copy of after hooks at
   * constructor time. This means that after hooks added to the prototype after
   * constructor time will not be used in the instance.
   */

  after: [],

  /**
   * Run the hooks for the given name (before/after).
   *
   * @param {String} name The name of the hooks to run (e.g. before/after)
   * @api public
   */

  runHooks: function (name) {
    var self = this
      , hooks = self[name];

    if (!hooks) return;

    Deps.afterFlush(function () {
      _.each(hooks, function (hook) {
        hook.call(self);
      });
    });
  },

  /**
   * XXX update docs for new behavior.
   * Render a template. Templates can be rendered into a named yield region or
   * to the main (anonymous) yield. The first parameter can be the name of a
   * template, a function to act as the template, or an object of template name
   * to option pairs. The last case is the same as calling render multiple times
   * with different templates.
   *
   * @param {String|Function|Object} [template]
   * @param {Object} [options] Render options for a single template.
   * @param {String} [options.to] Render the template to a given named yield.
   * @param {Array|Object} [options.waitOn] Wait on one or more subscriptions
   * before rendering. If the loadingTemplate is defined then render that while
   * we're waiting.
   * @api public
   */

  render: function (template, options) {
    var data
      , to
      , template
      , notFoundTemplate
      , loadingTemplate
      , waitOn
      , self = this;

    if (_.isObject(template) && arguments.length === 1) {
      _.each(template, function (options, templateName) {
        self.render(templateName, options);
      });
      return;
    } 
    
    options = options || {};
    template = RouterUtils.getTemplateFunction(template || this.template);

    if (notFoundTemplate = options.notFoundTemplate || this.notFoundTemplate)
      notFoundTemplate = RouterUtils.getTemplateFunction(notFoundTemplate);

    if (loadingTemplate = options.loadingTemplate || this.loadingTemplate)
      loadingTemplate = RouterUtils.getTemplateFunction(loadingTemplate);

    to = options.to;

    if (typeof options.data !== 'undefined')
      data = options.data;
    else
      data = this.data;

    if (typeof options.waitOn !== 'undefined')
      waitOn = options.waitOn;
    else
      waitOn = this.waitOn;

    var onReady = function () {
      if (_.isFunction(data))
        data = data.call(self);

      // if this is the main template and data returned null and we have a
      // notFoundTemplate then render that instead of the regular template
      if (!data && notFoundTemplate && !to)
        template = notFoundTemplate;

      // give the router a chance to do something with this
      self.onRender(template, data, to);
    };

    var onWait = function () {
      if (loadingTemplate && !to)
        self.onRender(loadingTemplate);
    };

    return this.wait(waitOn, onReady, onWait);
  },

  /**
   * The default action for the controller. Called by the Router.
   *
   */

  run: function () {
    var self = this;

    self.render();

    if (self.renderTemplates) {
      _.each(self.renderTemplates, function (options, template) {
        self.render(template, options);
      });
    }
  },

  /**
   * Wait on one or more subscriptions. Must be run in a reactive context in
   * order to work property. Calls the onReady method when all handles are
   * ready. Otherwise calls the onWait function.
   */

  wait: function (handles, onReady, onWait) {
    var isReady = true;

    if (!handles)
      return onReady.call(this);

    if (!_.isArray(handles))
      handles = [handles];

    _.each(handles, function (handle) {
      if (!handle.ready())
        isReady = false;
    });

    onWait = onWait || function () {};
    return isReady ? onReady.call(this) : onWait.call(this);
  },

  onRender: function (template, data, to) {
  }
};

_.extend(RouteController, {
  extend: function (definition) {
    return RouterUtils.extend(this, definition);
  }
});
