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
  this.before = [].concat(options.before || []).concat(this.before);
  this.after = [].concat(options.after || []).concat(this.after);

  this.template = options.template || 
    this.template || (this.route && this.route.name);
  this.loadingTemplate = options.loadingTemplate || this.loadingTemplate;
  this.notFoundTemplate = options.notFoundTemplate || this.notFoundTemplate;
  this.data = options.data || this.data;
};

RouteController.prototype = {
  typeName: 'RouteController',

  constructor: RouteController,

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
      , html
      , self = this;

    if (_.isObject(template) && arguments.length === 1) {
      _.each(template, function (options, templateName) {
        self.render(templateName, options);
      });
    } else {
      options = options || {};
      template = RouterUtils.getTemplateFunction(template || this.template);
      to = options.to;
      data = options.data || this.data;
      // if there's a Spark renderer we should probably return html
      // otherwise call onRender with template, data and to
      self.onRender(template, data, to);
    }
  },

  /**
   * The default action for the controller. Called by the Router.
   *
   */

  run: function () {
    this.render();
  },

  onRender: function (html, to) {
  }
};

_.extend(RouteController, {

  _MAIN_YIELD: '__main__',

  extend: function (definition) {
    return RouterUtils.extend(this, definition);
  },

  getPartialFunction: function (name, defaultFn) {
    var template = RouteController._yieldPartials.get(name);
    return ClientRouter._getTemplateFunction(template, defaultFn);
  },

  /**
   * A global map of named yields to template names or functions.
   *
   * Example:
   *  {
   *    '__main__': 'mainTemplate',
   *    'aside': 'asideTemplate',
   *    'footer': 'footerTemplate'
   *  }
   *
   * @type {ReactiveDict}
   * @api private
   */

  _yieldPartials: new ReactiveDict,

  _CurrentDataContext: (function () {
    var current = null;

    return {
      get: function () {
        return current;
      },

      withValue: function (value, fn) {
        var prev = current;
        try {
          current = value;
          fn();
          // flushing here causes the yield function to run
          // right away with the correct data context.
          Deps.flush();
        } finally {
          current = prev;
        }
      }
    };
  })()
});

//XXX inheritance methods (augment or extend)
//XXX handle inheritance for arrays and objects (before/after hooks)
//XXX waitOn and notFound implementation in render method or yield helper.
//XXX maybe remove the run method. is it really required?
