/**
 * Main class for handling data and rendering logic for a route.
 *
 * @constructor RouteController
 * @exports RouteController
 * @param {RouteContext} context
 * @param {Object} [options]
 * @param {String|Function} [options.template]
 * @param {String|Function} [options.loadingTemplate]
 * @param {String|Function} [options.notFoundTemplate]
 * @param {Object|Function} [options.data]
 */

RouteController = function (context, options) {
  var routerOptions
    , routeOptions;

  context = context || {};
  options = this.options = options || {};

  routerOptions = (context.router && context.router.options) || {};
  routeOptions = (context.route && context.route.options) || {};

  this.params = context.params || [];
  this.route = context.route;
  this.router = context.router;
  this.context = context;

  var self = this;
  var getOption = function(name) {
    return options[name] || routeOptions[name] || routerOptions[name] || self[name];
  }

  this['loadingTemplate'] = getOption('loadingTemplate');
  this['notFoundTemplate'] = getOption('notFoundTemplate');
  this['data'] = getOption('data');
  this['onBeforeRun'] = getOption('onBeforeRun');
  this['onAfterRun'] = getOption('onAfterRun');
  this['onBeforeRerun'] = getOption('onBeforeRerun');
  this['onAfterRerun'] = getOption('onAfterRerun');
  this['template'] = getOption('template') || (this.route && this.route.name);
  this['renderTemplates'] = getOption('renderTemplates');
  this['waitOn'] = getOption('waitOn');

  this.stopped = false;
  this.isFirstRun = true;

  this.before = []
    .concat(RouterUtils.toArray(routerOptions.before))
    .concat(RouterUtils.toArray(routeOptions.before))
    .concat(RouterUtils.toArray(options.before))
    .concat(RouterUtils.toArray(this.before));

  this.after = []
    .concat(RouterUtils.toArray(routerOptions.after))
    .concat(RouterUtils.toArray(routeOptions.after))
    .concat(RouterUtils.toArray(options.after))
    .concat(RouterUtils.toArray(this.after));
};

RouteController.prototype = {
  typeName: 'RouteController',

  constructor: RouteController,

  /**
   * Used to specify additional templates to render into named yield regions.
   * The default run method will first render the main template and then use
   * this property to render additional templates. Only used in the 'run'
   * method.
   *
   * Example:
   *
   *  renderTemplates: {
   *    'asideTemplateName': {to: 'aside', data: {}, waitOn: Sub},
   *    'footerTemplateName': {to: 'footer'}
   *  }
   *
   * @type {Object|null}
   * @api public
   */

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
   * @type {Object|Function}
   * @api public
   */

  data: {},

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
   * Run the hooks for the given name (e.g. before/after)
   *
   * @param {String} name The name of the hooks to run (e.g. before/after)
   * @api public
   */

  runHooks: function (name) {
    var self = this
      , hooks = self[name];

    if (!hooks) return;

    _.each(hooks, function (hook) {
      hook.call(self);
    });
  },

  /**
   * Calls the onRender method with a template function, data and to property.
   * The to property is for named yields. This method also handles waiting
   * (waitOn) and data.
   *
   * Examples:
   *  this.render();
   *
   *  this.render('myTemplate');
   *
   *  this.render('myTemplate', {
   *    to: 'namedYield',
   *    data: {},
   *    waitOn: subHandle, // or waitOn: function () { return subHandle; }
   *    loadingTemplate: 'loadingTemplate',
   *    notFoundTemplate: 'notFoundTemplate'
   *
   *  this.render({
   *    'asideTemplate': { to: 'aside' },
   *    'mainTemplate': { to: '__main__' } // or just call render()
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
    template = template || this.template;
    notFoundTemplate = options.notFoundTemplate || this.notFoundTemplate;
    loadingTemplate = options.loadingTemplate || this.loadingTemplate;

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
      var dataValue = _.isFunction(data) ? data.call(self) : data;

      // if this is the main template and data returned null and we have a
      // notFoundTemplate then render that instead of the regular template
      if (!dataValue && notFoundTemplate && !to)
        template = notFoundTemplate;

      // give the router a chance to do something with this
      self.onRender(template, {
        data: dataValue,
        to: to
      });
    };

    var onWait = function () {
      if (loadingTemplate && !to)
        self.onRender(loadingTemplate);
    };

    // wait requires an autorun. also, this isolates the data function to only
    // affect the current call to render and not the enclosing function. if you
    // use a reactive data source in the enclosing function (the action or run
    // method) that method is run in its own computation, unless you specify
    // reactive: false in the route options.
    Deps.autorun(function () {
      self.wait(waitOn, onReady, onWait);
    });
  },

  /**
   * The default action for the controller. Called by the Router. Calls the main
   * render method and then the render method for each template specified in
   * renderTemplates.
   *
   * @api public
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

    if (_.isFunction(handles)) {
      handles = handles.call(self);
      if (!handles)
        throw new Error(
          'It looks like your waitOn function is not returning anything!');
    }

    if (!_.isArray(handles))
      handles = [handles];

    _.each(handles, function (handle) {
      if (!handle.ready())
        isReady = false;
    });

    onWait = onWait || function () {};
    return isReady ? onReady.call(this) : onWait.call(this);
  },

  /**
   * Hook for Router to attach itself to the result of a render. This is called
   * by the render method one or more times.
   * @param {Function} template
   * @param {Object} [options]
   * @param {Object|Function} [options.data] The data context
   * @param {String} [options.to] The named yield region
   * @api public
   */

  onRender: function (template, options) {
  },

  /**
   * Hook called on the before the first run - either the run method being
   * called or another action being called. This method is called from the
   * router. It should only be called once. Not on reactive reruns.
   *
   * @api public
   */

  onBeforeRun: function () {
  },

  /**
   * Hook called after the first run - either the run method being
   * called or another action being called. This method is called from the
   * router. It should only be called once. Not on reactive reruns.
   *
   * @api public
   */

  onAfterRun: function () {
  },

  /**
   * Hook called before a reactive rerun. Called by the router.
   *
   * @api public
   */

  onBeforeRerun: function () {
  },

  /**
   * Hook called after a reactive rerun. Called by the router.
   *
   * @api public
   */

  onAfterRerun: function () {
  },
  
  
  /**
   * Set the stopped property on the controller to true. This would typically be
   * used in a before filter or hook. If the controller is marked as stopped, it
   * tells the router not to call the controller's action or afterRun callbacks
   * and hooks. This property is not used internally by the controller.
   *
   * @api public
   */
  stop: function() {
    this.stopped = true;
  }
};

_.extend(RouteController, {
  /**
   * Inherit from RouteController
   *
   * @param {Object} definition Prototype properties for inherited class.
   */

  extend: function (definition) {
    return RouterUtils.extend(this, definition);
  }
});
