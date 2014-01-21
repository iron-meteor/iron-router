Route = function (router, name, options) {
  var path;

  Utils.assert(router instanceof IronRouter);
  Utils.assert(_.isString(name),
    'Route constructor requires a name as the second parameter');

  options = this.options = options || {};
  path = options.path || ('/' + name);

  this.router = router;
  this.originalPath = path;

  if (_.isString(this.originalPath) && this.originalPath.charAt(0) !== '/')
    this.originalPath = '/' + this.originalPath;

  this.name = name;
  this.where = options.where || 'client';
  this.action = options.action || this.action;

  this.hooks = {};
  options.load = Utils.toArray(options.load);
  options.before = Utils.toArray(options.before);
  options.after = Utils.toArray(options.after);
  options.unload = Utils.toArray(options.unload);

  this.compile();
};

Route.classifyTemplateName = function (str) {
  return Utils.classify(str);
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

    if (self.originalPath instanceof RegExp) {
      self.re = self.originalPath;
    } else {
      path = self.originalPath
        .replace(/(.)\/$/, '$1')
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

  params: function (path) {
    if (!path) return null;

    var params = []
      , m = this.exec(path)
      , queryString
      , keys = this.keys
      , key
      , value;

    if (!m)
      throw new Error('The route named "' + this.name + '" does not match the path "' + path + '"');

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

  exec: function (path) {
    return this.re.exec(this.normalizePath(path));
  },

  resolve: function (params, options) {
    var value
      , isValueDefined
      , result
      , wildCardCount = 0
      , path = this.originalPath
      , hash
      , query
      , isMissingParams = false;

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
              isMissingParams = true;
              return;
            }

            value = _.isFunction(value) ? value.call(params) : value;
            var escapedValue = _.map(String(value).split('/'), function (segment) {
              return encodeURIComponent(segment);
            }).join('/');
            return slash + escapedValue
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

            var paramValue = String(params[wildCardCount++]);
            return _.map(paramValue.split('/'), function (segment) {
              return encodeURIComponent(segment);
            }).join('/');
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

    return isMissingParams ? '/' : path;
  },

  path: function (params, options) {
    return this.resolve(params, options);
  },

  url: function (params, options) {
    var path = this.path(params, options);
    if (path[0] === '/')
      path = path.slice(1, path.length);
    return Meteor.absoluteUrl() + path;
  },

  run: function (path, options) {
    var self = this;
    var routeMatch = new RouteMatch(self, path, options);
    self.setData(routeMatch.data);
    self.runHooks(routeMatch, 'before');
    self.runAction(routeMatch)
    self.runHooks(routeMatch, 'after');
  },

  setData: function (data) {
    this.router.setData(data);
  },

  runAction: function (routeMatch) {
    var action = _.isFunction(this.action) ? this.action : this[this.action];
    action.call(routeMatch);
  },

  runHooks: function (routeMatch, hookName, more) {
    Utils.assert(routeMatch, 'routeMatch param required');
    Utils.assert(hookName, 'hookName param required');

    var ctor = this.constructor;
    more = Utils.toArray(more);

    var collectInheritedHooks = function (ctor) {
      var hooks = [];

      if (ctor.__super__)
        hooks = hooks.concat(collectInheritedHooks(ctor.__super__.constructor));

      return ctor.prototype[hookName] ?
        hooks.concat(ctor.prototype[hookName]) : hooks;
    };

    var prototypeHooks = collectInheritedHooks(this.constructor);
    var routeHooks = this.options[hookName];
    var globalHooks = this.router.getHooks(hookName, this.name);

    var allHooks = globalHooks.concat(routeHooks).concat(prototypeHooks).concat(more);

    for (var i = 0, hook; hook = allHooks[i]; i++) {
      if (routeMatch.stopped)
        break;
      this.runHook(hook, routeMatch);
    }
  },

  runHook: function (hook, routeMatch) {
    hook.call(routeMatch);
  },

  action: function () {}
};

_.extend(Route, {
  extend: function (definition) {
    return Utils.extend(this, definition, function (definition) {});
  }
});
