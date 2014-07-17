/**
 * Simple plugin wrapper around the loading hook.
 */
Router.plugins.loading = function (router, options) {
  router.onBeforeAction('loading', options);
};

/**
 * Simple plugin wrapper around the dataNotFound hook.
 */
Router.plugins.dataNotFound = function (router, options) {
  router.onBeforeAction('dataNotFound', options);
};
