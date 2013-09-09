/**
 * The main Route class.
 *
 * Example: 
 *  new Route(router, 'postShow', {path: '/posts/:_id'});
 *  new Route(router, 'postShow', {path: '/posts/:_id'}, function () {});
 *  new Route(router, 'postShow', {path: '/posts/:_id', handler: function () {}});
 *
 * @constructor Route
 * @exports Route
 * @param {IronRouter} router
 * @param {String} name The name will be used as the default path if none is
 * specified in the options. For example, 'test' will become '/test'
 * @param {Object} [options]
 * @param {String} [options.path]
 * @param {Function} [options.handler]
 * @param {Function} [handler] Handler function can be passed as the last
 * parameter or as an option. A handler function is not required but will be
 * used by the Router if one is provided.
 * @api public
 */

Route = function (router, name, options, handler) {
  var path;

  RouterUtils.assert(router instanceof IronRouter);

  RouterUtils.assert(_.isString(name),
    'Route constructor requires a name as the second parameter');

  if (_.isFunction(options))
    options = { handler: options };

  if (_.isFunction(handler))
    options.handler = handler;

  options = this.options = options || {};
  path = options.path || ('/' + name);

  this.router = router;
  this.originalPath = path;

  if (this.originalPath.charAt(0) !== '/')
    this.originalPath = '/' + this.originalPath;

  this.name = name;
  this.where = options.where || 'client';
  this.handler = this.handler || options.handler;
  this.action = options.action || 'run';
  this.controller = options.controller;

  if (typeof options.reactive !== 'undefined')
    this.isReactive = options.reactive;
  else
    this.isReactive = true;

  this.compile();
};

Route.prototype = {
  constructor: Route,

  /**
   * Compile the path. 
   *
   *  @return {Route}
   *  @api public
   */

  compile: function () {
    var self = this
      , path
      , options = self.options;

    this.keys = [];

    if (self.path instanceof RegExp) {
      self.re = self.originalPath;
    } else {
      path = self.originalPath
        .concat(options.strict ? '' : '/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/#/, '/?#')
        .replace(
          /(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
          function (match, slash, format, key, capture, optional){
            self.keys.push({ name: key, optional: !! optional });
            slash = slash || '';
            return ''
              + (optional ? '' : slash)
              + '(?:'
              + (optional ? slash : '')
              + (format || '') 
              + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
              + (optional || '');
          }
        )
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.*)');
      
      self.re = new RegExp('^' + path + '$', options.sensitive ? '' : 'i');
    }

    return this;
  },

  /**
   * Returns an array of parameters given a path. The array may have named
   * properties in addition to indexed values.
   *
   * @param {String} path
   * @return {Array}
   * @api public
   */

  params: function (path) {
    if (!path) return null;

    var params = []
      , m = this.exec(path)
      , queryString
      , keys = this.keys
      , key
      , value;

    for (var i = 1, len = m.length; i < len; ++i) {
      key = keys[i - 1];
      value = typeof m[i] == 'string' ? decodeURIComponent(m[i]) : m[i];
      if (key) {
        params[key.name] = params[key.name] !== undefined ? 
          params[key.name] : value;
      } else
        params.push(value);
    }

    path = decodeURI(path);

    queryString = path.split('?')[1];
    if (queryString)
      queryString = queryString.split('#')[0];

    params.hash = path.split('#')[1];

    if (queryString) {
      _.each(queryString.split('&'), function (paramString) {
        paramParts = paramString.split('=');
        params[paramParts[0]] = decodeURIComponent(paramParts[1]);
      });
    }

    return params;
  },

  normalizePath: function (path) {
    var origin = Meteor.absoluteUrl();

    path = path.replace(origin, '');

    var queryStringIndex = path.indexOf('?');
    path = ~queryStringIndex ? path.slice(0, queryStringIndex) : path;

    var hashIndex = path.indexOf('#');
    path = ~hashIndex ? path.slice(0, hashIndex) : path;

    if (path.charAt(0) !== '/')
      path = '/' + path;

    return path;
  },

  /**
   * Returns true if the path matches and false otherwise.
   *
   * @param {String} path
   * @return {Boolean} 
   * @api public
   */
  test: function (path) {
    return this.re.test(this.normalizePath(path));
  },

  /**
   * Calls the exec method of the compiled path regular expression and returns
   * the result.
   *
   * @param {String} path
   * @return {Array|null}
   * @api public
   */
  exec: function (path) {
    return this.re.exec(this.normalizePath(path));
  },

  /**
   * Given an object or array of params, returns a path. This is used to create
   * Handlebars pathFor and urlFor helpers for example. If the params object has
   * a 'query' property, its values are used as query params.
   *
   * @param {Object|Array} params
   * @param {String|Object} [params.query] Query parameters to be appended to
   * the path.
   * @return {String}
   * @api public
   */

  resolve: function (params, options) {
    var value
      , isValueDefined
      , result
      , wildCardCount = 0
      , path = this.originalPath
      , hash
      , query;

    options = options || {};
    params = params || [];
    query = options.query;
    hash = options.hash;

    if (path instanceof RegExp) {
      throw new Error('Cannot currently resolve a regular expression path');
    } else {
      path = this.originalPath
        .replace(
          /(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
          function (match, slash, format, key, capture, optional) {
            slash = slash || '';
            value = params[key];
            isValueDefined = typeof value !== 'undefined';

            if (optional && !isValueDefined) {
              slash = '';
              value = '';
            } else if (!isValueDefined) {
              throw new Error(key + ' not found in params');
            }

            value = _.isFunction(value) ? value.call(params) : value;
            return slash + encodeURIComponent(value);
          }
        )
        .replace(
          /\*/g,
          function (match) {
            if (typeof params[wildCardCount] === 'undefined') {
              throw new Error(
                'You are trying to access a wild card parameter at index ' + 
                wildCardCount +
                ' but the value of params at that index is undefined');
            }

            return encodeURIComponent(params[wildCardCount++]);
          }
        );

      if (_.isObject(query)) {
        query = _.map(_.pairs(query), function (queryPart) {
          return queryPart[0] + '=' + encodeURIComponent(queryPart[1]);
        }).join('&');

        if (query && query.length)
          path = path + '/?' + query;
      }

      if (hash) {
        hash = encodeURI(hash.replace('#', ''));
        path = query ? 
          path + '#' + hash : path + '/#' + hash;
      }
    }
    
    return path;
  },

  /**
   * Returns a path given a params object or array. Proxies to the RoutePath
   * instance stored in compiledPath.
   *
   * Example:
   *  route = new Route(router, 'postShow', {path: '/posts/:id'});
   *  route.path({id: 5}) => '/posts/5'
   *
   * @param {Array|Object} params
   * @return {String}
   * @api public
   */

  path: function (params, options) {
    return this.resolve(params, options);
  },

  /**
   * Returns an absolute url given a params object or array. Uses
   * Meteor.absoluteUrl() for the root url.
   *
   * Example:
   *  route = new Route(router, 'postShow', {path: '/posts/:id'});
   *  route.url({id: 5}) => 'http://www.eventedmind.com/posts/5'
   *
   * @param {Array|Object} params
   * @return {String}
   * @api public
   */

  url: function (params, options) {
    var path = this.path(params, options);
    if (path[0] === '/')
      path = path.slice(1, path.length);
    return Meteor.absoluteUrl() + path;
  },

  getController: function (path, options) {
    var handler
      , controllerClass
      , controller
      , action
      , routeName;

    //XXX double check hash and query params stuff
    // where does that get passed in? 
    options = _.extend({}, this.router.options, this.options, options || {}, {
      path: path,
      route: this,
      router: this.router,
      where: this.where,
      params: this.params(path)
    });

    var classify = function (name) {
      return RouterUtils.classify(name);
    };

    var root = RouterUtils.global();
    var params = this.params(path);

    var findController = function (name) {
      var controller = root[name];
      if (typeof controller === 'undefined') {
        throw new Error(
          'controller "' + name + '" is not defined');
      }

      return controller;
    };

    // case 1: handler defined directly on the route
    if (handler = this.handler) {
      controller = new RouteController(this.router, options);
      controller[this.action] = handler;
      return controller;
    }

    // case 2: controller option is defined on the route
    if (this.controller) {
      controllerClass = _.isString(this.controller) ?
        findController(this.controller) : this.controller;
      controller = new controllerClass(this.router, options);
      return controller;
    }

    // case 3: intelligently find the controller class in global namespace
    routeName = this.name;

    if (routeName) {
      controllerClass = root[classify(routeName + 'Controller')];

      if (controllerClass) {
        controller = new controllerClass(this.router, options);
        return controller;
      }
    }

    // case 4: nothing found so create a default controller
    return new RouteController(this.router, options);
  }
};
