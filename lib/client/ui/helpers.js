Router.helpers = {};

var getData = function (thisArg) {
  return thisArg === window ? {} : thisArg;
};

var processPathArgs = function (routeName, options) {
  if (_.isObject(routeName)) {
    options = routeName;
    routeName = options.route;
  }

  var opts = options.hash || {};
  var params = opts.params || _.omit(opts, 'hash', 'query');
  var hash = opts.hash;
  var query = opts.query;

  // if called without opts, use the data context of the parent
  if (_.isEmpty(opts))
    params = getData(this);

  return {
    routeName: routeName,
    params: params,
    query: query,
    hash: hash
  };
};

_.extend(Router.helpers, {

  /**
   * Example Use:
   *
   *  {{pathFor 'items' params=this}}
   *  {{pathFor 'items' id=5 query="view=all" hash="somehash"}}
   *  {{pathFor route='items' id=5 query="view=all" hash="somehash"}}
   */

  pathFor: function (routeName, options) {
    var args = processPathArgs.call(this, routeName, options);

    return Router.path(args.routeName, args.params, {
      query: args.query,
      hash: args.hash
    });
  },

  /**
   * Same as pathFor but returns entire aboslute url.
   *
   */
  urlFor: function (routeName, options) {
    var args = processPathArgs.call(this, routeName, options);

    return Router.url(args.routeName, args.params, {
      query: args.query,
      hash: args.hash
    });
  }
});

_.each(Router.helpers, function (helper, name) {
  UI.registerHelper(name, helper);
});
