// The code in this file is adapted for Shadowbox from the jQuery JavaScript library

/**
 * True if Shadowbox has been loaded into the DOM, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
var loaded = false,

/**
 * The callback function for the DOMContentLoaded browser event.
 *
 * @type    {Function}
 * @private
 */
DOMContentLoaded;

if (document.addEventListener) {
    DOMContentLoaded = function() {
        document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
        S.load();
    }
} else if (document.attachEvent) {
    DOMContentLoaded = function() {
        if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", DOMContentLoaded);
            S.load();
        }
    }
}

/**
 * A DOM ready check for IE.
 *
 * @private
 */
function doScrollCheck() {
    if (loaded)
        return;

    try {
        document.documentElement.doScroll("left");
    } catch (e) {
        setTimeout(doScrollCheck, 1);
        return;
    }

    S.load();
}

/**
 * Waits for the DOM to be ready before firing the given callback function.
 *
 * @param   {Function}  callback
 * @private
 */
function bindLoad() {
    if (document.readyState === "complete")
        return S.load();

    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
        window.addEventListener("load", S.load, false);
    } else if (document.attachEvent) {
        document.attachEvent("onreadystatechange", DOMContentLoaded);
        window.attachEvent("onload", S.load);

        var topLevel = false;
        try {
            topLevel = window.frameElement === null;
        } catch (e) {}

        if (document.documentElement.doScroll && topLevel)
            doScrollCheck();
    }
}

/**
 * Loads the Shadowbox code into the DOM. Is called automatically when the document
 * is ready.
 *
 * @public
 */
S.load = function() {
    if (loaded)
        return;

    if (!document.body)
        return setTimeout(S.load, 13);

    loaded = true;

    checkSupport();

    S.onReady();

    if (!S.options.skipSetup)
        S.setup();

    S.skin.init();
}
