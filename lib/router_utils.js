/**
 * Utility methods available privately to the package.
 */

RouterUtils = {};

/**
 * Returns global on node or window in the browser.
 */

RouterUtils.global = function () {
  if (typeof window !== 'undefined')
    return window;
  else if (typeof global !== 'undefined')
    return global;
  else
    return null;
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

RouterUtils.resolveValue = function (nameOrValue) {
  var global = RouterUtils.global()
    , parts
    , ptr;

  if (_.isString(nameOrValue)) {
    parts = nameOrValue.split('.')
    ptr = global;
    for (var i = 0; i < parts.length; i++) {
      ptr = ptr[parts[i]];
      if (!ptr)
        throw new Error(parts.slice(0, i+1).join('.') + ' is ' + typeof ptr);
    }
  } else {
    ptr = nameOrValue;
  }

  // final position of ptr should be the resolved value
  return ptr;
};

RouterUtils.hasOwnProperty = function (obj, key) {
  var prop = {}.hasOwnProperty;
  return prop.call(obj, key);
};

/**
 * Don't mess with this function. It's exactly the same as the compiled
 * coffeescript mechanism. If you change it we can't guarantee that our code
 * will work when used with Coffeescript. One exception is putting in a runtime
 * check that both child and parent are of type Function.
 */

RouterUtils.inherits = function (child, parent) {
  if (RouterUtils.typeOf(child) !== '[object Function]')
    throw new Error('First parameter to RouterUtils.inherits must be a function');
   
  if (RouterUtils.typeOf(parent) !== '[object Function]')
    throw new Error('Second parameter to RouterUtils.inherits must be a function');

  for (var key in parent) {
    if (RouterUtils.hasOwnProperty(parent, key))
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

RouterUtils.toArray = function (obj) {
  if (!obj)
    return [];
  else if (RouterUtils.typeOf(obj) !== '[object Array]')
    return [obj];
  else
    return obj;
};

RouterUtils.typeOf = function (obj) {
  if (obj && obj.typeName)
    return obj.typeName;
  else
    return Object.prototype.toString.call(obj);
};

RouterUtils.extend = function (Super, definition) {
  if (arguments.length === 1)
    definition = Super;
  else {
    definition = definition || {};
    definition.extend = Super;
  }

  return RouterUtils.create(definition, {delayInheritance: false});
};

RouterUtils.create = function (definition, options) {
  var Constructor
    , extendFrom
    , savedPrototype;

  options = options || {};
  definition = definition || {};

  if (RouterUtils.hasOwnProperty(definition, 'constructor'))
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
    RouterUtils.inherits(Child, RouterUtils.resolveValue(Super));
    if (prototype) _.extend(Child.prototype, prototype);
  };

  if (extendFrom) {
    inherit(Constructor, extendFrom);
  }

  _.extend(Constructor.prototype, definition);

  return Constructor;
};

/**
 * Assert that the given condition is truthy.
 *
 * @param {Boolean} condition The boolean condition to test for truthiness.
 * @param {String} msg The error message to show if the condition is falsy.
 */

RouterUtils.assert = function (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

RouterUtils.capitalize = function (str) {
  return str[0].toUpperCase() + str.slice(1, str.length);
};

RouterUtils.classify = function (str) {
  var re = /_|-|\./;
  return _.map(str.split(re), function (word) {
    return RouterUtils.capitalize(word);
  }).join('');
};

RouterUtils.pick = function (/* args */) {
  var args = _.toArray(arguments)
    , arg;
  for (var i = 0; i < args.length; i++) {
    arg = args[i];
    if (typeof arg !== 'undefined' && arg !== null)
      return arg;
  }

  return null;
};
