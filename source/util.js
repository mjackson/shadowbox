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
 * Removes all children from the given element.
 *
 * @param   {HTMLElement}   el
 * @private
 */
function empty(el) {
    while (el.firstChild)
        el.removeChild(el.firstChild);
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
 * Animates the given property of el to the given value over a specified duration. If a
 * callback is provided, it will be called when the animation is finished.
 *
 * @param   {HTMLElement}   el
 * @param   {String}        property
 * @param   {mixed}         to
 * @param   {Number}        duration
 * @param   {Function}      callback
 * @private
 */
function animate(el, property, to, duration, callback) {
    var opacity = (property == "opacity");
    var set = (opacity ? setOpacity : function(el, to) { el.style[property] = to });

    if (duration == 0 || (!opacity && !S.options.animate) || (opacity && !S.options.animateFade)) {
        set(el, to);
        if (callback)
            callback();
        return;
    }

    var from = parseFloat(getStyle(el, property));

    if (isNaN(from))
        from = 0;

    var delta = to - from;
    if (delta == 0) {
        if (callback)
            callback();
        return; // nothing to animate
    }

    duration *= 1000; // convert to milliseconds

    var begin = now(),
        ease = S.ease,
        end = begin + duration,
        time;

    var interval = setInterval(function() {
        time = now();
        if (time >= end) {
            clearInterval(interval);
            interval = null;
            set(el, to);
            if (callback)
                callback();
        } else
            set(el, from + ease((time - begin) / duration) * delta);
    }, 10); // 10 ms interval is minimum on WebKit
}

/**
 * Sets an element's opacity.
 *
 * @param   {HTMLElement}   el
 * @param   {Number}        opacity
 * @private
 */
function setOpacity(el, opacity) {
    var style = el.style;

    if (window.ActiveXObject) {
        style.zoom = 1; // trigger hasLayout
        if (opacity == 1) {
            if (typeof style.filter == "string" && (/alpha/i).test(style.filter))
                style.filter = style.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
        } else {
            style.filter = (style.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
                " alpha(opacity=" + (opacity * 100) + ")";
        }
    } else {
        style.opacity = (opacity == 1 ? '' : opacity);
    }
}

/**
 * Clears the opacity setting on the given element. Needed for some cases in IE.
 *
 * @param   {HTMLElement}   el
 * @private
 */
function clearOpacity(el) {
    setOpacity(el, 1);
}
