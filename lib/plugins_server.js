/**
 * Use this until underscore's _.noop is available
 */
noop = function () {
  return undefined;
}

/**
 * Simple placeholder plugins.
 *
 * This makes it possible to call Router.plugin both on client and server
 * and only have the plugins do it's thing on the client.
 * In the future the plugins maybe doing something different on the server
 * than on the client.
 */
Router.plugins.loading = noop;

Router.plugins.dataNotFound = noop;
