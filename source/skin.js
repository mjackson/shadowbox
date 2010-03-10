/**
 * Keeps track of whether or not the overlay is activated.
 *
 * @type    {Boolean}
 * @private
 */
var overlayOn = false,

/**
 * A cache of elements that are troublesome for modal overlays.
 *
 * @type    {Array}
 * @private
 */
visibilityCache = [],

/**
 * Id's of elements that need transparent PNG support.
 *
 * @type    {Array}
 * @private
 */
pngIds = [
    "sb-nav-close",
    "sb-nav-next",
    "sb-nav-play",
    "sb-nav-pause",
    "sb-nav-previous"
],

/**
 * The container element.
 *
 * @type    {HTMLElement}
 * @private
 */
container,

/**
 * The overlay element.
 *
 * @type    {HTMLElement}
 * @private
 */
overlay,

/**
 * The wrapper element.
 *
 * @type    {HTMLElement}
 * @private
 */
wrapper,

/**
 * True if the window resize event is allowed to fire.
 *
 * @type    {Boolean}
 * @private
 */
doWindowResize = true;

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
    var isOpacity = (property == "opacity"),
    anim = isOpacity ? S.setOpacity : function(el, value) {
        // default unit is px for properties other than opacity
        el.style[property] = "" +
            value + "px";
    };

    if (duration == 0 || (!isOpacity && !S.options.animate) || (isOpacity && !S.options.animateFade)) {
        anim(el, to);
        if (callback)
            callback();
        return;
    }

    var from = parseFloat(S.getStyle(el, property)) || 0;
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
            anim(el, to);
            if (callback)
                callback();
        } else {
            anim(el, from + ease((time - begin) / duration) * delta);
        }
    }, 10); // 10 ms interval is minimum on WebKit
}

/**
 * Sets the size of the container element.
 *
 * @private
 */
function setSize() {
    container.style.height = S.getWindowSize("Height") + "px";
    container.style.width = S.getWindowSize("Width") + "px";
}

/**
 * Sets the top of the container element. This is only necessary in browsers that
 * don't support fixed positioning, such as IE6.
 *
 * @private
 */
function setPosition() {
    container.style.top = document.documentElement.scrollTop + "px";
    container.style.left = document.documentElement.scrollLeft + "px";
}

/**
 * Toggles the visibility of elements that are troublesome for overlays.
 *
 * @param   {Boolean}   on  True to make visible, false to hide
 * @private
 */
function toggleTroubleElements(on) {
    if (on) {
        each(visibilityCache, function(i, el){
            el[0].style.visibility = el[1] || '';
        });
    } else {
        visibilityCache = [];
        each(S.options.troubleElements, function(i, tag) {
            each(document.getElementsByTagName(tag), function(j, el) {
                visibilityCache.push([el, el.style.visibility]);
                el.style.visibility = "hidden";
            });
        });
    }
}

/**
 * Toggles the display of the nav control with the given id.
 *
 * @param   {String}    id      The id of the navigation control
 * @param   {Boolean}   on      True to toggle on, false to toggle off
 * @private
 */
function toggleNav(id, on) {
    var el = get("sb-nav-" + id);
    if (el)
        el.style.display = on ? "" : "none";
}

/**
 * Toggles the visibility of the loading layer.
 *
 * @param   {Boolean}   on          True to toggle on, false to toggle off
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function toggleLoading(on, callback) {
    var loading = get("sb-loading"),
        playerName = S.getCurrent().player,
        anim = (playerName == "img" || playerName == "html"); // fade on images & html

    if (on) {
        S.setOpacity(loading, 0);
        loading.style.display = "block";

        var wrapped = function() {
            S.clearOpacity(loading);
            if (callback)
                callback();
        }

        if (anim) {
            animate(loading, "opacity", 1, S.options.fadeDuration, wrapped);
        } else {
            wrapped();
        }
    } else {
        var wrapped = function() {
            loading.style.display = "none";
            S.clearOpacity(loading);
            if (callback)
                callback();
        }

        if (anim) {
            animate(loading, "opacity", 0, S.options.fadeDuration, wrapped);
        } else {
            wrapped();
        }
    }
}

/**
 * Builds the content for the title and information bars.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function buildBars(callback) {
    var obj = S.getCurrent();

    get("sb-title-inner").innerHTML = obj.title || "";

    // build the nav
    var close, next, play, pause, previous;
    if (S.options.displayNav) {
        close = true;
        var len = S.gallery.length;
        if (len > 1) {
            if (S.options.continuous) {
                next = previous = true;
            } else {
                next = (len - 1) > S.current; // not last in gallery, show next
                previous = S.current > 0; // not first in gallery, show previous
            }
        }
        // in a slideshow?
        if (S.options.slideshowDelay > 0 && S.hasNext()) {
            pause = !S.isPaused();
            play = !pause;
        }
    } else {
        close = next = play = pause = previous = false;
    }
    toggleNav("close", close);
    toggleNav("next", next);
    toggleNav("play", play);
    toggleNav("pause", pause);
    toggleNav("previous", previous);

    // build the counter
    var counter = "";
    if (S.options.displayCounter && S.gallery.length > 1) {
        var len = S.gallery.length;
        if (S.options.counterType == "skip") {
            // limit the counter?
            var i = 0,
                end = len,
                limit = parseInt(S.options.counterLimit) || 0;

            if (limit < len && limit > 2) { // support large galleries
                var h = Math.floor(limit / 2);
                i = S.current - h;
                if (i < 0)
                    i += len;
                end = S.current + (limit - h);
                if (end > len)
                    end -= len;
            }

            while (i != end) {
                if (i == len)
                    i = 0;
                counter += '<a onclick="Shadowbox.change(' + i + ');"'
                if (i == S.current)
                    counter += ' class="sb-counter-current"';
                counter += ">" + (++i) + "</a>";
            }
        } else {
            counter = [S.current + 1, S.lang.of, len].join(' ');
        }
    }

    get("sb-counter").innerHTML = counter;

    callback();
}

/**
 * Shows the title and info bars.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function showBars(callback) {
    var titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        duration = 0.35;

    // clear visibility before animating into view
    titleInner.style.visibility = infoInner.style.visibility = "";

    if (titleInner.innerHTML != "")
        animate(titleInner, "marginTop", 0, duration);
    animate(infoInner, "marginTop", 0, duration, callback);
}

/**
 * Hides the title and info bars.
 *
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function hideBars(anim, callback) {
    var title = get("sb-title"),
        info = get("sb-info"),
        titleHeight = title.offsetHeight,
        infoHeight = info.offsetHeight,
        titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        duration = (anim ? 0.35 : 0);

    animate(titleInner, "marginTop", titleHeight, duration);
    animate(infoInner, "marginTop", infoHeight * -1, duration, function() {
        titleInner.style.visibility = infoInner.style.visibility = "hidden";
        callback();
    });
}

/**
 * Adjusts the height of #sb-wrapper-inner and centers #sb-wrapper vertically
 * in the viewport.
 *
 * @param   {Number}    height      The height (in pixels)
 * @param   {Number}    top         The top (in pixels)
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustHeight(height, top, anim, callback) {
    var wrapperInner = get("sb-wrapper-inner"),
        duration = (anim ? S.options.resizeDuration : 0);

    animate(wrapper, "top", top, duration);
    animate(wrapperInner, "height", height, duration, callback);
}

/**
 * Adjusts the width and left position of #sb-wrapper.
 *
 * @param   {Number}    width       The width (in pixels)
 * @param   {Number}    left        The left (in pixels)
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustWidth(width, left, anim, callback) {
    var duration = (anim ? S.options.resizeDuration : 0);

    animate(wrapper, "left", left, duration);
    animate(wrapper, "width", width, duration, callback);
}

/**
 * Calculates the dimensions for Shadowbox.
 *
 * @param   {Number}    height      The content height
 * @param   {Number}    width       The content width
 * @return  {Object}                The new dimensions object
 * @private
 */
function setDimensions(height, width) {
    var bodyInner = get("sb-body-inner"),
        height = parseInt(height),
        width = parseInt(width),
        topBottom = wrapper.offsetHeight - bodyInner.offsetHeight,
        leftRight = wrapper.offsetWidth - bodyInner.offsetWidth,

        // overlay should provide proper window dimensions here
        maxHeight = overlay.offsetHeight,
        maxWidth = overlay.offsetWidth,

        // default to the default viewport padding
        padding = parseInt(S.options.viewportPadding) || 20,

        // only preserve aspect ratio if there is something to display and
        // it's not draggable
        preserveAspect = (S.player && S.options.handleOversize != "drag");

    return S.setDimensions(height, width, maxHeight, maxWidth, topBottom, leftRight, padding, preserveAspect);
}

/**
 * The Shadowbox.skin object.
 *
 * @type    {Object}
 * @public
 */
var K = {};

/**
 * The HTML markup to use.
 *
 * @type    {String}
 * @public
 */
K.markup = "" +
'<div id="sb-container">' +
    '<div id="sb-overlay"></div>' +
    '<div id="sb-wrapper">' +
        '<div id="sb-title">' +
            '<div id="sb-title-inner"></div>' +
        '</div>' +
        '<div id="sb-wrapper-inner">' +
            '<div id="sb-body">' +
                '<div id="sb-body-inner"></div>' +
                '<div id="sb-loading">' +
                    '<div id="sb-loading-inner"><span>{loading}</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div id="sb-info">' +
            '<div id="sb-info-inner">' +
                '<div id="sb-counter"></div>' +
                '<div id="sb-nav">' +
                    '<a id="sb-nav-close" title="{close}" onclick="Shadowbox.close()"></a>' +
                    '<a id="sb-nav-next" title="{next}" onclick="Shadowbox.next()"></a>' +
                    '<a id="sb-nav-play" title="{play}" onclick="Shadowbox.play()"></a>' +
                    '<a id="sb-nav-pause" title="{pause}" onclick="Shadowbox.pause()"></a>' +
                    '<a id="sb-nav-previous" title="{previous}" onclick="Shadowbox.previous()"></a>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +
'</div>';

/**
 * Various options that control the behavior of Shadowbox' skin.
 *
 * @type    {Object}
 * @public
 */
K.options = {

    /**
     * The sequence of the resizing animations. "hw" will resize height, then width. "wh" resizes
     * width, then height. "sync" resizes both simultaneously.
     *
     * @type    {String}
     */
    animSequence: "sync",

    /**
     * The limit to the number of counter links that are displayed in a "skip"-style counter.
     *
     * @type    {Number}
     */
    counterLimit: 10,

    /**
     * The counter type to use. May be either "default" or "skip". A skip counter displays a
     * link for each object in the gallery.
     *
     * @type    {String}
     */
    counterType: "default",

    /**
     * True to display the gallery counter.
     *
     * @type    {Boolean}
     */
    displayCounter: true,

    /**
     * True to show the navigation controls.
     *
     * @type    {Boolean}
     */
    displayNav: true,

    /**
     * The duration (in seconds) of opacity animations.
     *
     * @type    {Number}
     */
    fadeDuration: 0.35,

    /**
     * The initial height (in pixels).
     *
     * @type    {Number}
     */
    initialHeight: 160,

    /**
     * The initial width (in pixels).
     *
     * @type    {Number}
     */
    initialWidth: 320,

    /**
     * True to trigger Shadowbox.close when the overlay is clicked.
     *
     * @type    {Boolean}
     */
    modal: false,

    /**
     * The color (in hex) to use for the overlay.
     *
     * @type    {String}
     */
    overlayColor: "#000",

    /**
     * The opacity to use for the overlay.
     *
     * @type    {Number}
     */
    overlayOpacity: 0.5,

    /**
     * The duration (in seconds) to use for resizing animations.
     *
     * @type    {Number}
     */
    resizeDuration: 0.35,

    /**
     * True to show the overlay, false to hide it.
     *
     * @type    {Boolean}
     */
    showOverlay: true,

    /**
     * Names of elements that should be hidden when the overlay is enabled.
     *
     * @type    {String}
     */
    troubleElements: ["select", "object", "embed", "canvas"]

};

/**
 * Initialization function. Called immediately after this skin's markup has been
 * appended to the document with all of the necessary language replacements done.
 *
 * @public
 */
K.init = function() {
    S.appendHTML(document.body, sprintf(K.markup, S.lang));

    K.body = get("sb-body-inner");

    // cache oft-used elements
    container = get("sb-container");
    overlay = get("sb-overlay");
    wrapper = get("sb-wrapper");

    // use absolute positioning in browsers that don't support fixed
    if (!supportsFixed)
        container.style.position = "absolute";

    if (!supportsOpacity) {
        // support transparent PNG's via AlphaImageLoader
        var el, m, re = /url\("(.*\.png)"\)/;
        each(pngIds, function(i, id) {
            el = get(id);
            if (el) {
                m = S.getStyle(el, "backgroundImage").match(re);
                if (m) {
                    el.style.backgroundImage = "none";
                    el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true,src=" +
                        m[1] + ",sizingMethod=scale);";
                }
            }
        });
    }

    // add window resize event handler, use 10 ms buffer to prevent jerky resizing
    var timer;
    addEvent(window, "resize", function() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        if (open)
            timer = setTimeout(K.onWindowResize, 10);
    });
}

/**
 * Called when Shadowbox opens.
 *
 * @param   {Object}    obj         The object to open
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onOpen = function(obj, callback) {
    // prevent window resize events from firing until we're finished
    doWindowResize = false;

    container.style.display = "block";

    setSize();

    var dims = setDimensions(S.options.initialHeight, S.options.initialWidth);
    adjustHeight(dims.innerHeight, dims.top);
    adjustWidth(dims.width, dims.left);

    if (S.options.showOverlay) {
        overlay.style.backgroundColor = S.options.overlayColor;
        S.setOpacity(overlay, 0);

        if (!S.options.modal)
            addEvent(overlay, "click", S.close);

        overlayOn = true;
    }

    if (!supportsFixed) {
        setPosition();
        addEvent(window, "scroll", setPosition);
    }

    toggleTroubleElements();
    container.style.visibility = "visible";

    if (overlayOn) {
        animate(overlay, "opacity", S.options.overlayOpacity, S.options.fadeDuration, callback);
    } else {
        callback();
    }
}

/**
 * Called when a new object is being loaded.
 *
 * @param   {Boolean}   changing    True if the content is changing from some
 *                                  previous object
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onLoad = function(changing, callback) {
    toggleLoading(true);

    // make sure the body doesn't have any children
    while (K.body.firstChild)
        remove(K.body.firstChild);

    hideBars(changing, function() {
        if (!open)
            return;

        if (!changing)
            wrapper.style.visibility = "visible";

        buildBars(callback);
    });
}

/**
 * Called when the content is ready to be loaded (e.g. when the image has finished
 * loading). Should resize the content box and make any other necessary adjustments.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onReady = function(callback) {
    if (!open)
        return;

    var player = S.player,
        dims = setDimensions(player.height, player.width);

    var wrapped = function() {
        showBars(callback);
    }

    switch (S.options.animSequence) {
    case "hw":
        adjustHeight(dims.innerHeight, dims.top, true, function() {
            adjustWidth(dims.width, dims.left, true, wrapped);
        });
        break;
    case "wh":
        adjustWidth(dims.width, dims.left, true, function() {
            adjustHeight(dims.innerHeight, dims.top, true, wrapped);
        });
        break;
    default: // sync
        adjustWidth(dims.width, dims.left, true);
        adjustHeight(dims.innerHeight, dims.top, true, wrapped);
    }
}

/**
 * Called when the content is loaded into the box and is ready to be displayed.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onShow = function(callback) {
    toggleLoading(false, callback);

    // re-enable window resize events
    doWindowResize = true;
}

/**
 * Called in Shadowbox.close.
 *
 * @public
 */
K.onClose = function() {
    if (!supportsFixed)
        removeEvent(window, "scroll", setPosition);

    removeEvent(overlay, "click", S.close);

    wrapper.style.visibility = "hidden";

    var callback = function() {
        container.style.visibility = "hidden";
        container.style.display = "none";
        toggleTroubleElements(true);
    }

    if (overlayOn) {
        animate(overlay, "opacity", 0, S.options.fadeDuration, callback);
    } else {
        callback();
    }
}

/**
 * Called in Shadowbox.play.
 *
 * @public
 */
K.onPlay = function() {
    toggleNav("play", false);
    toggleNav("pause", true);
}

/**
 * Called in Shadowbox.pause.
 *
 * @public
 */
K.onPause = function() {
    toggleNav("pause", false);
    toggleNav("play", true);
}

/**
 * Called when the window is resized.
 *
 * @public
 */
K.onWindowResize = function() {
    if (!doWindowResize)
        return;

    setSize();

    var player = S.player,
        dims = setDimensions(player.height, player.width);

    // adjust width first to eliminate horizontal scroll bar
    adjustWidth(dims.width, dims.left);
    adjustHeight(dims.innerHeight, dims.top);

    if (player.onWindowResize)
        player.onWindowResize();
}

S.skin = K;
