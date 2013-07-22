/**
 * @export RouteController
 */
RouteController = function (context, options) {
  this.request = context.options.request;
  this.response = context.options.response;
  this.params = context.params || [];
  this.route = context.route;
  this.router = context.router;
  this.context = context;
};

RouteController.prototype = {
  typeName: 'RouteController',

  constructor: RouteController,

  run: function () {
    this.response.end();
  }
};
