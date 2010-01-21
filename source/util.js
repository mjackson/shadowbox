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

/**
 * Gets the computed value of the style on the given element.
 *
 * Note: This function is not safe for retrieving float values or non-pixel values
 * in IE.
 *
 * @param   {HTMLElement}   el          The element
 * @param   {String}        style       The camel-cased name of the style
 * @return  {mixed}                     The computed value of the given style
 * @private
 */
var getStyle = (function() {
    var opacity = /opacity=([^)]*)/;

    return function(el, style) {
        var ret;

        if (!supportsOpacity && style == "opacity" && el.currentStyle) {
            ret = opacity.test(el.currentStyle.filter || "") ? (parseFloat(RegExp.$1) / 100) + "" : "";
            return ret === "" ? "1" : ret;
        }

        if (document.defaultView && document.defaultView.getComputedStyle) {
            var view = el.ownerDocument.defaultView;

            if (!view)
                return null;

            var computedStyle = view.getComputedStyle(el, null);

            if (computedStyle)
                ret = computedStyle.getPropertyValue(style);

            if (style == "opacity" && ret == "")
                ret = "1";
        } else {
            ret = el.currentStyle[style];
        }

        return ret;
    }
})();

/**
 * Gets the offset size of the given element. The dimension may be either "Height" or "Width".
 *
 * @param   {HTMLElement}   el
 * @param   {String}        dimension
 * @return  {Number}
 */
var getOffset = (function() {
    var show = { position: "absolute", visibility: "hidden", display: "block" };

    function swap(el, styles, callback) {
        var old = {};

        for (var style in styles) {
            old[style] = el.style[style];
            el.style[style] = styles[style];
        }

        callback.call(el);

        for (var style in styles)
            el.style[style] = old[style];
    }

    return function(el, dimension) {
        var value, callback = function() {
            value = dimension === "Width" ? el.offsetWidth : el.offsetHeight;
        }

        if (el.offsetWidth !== 0) {
            callback();
        } else {
            swap(el, show, callback);
        }

        return Math.max(0, Math.round(value));
    }
})();

/**
 * Gets the offsetWidth of the given element.
 *
 * @param   {HTMLElement}   el      The element
 * @return  {Number}                The width including padding and borders
 * @private
 */
function getWidth(el) {
    return getOffset(el, "Width");
}

/**
 * Gets the offsetHeight of the given element.
 *
 * @param   {HTMLElement}   el      The element
 * @return  {Number}                The height including padding and borders
 * @private
 */
function getHeight(el) {
    return getOffset(el, "Height");
}

/**
 * Appends an HTML fragment to the given element.
 *
 * @param   {HTMLElement}   el
 * @param   {String}        html    The HTML fragment to use
 * @private
 */
function appendHTML(el, html) {
    if (el.insertAdjacentHTML) {
        el.insertAdjacentHTML("BeforeEnd", html);
    } else if (el.lastChild) {
        var range = el.ownerDocument.createRange();
        range.setStartAfter(el.lastChild);
        var frag = range.createContextualFragment(html);
        el.appendChild(frag);
    } else {
        el.innerHTML = html;
    }
}

/**
 * Gets the window size. The dimension may be either "Height" or "Width".
 *
 * @param   {String}    dimension
 * @return  {Number}
 * @private
 */
function getWindowSize(dimension) {
    if (document.compatMode === "CSS1Compat")
        return document.documentElement["client" + dimension];

    return document.body["client" + dimension];
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
    if (supportsOpacity) {
        style.opacity = (opacity == 1 ? "" : opacity);
    } else {
        style.zoom = 1; // trigger hasLayout
        if (opacity == 1) {
            if (typeof style.filter == "string" && (/alpha/i).test(style.filter))
                style.filter = style.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
        } else {
            style.filter = (style.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
                " alpha(opacity=" + (opacity * 100) + ")";
        }
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

/**
 * True if this browser supports opacity.
 *
 * @type    {Boolean}
 * @private
 */
var supportsOpacity = true,

/**
 * True if the browser supports fixed positioning.
 *
 * @type    {Boolean}
 * @private
 */
supportsFixed = true;

/**
 * Checks the level of support the browser provides. Should be called when
 * the DOM is ready to be manipulated.
 *
 * @private
 */
function checkSupport() {
    var body = document.body,
        div = document.createElement("div");

    // detect opacity support
    supportsOpacity = typeof div.style.opacity === "string";

    // detect support for fixed positioning
    div.style.position = "fixed";
    div.style.margin = 0;
    div.style.top = "20px";
    body.appendChild(div, body.firstChild);
    supportsFixed = div.offsetTop == 20;
    body.removeChild(div);
}
