/**
 * The Shadowbox object.
 *
 * @type    {Object}
 * @public
 */
var S = {

    /**
     * The current version of Shadowbox.
     *
     * @type    {String}
     * @public
     */
    version: "3.0rc2"

}

var ua = navigator.userAgent.toLowerCase();

// operating system detection
if (ua.indexOf('windows') > -1 || ua.indexOf('win32') > -1) {
    S.isWindows = true;
} else if (ua.indexOf('macintosh') > -1 || ua.indexOf('mac os x') > -1) {
    S.isMac = true;
} else if (ua.indexOf('linux') > -1) {
    S.isLinux = true;
}

// browser detection -- deprecated. the goal is to use object detection
// instead of the user agent string
S.isIE = ua.indexOf('msie') > -1;
S.isIE6 = ua.indexOf('msie 6') > -1;
S.isIE7 = ua.indexOf('msie 7') > -1;
S.isGecko = ua.indexOf('gecko') > -1 && ua.indexOf('safari') == -1;
S.isWebKit = ua.indexOf('applewebkit/') > -1;

var inlineId = /#(.+)$/,
    galleryName = /^(light|shadow)box\[(.*?)\]/i,
    inlineParam = /\s*([a-z_]*?)\s*=\s*(.+)\s*/,
    fileExtension = /[0-9a-z]+$/i,
    scriptPath = /(.+\/)shadowbox\.js/i;

/**
 * True if Shadowbox is currently open, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
var open = false,

/**
 * True if Shadowbox has been initialized, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
initialized = false,

/**
 * True if Shadowbox has been loaded into the DOM, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
loaded = false,

/**
 * The previous set of options that were used before Shadowbox.applyOptions was
 * called.
 *
 * @type    {Object}
 * @private
 */
lastOptions = {},

/**
 * The delay in milliseconds that the current gallery uses.
 *
 * @type    {Number}
 * @private
 */
slideDelay = 0,

/**
 * The time at which the current slideshow frame appeared.
 *
 * @type    {Number}
 * @private
 */
slideStart,

/**
 * The timeout id for the slideshow transition function.
 *
 * @type    {Number}
 * @private
 */
slideTimer,

/**
 * The callback function for the DOMContentLoaded browser event.
 *
 * @type    {Function}
 * @private
 */
DOMContentLoaded;

// The following code is adapted for Shadowbox from the jQuery JavaScript library.

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
 * The id to use for the Shadowbox player element.
 *
 * @type    {String}
 * @public
 */
S.playerId = "sb-player";

/**
 * The index of the current object in the gallery array.
 *
 * @type    {Number}
 * @public
 */
S.current = -1;

/**
 * The current dimensions of Shadowbox.
 *
 * @type    {Object}
 * @public
 */
S.dimensions = null;

/**
 * Easing function used for animations. Based on a cubic polynomial.
 *
 * @param   {Number}    state   The state of the animation (% complete)
 * @return  {Number}            The adjusted easing value
 * @public
 */
S.ease = function(state) {
    return 1 + Math.pow(state - 1, 3);
}

/**
 * The content objects in the current set.
 *
 * @type    {Array}
 * @public
 */
S.gallery = [];

/**
 * The URL path to the Shadowbox script.
 *
 * @type    {String}
 * @public
 */
S.path = null;

/**
 * The current player object.
 *
 * @type    {Object}
 * @public
 */
S.player = null;

/**
 * Various options that control Shadowbox' behavior.
 *
 * @type    {Object}
 * @public
 */
S.options = {

    /**
     * True to enable animations.
     *
     * @type    {Boolean}
     */
    animate: true,

    /**
     * True to enable opacity animations.
     *
     * @type    {Boolean}
     */
    animateFade: true,

    /**
     * True to automatically play movies when the load.
     *
     * @type    {Boolean}
     */
    autoplayMovies: true,

    /**
     * True to enable the user to skip to the first item in a gallery from the last using
     * next.
     *
     * @type    {Boolean}
     */
    continuous: false,

    /**
     * True to enable keyboard navigation.
     *
     * @type    {Boolean}
     */
    enableKeys: true,

    /**
     * An object containing names of plugins and links to their respective download pages.
     *
     * @type    {Object}
     */
    errors: {
        fla: {
            name: "Flash",
            url:  "http://www.adobe.com/products/flashplayer/"
        },
        qt: {
            name: "QuickTime",
            url:  "http://www.apple.com/quicktime/download/"
        },
        wmp: {
            name: "Windows Media Player",
            url:  "http://www.microsoft.com/windows/windowsmedia/"
        },
        f4m: {
            name: "Flip4Mac",
            url:  "http://www.flip4mac.com/wmv_download.htm"
        }
    },

    /**
     * Parameters to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashParams: {
        bgcolor: "#000000",
        allowfullscreen: true
    },

    /**
     * Variables to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashVars: {},

    /**
     * The minimum required Flash version.
     *
     * Note: The default is 9.0.115. This is the minimum version suggested by
     * the JW FLV player.
     *
     * @type    {String}
     */
    flashVersion: "9.0.115",

    /**
     * Determines how oversized content is handled. If set to "resize" the
     * content will be resized while preserving aspect ratio. If "drag" will display
     * the image at its original resolution but it will be draggable. If "none" will
     * display the content at its original resolution but it may be cropped.
     *
     * @type    {String}
     */
    handleOversize: "resize",

    /**
     * Determines how unsupported content is handled. If set to "remove" will
     * remove the content from the gallery. If "link" will display a helpful
     * link to a page where the necessary browser plugin can be installed.
     *
     * @type    {String}
     */
    handleUnsupported: "link",

    /**
     * A hook function to be fired when changing from one gallery item to the
     * next. Is passed the item that is about to be displayed as its only argument.
     *
     * @type    {Function}
     */
    onChange: noop,

    /**
     * A hook function to be fired when closing. Is passed the most recent item
     * as its only argument.
     *
     * @type    {Function}
     */
    onClose: noop,

    /**
     * A hook funciton to be fires when content is finished loading. Is passed the
     * current gallery item as its only argument.
     *
     * @type    {Function}
     */
    onFinish: noop,

    /**
     * A hook function to be fired when opening. Is passed the current gallery item
     * as its only argument.
     *
     * @type    {Function}
     */
    onOpen: noop,

    /**
     * True to enable movie controls on movie players.
     *
     * @type    {Boolean}
     */
    showMovieControls: true,

    /**
     * True to skip calling setup during init.
     *
     * @type    {Boolean}
     */
    skipSetup: false,

    /**
     * The delay (in seconds) to use when displaying a gallery in slideshow mode. Setting
     * this option to any value other than 0 will trigger slideshow mode.
     *
     * @type    {Number}
     */
    slideshowDelay: 0,

    /**
     * The ammount of padding (in pixels) to maintain around the edge of the viewport at all
     * times.
     *
     * @type    {Number}
     */
    viewportPadding: 20

};

/**
 * Gets the object that is currently being displayed.
 *
 * @return  {Object}
 * @public
 */
S.getCurrent = function() {
    return S.current > -1 ? S.gallery[S.current] : null;
}

/**
 * Returns true if there is another object to display after the current.
 *
 * @return  {Boolean}
 * @public
 */
S.hasNext = function() {
    return S.gallery.length > 1 && (S.current != S.gallery.length - 1 || S.options.continuous);
}

/**
 * Returns true if Shadowbox is currently open.
 *
 * @return  {Boolean}
 * @public
 */
S.isOpen = function() {
    return open;
}

/**
 * Returns true if Shadowbox is currently paused.
 *
 * @return  {Boolean}
 * @public
 */
S.isPaused = function() {
    return slideTimer == "pause";
}

/**
 * Applies the given set of options to Shadowbox' options. May be undone with revertOptions().
 *
 * @param   {Object}    options
 * @public
 */
S.applyOptions = function(options) {
    lastOptions = apply({}, S.options);
    apply(S.options, options);
}

/**
 * Reverts to whatever the options were before applyOptions() was called.
 *
 * @public
 */
S.revertOptions = function() {
    apply(S.options, lastOptions);
}

/**
 * Initializes the Shadowbox environment. If options are given here, they
 * will override the defaults.
 *
 * @param   {Object}    options
 * @public
 */
S.init = function(options) {
    if (initialized)
        return;

    initialized = true;

    if (S.skin.options)
        apply(S.options, S.skin.options);

    if (options)
        apply(S.options, options);

    if (!S.path) {
        // determine script path automatically
        var path, scripts = document.getElementsByTagName("script");
        for (var i = 0, len = scripts.length; i < len; ++i) {
            path = scriptPath.exec(scripts[i].src);
            if (path) {
                S.path = path[1];
                break;
            }
        }
    }

    bindLoad();
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

    if (!S.options.skipSetup)
        S.setup();

    S.skin.init();
}

/**
 * Opens the given object in Shadowbox. This object should be either link element or
 * an object similar to one produced by Shadowbox.buildObject.
 *
 * @param   {mixed}     obj
 * @public
 */
S.open = function(obj) {
    if (open)
        return;

    // non-cached link, build an object on the fly
    if (obj.tagName && !(obj = S.getCache(obj)))
        obj = S.buildObject(obj);

    if (obj.push) {
        // obj is a gallery of objects
        S.gallery = obj;
        S.current = 0;
    } else {
        if (obj.gallery) {
            // gallery object, build gallery from cached gallery objects
            S.gallery = [];
            S.current = null;

            var o;
            for (var key in S.cache) {
                o = S.cache[key];
                if (o.gallery && o.gallery == obj.gallery) {
                    if (S.current == null && o.content == obj.content)
                        S.current = S.gallery.length;
                    S.gallery.push(o);
                }
            }

            if (S.current == null) {
                S.gallery.unshift(obj);
                S.current = 0;
            }
        } else {
            // single object, no gallery
            S.gallery = [obj];
            S.current = 0;
        }
    }

    // use apply to break references to each gallery object here because
    // the code may modify certain properties of these objects from here
    // on out and we want to preserve the original in case it is used
    // again in a future call
    each(S.gallery, function(i, o) {
        S.gallery[i] = apply({}, o);
    });

    obj = S.getCurrent();
    if (obj.options)
        S.applyOptions(obj.options);

    filterGallery();

    // anything left to display?
    if (S.gallery.length) {
        if (S.options.onOpen(obj) === false)
            return;

        open = true;

        S.skin.onOpen(obj, load);
    }
}

/**
 * Closes Shadowbox.
 *
 * @public
 */
S.close = function() {
    if (!open)
        return;

    open = false;

    if (S.player) {
        S.player.remove();
        S.player = null;
    }

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
    }
    slideDelay = 0;

    S.options.onClose(S.getCurrent());

    S.skin.onClose();

    S.revertOptions();
}

/**
 * Starts a slideshow when a gallery is being displayed. Is called automatically
 * when the slideshowDelay option is set to anything other than 0.
 *
 * @public
 */
S.play = function() {
    if (!S.hasNext())
        return;

    if (!slideDelay)
        slideDelay = S.options.slideshowDelay * 1000;

    if (slideDelay) {
        slideStart = now();
        slideTimer = setTimeout(function(){
            slideDelay = slideStart = 0; // reset slideshow
            S.next();
        }, slideDelay);

        if(S.skin.onPlay)
            S.skin.onPlay();
    }
}

/**
 * Pauses a slideshow on the current object.
 *
 * @public
 */
S.pause = function() {
    if (typeof slideTimer != "number")
        return;

    slideDelay = Math.max(0, slideDelay - (now() - slideStart));

    // if there's any time left on current slide, pause the timer
    if (slideDelay) {
        clearTimeout(slideTimer);
        slideTimer = "pause";

        if(S.skin.onPause)
            S.skin.onPause();
    }
}

/**
 * Changes Shadowbox to display the item in the gallery specified by index.
 *
 * @param   {Number}    index
 * @public
 */
S.change = function(index) {
    if (!(index in S.gallery)) {
        if (S.options.continuous) {
            index = (index < 0 ? S.gallery.length + index : 0); // loop
            if (!(index in S.gallery))
                return;
        } else {
            return;
        }
    }

    S.current = index;

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
        slideDelay = slideStart = 0;
    }

    S.options.onChange(S.getCurrent());

    load(true);
}

/**
 * Advances to the next item in the gallery.
 *
 * @public
 */
S.next = function() {
    S.change(S.current + 1);
}

/**
 * Rewinds to the previous gallery item.
 *
 * @public
 */
S.previous = function() {
    S.change(S.current - 1);
}

/**
 * Extracts parameters from a link element and returns an object containing
 * (most of) the following keys:
 *
 * - link: the link element
 * - title: the object's title
 * - player: the player to use for the object
 * - content: the object's URL
 * - gallery: the gallery the object belongs to (optional)
 * - height: the height of the object (only necessary for movies)
 * - width: the width of the object (only necessary for movies)
 * - options: custom options to use (optional)
 *
 * A custom set of options may be passed in here that will be applied when
 * this object is displayed. However, any options that are specified in
 * the link's HTML markup will trump options given here.
 *
 * @param   {HTMLElement}   link        The link element to process
 * @param   {Object}        options     A set of options to use for the object
 * @return  {Object}                    An object representing the link
 * @public
 */
S.buildObject = function(link, options) {
    var obj = {
        link:       link,
        title:      link.getAttribute("title") || "",
        content:    link.href // don't use getAttribute here
    };

    // remove link-level options from top-level options
    if (options) {
        each(["player", "title", "height", "width", "gallery"], function(i, o) {
            if (typeof options[o] != "undefined") {
                obj[o] = options[o];
                delete options[o];
            }
        });
    }
    obj.options = options || {};

    if (!obj.player)
        obj.player = S.getPlayer(obj.content);

    // HTML options always trump JavaScript options, so do these last
    var rel = link.getAttribute("rel");
    if (rel) {
        // extract gallery name from shadowbox[name] format
        var match = rel.match(galleryName);
        if (match)
            obj.gallery = escape(match[2]);

        // other parameters
        each(rel.split(';'), function(i, p) {
            match = p.match(inlineParam);
            if (match) {
                if (match[1] == "options") {
                    eval("apply(obj.options," + match[2] + ")");
                } else {
                    obj[match[1]] = match[2];
                }
            }
        });
    }

    return obj;
}

/**
 * Attempts to automatically determine the correct player to use based on the
 * given content attribute. If the content type can be detected but is not
 * supported, the return value will be 'unsupported-*' where * will be the
 * player abbreviation (e.g. 'qt' = QuickTime). Defaults to 'iframe' where the
 * content type cannot automatically be determined.
 *
 * @param   {String}    content     The content attribute of the item
 * @return  {String}                The name of the player to use
 * @public
 */
S.getPlayer = function(content) {
    if (content.indexOf("#") > -1 && content.indexOf(document.location.href) == 0)
        return "inline";

    // strip query string for player detection purposes
    var q = content.indexOf("?");
    if (q > -1)
        content = content.substring(0, q);

    // get file extension
    var ext, m = content.match(fileExtension)
    if (m)
        ext = m[0];

    if (ext) {
        if (S.img && S.img.ext.indexOf(ext) > -1)
            return "img";
        if (S.swf && S.swf.ext.indexOf(ext) > -1)
            return "swf";
        if (S.flv && S.flv.ext.indexOf(ext) > -1)
            return "flv";
        if (S.qt && S.qt.ext.indexOf(ext) > -1) {
            if (S.wmp && S.wmp.ext.indexOf(ext) > -1) {
                return "qtwmp"; // can be played by either QuickTime or Windows Media Player
            } else {
                return "qt";
            }
        }
        if (S.wmp && S.wmp.ext.indexOf(ext) > -1)
            return "wmp";
    }

    return "iframe";
}

/**
 * Calculates the dimensions for Shadowbox according to the given
 * parameters. Will determine if content is oversized (too large for the
 * viewport) and will automatically constrain resizable content
 * according to user preference.
 *
 * @param   {Number}    height      The content height
 * @param   {Number}    width       The content width
 * @param   {Number}    maxHeight   The maximum height available (should be the height of the viewport)
 * @param   {Number}    maxWidth    The maximum width available (should be the width of the viewport)
 * @param   {Number}    tb          The extra top/bottom pixels that are required for borders/toolbars
 * @param   {Number}    lr          The extra left/right pixels that are required for borders/toolbars
 * @param   {Boolean}   resizable   True if the content is able to be resized. Defaults to false
 * @public
 */
S.setDimensions = function(height, width, maxHeight, maxWidth, tb, lr, padding, resizable) {
    var h = height,
        w = width;

    // calculate the max height/width
    var extraHeight = 2 * padding + tb;
    if (h + extraHeight >= maxHeight)
        h = maxHeight - extraHeight;
    var extraWidth = 2 * padding + lr;
    if (w + extraWidth >= maxWidth)
        w = maxWidth - extraWidth;

    // handle oversized content
    var resizeHeight = height,
        resizeWidth = width,
        changeHeight = (height - h) / height,
        changeWidth = (width - w) / width,
        oversized = (changeHeight > 0 || changeWidth > 0);

    // adjust resized height/width, preserve original aspect ratio
    if (resizable && oversized && S.options.handleOversize == "resize") {
        if (changeHeight > changeWidth) {
            w = Math.round((width / height) * h);
        } else if (changeWidth > changeHeight) {
            h = Math.round((height / width) * w);
        }
        resizeWidth = w;
        resizeHeight = h;
    }

    S.dimensions = {
        height:         h + tb,
        width:          w + lr,
        innerHeight:    h,
        innerWidth:     w,
        top:            (maxHeight - (h + extraHeight)) / 2 + padding,
        left:           (maxWidth - (w + extraWidth)) / 2 + padding,
        oversized:      oversized,
        resizeHeight:   resizeHeight,
        resizeWidth:    resizeWidth
    };
}

/**
 * Filters the current gallery for unsupported objects.
 *
 * @private
 */
function filterGallery() {
    var errors = S.options.errors, plugins = S.plugins, obj, remove, needed,
        m, format, replace, inlineEl, flashVersion;

    for (var i = 0; i < S.gallery.length; ++i) {
        obj = S.gallery[i]

        remove = false; // remove the object?
        needed = null; // what plugins are needed?

        switch (obj.player) {
        case "flv":
        case "swf":
            if (!plugins.fla)
                needed = "fla";
            break;
        case "qt":
            if (!plugins.qt)
                needed = "qt";
            break;
        case "wmp":
            if (S.isMac) {
                if (plugins.qt && plugins.f4m) {
                    obj.player = "qt";
                } else {
                    needed = "qtf4m";
                }
            } else if (!plugins.wmp) {
                needed = "wmp";
            }
            break;
        case "qtwmp":
            if (plugins.qt) {
                obj.player = "qt";
            } else if (plugins.wmp) {
                obj.player = "wmp";
            } else {
                needed = "qtwmp";
            }
            break;
        }

        // handle unsupported elements
        if (needed) {
            if (S.options.handleUnsupported == "link") {
                // generate a link to the appropriate plugin download page(s)
                switch (needed) {
                case "qtf4m":
                    format = "shared";
                    replace = [errors.qt.url, errors.qt.name, errors.f4m.url, errors.f4m.name];
                    break;
                case "qtwmp":
                    format = "either";
                    replace = [errors.qt.url, errors.qt.name, errors.wmp.url, errors.wmp.name];
                    break;
                default:
                    format = "single";
                    replace = [errors[needed].url, errors[needed].name];
                }

                obj.player = "html";
                obj.content = '<div class="sb-message">' + sprintf(S.lang.errors[format], replace) + '</div>';
            } else {
                remove = true;
            }
        } else if (obj.player == "inline") {
            // inline element, retrieve innerHTML
            m = inlineId.exec(obj.content);
            if (m) {
                inlineEl = get(m[1]);
                if (inlineEl) {
                    obj.content = inlineEl.innerHTML;
                } else {
                    // cannot find element with id
                    remove = true;
                }
            } else {
                // cannot determine element id from content string
                remove = true;
            }
        } else if (obj.player == "swf" || obj.player == "flv") {
            flashVersion = (obj.options && obj.options.flashVersion) || S.options.flashVersion;

            if (!S.flash.hasFlashPlayerVersion(version)) {
                // express install will be triggered because the client does not meet the
                // minimum required version of Flash. set height and width to those of expressInstall.swf
                obj.width = 310;
                // minimum height is 127, but +20 pixels on top and bottom looks better
                obj.height = 177;
            }
        }

        if (remove) {
            S.gallery.splice(i, 1);

            if (i < S.current) {
                --S.current; // maintain integrity of S.current
            } else if (i == S.current) {
                S.current = i > 0 ? i - 1 : i; // look for supported neighbor
            }

            // decrement index for next loop
            --i;
        }
    }
}

/**
 * Sets up a listener on the document for keydown events.
 *
 * @param   {Boolean}   on      True to enable the listener, false to disable
 * @private
 */
function listenKeys(on) {
    if (!S.options.enableKeys)
        return;

    if (on) {
        addEvent(document, "keydown", handleKey);
    } else {
        removeEvent(document, "keydown", handleKey);
    }
}

/**
 * A listener function that is fired when a key is pressed.
 *
 * @param   {Event}     e   The keydown event
 * @private
 */
function handleKey(e) {
    var code = keyCode(e), handler;

    switch (code) {
    case 81: // q
    case 88: // x
    case 27: // esc
        handler = S.close;
        break;
    case 37: // left
        handler = S.previous;
        break;
    case 39: // right
        handler = S.next;
        break;
    case 32: // space
        handler = typeof slideTimer == "number" ? S.pause : S.play;
        break;
    }

    if (handler) {
        preventDefault(e);
        handler();
    }
}

/**
 * Loads the current object.
 *
 * @param   {Boolean}   True if changing from a previous object
 * @private
 */
function load(changing) {
    listenKeys(false);

    var obj = S.getCurrent();

    // determine player, inline is really just html
    var player = (obj.player == "inline" ? "html" : obj.player);

    if (typeof S[player] != "function")
        throw "unknown player " + player;

    if (changing) {
        S.player.remove();
        S.revertOptions();
        S.applyOptions(obj.options);
    }

    S.player = new S[player](obj);

    // preload neighboring gallery images
    if (S.gallery.length > 1) {
        var next = S.gallery[S.current + 1] || S.gallery[0];
        if (next.player == "img") {
            var a = new Image();
            a.src = next.content;
        }
        var prev = S.gallery[S.current - 1] || S.gallery[S.gallery.length - 1];
        if (prev.player == "img") {
            var b = new Image();
            b.src = prev.content;
        }
    }

    S.skin.onLoad(changing, waitReady);
}

/**
 * Waits until the current object is ready to be displayed.
 *
 * @private
 */
function waitReady() {
    if (!open)
        return;

    if (typeof S.player.ready != "undefined") {
        // wait for content to be ready before loading
        var timer = setInterval(function() {
            if (open) {
                if (S.player.ready) {
                    clearInterval(timer);
                    timer = null;
                    S.skin.onReady(show);
                }
            } else {
                clearInterval(timer);
                timer = null;
            }
        }, 10);
    } else {
        S.skin.onReady(show);
    }
}

/**
 * Displays the current object.
 *
 * @private
 */
function show() {
    if (!open)
        return;

    S.player.append(S.skin.body, S.dimensions);

    S.skin.onShow(finish);
}

/**
 * Finishes up any remaining tasks after the object is displayed.
 *
 * @private
 */
function finish() {
    if (!open)
        return;

    if (S.player.onLoad)
        S.player.onLoad();

    S.options.onFinish(S.getCurrent());

    if (!S.isPaused())
        S.play(); // kick off next slide

    listenKeys(true);
}
