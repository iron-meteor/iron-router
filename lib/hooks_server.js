// Add this to prevent errors of hooks are called in server or shared code.

skip = function() {
  this.next();
}

Router.hooks.loading = skip;

Router.hooks.dataNotFound = skip;
