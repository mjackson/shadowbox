// used to match the rel attribute of links
var relAttr = /^(light|shadow)box/i,

/**
 * The name of the expando property that Shadowbox uses on HTML elements
 * to store the cache index of that element.
 *
 * @type    {String}
 * @private
 */
expando = "shadowboxCacheKey",

/**
 * A unique id counter.
 *
 * @type    {Number}
 * @private
 */
cacheKey = 1;

/**
 * Contains all link objects that have been cached.
 *
 * @type    {Object}
 * @public
 */
S.cache = {};

/**
 * Resolves a link selector. The selector may be omitted to select all anchor elements
 * on the page with rel="shadowbox" or, if Shadowbox.find is used, it may be a single CSS
 * selector or an array of [selector, [context]].
 *
 * @param   {mixed}     selector
 * @return  {Array}     An array of matching link elements
 * @public
 */
S.select = function(selector) {
    var links = [];

    if (!selector) {
        var rel;
        each(document.getElementsByTagName("a"), function(i, el) {
            rel = el.getAttribute("rel");
            if (rel && relAttr.test(rel))
                links.push(el);
        });
    } else {
        var length = selector.length;
        if (length) {
            if (typeof selector == "string") {
                if (S.find)
                    links = S.find(selector); // css selector
            } else if (length == 2 && typeof selector[0] == "string" && selector[1].nodeType) {
                if (S.find)
                    links = S.find(selector[0], selector[1]); // css selector + context
            } else {
                // array of links (or node list)
                for (var i = 0; i < length; ++i)
                    links[i] = selector[i];
            }
        } else {
            links.push(selector); // single link
        }
    }

    return links;
}

/**
 * Adds all links specified by the given selector to the cache. If no selector
 * is provided, will select every anchor element on the page with rel="shadowbox".
 *
 * Note: Options given here apply only to links selected by the given selector.
 * Also, because <area> elements do not support the rel attribute, they must be
 * explicitly passed to this method.
 *
 * @param   {mixed}     selector
 * @param   {Object}    options     Some options to use for the given links
 * @public
 */
S.setup = function(selector, options) {
    each(S.select(selector), function(i, link) {
        S.addCache(link, options);
    });
}

/**
 * Removes all links specified by the given selector from the cache.
 *
 * @param   {mixed}     selector
 * @public
 */
S.teardown = function(selector) {
    each(S.select(selector), function(i, link) {
        S.removeCache(link);
    });
}

/**
 * Adds the given link element to the cache with the given options.
 *
 * @param   {HTMLElement}   link
 * @param   {Object}        options
 * @public
 */
S.addCache = function(link, options) {
    var key = link[expando];

    if (key == undefined) {
        key = cacheKey++;
        // assign cache key expando, use integer primitive to avoid memory leak in IE
        link[expando] = key;
        // add onclick listener
        addEvent(link, "click", handleClick);
    }

    S.cache[key] = S.makeObject(link, options);
}

/**
 * Removes the given link element from the cache.
 *
 * @param   {HTMLElement}   link
 * @public
 */
S.removeCache = function(link) {
    removeEvent(link, "click", handleClick);
    delete S.cache[link[expando]];
    link[expando] = null;
}

/**
 * Gets the object from cache representative of the given link element (if there is one).
 *
 * @param   {HTMLElement}   link
 * @return  {Object}
 * @public
 */
S.getCache = function(link) {
    var key = link[expando];
    return (key in S.cache && S.cache[key]);
}

/**
 * Removes all onclick listeners from elements that have previously been setup with
 * Shadowbox and clears all objects from cache.
 *
 * @public
 */
S.clearCache = function() {
    for (var key in S.cache)
        S.removeCache(S.cache[key].link);

    S.cache = {};
}

/**
 * Handles all clicks on links that have been set up to work with Shadowbox
 * and cancels the default event behavior when appropriate.
 *
 * @param   {Event}     e   The click event
 * @private
 */
function handleClick(e) {
    //preventDefault(e); // good for debugging

    S.open(this);

    if (S.gallery.length)
        preventDefault(e);
}
