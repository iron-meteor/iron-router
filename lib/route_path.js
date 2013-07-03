function assert (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

RoutePath = Class.extends({
  initialize: function (path, options) {
    assert(_.isString(path), 
      'RoutePath constructor requires a string path as the first parameter');

    this.keys = [];
    this.path = path || '';
    this.options = options || {};
  },

  compile: function () {
    var self = this
      , path
      , options = self.options;

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

    return this;
  },

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
        params[paramParts[0]] = paramParts[1];
      });
    }

    return params;
  },

  test: function (path) {
    return this.re.test(path);
  },

  exec: function (path) {
    var qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    return this.re.exec(pathname);
  },

  resolve: function (params) {
    var value
      , isValueDefined
      , result
      , wildCardCount = 0
      , path
      , query;

    params = params || [];
    query = params.query;

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
          return queryPart[0] + '=' + queryPart[1];
        }).join('&');
      }

      path = path + '?' + encodeURIComponent(query);
    }

    return path;
  }
});
