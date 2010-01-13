/**
 * Keeps track of whether or not the overlay is activated.
 *
 * @var     Boolean
 * @private
 */
var overlayOn = false,

/**
 * A cache of elements that are troublesome for modal overlays.
 *
 * @var     Array
 * @private
 */
visibilityCache = [],

/**
 * Id's of elements that need transparent PNG support in IE6.
 *
 * @var     Array
 * @private
 */
png = [
    'sb-nav-close',
    'sb-nav-next',
    'sb-nav-play',
    'sb-nav-pause',
    'sb-nav-previous'
];

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
        '<div id="sb-body">' +
            '<div id="sb-body-inner"></div>' +
            '<div id="sb-loading">' +
                '<a onclick="Shadowbox.close()">{cancel}</a>' +
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
                '<div style="clear:both"></div>' +
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
     * True, to use the dimensions of the first piece as the initial dimensions if they are
     * available.
     *
     * @type    {Boolean}
     */
    autoDimensions: false,

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
 * Initialization function. Called immediately after this skin's markup
 * has been appended to the document with all of the necessary language
 * replacements done.
 *
 * @public
 */
K.init = function(){
    appendHTML(document.body, sprintf(K.markup, S.lang));

    // several fixes for IE6
    if (S.isIE6) {
        // trigger hasLayout on sb-body
        get("sb-body").style.zoom = 1;

        // support transparent PNG's via AlphaImageLoader
        var el, m, re = /url\("(.*\.png)"\)/;
        each(pngIds, function(i, id){
            el = get(id);
            if (el) {
                m = getStyle(el, "backgroundImage").match(re);
                if (m) {
                    el.style.backgroundImage = "none";
                    el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true,src=" +
                        m[1] + ",sizingMethod=scale);";
                }
            }
        });
    }

    // set up window resize event handler
    var timeoutId;
    addEvent(window, "resize", function() {
        // use 50 ms event buffering to prevent jerky window resizing
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        // check if activated because IE7 fires window resize event
        // when container display is set to block
        if (open) {
            timeoutId = setTimeout(function() {
                K.onWindowResize();
                if (S.player.onWindowResize)
                    S.player.onWindowResize();
            }, 50);
        }
    });
}

/**
 * Gets the element that content should be appended to.
 *
 * @return  {HTMLElement}   The body element
 * @public
 */
K.body = function() {
    return get("sb-body-inner");
}

/**
 * Called when Shadowbox opens from an inactive state.
 *
 * @param   {Object}    obj         The object to open
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onOpen = function(obj, callback) {
    toggleTroubleElements(false);

    var opt = S.options,
        height = (opt.autoDimensions && "height" in obj ? obj.height : opt.initialHeight),
        width = (opt.autoDimensions && "width" in obj ? obj.width : opt.initialWidth);

    get("sb-container").style.display = "block";

    var dims = setDimensions(height, width);
    adjustHeight(dims.innerHeight, dims.top, false);
    adjustWidth(dims.width, dims.left, false);

    toggleVisible(callback);
}

/**
 * Called when a new piece of content is being loaded.
 *
 * @param   {Boolean}   change      True if the content is changing
 *                                  from some previous content
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onLoad = function(change, callback) {
    toggleLoading(true);

    // if changing, animate the bars transition
    hideBars(change, function() {
        if (!open)
            return;

        // if opening, clear #sb-wrapper display
        if (!change)
            get("sb-wrapper").style.display = "";

        callback();
    });
}

/**
 * Called when the content is ready to be loaded (e.g. when the image
 * has finished loading). Should resize the content box and make any
 * other necessary adjustments.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onReady = function(callback) {
    if (!open)
        return;

    var player = S.player,
        dims = setDimensions(player.height, player.width, player.resizable);

    K.resizeContent(dims.innerHeight, dims.width, dims.top, dims.left, true, function() {
        showBars(callback);
    });
}

/**
 * Called when the content is loaded into the box and is ready to be
 * displayed.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.onFinish = function(callback) {
    toggleLoading(false, callback);
}

/**
 * Called when Shadowbox is closed.
 *
 * @public
 */
K.onClose = function() {
    toggleVisible();
    toggleTroubleElements(true);
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
    if (!open)
        return;

    var player = S.player,
        dims = setDimensions(player.height, player.width, player.resizable);

    adjustWidth(dims.width, dims.left, false);
    adjustHeight(dims.innerHeight, dims.top, false);

    var playerEl = get(S.playerId);
    if (playerEl) {
        // resize resizable content when in resize mode
        if (player.resizable && S.options.handleOversize == "resize") {
            playerEl.height = dims.resizeHeight;
            playerEl.width = dims.resizeWidth;
        }
    }
}

/**
 * Resizes Shadowbox to the appropriate height and width for the current content.
 *
 * @param   {Number}    height      The new height to use
 * @param   {Number}    width       The new width to use
 * @param   {Number}    top         The new top to use
 * @param   {Number}    left        The new left to use
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @public
 */
K.resizeContent = function(height, width, top, left, anim, callback) {
    if (!open)
        return;

    var player = S.player,
        dims = setDimensions(player.height, player.width, player.resizable);

    switch (S.options.animSequence) {
    case "hw":
        adjustHeight(dims.innerHeight, dims.top, anim, function(){
            adjustWidth(dims.width, dims.left, anim, callback);
        });
        break;
    case "wh":
        adjustWidth(dims.width, dims.left, anim, function(){
            adjustHeight(dims.innerHeight, dims.top, anim, callback);
        });
        break;
    default: // sync
        adjustWidth(dims.width, dims.left, anim);
        adjustHeight(dims.innerHeight, dims.top, anim, callback);
    }
}

/**
 * Sets the top of the container element. This is only necessary in IE6
 * where the container uses absolute positioning instead of fixed.
 *
 * @private
 */
function fixTop() {
    get('sb-container').style.top = document.documentElement.scrollTop + 'px';
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
        each(S.options.troubleElements, function(tag) {
            each(document.getElementsByTagName(tag), function(el) {
                visibilityCache.push([el, el.style.visibility]);
                el.style.visibility = "hidden";
            });
        });
    }
}

/**
 * Toggles the visibility of the Shadowbox container.
 *
 * @param   {Function}  callback    The callback to use after toggling on, absent
 *                                  when toggling off
 * @private
 */
function toggleVisible(callback) {
    var overlay = get("sb-overlay"),
        container = get("sb-container"),
        wrapper = get("sb-wrapper");

    if (callback) {
        if (S.isIE6) {
            fixTop();
            addEvent(window, "scroll", fixTop);
        }
        if (S.options.showOverlay) {
            overlayOn = true;

            // set overlay color/opacity
            overlay.style.backgroundColor = S.options.overlayColor;
            setOpacity(overlay, 0);

            if(!S.options.modal)
                addEvent(overlay, "click", S.close);

            wrapper.style.display = "none"; // cleared in onLoad
        }

        container.style.visibility = "visible";

        if (overlayOn) {
            animate(overlay, "opacity", parseFloat(S.options.overlayOpacity), S.options.fadeDuration, callback);
        } else {
            callback();
        }
    } else {
        if (S.isIE6)
            removeEvent(window, "scroll", fixTop);

        removeEvent(overlay, "click", S.close);

        if (overlayOn) {
            wrapper.style.display = "none";
            animate(overlay, "opacity", 0, S.options.fadeDuration, function() {
                // the following is commented because it causes the overlay to
                // be hidden on consecutive activations in IE8, even though we
                // set the visibility to "visible" when we reactivate
                //container.style.visibility = "hidden";
                container.style.display = "";
                wrapper.style.display = "";
                clearOpacity(overlay);
            });
        } else {
            container.style.visibility = "hidden";
        }
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
        setOpacity(loading, 0);
        loading.style.display = '';

        function wrapped() {
            clearOpacity(loading);
            if (callback)
                callback();
        }

        if (anim) {
            animate(loading, "opacity", 1, S.options.fadeDuration, wrapped);
        } else {
            wrapped();
        }
    } else {
        function wrapped() {
            loading.style.display = "none";
            clearOpacity(loading);
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
                counter += '>' + (i++) + '</a>';
            }
        } else {
            counter = (S.current + 1) + ' ' + S.lang.of + ' ' + len;
        }
    }

    get("sb-counter").innerHTML = counter;

    callback();
}

/**
 * Hides the title and info bars.
 *
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function hideBars(anim, callback) {
    var wrapper = get("sb-wrapper"),
        title = get("sb-title"),
        info = get("sb-info"),
        titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        titleHeight = parseInt(getStyle(titleInner, "height")) || 0,
        infoHeight = parseInt(getStyle(infoInner, "height")) || 0,
        duration = (anim ? 0.35 : 0);

    animate(title, "height", 0, duration);
    animate(info, "height", 0, duration);
    animate(wrapper, "paddingTop", titleHeight, duration);
    animate(wrapper, "paddingBottom", infoHeight, duration, function() {
        // hide bars here in case of overflow, build after hidden
        titleInner.style.visibility = infoInner.style.visibility = "hidden";
        buildBars(callback);
    });
}

/**
 * Shows the title and info bars.
 *
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function showBars(callback) {
    var wrapper = get("sb-wrapper"),
        title = get("sb-title"),
        info = get("sb-info"),
        titleInner = get("sb-title-inner"),
        infoInner = get("sb-info-inner"),
        titleHeight = parseInt(getStyle(titleInner, "height")) || 0,
        infoHeight = parseInt(getStyle(infoInner, "height")) || 0,
        duration = 0.35;

    // clear visibility before animating into view
    titleInner.style.visibility = infoInner.style.visibility = "";

    if (titleInner.innerHTML != '') {
        animate(title, "height", titleHeight, duration);
        animate(wrapper, "paddingTop", 0, duration);
    }
    animate(info, "height", infoHeight, duration);
    animate(wrapper, "paddingBottom", 0, duration, callback);
}

/**
 * Adjusts the height of #sb-body and centers #sb-wrapper vertically
 * in the viewport.
 *
 * @param   {Number}    height      The height to use for #sb-body
 * @param   {Number}    top         The top to use for #sb-wrapper
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustHeight(height, top, anim, callback) {
    var body = get("sb-body"),
        wrapper = get("sb-wrapper"),
        duration = (anim ? S.options.resizeDuration : 0);

    animate(body, "height", height, duration);
    animate(wrapper, "top", top, duration, callback);
}

/**
 * Adjusts the width and left of #sb-wrapper.
 *
 * @param   {Number}    width       The width to use for #sb-wrapper
 * @param   {Number}    left        The left to use for #sb-wrapper
 * @param   {Boolean}   anim        True to animate the transition
 * @param   {Function}  callback    The callback to use when finished
 * @private
 */
function adjustWidth(width, left, anim, callback) {
    var wrapper = get("sb-wrapper"),
        duration = (anim ? S.options.resizeDuration : 0);

    animate(wrapper, "width", width, duration);
    animate(wrapper, "left", left, duration, callback);
}

/**
 * Calculates the dimensions for Shadowbox, taking into account the borders
 * and surrounding elements of #sb-body.
 *
 * @param   {Number}    height      The content height
 * @param   {Number}    width       The content width
 * @param   {Boolean}   resizable   True if the content is able to be resized
 * @return  {Object}                The new dimensions object
 * @private
 */
function setDimensions(height, width, resizable){
    var sbi = get("sb-body-inner")
        sw = get("sb-wrapper"),
        so = get("sb-overlay"),
        tb = sw.offsetHeight - sbi.offsetHeight,
        lr = sw.offsetWidth - sbi.offsetWidth,
        maxHeight = so.offsetHeight, // measure overlay to get viewport size for IE6
        maxWidth = so.offsetWidth;

    S.setDimensions(height, width, maxHeight, maxWidth, tb, lr, resizable);

    return S.dimensions;
}

S.skin = K;
