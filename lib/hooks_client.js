/**
 * The default anonymous loading template.
 */
var defaultLoadingTemplate = new Template('DefaultLoadingTemplate', function () {
  return 'Loading...';
});

/**
 * Automatically render a loading template into the main region if the
 * controller is not ready (i.e. this.ready() is false). If no loadingTemplate
 * is defined use some default text.
 */

Router.hooks.loading = function () {
  // if we're ready just pass through
  if (this.ready()) {
    this.next();
    return;
  }

  var template = this.lookupOption('template', 'loading');
  this.render(template || defaultLoadingTemplate);
  this.renderRegions();
};

/**
 * The default anonymous data not found template.
 */
var defaultDataNotFoundTemplate = new Template('DefaultDataNotFoundTemplate', function () {
  return 'Data not found...';
});

/**
 * Render a "data not found" template if a global data function returns a falsey
 * value
 */
Router.hooks.dataNotFound = function () {
  if (!this.ready()) {
    this.next();
    return;
  }

  var data = this.lookupOption('data');
  var dataValue;
  var template = this.lookupOption('template', 'dataNotFound');

  if (typeof data === 'function') {
    if (!(dataValue = data.call(this))) {
      this.render(template || defaultDataNotFoundTemplate);
      this.renderRegions();
      return;
    }
  }

  // okay never mind just pass along now
  this.next();
};
