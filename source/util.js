if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, from) {
        var len = this.length >>> 0;

        from = from || 0;
        if (from < 0)
            from += len;

        for (; from < len; ++from) {
            if (from in this && this[from] === obj)
                return from;
        }

        return -1;
    }
}

/**
 * Gets the current time in milliseconds.
 *
 * @return  {Number}
 * @private
 */
function now() {
    return (new Date).getTime();
}

/**
 * Applies all properties of extension to original.
 *
 * @param   {Object}    original
 * @param   {Object}    extension
 * @return  {Object}    The original object
 * @private
 */
function apply(original, extension) {
    for (var property in extension)
        original[property] = extension[property];
    return original;
}

/**
 * Calls the given callback function for each element in obj. Note: obj must be an array-like
 * object.
 *
 * @param   {Array|mixed}   obj
 * @param   {Function}      callback
 * @private
 */
function each(obj, callback) {
    var i = 0, len = obj.length;
    for (var value = obj[0]; i < len && callback.call(value, i, value) !== false; value = obj[++i]) {}
}

/**
 * Formats a string with the elements in the replacement array. The string should contain
 * tokens in the format {n} where n corresponds to the index of property name of the replacement
 * in the replace object.
 *
 * Example:
 *
 * format('Hello {0}', ['World']); // "Hello World"
 * format('Hello {world}', {world: "World"}); // "Hello World"
 *
 * @param   {String}        str         The format spec string
 * @param   {Array|Object}  replace     The array/object of replacement values
 * @return  {String}                    The formatted string
 * @private
 */
function sprintf(str, replace) {
    return str.replace(/\{(\w+?)\}/g, function(match, i) {
        return replace[i];
    });
}

/**
 * A no-op function.
 *
 * @private
 */
function noop() {}

/**
 * Gets the element with the given id.
 *
 * @param   {String}        id
 * @return  {HTMLElement}
 * @private
 */
function get(id) {
    return document.getElementById(id);
}

/**
 * Removes an element from the DOM.
 *
 * @param   {HTMLElement}   el          The element to remove
 * @private
 */
function remove(el) {
    el.parentNode.removeChild(el);
}
