const guid = (function() {
  let guid = 0;
  return function() {
    return guid++;
  }
})();

function isFunction(obj) {
  return typeof obj === 'function';
}

function noop() {}

/**
 * Wrapp non-array values in an array
 */
function toArray(a) {
  if (!Array.isArray(a)) {
    a = [a];
  }
  return a
}

/**
 * Calls the given callback function for each element in the given object,
 * which must be an array-like object. Return false from any callback to
 * stop execution.
 */
function each(obj, callback) {
  var i = 0, len = obj.length;
  for (var v = obj[0]; i < len && callback.call(v, i, v) !== false; v = obj[++i]) {}
}

/**
 * Applies all properties of additional arguments to the given object.
 */
function apply(obj) {
  var len = arguments.length, ext;
  for (var i = 1; i < len; ++i) {
    ext = arguments[i];

    for (var prop in ext) {
      obj[prop] = ext[prop];
    }
  }
  return obj;
}

/**
 * Clear a timeout and set the value to null
 */
function removeTimeout(context, name) {
  const timeout = context[name];
  if (timeout) {
    clearTimeout(timeout);
    context[name] = null;
  }
}

module.exports = {
  guid,
  isFunction,
  noop,
  toArray,
  each,
  apply,
  removeTimeout
};
