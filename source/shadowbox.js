/*!
 * Shadowbox, version @VERSION
 * http://shadowbox-js.com/
 * Copyright 2007-2011 Michael Jackson
 */

(function (window, undefined) {

    var root = document.documentElement,
        guid = 1,
        initialized = false,
        current = -1,
        gallery = [],
        player = null,
        options = {},

        // True if the browser supports opacity.
        supportsOpacity = "opacity" in root.style && typeof root.style.opacity === "string",

        // True if the browser supports fixed positioning.
        supportsFixed = false,

        // True if the browser is on a touch-based device.
        supportsTouch = "createTouch" in document;

    // Detect support for fixed positioning.
    var div = document.createElement("div");
    div.style.position = "fixed";
    div.style.margin = 0;
    div.style.top = "20px";
    root.appendChild(div, root.firstChild);
    supportsFixed = (div.offsetTop == 20);
    root.removeChild(div);

    var shadowbox = open;

    /**
     * The current version of Shadowbox.
     */
    shadowbox.version = "4.0.0";

    /**
     * A map of file extensions to the player class that should be used to play
     * files with that extension.
     */
    shadowbox.players = {};

    /**
     * The default set of options.
     */
    shadowbox.options = {

        // Animate height/width transitions.
        animate: true,

        // Automatically close when done playing movies.
        autoClose: false,

        // Able to navigate from one end of a gallery to the other (i.e. from
        // last item to first or vice versa) by choosing next/previous?
        continuous: false,

        // Easing function for animations. Based on a cubic polynomial.
        ease: function (state) {
            return 1 + Math.pow(state - 1, 3);
        },

        // Enable control of Shadowbox via the keyboard?
        enableKeys: true,

        // The amount of margin to maintain around the edge of Shadowbox at all
        // times.
        margin: 40,

        // A hook function that is called when closing.
        onClose: noop,

        // A hook function that is called when a player is finished loading and
        // all display transitions are complete. Receives the player object as
        // its only argument.
        onDone: noop,

        // A hook function that is called when opening.
        onOpen: noop,

        // A hook function that is called when a player is ready to be
        // displayed. Receives the player object as its only argument.
        onShow: noop,

        // Background color for the overlay.
        overlayColor: "#333",

        // Opacity for the overlay.
        overlayOpacity: 0.5,

        // The index in the current gallery at which to start when first
        // opening.
        startIndex: 0

    };

    /**
     * Registers the given player class to be used with the given file
     * extensions.
     *
     *   shadowbox.register(shadowbox.Video, "mov");
     *   shadowbox.register(shadowbox.Photo, ["jpg", "jpeg"]);
     */
    function register(player, exts) {
        exts = exts || [];

        if (!Array.isArray(exts)) {
            exts = [exts];
        }

        for (var i = 0, len = exts.length; i < len; ++i) {
            shadowbox.players[exts[i]] = player;
        }
    }

    // Cache references to oft-used DOM elements for speed.
    var container, overlay, wrapper, cover, content;

    /**
     * Appends Shadowbox' to the DOM.
     */
    function initialize() {
        if (initialized) {
            return;
        }

        initialized = true;

        // The Shadowbox markup:
        //
        // <div id="shadowbox">
        //     <div id="sb-overlay"></div>
        //     <div id="sb-wrapper">
        //         <div id="sb-body">
        //             <div id="sb-content"></div>
        //             <div id="sb-cover"></div>
        //         </div>
        //         <div id="sb-close"></div>
        //         <div id="sb-next"></div>
        //         <div id="sb-prev"></div>
        //     </div>
        // </div>

        container = dom("div", {id: "shadowbox"});
        overlay = dom("div", {id: "sb-overlay"});
        wrapper = dom("div", {id: "sb-wrapper"});
        var body = dom("div", {id: "sb-body"});
        content = dom("div", {id: "sb-content"});
        cover = dom("div", {id: "sb-cover"});
        var closeEl = dom("div", {id: "sb-close"});
        var nextEl = dom("div", {id: "sb-next"});
        var previousEl = dom("div", {id: "sb-prev"});

        // Append #shadowbox to the DOM.
        dom(document.body, [
            dom(container, [
                overlay,
                dom(wrapper, [
                    dom(body, [content, cover]),
                    closeEl,
                    nextEl,
                    previousEl
                ])
            ])
        ]);

        // Setup a click listener on the overlay to close Shadowbox.
        addEvent(overlay, "click", close);

        // Setup callbacks on navigation elements.
        addEvent(closeEl, "click", cancel(close));
        addEvent(nextEl, "click", cancel(next));
        addEvent(previousEl, "click", cancel(previous));

        if (!supportsFixed) {
            // Use an absolutely positioned container in browsers that don't
            // support fixed positioning.
            setStyle(container, "position", "absolute");
        }
    }

    /**
     * Opens an object (or an array of objects) in Shadowbox. Takes options as
     * the final argument.
     *
     *   shadowbox("myphoto.jpg");
     *   shadowbox(["myphoto1.jpg", "myphoto2.jpg"]);
     *   shadowbox(["myphoto1.jpg", "myphoto2.jpg"], {
     *       animate:         false,
     *       overlayColor:    "white",
     *       overlayOpacity:  0.8
     *   });
     *
     * Options may be any of shadowbox.options. Returns the number of objects
     * that were able to be opened.
     */
    function open(objs, opts) {
        if (!Array.isArray(objs)) {
            objs = [objs];
        }

        options = apply({}, shadowbox.options, opts || {});

        // Clear the gallery.
        gallery = [];

        // Normalize into player objects and append them to the gallery.
        var index = options.startIndex,
            player;
        for (var i = 0, len = objs.length; i < len; ++i) {
            player = makePlayer(objs[i]);
            if (player) {
                gallery.push(player);
            } else {
                if (i < index) {
                    index -= 1;
                } else if (i == index) {
                    index = 0;
                }
            }
        }

        // Display the first item in the gallery (if there's anything left
        // to display).
        if (gallery.length > 0) {
            if (current == -1) {
                initialize();

                if (isFunction(options.onOpen)) {
                    options.onOpen();
                }

                setStyle(container, "display", "block");
                setContainerPosition();
                setContainerSize();
                toggleTroubleElements(0);
                setStyle(overlay, "backgroundColor", options.overlayColor);
                setStyle(overlay, "opacity", 0);
                setStyle(container, "visibility", "visible");

                animateStyle(overlay, "opacity", options.overlayOpacity, 0.35, function () {
                    setWrapperSize(340, 200);
                    setStyle(wrapper, "visibility", "visible");
                    show(index);
                });
            } else {
                show(index);
            }
        }

        return gallery.length;
    }

    /**
     * Displays the gallery item at the given index in Shadowbox. Assumes that
     * Shadowbox is already initialized and open.
     */
    function show(index) {
        // Guard against invalid indices.
        if (index < 0 || !gallery[index]) {
            return;
        }

        toggleControls(0);
        toggleWindowHandlers(0);
        toggleMouseHandlers(0);
        toggleKeyHandlers(0);

        setStyle(cover, "display", "block");
        setStyle(cover, "opacity", 1);

        if (player) {
            player.remove();
        }

        // Update current gallery position.
        current = index;
        player = gallery[current];

        // Wait for the player to be ready before proceeding.
        var timer = setInterval(function () {
            if (!player) {
                clearInterval(timer);
                timer = null;
                return;
            }

            if (player.ready === false) {
                return;
            }

            clearInterval(timer);
            timer = null;

            if (isFunction(options.onShow)) {
                options.onShow(player);
            }

            var size = getWrapperSize();

            var fromWidth = parseInt(getStyle(wrapper, "width")) || 0,
                fromHeight = parseInt(getStyle(wrapper, "height")) || 0,
                toWidth = size[0],
                toHeight = size[1],
                changeWidth = toWidth - fromWidth,
                changeHeight = toHeight - fromHeight;

            // Open to the correct dimensions. Use the low-level animation
            // primitive to make this transition as smooth as possible.
            animate(0, 1, 0.5, function (value) {
                if (!player) {
                    return false; // Cancel the animation.
                }

                setWrapperSize(fromWidth + (changeWidth * value),
                    fromHeight + (changeHeight * value));

                if (value === 1) {
                    if (player.fadeCover) {
                        player.insert(content);
                        animateStyle(cover, "opacity", 0, 0.5, function () {
                            if (player) done();
                        });
                    } else {
                        done();
                        player.insert(content);
                    }
                }
            });
        }, 10);
    }

    function done() {
        setStyle(cover, "display", "none");

        toggleWindowHandlers(1);
        toggleMouseHandlers(1);
        toggleKeyHandlers(1);

        if (isFunction(options.onDone)) {
            options.onDone(player);
        }
    }

    /**
     * Closes Shadowbox immediately.
     */
    function close() {
        if (!isOpen()) {
            return;
        }

        current = -1;
        player = null;

        setStyle(wrapper, "visibility", "hidden");
        setStyle(cover, "opacity", 1);
        content.innerHTML = "";

        toggleControls(0);
        toggleWindowHandlers(0);
        toggleMouseHandlers(0);
        toggleKeyHandlers(0);

        animateStyle(overlay, "opacity", 0, 0.5, function () {
            setStyle(container, "visibility", "hidden");
            setStyle(container, "display", "none");
            toggleTroubleElements(1);

            if (isFunction(options.onClose)) {
                options.onClose();
            }
        });
    }

    /**
     * Gets the current player instance.
     */
    function getPlayer() {
        return player;
    }

    /**
     * Gets the index of the next item in the gallery, -1 if there is none.
     */
    function getNext() {
        if (current == gallery.length - 1) {
            return (options.continuous && current != 0) ? 0 : -1;
        }

        return current + 1;
    }

    /**
     * Returns true if there is a next item in the gallery.
     */
    function hasNext() {
        return getNext() >= 0;
    }

    /**
     * Opens the next item in the gallery.
     */
    function next() {
        show(getNext());
    }

    /**
     * Gets the index of the previous item in the gallery, -1 if there is none.
     */
    function getPrevious() {
        if (current == 0) {
            return options.continuous ? gallery.length - 1 : -1;
        }

        return current - 1;
    }

    /**
     * Returns true if there is a previous item in the gallery.
     */
    function hasPrevious() {
        return getPrevious() >= 0;
    }

    /**
     * Opens the previous item in the gallery.
     */
    function previous() {
        show(getPrevious());
    }

    /**
     * Returns true if Shadowbox is currently open.
     */
    function isOpen() {
        return current != -1;
    }

    /**
     * Gets the size that should be used for the wrapper element. Should be
     * called when Shadowbox is open and has a player that is ready.
     */
    function getWrapperSize() {
        var margin = Math.max(options.margin, 20); // Minimum 20px margin.
        var size = constrainSize(player.width, player.height,
            overlay.offsetWidth, overlay.offsetHeight, margin);

        return size;
    }

    /**
     * Sets the size and position of the wrapper.
     */
    function setWrapperSize(width, height) {
        setStyle(wrapper, "width", width + "px");
        setStyle(wrapper, "marginLeft", (-width / 2) + "px");
        setStyle(wrapper, "height", height + "px");
        setStyle(wrapper, "marginTop", (-height / 2) + "px");
    }

    /**
     * Scales the given width and height to be within the bounds of the given
     * maximum width and height, allowing for margin. Returns an array of the
     * constrained [width, height].
     */
    function constrainSize(width, height, maxWidth, maxHeight, extra) {
        var originalWidth = width,
            originalHeight = height;

        // Constrain height/width to max.
        var extraWidth = 2 * extra;
        if (width + extraWidth > maxWidth) {
            width = maxWidth - extraWidth;
        }

        var extraHeight = 2 * extra;
        if (height + extraHeight > maxHeight) {
            height = maxHeight - extraHeight;
        }

        // Calculate the change in height/width.
        var changeWidth = (originalWidth - width) / originalWidth,
            changeHeight = (originalHeight - height) / originalHeight;

        // Adjust height/width if oversized.
        if (changeWidth > 0 || changeHeight > 0) {
            // Preserve original aspect ratio according to greatest change.
            if (changeWidth > changeHeight) {
                height = round((originalHeight / originalWidth) * width);
            } else if (changeHeight > changeWidth) {
                width = round((originalWidth / originalHeight) * height);
            }
        }

        return [width, height];
    }

    /**
     * Sets the size of the container element to the size of the window.
     */
    function setContainerSize() {
        setStyle(container, "width", root.clientWidth + "px");
        setStyle(container, "height", root.clientHeight + "px");

        if (player) {
            var size = getWrapperSize();
            setWrapperSize(size[0], size[1]);
        }
    }

    /**
     * Sets the position of the container element to the top left corner of
     * the window. Necessary when using absolute positioning instead of fixed.
     */
    function setContainerPosition() {
        setStyle(container, "left", root.scrollLeft + "px");
        setStyle(container, "top", root.scrollTop + "px");
    }

    var troubleElements = ["select", "object", "embed", "canvas"],
        visibilityCache = [];

    /**
     * Toggles the visibility of elements that are troublesome for overlays.
     */
    function toggleTroubleElements(on) {
        if (on) {
            each(visibilityCache, function(i, el){
                setStyle(el[0], "visibility", el[1] || "");
            });
        } else {
            visibilityCache = [];
            each(troubleElements, function(i, tagName) {
                each(document.getElementsByTagName(tagName), function(j, el) {
                    visibilityCache.push([el, getStyle(el, "visibility")]);
                    setStyle(el, "visibility", "hidden");
                });
            });
        }
    }

    /**
     * Creates a new player object based on the attributes in the given object.
     * Valid attributes include:
     *
     *   - url          The URL of the content to display
     *   - width        (optional) The width of the content
     *   - height       (optional) The height of the content
     *   - player       (optional) The player class to use to play the content.
     *                  Can be guessed in most cases from the URL
     *   - encodings    (video only) Encoding name/URL pairs of alternate URL's
     *                  for the video. Possible encoding names are "h264", "ogg"
     *                  "webm", and "flv"
     *   - posterUrl    (video only) The URL to a poster image of the video
     *   - flashParams  (flash only) Name/value pairs of <param>'s to use for
     *                  the Flash <object>
     *   - flashVars    (flash only) Name/value pairs of variables to pass to
     *                  the Flash object as variables
     *
     * If a string is given, it will be used as the value of the URL. If a DOM
     * element is given, it should have an href property (i.e. either an <a> or
     * an <area> element) which will be used as the URL. It may also contain
     * a data-shadowbox attribute that has any of the other options formatted
     * in a JSON string.
     *
     * If no player is specified, it will be guessed using the registered player
     * for the URL's file extension (see shadowbox.register).
     *
     * Returns false if no player is able to be created, or this browser does
     * not have proper support for that content.
     */
    function makePlayer(obj) {
        if (typeof obj == "string") {
            obj = {url: obj};
        } else if (obj.nodeType === 1 && obj.href) {
            // The object is a DOM element. Should be an <a> or <area>. The
            // data-shadowbox attribute may contain a JSON string specifying
            // options for the player object.
            var data = obj.getAttribute("data-shadowbox");

            obj = {url: obj.href};

            if (data) {
                apply(obj, parseJson(data));
            }
        }

        if (obj && typeof obj.url == "string") {
            var id = "sb-player-" + String(guid++),
                playerFn;

            if (obj.player) {
                playerFn = obj.player;
            } else {
                // Guess the player class using the URL's file extension.
                var match = obj.url.match(/\.([0-9a-z]+)(\?.*)?$/i);
                if (match) {
                    playerFn = shadowbox.players[match[1].toLowerCase()];
                }
            }

            playerFn = playerFn || Frame;

            var player = new playerFn(obj, id);

            if (player.isSupported()) {
                return player;
            }
        }

        return false;
    }

    // Toggles visibility of clickable controls on and off.
    function toggleControls(on) {
        var name = "";

        if (on) {
            name += "active";
            if (hasNext()) name += " has-next";
            if (hasPrevious()) name += " has-prev";
        }

        container.className = name;
    }

    var windowResizeTimer, windowScrollTimer, mouseMoveTimer;

    // Toggles window resize/scroll handlers on/off.
    function toggleWindowHandlers(on) {
        var fn;
        if (on) {
            fn = addEvent;
        } else {
            fn = removeEvent;

            // Clear cached timers.
            if (windowResizeTimer) {
                clearTimeout(windowResizeTimer);
                windowResizeTimer = null;
            }

            if (windowScrollTimer) {
                clearTimeout(windowScrollTimer);
                windowScrollTimer = null;
            }
        }

        fn(window, "resize", handleWindowResize);

        if (!supportsFixed) {
            fn(window, "scroll", handleWindowScroll);
        }
    }

    // Updates the size of the container when the window size changes.
    function handleWindowResize() {
        if (windowResizeTimer) {
            clearTimeout(windowResizeTimer);
        }

        windowResizeTimer = setTimeout(function () {
            windowResizeTimer = null;
            setContainerSize();
        }, 10);
    }

    // Updates the position of the container when the window scrolls.
    function handleWindowScroll() {
        if (windowScrollTimer) {
            clearTimeout(windowScrollTimer);
        }

        windowScrollTimer = setTimeout(function () {
            windowScrollTimer = null;
            setContainerPosition();
        }, 10);
    }

    // Toggles document mouse move handler on/off.
    function toggleMouseHandlers(on) {
        if (supportsTouch) {
            toggleControls(on);
            return;
        }

        var fn;
        if (on) {
            fn = addEvent;
        } else {
            fn = removeEvent;

            // Clear cached timers.
            if (mouseMoveTimer) {
                clearTimeout(mouseMoveTimer);
                mouseMoveTimer = null;
            }
        }

        fn(document, "mousemove", handleMouseMove);
    }

    var lastX, lastY;

    // Shows clickable controls when the mouse moves.
    function handleMouseMove(e) {
        // Ignore consecutive mousemove events from the same location.
        if (lastX === e.clientX && lastY === e.clientY) {
            return;
        }

        lastX = e.clientX;
        lastY = e.clientY;

        if (mouseMoveTimer) {
            clearTimeout(mouseMoveTimer);
        } else {
            toggleControls(1);
        }

        mouseMoveTimer = setTimeout(function () {
            mouseMoveTimer = null;
            toggleControls(0);
        }, 1500);
    }

    function toggleKeyHandlers(on) {
        (on ? addEvent : removeEvent)(document, "keydown", handleKey);
    }

    function handleKey(e) {
        if (!options.enableKeys) {
            return;
        }

        // Don't handle events with modifier keys.
        if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey) {
            return;
        }

        var handler;
        switch (e.keyCode) {
        case 81: // q
        case 88: // x
        case 27: // esc
            handler = close;
            break;
        case 37: // left
            handler = previous;
            break;
        case 39: // right
            handler = next;
            break;
        case 32: // space
            if (player && typeof player.togglePlay == "function") {
                player.togglePlay();
            }
            break;
        }

        if (handler) {
            e.preventDefault();
            handler();
        }
    }

    function handleClick(e) {
        var target = e.target;

        if (target.nodeType !== 1) {
            return;
        }

        var matcher = /^(?:shadow|light)box(?:\[(\w+)\])?$/i,
            links = [],
            index = 0,
            match;

        // Find an ancestor node with rel="shadowbox" attribute.
        while (target) {
            match = (target.rel || "").match(matcher);

            if (match) {
                // Look for other anchor elements in the document that also have
                // rel="shadowbox" attribute with the same gallery.
                if (match[1]) {
                    var galleryMatcher = new RegExp("^(shadow|light)box\\[" + match[1] + "\\]$", "i");

                    each(document.getElementsByTagName("a"), function (i, link) {
                        if (link.rel && galleryMatcher.test(link.rel)) {
                            if (link == target) {
                                index = links.length;
                            }
                            links.push(link);
                        }
                    });
                } else {
                    links.push(target);
                }

                break;
            }

            target = target.parentNode;
        }

        // Good for debugging.
        e.preventDefault();

        if (links.length > 0 && open(links, {startIndex: index})) {
            // Prevent the browser from following the link.
            e.preventDefault();
        }
    }

    addEvent(document, "click", handleClick);


    //// PLAYERS ////


    /**
     * The iframe player is the default Shadowbox player. It is used for plain
     * web pages or when no other player is suitable for a piece of content.
     */
    function Frame(obj, id) {
        this.url = obj.url;
        this.width = obj.width ? parseInt(obj.width, 10) : root.clientWidth;
        this.height = obj.height ? parseInt(obj.height, 10) : root.clientHeight;
        this.id = id;

        // Preload the iframe so it's ready when needed.
        this.ready = false;
        this._preload();
    }

    apply(Frame.prototype, {

        _preload: function () {
            var iframe = dom("iframe");

            iframe.id = this.id;
            iframe.name = this.id;
            iframe.width = "0px";
            iframe.height = "0px";
            iframe.frameBorder = "0";
            iframe.marginWidth = "0";
            iframe.marginHeight = "0";
            iframe.scrolling = "auto";
            iframe.allowTransparency = "true";
            iframe.src = this.url;

            var self = this;

            if (iframe.attachEvent) {
                iframe.attachEvent("onload", function () {
                    self.ready = true;
                });
            } else {
                iframe.onload = function () {
                    self.ready = true;
                };
            }

            // Starts the actual loading of the iframe.
            document.body.appendChild(iframe);

            this._el = iframe;
        },

        /**
         * Returns true if this player is supported on this browser.
         */
        isSupported: function () {
            return true;
        },

        /**
         * Inserts this object as the only child of the given DOM element.
         * Returns the newly created element, false if none was created.
         */
        insert: function (element) {
            empty(element);

            this._el.style.visibility = "hidden";
            this._el.width = "100%";
            this._el.height = "100%";
            element.appendChild(this._el);
            this._el.style.visibility = "";

            return this._el;
        },

        /**
         * Removes this object from the DOM.
         */
        remove: function () {
            if (this._el) {
                remove(this._el);
                this._el = null;

                // Needed for Firefox, IE <= 8 throws error.
                try {
                    delete window.frames[this.id];
                } catch (err) {}
            }
        }

    });

    /**
     * The photo player is used for displaying images.
     */
    function Photo(obj, id) {
        this.url = obj.url;
        this.width = parseInt(obj.width, 10);
        this.height = parseInt(obj.height, 10);
        this.id = id;

        // Preload the image so it's ready when needed.
        this.ready = false;
        this._preload();
    }

    apply(Photo.prototype, {

        fadeCover: true,

        _preload: function () {
            var self = this,
                pre = new Image;

            pre.onload = function () {
                // Width and height default to image dimensions.
                self.width = self.width || pre.width;
                self.height = self.height || pre.height;

                // Ready to go.
                self.ready = true;

                // Clean up to prevent memory leak in IE.
                pre.onload = pre = null;
            }

            pre.src = this.url;
        },

        /**
         * Returns true if this player is supported on this browser.
         */
        isSupported: function () {
            return true;
        },

        /**
         * Inserts this object as the only child of the given DOM element.
         * Returns the newly created element, false if none was created.
         */
        insert: function (element) {
            element.innerHTML = '<img id="' + this.id + '" width="100%" ' +
                'height="100%" src="' + this.url + '">';

            this._el = element.firstChild;

            return this._el;
        },

        /**
         * Removes this object from the DOM.
         */
        remove: function () {
            if (this._el) {
                remove(this._el);
                this._el = null;
            }
        }

    });

    register(Photo, ["gif", "jpg", "jpeg", "png", "bmp"]);


    //// JAVASCRIPT UTILITIES ////


    var round = Math.round;
    var toString = Object.prototype.toString;

    Array.isArray = Array.isArray || function (obj) {
        return toString.call(obj) === "[object Array]";
    };

    function isFunction(obj) {
        return typeof obj == "function";
    }

    function noop() {}

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
        var len = arguments.length,
            ext;

        for (var i = 1; i < len; ++i) {
            ext = arguments[i];
            for (var prop in ext) {
                obj[prop] = ext[prop];
            }
        }

        return obj;
    }

    /**
     * Gets the current time in milliseconds.
     */
    function now() {
        return (new Date).getTime();
    }

    /**
     * Parse and return an object from the given `json` string.
     */
    function parseJson(json) {
        if (JSON && JSON.parse) {
            return JSON.parse(json);
        }

        // Poor man's JSON.parse.
        return eval("(" + json + ")");
    }

    /**
     * Animates from one numeric value to another over the given duration,
     * calling the given callback for each frame with the eased value. Return
     * false from the callback at any time to cancel the animation.
     */
    function animate(from, to, duration, callback) {
        var delta = to - from;

        if (delta === 0 || duration === 0 || !options.animate) {
            callback(to);
            return; // Don't animate!
        }

        // Convert duration to milliseconds.
        duration = (duration || 0.35) * 1000;

        var ease = options.ease,
            begin = now(),
            end = begin + duration,
            time;

        var timer = setInterval(function() {
            time = now();
            if (time >= end) {
                clearInterval(timer);
                timer = null;
                callback(to);
            } else if (callback(from + ease((time - begin) / duration) * delta) === false) {
                clearInterval(timer);
                timer = null;
            }
        }, 10); // 10 ms interval is minimum on WebKit.
    }


    //// DOM UTILITIES ////


    /**
     * Multipurpose utility function for creating DOM elements, assigning
     * attributes, and appending child nodes.
     */
    function dom(element, attrs, children) {
        if (typeof element == "string") {
            element = document.createElement(element);
        }

        if (Array.isArray(attrs)) {
            children = attrs;
            attrs = null;
        } else if (attrs && attrs.nodeType) {
            children = [attrs];
            attrs = null;
        }

        if (attrs) {
            for (var attr in attrs) {
                // element.setAttribute(attr, attrs[attr]);
                element[attr] = attrs[attr];
            }
        }

        if (Array.isArray(children)) {
            for (var i = 0, len = children.length; i < len; ++i) {
                element.appendChild(children[i]);
            }
        }

        return element;
    }

    /**
     * Removes the given element from the DOM.
     */
    function remove(element) {
        return element.parentNode.removeChild(element);
    }

    /**
     * Removes all child nodes from the given element.
     */
    function empty(element) {
        var child = element.firstChild;
        while (child) {
            remove(child);
            child = element.firstChild;
        }
    }

    /**
     * Wraps an event handler to cancel the default behavior and prevent
     * event bubbling when called.
     */
    function cancel(callback) {
        return function (e) {
            e.preventDefault();
            callback(e);
            return false;
        }
    }

    /**
     * Animates the style of an element from its current value to another over
     * the given duration. Calls the given callback when complete.
     */
    function animateStyle(element, style, to, duration, callback) {
        callback = callback || noop;
        var from = parseFloat(getStyle(element, style)) || 0;

        var setter;
        if (style === "opacity") {
            setter = function (value) {
                setStyle(element, style, value);
                if (value === to) {
                    callback();
                }
            }
        } else {
            // Assume pixel values for all styles besides opacity.
            setter = function (value) {
                setStyle(element, style, round(value) + "px");
                if (value === to) {
                    callback();
                }
            }
        }

        animate(from, to, duration, setter);
    }

    var opacityRe = /opacity=([^)]*)/i,
        getComputedStyle = document.defaultView && document.defaultView.getComputedStyle;

    /**
     * Gets the current value of the given style on the given element. The style
     * name should be camel-cased.
     *
     * Note: This function is not safe for retrieving float or non-pixel values
     * in Internet Explorer.
     */
    function getStyle(element, style) {
        var value = "";

        if (!supportsOpacity && style == "opacity" && element.currentStyle) {
            if (opacityRe.test(element.currentStyle.filter || "")) {
                value = (parseFloat(RegExp.$1) / 100) + "";
            }

            return value == "" ? "1" : value;
        }

        if (getComputedStyle) {
            var computedStyle = getComputedStyle(element, null);

            if (computedStyle) {
                value = computedStyle[style];
            }

            if (style == "opacity" && value == "") {
                value = "1";
            }
        } else {
            value = element.currentStyle[style];
        }

        return value;
    }

    /**
     * Sets the style on the given element to the given value. The style name
     * should be camel-cased.
     *
     * Note: This function is not safe for setting float values.
     */
    function setStyle(element, style, value) {
        var s = element.style;

        if (style == "opacity") {
            if (value == 1) {
                value = "";
            } else {
                value = (value < 0.00001 ? 0 : value);
            }

            if (!supportsOpacity) {
                s.zoom = 1; // Trigger hasLayout.

                if (value == 1) {
                    if (typeof s.filter == "string" && (/alpha/i).test(s.filter)) {
                        s.filter = s.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
                    }
                } else {
                    s.filter = (s.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
                        " alpha(opacity=" + (value * 100) + ")";
                }

                return;
            }
        }

        s[style] = value;
    }

    // Event handling functions modified from originals by Dean Edwards.
    // http://dean.edwards.name/my/events.js

    /**
     * Adds an event handler to the given element. The handler will be called
     * in the context of the element with the event object as its only argument.
     */
    function addEvent(element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else {
            if (element.nodeType === 3 || element.nodeType === 8) {
                return;
            }

            if (element.setInterval && (element !== window && !element.frameElement)) {
                element = window;
            }

            if (!handler.__guid) {
                handler.__guid = guid++;
            }

            if (!element.events) {
                element.events = {};
            }

            var handlers = element.events[type];
            if (!handlers) {
                handlers = element.events[type] = {};
                if (element["on" + type]) {
                    handlers[0] = element["on" + type];
                }
            }

            handlers[handler.__guid] = handler;

            element["on" + type] = handleEvent;
        }
    }

    function handleEvent(e) {
        e = e || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);

        var handlers = this.events[e.type],
            result = true;

        for (var id in handlers) {
            if (handlers[id].call(this, e) === false) {
                result = false;
            }
        }

        return result;
    }

    function preventDefault() {
        this.returnValue = false;
    }

    function stopPropagation() {
        this.cancelBubble = true;
    }

    function fixEvent(e) {
        e.preventDefault = preventDefault;
        e.stopPropagation = stopPropagation;
        e.target = e.srcElement;
        e.keyCode = e.which;
        return e;
    }

    /**
     * Removes an event handler from the given element.
     */
    function removeEvent(element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else {
            if (element.events && element.events[type] && handler.__guid) {
                delete element.events[type][handler.__guid];
            }
        }
    }

    // Expose.
    apply(shadowbox, {
        register: register,
        show: show,
        close: close,
        getPlayer: getPlayer,
        next: next,
        previous: previous,
        isOpen: isOpen,
        makePlayer: makePlayer,
        Frame: Frame,
        Photo: Photo,
        utils: {
            supportsOpacity: supportsOpacity,
            supportsFixed: supportsFixed,
            supportsTouch: supportsTouch,
            each: each,
            apply: apply,
            now: now,
            animate: animate,
            dom: dom,
            remove: remove,
            empty: empty,
            cancel: cancel,
            animateStyle: animateStyle,
            getStyle: getStyle,
            setStyle: setStyle,
            addEvent: addEvent,
            removeEvent: removeEvent
        }
    });

    window.shadowbox = shadowbox;

})(this);
