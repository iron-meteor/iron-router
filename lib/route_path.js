/**
 * Compiles a path with support for required, optional, wildcard and named
 * wildcard parameters. Also supports regular expression paths.
 *
 * Examples:
 *  "/posts"
 *  "/posts/:_id"
 *  "/posts/:paramOne/:paramTwo"
 *  "/posts/:required/:optional?"
 *  "/posts/*"
 *  "/posts/:file(*)"
 *  /^\/commits\/(\d+)\.\.(\d+)/
 *
 *  @constructor RoutePath
 *  @param {String|RegExp} path
 *  @param {Object} [options]
 *  @param {Boolean} [options.sensitive] Paths are case sensitive
 *  @param {Boolean} [options.strict] Truncate /? from path
 *  @api private
 */

RoutePath = function (path, options) {
  RouterUtils.assert(arguments.length >= 1,
         'RoutePath constructor requires a path as the first parameter');

  this.keys = [];
  this.path = path || '';
  this.options = options || {};
};

RoutePath.prototype = {
  typeName: 'RoutePath',

  constructor: RoutePath,

  /**
   * Compile the path. Typically you compile the path immediately after it is
   * initialized, but this is not required.
   *
   *  @return {RoutePath}
   *  @api public
   */

  compile: function () {
    var self = this
      , path
      , options = self.options;

    if (self.path instanceof RegExp) {
      self.re = self.path;
    } else {
      path = self.path
        .concat(options.strict ? '' : '/?')
        .replace(/\/\(/g, '(?:/')
        .replace(
          /(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
          function(match, slash, format, key, capture, optional){
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

    queryString = decodeURI(path).split('?')[1];

    if (queryString) {
      _.each(queryString.split('&'), function (paramString) {
        paramParts = paramString.split('=');
        params[paramParts[0]] = decodeURIComponent(paramParts[1]);
      });
    }

    return params;
  },

  /**
   * Returns true if the path matches and false otherwise.
   *
   * @param {String} path
   * @return {Boolean} 
   * @api public
   */
  test: function (path) {
    return this.re.test(path);
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
    var qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    return this.re.exec(pathname);
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
  resolve: function (params) {
    var value
      , isValueDefined
      , result
      , wildCardCount = 0
      , path = this.path
      , query;

    params = params || [];
    query = params.query;

    if (path instanceof RegExp) {
      throw new Error('Cannot currently resolve a regular expression path');
    } else {
      path = this.path
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

      if (query) {
        if (_.isObject(query)) {
          query = _.map(_.pairs(query), function (queryPart) {
            return queryPart[0] + '=' + encodeURIComponent(queryPart[1]);
          }).join('&');
        }

        path = path + '?' + query;
      }
    }
    
    return path;
  }
};
