/**
 * Utility methods available privately to the package.
 */

Utils = {};

/**
 * global object on node or window object in the browser.
 */

Utils.global = (function () { return this; })();

/**
 * Assert that the given condition is truthy.
 *
 * @param {Boolean} condition The boolean condition to test for truthiness.
 * @param {String} msg The error message to show if the condition is falsy.
 */

Utils.assert = function (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

var warn = function (msg) {
  if (Router.options.supressWarnings !== true) {
    console && console.warn && console.warn(msg);
  }
};

Utils.warn = function (condition, msg) {
  if (!condition)
    warn(msg);
};

/**
 * deprecatation notice to the user which can be a string or object
 * of the form:
 *
 * {
 *  name: 'somePropertyOrMethod',
 *  where: 'RouteController',
 *  instead: 'someOtherPropertyOrMethod',
 *  message: ':name is deprecated. Please use :instead instead'
 * }
 */
Utils.notifyDeprecated = function (info) {
  var name;
  var instead;
  var message;
  var where;
  var defaultMessage = "[:where] ':name' is deprecated. Please use ':instead' instead.";

  if (_.isObject(info)) {
    name = info.name;
    instead = info.instead;
    message = info.message || defaultMessage;
    where = info.where || 'IronRouter';
  } else {
    message = info;
    name = '';
    instead = '';
    where = '';
  }

  warn(
      '<deprecated> ' + 
      message
      .replace(':name', name)
      .replace(':instead', instead)
      .replace(':where', where) +
      ' ' +
      (new Error).stack
  );
};

Utils.withDeprecatedNotice = function (info, fn, thisArg) {
  return function () {
    Utils.notifyDeprecated(info);
    return fn && fn.apply(thisArg || this, arguments);
  };
};

// warn if we already have a deprecate prototype
// method on Function!
Utils.warn(!Function.prototype.deprecate, "It looks like the Function.prototype already has a deprecate method, and the iron-router package is about to override it!");

// so we can do this:
//   getController: function () {
//    ...
//   }.deprecate({...})
Function.prototype.deprecate = function (info) {
  var fn = this;
  return Utils.withDeprecatedNotice(info, fn);
};

/**
 * Given the name of a property, resolves to the value. Works with namespacing
 * too. If first parameter is already a value that isn't a string it's returned
 * immediately.
 *
 * Examples:
 *  'SomeClass' => window.SomeClass || global.someClass
 *  'App.namespace.SomeClass' => window.App.namespace.SomeClass
 *
 * @param {String|Object} nameOrValue
 */

Utils.resolveValue = function (nameOrValue) {
  var global = Utils.global;
  var parts;
  var ptr;

  if (_.isString(nameOrValue)) {
    parts = nameOrValue.split('.')
    ptr = global;
    for (var i = 0; i < parts.length; i++) {
      ptr = ptr[parts[i]];
      if (!ptr)
        return undefined;
    }
  } else {
    ptr = nameOrValue;
  }

  // final position of ptr should be the resolved value
  return ptr;
};

Utils.hasOwnProperty = function (obj, key) {
  var prop = {}.hasOwnProperty;
  return prop.call(obj, key);
};

/**
 * Don't mess with this function. It's exactly the same as the compiled
 * coffeescript mechanism. If you change it we can't guarantee that our code
 * will work when used with Coffeescript. One exception is putting in a runtime
 * check that both child and parent are of type Function.
 */

Utils.inherits = function (child, parent) {
  if (Utils.typeOf(child) !== '[object Function]')
    throw new Error('First parameter to Utils.inherits must be a function');

  if (Utils.typeOf(parent) !== '[object Function]')
    throw new Error('Second parameter to Utils.inherits must be a function');

  for (var key in parent) {
    if (Utils.hasOwnProperty(parent, key))
      child[key] = parent[key];
  }

  function ctor () {
    this.constructor = child;
  }

  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};

Utils.toArray = function (obj) {
  if (!obj)
    return [];
  else if (Utils.typeOf(obj) !== '[object Array]')
    return [obj];
  else
    return obj;
};

Utils.typeOf = function (obj) {
  if (obj && obj.typeName)
    return obj.typeName;
  else
    return Object.prototype.toString.call(obj);
};

Utils.extend = function (Super, definition, onBeforeExtendPrototype) {
  if (arguments.length === 1)
    definition = Super;
  else {
    definition = definition || {};
    definition.extend = Super;
  }

  return Utils.create(definition, {
    onBeforeExtendPrototype: onBeforeExtendPrototype
  });
};

Utils.create = function (definition, options) {
  var Constructor
    , extendFrom
    , savedPrototype;

  options = options || {};
  definition = definition || {};

  if (Utils.hasOwnProperty(definition, 'constructor'))
    Constructor = definition.constructor;
  else {
    Constructor = function () {
      if (Constructor.__super__ && Constructor.__super__.constructor)
        return Constructor.__super__.constructor.apply(this, arguments);
    }
  }

  extendFrom = definition.extend;

  if (definition.extend) delete definition.extend;

  var inherit = function (Child, Super, prototype) {
    Utils.inherits(Child, Utils.resolveValue(Super));
    if (prototype) _.extend(Child.prototype, prototype);
  };

  if (extendFrom) {
    inherit(Constructor, extendFrom);
  }

  if (options.onBeforeExtendPrototype)
    options.onBeforeExtendPrototype.call(Constructor, definition);

  _.extend(Constructor.prototype, definition);

  return Constructor;
};

Utils.capitalize = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1, str.length);
};

Utils.upperCamelCase = function (str) {
  var re = /_|-|\./;

  if (!str)
    return '';

  return _.map(str.split(re), function (word) {
    return Utils.capitalize(word);
  }).join('');
};

Utils.camelCase = function (str) {
  var output = Utils.upperCamelCase(str);
  output = output.charAt(0).toLowerCase() + output.slice(1, output.length);
  return output;
};

Utils.pick = function (/* args */) {
  var args = _.toArray(arguments)
    , arg;
  for (var i = 0; i < args.length; i++) {
    arg = args[i];
    if (typeof arg !== 'undefined' && arg !== null)
      return arg;
  }

  return null;
};

Utils.StringConverters = {
  'none': function(input) {
    return input;
  },

  'upperCamelCase': function (input) {
    return Utils.upperCamelCase(input);
  },

  'camelCase': function (input) {
    return Utils.camelCase(input);
  }
};

Utils.rewriteLegacyHooks = function (obj) {
  var legacyToNew = IronRouter.LEGACY_HOOK_TYPES;

  _.each(legacyToNew, function (newHook, oldHook) {
    // only look on the immediate object, not its
    // proto chain
    if (_.has(obj, oldHook)) {
      hasOld = true;
      obj[newHook] = obj[oldHook];

      Utils.notifyDeprecated({
        where: 'RouteController',
        name: oldHook,
        instead: newHook
      });
    }
  });
};

