/**
 * Utility methods available privately to the package.
 */

RouterUtils = {};

//@export RouterUtils.hasOwnProperty
RouterUtils.hasOwnProperty = function (obj, key) {
  var prop = {}.hasOwnProperty;
  return prop.call(obj, key);
};

//@export RouterUtils.inherits
RouterUtils.inherits = function (child, parent) {
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

//@export RouterUtils.toArray
RouterUtils.toArray = function (obj) {

  if (!obj)
    return [];
  else if (RouterUtils.typeOf(obj) !== '[object Array]')
    return [obj];
  else
    return obj;
};

//@export RouterUtils.typeOf
RouterUtils.typeOf = function (obj) {
  if (obj && obj.typeName)
    return obj.typeName;
  else
    return Object.prototype.toString.call(obj);
};

//@export RouterUtils.extend
RouterUtils.extend = function (Super, definition) {
  var Constructor;

  definition = definition || {};
  if (RouterUtils.hasOwnProperty(definition, 'constructor'))
    Constructor = definition.constructor;
  else
    Constructor = function () {
      return Constructor.__super__.constructor.apply(this, arguments);
    }

  if (arguments.length === 1)
    definition = Super;
  else
    RouterUtils.inherits(Constructor, Super);

  _.extend(Constructor.prototype, definition);

  return Constructor;
};

/**
 * Assert that the given condition is truthy.
 *
 * @param {Boolean} condition The boolean condition to test for truthiness.
 * @param {String} msg The error message to show if the condition is falsy.
 */

//@export RouterUtils.assert
RouterUtils.assert = function (condition, msg) {
  if (!condition)
    throw new Error(msg);
};

//@export RouterUtils.capitalize
RouterUtils.capitalize = function (str) {
  return str[0].toUpperCase() + str.slice(1, str.length);
};

//@export RouterUtils.classify
RouterUtils.classify = function (str) {
  var re = /_|-|\./;
  return _.map(str.split(re), function (word) {
    return RouterUtils.capitalize(word);
  }).join('');
};

/**
 * Finds the given template in the Template namespace or returns the defaultFn
 * if no template is found in Template. If no defaultFn is provided and the
 * template is not found, throws an exception. In other words, ensures a
 * template function is returned.
 *
 * @param {String|Function} name The name of the template or the template
 * function itself.
 * @param {Function} [defaultFn] The default function to use if no template
 * function is found in the Template namespace.
 * @returns {Function}
 * @api private
 */

//@export RouterUtils.getTemplateFunction
RouterUtils.getTemplateFunction = function (name, defaultFn) {
  var template = null;

  if (_.isFunction(name))
    template = name;
  else if (_.isString(name))
    template = Template[name];

  if (!template && defaultFn)
    template = defaultFn;

  RouterUtils.assert(template, 'Template "' + name + '" not found');
  return template;
}
