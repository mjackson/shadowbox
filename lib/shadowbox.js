/**
 * The Shadowbox class.
 *
 * This file is part of Shadowbox.
 *
 * Shadowbox is an online media viewer application that supports all of the
 * web's most popular media publishing formats. Shadowbox is written entirely
 * in JavaScript and CSS and is highly customizable. Using Shadowbox, website
 * authors can showcase a wide assortment of media in all major browsers without
 * navigating users away from the linking page.
 *
 * You should have received a license with this distribution explaining the terms
 * under which Shadowbox may be used. If you did not, you may obtain a copy of the
 * license at http://shadowbox-js.com/LICENSE
 *
 * @author      Michael J. I. Jackson <michael@mjijackson.com>
 * @copyright   2007-2009 Michael J. I. Jackson
 */

/**
 * The Shadowbox class. Used to display different media on a web page using a
 * Lightbox-like effect.
 *
 * Known issues:
 *
 * - Location.toString exception in FF3 when loading Flash content into an
 *   iframe (such as a YouTube video). Known Flash bug, will not be fixed.
 *   http://bugs.adobe.com/jira/browse/FP-561
 * - In some situations audio keeps on playing after Shadowbox is closed
 *   when using Windows Media Player or QuickTime. For this reason, it is
 *   recommended to convert to Flash video instead.
 *
 * Useful resources:
 *
 * - http://www.alistapart.com/articles/byebyeembed
 * - http://www.w3.org/TR/html401/struct/objects.html
 * - http://www.dyn-web.com/dhtml/iframes/
 * - http://www.apple.com/quicktime/player/specs.html
 * - http://www.apple.com/quicktime/tutorials/embed2.html
 * - http://www.howtocreate.co.uk/wrongWithIE/?chapter=navigator.plugins
 * - http://msdn.microsoft.com/en-us/library/ms532969.aspx
 * - http://support.microsoft.com/kb/316992
 * - http://www.alistapart.com/articles/flashembedcagematch
 *
 * Todo:
 *
 * - Remove user-agent sniffing (and consequently Shadowbox.client) in
 *   favor of feature support model of client detection
 */
(function(){

    var ua = navigator.userAgent.toLowerCase(),

    // the Shadowbox object
    S = {

        /**
         * The current version of Shadowbox.
         *
         * @var     String
         * @public
         */
        version: "3.0rc1",

        /**
         * The name of the adapter currently being used.
         *
         * @var     String
         * @public
         */
        adapter: null,

        /**
         * A cache of options for links that have been set up for use with
         * Shadowbox.
         *
         * @var     Array
         * @public
         */
        cache: [],

        /**
         * Some simple browser detection variables.
         *
         * @var     Object
         * @public
         */
        client: {
            isIE:       ua.indexOf('msie') > -1,
            isIE6:      ua.indexOf('msie 6') > -1,
            isIE7:      ua.indexOf('msie 7') > -1,
            isGecko:    ua.indexOf('gecko') > -1 && ua.indexOf('safari') == -1,
            isWebkit:   ua.indexOf('applewebkit/') > -1,
            isWindows:  ua.indexOf('windows') > -1 || ua.indexOf('win32') > -1,
            isMac:      ua.indexOf('macintosh') > -1 || ua.indexOf('mac os x') > -1,
            isLinux:    ua.indexOf('linux') > -1
        },

        /**
         * The current content object.
         *
         * @var     Object
         * @public
         */
        content: null,

        /**
         * The array index of the current gallery that is currently being viewed.
         *
         * @var     Number
         * @public
         */
        current: -1,

        /**
         * Holds the current dimensions of Shadowbox as calculated by its skin.
         * Contains the following properties:
         *
         * - height: The total height of #sb-wrapper (including title & info bars)
         * - width: The total width of #sb-wrapper
         * - inner_h: The height of #sb-body
         * - inner_w: The width of #sb-body
         * - top: The top to use for #sb-wrapper
         * - left: The left to use for #sb-wrapper
         * - oversized: True if the content is oversized (too large for the viewport)
         * - resize_h: The height to use for resizable content
         * - resize_w: The width to use for resizable content
         *
         * @var     Object
         * @public
         */
        dimensions: null,

        /**
         * An array containing the gallery objects currently being viewed. In the
         * case of non-gallery items, this will only hold one object.
         *
         * @var     Array
         * @public
         */
        gallery: [],

        /**
         * The name of the expando property that will be added to HTML elements
         * when they're added to the cache.
         *
         * @var     String
         * @public
         */
        expando: 'shadowboxCacheKey',

        /**
         * A map of library object names to their corresponding Shadowbox adapter
         * names.
         *
         * @var     Object
         * @public
         */
        libraries: {
            Prototype:  'prototype',
            jQuery:     'jquery',
            MooTools:   'mootools',
            YAHOO:      'yui',
            dojo:       'dojo',
            Ext:        'ext'
        },

        /**
         * Contains the default options for Shadowbox.
         *
         * @var     Object
         * @public
         */
        options: {
            adapter: null,              // the library adapter to use
            animate: true,              // enable all animations, except for fades
            animateFade: true,          // enable fade animations
            autoplayMovies: true,       // automatically play movies
            continuous: false,          // enables continuous galleries. When enabled,
                                        // user will be able to skip to the first
                                        // gallery item from the last using next and
                                        // vice versa

            /**
             * Easing function used for animations. Based on a cubic polynomial.
             *
             * @param   Number      x       The state of the animation (% complete)
             * @return  Number              The adjusted easing value
             */
            ease: function(x){
                return 1 + Math.pow(x - 1, 3);
            },

            enableKeys: true,           // enable keyboard navigation

            /**
             * An object containing names of plugins and links to their respective
             * download pages.
             */
            errors: {
                fla: {
                    name:   'Flash',
                    url:    'http://www.adobe.com/products/flashplayer/'
                },
                qt: {
                    name:   'QuickTime',
                    url:    'http://www.apple.com/quicktime/download/'
                },
                wmp: {
                    name:   'Windows Media Player',
                    url:    'http://www.microsoft.com/windows/windowsmedia/'
                },
                f4m: {
                    name:   'Flip4Mac',
                    url:    'http://www.flip4mac.com/wmv_download.htm'
                }
            },

            /**
             * A map of players to the file extensions they support. Each member of
             * this object is the name of a player (with one exception), whose value
             * is an array of file extensions that player will "play". The one
             * exception to this rule is the "qtwmp" member, which contains extensions
             * that may be played using either QuickTime or Windows Media Player.
             *
             * - img: Image file extensions
             * - swf: Flash SWF file extensions
             * - flv: Flash video file extensions (will be played by JW FLV player)
             * - qt: Movie file extensions supported by QuickTime
             * - wmp: Movie file extensions supported by Windows Media Player
             * - qtwmp: Movie file extensions supported by both QuickTime and Windows Media Player
             *
             * IMPORTANT: If this object is to be modified, it must be copied in its
             * entirety and tweaked because it is not merged recursively with the
             * default. Also, any modifications must be passed into Shadowbox.init
             * for speed reasons.
             */
            ext: {
                img:        ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
                swf:        ['swf'],
                flv:        ['flv', 'm4v'],
                qt:         ['dv', 'mov', 'moov', 'movie', 'mp4'],
                wmp:        ['asf', 'wm', 'wmv'],
                qtwmp:      ['avi', 'mpg', 'mpeg']
            },

            /**
             * Parameters to pass to flash <object>'s.
             */
            flashParams: {
                bgcolor:            '#000000',
                allowfullscreen:    true
            },

            flashVars: {},              // flash vars
            flashVersion: '9.0.115',    // minimum required flash version suggested
                                        // by JW FLV player

            /**
             * How to handle content that is too large to display in its entirety
             * (and is resizable). A value of 'resize' will resize the content while
             * preserving aspect ratio and display it at the smaller resolution. If
             * the content is an image, a value of 'drag' will display the image at
             * its original resolution but it will be draggable within Shadowbox. A
             * value of 'none' will display the content at its original resolution
             * but it may be cropped.
             */
            handleOversize: 'resize',

            /**
             * The mode to use when handling unsupported media. May be either
             * 'remove' or 'link'. If it is 'remove', the unsupported gallery item
             * will merely be removed from the gallery. If it is the only item in
             * the gallery, the link will simply be followed. If it is 'link', a
             * link will be provided to the appropriate plugin page in place of the
             * gallery element.
             */
            handleUnsupported: 'link',

            language: 'en',             // the language to use
            onChange: null,             // hook function to be fired when changing
                                        // from one item to the next. Is passed the
                                        // item that is about to be displayed
            onClose: null,              // hook function to be fired when closing.
                                        // is passed the most recent item
            onFinish: null,             // hook function to be fired when finished
                                        // loading content. Is passed current
                                        // gallery item
            onOpen: null,               // hook function to be fired when opening.
                                        // is passed the current gallery item
            players: ['img'],           // the players to load
            showMovieControls: true,    // enable movie controls on movie players
            skipSetup: false,           // skip calling Shadowbox.setup() during
                                        // shadowbox.init()
            slideshowDelay: 0,          // delay to use for slideshows (seconds). If
                                        // set to any duration other than 0, is interval
                                        // at which slideshow will advance
            useSizzle: true,            // use sizzle.js to support css selectors
            viewportPadding: 20         // amount of padding to maintain around the
                                        // edge of the viewport at all times (pixels)
        },

        /**
         * Contains the base path of the Shadowbox script.
         *
         * Note: This property will automatically be populated in Shadowbox.load.
         *
         * @var     String
         * @public
         */
        path: '',

        /**
         * Contains plugin support information. Each property of this object is a
         * boolean indicating whether that plugin is supported.
         *
         * - fla: Flash player
         * - qt: QuickTime player
         * - wmp: Windows Media player
         * - f4m: Flip4Mac plugin
         *
         * @var     Object
         * @public
         */
        plugins: null,

        /**
         * Tells whether or not the DOM is ready to be manipulated.
         *
         * @var     Boolean
         * @public
         */
        ready: false,

        /**
         * An object containing some regular expressions we'll need later. Compiled
         * up front for speed.
         *
         * @var     Object
         * @public
         */
        regex: {
            domain:         /:\/\/(.*?)[:\/]/,              // domain prefix
            inline:         /#(.+)$/,                       // inline element id
            rel:            /^(light|shadow)box/i,          // rel attribute format
            gallery:        /^(light|shadow)box\[(.*?)\]/i, // rel attribute format for gallery link
            unsupported:    /^unsupported-(\w+)/,           // unsupported media type
            param:          /\s*([a-z_]*?)\s*=\s*(.+)\s*/   // rel string parameter
        },

        /**
         * Applies the given set of options to those currently in use.
         *
         * Note: Options will be reset on Shadowbox.open() so this function is
         * only useful after it has already been called (while Shadowbox is
         * open).
         *
         * @param   Object      opts        The options to apply
         * @return  void
         * @public
         */
        applyOptions: function(opts){
            if(opts){
                // store defaults, use apply to break reference
                default_options = apply({}, S.options);
                apply(S.options, opts);
            }
        },

        /**
         * Reverts Shadowbox' options to the last default set in use before
         * Shadowbox.applyOptions() was called.
         *
         * @return  void
         * @public
         */
        revertOptions: function(){
            apply(S.options, default_options);
        },

        /**
         * Jumps to the piece in the current gallery with the given index.
         *
         * @param   Number      index   The gallery index to view
         * @return  void
         * @public
         */
        change: function(index){
            if(!S.gallery) return; // no current gallery
            if(!S.gallery[index]){ // index does not exist
                if(!S.options.continuous)
                    return;
                else
                    index = index < 0 ? S.gallery.length - 1 : 0; // loop
            }

            // update current
            S.current = index;

            if(typeof slide_timer == 'number'){
                clearTimeout(slide_timer);
                slide_timer = null;
                slide_delay = slide_start = 0; // reset slideshow variables
            }

            if(S.options.onChange)
                S.options.onChange();

            loadContent();
        },

        /**
         * Deactivates Shadowbox.
         *
         * @return  void
         * @public
         */
        close: function(){
            if(!active) return; // already closed
            active = false;

            listenKeys(false);

            // remove the content
            if(S.content){
                S.content.remove();
                S.content = null;
            }

            // clear slideshow variables
            if(typeof slide_timer == 'number')
                clearTimeout(slide_timer);
            slide_timer = null;
            slide_delay = 0;

            if(S.options.onClose)
                S.options.onClose();

            S.skin.onClose();

            S.revertOptions();
        },

        /**
         * Gets the id that should be used for content elements.
         *
         * @return  String          The content element id
         * @public
         */
        contentId: function(){
            return content_id;
        },

        /**
         * Reports an error. Mainly needed because there are quite a few web developers out
         * there who think that all exceptions are errors in the code instead of helpful
         * messages.
         *
         * @param   String  msg     The error message
         * @return  void
         * @public
         */
        error: function(msg){
            if(!S.debug) return;

            if(typeof window['console'] != 'undefined' && typeof console.log == 'function')
                console.log(msg);
            else
                alert(msg);
        },

        /**
         * Gets the current gallery object.
         *
         * @return  Object          The current gallery item
         * @public
         */
        getCurrent: function(){
            return S.current > -1 ? S.gallery[S.current] : null;
        },

        /**
         * Determines if there is a next piece to display in the current
         * gallery.
         *
         * @return  Boolean         True if there is another piece
         * @public
         */
        hasNext: function(){
            return S.gallery.length > 1 &&
                (S.current != S.gallery.length - 1 || S.options.continuous);
        },

        /**
         * Initializes the Shadowbox environment. Should be called by the user in
         * the <head> of the HTML document.
         *
         * Note: This function attempts to load all Shadowbox dependencies
         * dynamically. However, if these dependencies are already included on the
         * page they won't be loaded again.
         *
         * @param   Object      opts    (optional) The default options to use
         * @return  void
         * @public
         */
        init: function(opts){
            if(initialized) return; // don't initialize twice
            initialized = true;

            opts = opts || {};
            init_options = opts;

            // apply options
            if(opts)
                apply(S.options, opts);

            // compile regular expressions here for speed
            for(var e in S.options.ext)
                S.regex[e] = new RegExp('\.(' + S.options.ext[e].join('|') + ')\s*$', 'i');

            if(!S.path){
                // determine script path automatically
                var pathre = /(.+\/)shadowbox\.js/i, path;
                each(document.getElementsByTagName('script'), function(s){
                    path = pathre.exec(s.src);
                    if(path){
                        S.path = path[1];
                        return false;
                    }
                });
            }

            // determine adapter
            if(S.options.adapter)
                S.adapter = S.options.adapter.toLowerCase();
            else{
                // automatically detect adapter based on loaded libraries
                for(var lib in S.libraries){
                    if(typeof window[lib] != 'undefined'){
                        S.adapter = S.libraries[lib];
                        break;
                    }
                }
                if(!S.adapter)
                    S.adapter = 'base';
            }

            // load dependencies
            if(S.options.useSizzle && !window['Sizzle'])
                // jQuery 1.3.2 doesn't expose Sizzle to the global namespace... why?
                if(window['jQuery'])
                    window['Sizzle'] = jQuery.find;
                else
                    U.include(S.path + 'libraries/sizzle/sizzle.js');
            if(!S.lang)
                U.include(S.path + 'languages/shadowbox-' + S.options.language + '.js');
            each(S.options.players, function(p){
                if((p == 'swf' || p == 'flv') && !window['swfobject'])
                    U.include(S.path + 'libraries/swfobject/swfobject.js');
                if(!S[p])
                    U.include(S.path + 'players/shadowbox-' + p + '.js');
            });
            if(!S.lib)
                U.include(S.path + 'adapters/shadowbox-' + S.adapter + '.js');

            waitDom(waitLibs);
        },

        /**
         * Tells whether or not Shadowbox is currently activated.
         *
         * @return  Boolean         True if activated, false otherwise
         * @public
         */
        isActive: function(){
            return active;
        },

        /**
         * Tells whether or not Shadowbox is currently in the middle of a
         * slideshow in a paused state.
         *
         * @return  Boolean         True if paused, false otherwise
         * @public
         */
        isPaused: function(){
            return slide_timer == 'paused';
        },

        /**
         * Loads Shadowbox into the DOM. Is called automatically by each adapter
         * as soon as the DOM is ready.
         *
         * @return  void
         * @public
         */
        load: function(){
            if(S.ready) return;
            S.ready = true;

            // apply skin options, re-apply user init options in case they overwrite
            if(S.skin.options){
                apply(S.options, S.skin.options);
                apply(S.options, init_options);
            }

            S.skin.init();

            if(!S.options.skipSetup)
                S.setup();
        },

        /**
         * Jumps to the next piece in the gallery.
         *
         * @return  void
         * @public
         */
        next: function(){
            S.change(S.current + 1);
        },

        /**
         * Opens the given object in Shadowbox. This object may be either an
         * anchor/area element, or an object similar to the one created by
         * Shadowbox.buildCacheObj().
         *
         * @param   mixed       obj         The object or link element that defines
         *                                  what to display
         * @return  void
         * @public
         */
        open: function(obj){
            if(U.isLink(obj)){
                if(S.inCache(obj))
                    obj = S.cache[obj[S.expando]];
                else
                    obj = S.buildCacheObj(obj); // non-cached link, build an object on the fly
            }

            // set up the gallery
            if(obj.constructor == Array){
                S.gallery = obj;
                S.current = 0;
            }else{
                if(!obj.gallery){
                    // single item, no gallery
                    S.gallery = [obj];
                    S.current = 0;
                }else{
                    // gallery item, build gallery from cached gallery elements
                    S.current = null;
                    S.gallery = [];
                    each(S.cache, function(c){
                        if(c.gallery && c.gallery == obj.gallery){
                            if(S.current == null && c.content == obj.content && c.title == obj.title)
                                S.current = S.gallery.length;
                            S.gallery.push(c);
                        }
                    });

                    // if not found in cache, prepend to front of gallery
                    if(S.current == null){
                        S.gallery.unshift(obj);
                        S.current = 0;
                    }
                }
            }

            obj = S.getCurrent();
            if(obj.options){
                S.revertOptions();
                S.applyOptions(obj.options);
            }

            // filter gallery for unsupported elements
            var item, remove, m, format, replace, oe = S.options.errors, msg, el;
            for(var i = 0; i < S.gallery.length; ++i){
                // use apply to break the reference to the original object here
                // because we'll be modifying the properties of the gallery objects
                // directly and we don't want to taint them in case they are used
                // again in a future call
                item = S.gallery[i] = apply({}, S.gallery[i]);

                remove = false; // remove the element?

                if(m = S.regex.unsupported.exec(item.player)){
                    // handle unsupported elements
                    if(S.options.handleUnsupported == 'link'){
                        item.player = 'html';
                        // generate a link to the appropriate plugin download page(s)
                        switch(m[1]){
                            case 'qtwmp':
                                format = 'either';
                                replace = [oe.qt.url, oe.qt.name, oe.wmp.url, oe.wmp.name];
                            break;
                            case 'qtf4m':
                                format = 'shared';
                                replace = [oe.qt.url, oe.qt.name, oe.f4m.url, oe.f4m.name];
                            break;
                            default:
                                format = 'single';
                                if(m[1] == 'swf' || m[1] == 'flv') m[1] = 'fla';
                                replace = [oe[m[1]].url, oe[m[1]].name];
                        }
                        msg = S.lang.errors[format].replace(/\{(\d+)\}/g, function(m, n){
                            return replace[n];
                        });
                        item.content = '<div class="sb-message">' + msg + '</div>';
                    }else
                        remove = true;
                }else if(item.player == 'inline'){
                    // inline element, retrieve innerHTML
                    m = S.regex.inline.exec(item.content);
                    if(m){
                        var el = U.get(m[1]);
                        if(el)
                            item.content = el.innerHTML;
                        else
                            S.error('Cannot find element with id ' + m[1]);
                    }else
                        S.error('Cannot find element id for inline content');
                }else if(item.player == 'swf' || item.player == 'flv'){
                    var version = (item.options && item.options.flashVersion) || S.options.flashVersion;
                    if(!swfobject.hasFlashPlayerVersion(version)){
                        // express install will be triggered because the client
                        // does not have the minimum required version of flash
                        // installed, set height and width to those of express
                        // install swf
                        item.width = 310;
                        // minimum height is 127, but +20 pixels on top and bottom
                        // looks better
                        item.height = 177;
                    }
                }
                if(remove){
                    S.gallery.splice(i, 1); // remove from gallery
                    if(i < S.current)
                        --S.current; // maintain integrity of S.current
                    else if(i == S.current)
                        S.current = i > 0 ? i - 1 : i; // look for supported neighbor
                    --i; // decrement index for next loop
                }
            }

            // anything left to display?
            if(S.gallery.length){
                if(!active){
                    if(typeof S.options.onOpen == 'function' && S.options.onOpen(obj) === false)
                        return;

                    S.skin.onOpen(obj, loadContent);
                }else
                    loadContent();

                active = true;
            }
        },

        /**
         * Pauses the current slideshow.
         *
         * @return  void
         * @public
         */
        pause: function(){
            if(typeof slide_timer != 'number') return;

            var time = new Date().getTime();
            slide_delay = Math.max(0, slide_delay - (time - slide_start));

            // if there's any time left on current slide, pause the timer
            if(slide_delay){
                clearTimeout(slide_timer);
                slide_timer = 'paused';

                if(S.skin.onPause)
                    S.skin.onPause();
            }
        },

        /**
         * Sets the timer for the next image in the slideshow to be displayed.
         *
         * @return  void
         * @public
         */
        play: function(){
            if(!S.hasNext()) return;
            if(!slide_delay) slide_delay = S.options.slideshowDelay * 1000;
            if(slide_delay){
                slide_start = new Date().getTime();
                slide_timer = setTimeout(function(){
                    slide_delay = slide_start = 0; // reset slideshow
                    S.next();
                }, slide_delay);

                if(S.skin.onPlay)
                    S.skin.onPlay();
            }
        },

        /**
         * Jumps to the previous piece in the gallery.
         *
         * @return  void
         * @public
         */
        previous: function(){
            S.change(S.current - 1);
        },

        /**
         * Calculates the dimensions for Shadowbox according to the given
         * parameters. Will determine if content is oversized (too large for the
         * viewport) and will automatically constrain resizable content
         * according to user preference.
         *
         * @param   Number      height      The content height
         * @param   Number      width       The content width
         * @param   Number      max_h       The maximum height available (should
         *                                  be the height of the viewport)
         * @param   Number      max_w       The maximum width available (should
         *                                  be the width of the viewport)
         * @param   Number      tb          The extra top/bottom pixels that are
         *                                  required for borders/toolbars
         * @param   Number      lr          The extra left/right pixels that are
         *                                  required for borders/toolbars
         * @param   Boolean     resizable   True if the content is able to be
         *                                  resized. Defaults to false
         * @return  void
         * @public
         */
        setDimensions: function(height, width, max_h, max_w, tb, lr, resizable){
            var h = height = parseInt(height),
                w = width = parseInt(width),
                pad = parseInt(S.options.viewportPadding) || 0;

            // calculate the max height/width
            var extra_h = 2 * pad + tb;
            if(h + extra_h >= max_h) h = max_h - extra_h;
            var extra_w = 2 * pad + lr;
            if(w + extra_w >= max_w) w = max_w - extra_w;

            // handle oversized content
            var resize_h = height,
                resize_w = width,
                change_h = (height - h) / height,
                change_w = (width - w) / width,
                oversized = (change_h > 0 || change_w > 0);
            if(resizable && oversized && S.options.handleOversize == 'resize'){
                // adjust resized height/width, preserve original aspect ratio
                if(change_h > change_w)
                    w = Math.round((width / height) * h);
                else if(change_w > change_h)
                    h = Math.round((height / width) * w);
                resize_w = w;
                resize_h = h;
            }

            // update Shadowbox.dimensions
            S.dimensions = {
                height:     h + tb,
                width:      w + lr,
                inner_h:    h,
                inner_w:    w,
                top:        (max_h - (h + extra_h)) / 2 + pad,
                left:       (max_w - (w + extra_w)) / 2 + pad,
                oversized:  oversized,
                resize_h:   resize_h,
                resize_w:   resize_w
            };
        },

        /**
         * Sets up listeners on the given links that will trigger Shadowbox. If no
         * links are given, this method will set up every anchor element on the page
         * with rel="shadowbox". It is important to note that any options given here
         * are applied to all link elements. Multiple calls to this method may be
         * needed if different options are desired.
         *
         * Note: Because AREA elements do not support the rel attribute, they must
         * be explicitly passed to this method.
         *
         * @param   mixed       links       A link selector (see findLinks)
         * @param   Object      opts        Some options to use for the given links
         * @return  void
         * @public
         */
        setup: function(links, opts){
            each(S.findLinks(links), function(link){
                S.addCache(link, opts);
            });
        },

        /**
         * Remove the given link elements from the cache, remove event listeners
         * and expandos as well.
         *
         * @param   mixed       links       A link selector (see findLinks)
         * @return  void
         * @public
         */
        teardown: function(links){
            each(S.findLinks(links), S.removeCache);
        },

        /**
         * Resolves a link selector. The selector may be void to select all
         * anchor elements on the page with rel="shadowbox" or, if the Sizzle
         * library is loaded, it may be a single CSS seletor or an array of
         * [selector, context].
         *
         * @param   mixed   links       The links selector (or selector + context)
         * @return  Array               An array of matching link elements
         * @public
         */
        findLinks: function(links){
            if(!links){
                var links = [], rel;
                each(document.getElementsByTagName('a'), function(a){
                    rel = a.getAttribute('rel');
                    if(rel && S.regex.rel.test(rel))
                        links.push(a);
                });
            }else{
                var len = links.length;
                if(len){
                    if(window['Sizzle']){
                        if(typeof links == 'string')
                            links = Sizzle(links); // lone selector
                        else if(len == 2 && links.push && typeof links[0] == 'string' && links[1].nodeType)
                            links = Sizzle(links[0], links[1]); // selector + context
                    }
                }else
                    links = [links]; // single link
            }

            return links;
        },

        /**
         * Tells if the given link element is already in the cache.
         *
         * @param   HTMLElement     link    The link element
         * @return  Boolean                 True if in the cache, false otherwise
         * @public
         */
        inCache: function(link){
            return typeof link[S.expando] == 'number' && S.cache[link[S.expando]];
        },

        /**
         * Adds the given link element to the cache with the given options.
         *
         * @param   HTMLElement     link    The link element
         * @return  void
         * @public
         */
        addCache: function(link, opts){
            if(!S.inCache(link)){
                // assign cache key expando, use integer primitive to avoid
                // memory leak in IE
                link[S.expando] = S.cache.length;
                // add onclick listener
                S.lib.addEvent(link, 'click', handleClick);
            }
            S.cache[link[S.expando]] = S.buildCacheObj(link, opts);
        },

        /**
         * Removes the given link element from the cache.
         *
         * @param   HTMLElement     link    The link element
         * @return  void
         * @public
         */
        removeCache: function(link){
            S.lib.removeEvent(link, 'click', handleClick);
            S.cache[link[S.expando]] = null;
            delete link[S.expando];
        },

        /**
         * Removes all onclick listeners from elements that have been setup with
         * Shadowbox and clears all objects from cache.
         *
         * @return  void
         * @public
         */
        clearCache: function(){
            each(S.cache, function(obj){
                S.removeCache(obj.link);
            });
            S.cache = [];
        },

        /**
         * Builds an object from the original link element data to store in cache.
         * These objects contain (most of) the following keys:
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
         * @param   HTMLElement     link    The link element to process
         * @param   Object          opts    A set of options to use for the object
         * @return  Object                  An object representing the link
         * @public
         */
        buildCacheObj: function(link, opts){
            var obj = {
                link:       link,
                title:      link.getAttribute('title'),
                options:    apply({}, opts || {}),
                content:    link.href // don't use getAttribute here
            };

            // remove link-level options from top-level options
            if(opts) each(['player', 'title', 'height', 'width', 'gallery'], function(option){
                if(typeof obj.options[option] != 'undefined'){
                    obj[option] = obj.options[option];
                    delete obj.options[option];
                }
            });

            if(!obj.player)
                obj.player = S.getPlayer(obj.content);

            // HTML options always trump JavaScript options, so do these last
            var rel = link.getAttribute('rel');
            if(rel){
                // extract gallery name from shadowbox[name] format
                var match = rel.match(S.regex.gallery);
                if(match)
                    obj.gallery = escape(match[2]);

                // other parameters
                each(rel.split(';'), function(parameter){
                    match = parameter.match(S.regex.param);
                    if(match){
                        if(match[1] == 'options')
                            eval('apply(obj.options,' + match[2] + ')');
                        else
                            obj[match[1]] = match[2];
                    }
                });
            }

            return obj;
        },

        /**
         * Attempts to automatically determine the correct player to use based on the
         * given content attribute. If the content type can be detected but is not
         * supported, the return value will be 'unsupported-*' where * will be the
         * player abbreviation (e.g. 'qt' = QuickTime). Defaults to 'iframe' where the
         * content type cannot automatically be determined.
         *
         * @param   String  content     The content attribute of the item
         * @return  String              The name of the player to use
         * @public
         */
        getPlayer: function(content){
            var r = S.regex,
                p = S.plugins,
                m = content.match(r.domain),
                same_domain = m && document.domain == m[1];

            if(content.indexOf('#') > -1 && same_domain) return 'inline';

            // strip query string for player detection purposes
            var q = content.indexOf('?');
            if(q > -1) content = content.substring(0, q);

            if(r.img.test(content)) return 'img';
            if(r.swf.test(content)) return p.fla ? 'swf' : 'unsupported-swf';
            if(r.flv.test(content)) return p.fla ? 'flv' : 'unsupported-flv';
            if(r.qt.test(content)) return p.qt ? 'qt' : 'unsupported-qt';
            if(r.wmp.test(content)){
                if(p.wmp) return 'wmp';
                if(p.f4m) return 'qt';
                if(S.client.isMac) return p.qt ? 'unsupported-f4m' : 'unsupported-qtf4m';
                return 'unsupported-wmp';
            }
            if(r.qtwmp.test(content)){
                if(p.qt) return 'qt';
                if(p.wmp) return 'wmp';
                return S.client.isMac ? 'unsupported-qt' : 'unsupported-qtwmp';
            }

            return 'iframe';
        }

    },

    U = S.util = {

        /**
         * Animates any numeric (not color) style of the given element from its
         * current state to the given value. Defaults to using pixel-based
         * measurements.
         *
         * @param   HTMLElement     el      The element to animate
         * @param   String          p       The property to animate (in camelCase)
         * @param   mixed           to      The value to animate to
         * @param   Number          d       The duration of the animation (in
         *                                  seconds)
         * @param   Function        cb      A callback function to call when the
         *                                  animation completes
         * @return  void
         * @public
         */
        animate: function(el, p, to, d, cb){
            var from = parseFloat(S.lib.getStyle(el, p));
            if(isNaN(from)) from = 0;

            var delta = to - from;
            if(delta == 0){
                if(cb) cb();
                return; // nothing to animate
            }

            var op = p == 'opacity';

            function fn(ease){
                var to = from + ease * delta;
                if(op)
                    U.setOpacity(el, to);
                else
                    el.style[p] = to + 'px'; // default unit is px
            }

            // cancel the animation here if duration is 0 or if set in the options
            if(!d || (!op && !S.options.animate) || (op && !S.options.animateFade)){
                fn(1);
                if(cb) cb();
                return;
            }

            d *= 1000; // convert to milliseconds

            var begin = new Date().getTime(),
            ease = S.options.ease,
            end = begin + d,
            time,
            timer = setInterval(function(){
                time = new Date().getTime();
                if(time >= end){ // end of animation
                    clearInterval(timer);
                    fn(1);
                    if(cb) cb();
                }else
                    fn(ease((time - begin) / d));
            }, 10); // 10 ms interval is minimum on webkit
        },

        /**
         * Applies all properties of e to o.
         *
         * @param   Object      o       The original object
         * @param   Object      e       The extension object
         * @return  Object              The original object with all properties
         *                              of the extension object applied
         * @public
         */
        apply: function(o, e){
            for(var p in e)
                o[p] = e[p];

            return o;
        },

        /**
         * A utility function used by the fade functions to clear the opacity
         * style setting of the given element. Required in some cases for IE.
         *
         * @param   HTMLElement     el      The element
         * @return  void
         * @public
         */
        clearOpacity: function(el){
            var s = el.style;
            if(window.ActiveXObject){
                // be careful not to overwrite other filters!
                if(typeof s.filter == 'string' && (/alpha/i).test(s.filter))
                    s.filter = s.filter.replace(/[\w\.]*alpha\(.*?\);?/i, '');
            }else
                s.opacity = '';
        },

        /**
         * Calls the given function for each element of obj. The obj element must
         * be array-like (meaning it must have a length property and be able to
         * be accessed using the array square bracket syntax). If scope is not
         * explicitly given, the callback will be called with a scope of the
         * current item. Will stop execution if a callback returns false.
         *
         * @param   mixed       obj     An array-like object containing the
         *                              elements
         * @param   Function    fn      The callback function
         * @param   mixed       scope   The scope of the callback
         * @return  void
         * @public
         */
        each: function(obj, fn, scope){
            for(var i = 0, len = obj.length; i < len; ++i)
                if(fn.call(scope || obj[i], obj[i], i, obj) === false) return;
        },

        /**
         * Gets an element by its id.
         *
         * @param   String      id      The element id
         * @return  HTMLElement         A reference to the element with the
         *                              given id
         * @public
         */
        get: function(id){
            return document.getElementById(id);
        },

        /**
         * Dynamically includes a JavaScript file in the current page.
         *
         * @param   String      file    The name of the js file to include
         * @return  void
         * @public
         */
        include: function(){
            var includes = {};
            return function(file){
                if(includes[file]) return; // don't include the same file twice
                includes[file] = true;
                var head = document.getElementsByTagName('head')[0],
                    script = document.createElement('script');
                script.src = file;
                head.appendChild(script);
            }
        }(),

        /**
         * Determines if the given object is an anchor/area element.
         *
         * @param   mixed       obj     The object to check
         * @return  Boolean             True if the object is a link element
         * @public
         */
        isLink: function(obj){
            if(!obj || !obj.tagName) return false;
            var up = obj.tagName.toUpperCase();
            return up == 'A' || up == 'AREA';
        },

        /**
         * Removes all child nodes from the given element.
         *
         * @param   HTMLElement     el      The element
         * @return  void
         * @public
         */
        removeChildren: function(el){
            while(el.firstChild)
                el.removeChild(el.firstChild);
        },

        /**
         * Sets the opacity of the given element to the specified level.
         *
         * @param   HTMLElement     el      The element
         * @param   Number          o       The opacity to use
         * @return  void
         * @public
         */
        setOpacity: function(el, o){
            var s = el.style;
            if(window.ActiveXObject){
                s.zoom = 1; // trigger hasLayout
                s.filter = (s.filter || '').replace(/\s*alpha\([^\)]*\)/gi, '') +
                    (o == 1 ? '' : ' alpha(opacity=' + (o * 100) + ')');
            }else
                s.opacity = o;
        }

    },

    // shorthand
    apply = U.apply,
    each = U.each,

    /**
     * The initial options object that was given by the user.
     *
     * @var     Object
     * @private
     */
    init_options,

    /**
     * Keeps track of whether or not Shadowbox.init has been called.
     *
     * @var     Boolean
     * @private
     */
    initialized = false,

    /**
     * Stores the default set of options in case a custom set of options is used
     * on a link-by-link basis so we can restore them later.
     *
     * @var     Object
     * @private
     */
    default_options = {},

    /**
     * The id to use for content objects.
     *
     * @var     String
     * @private
     */
    content_id = 'sb-content',

    /**
     * Keeps track of whether or not Shadowbox is activated.
     *
     * @var     Boolean
     * @private
     */
    active = false,

    /**
     * The timeout id for the slideshow transition function.
     *
     * @var     Number
     * @private
     */
    slide_timer,

    /**
     * Keeps track of the time at which the current slideshow frame was
     * displayed.
     *
     * @var     Number
     * @private
     */
    slide_start,

    /**
     * The delay on which the next slide will display.
     *
     * @var     Number
     * @private
     */
    slide_delay = 0;

    // detect plugin support
    if(navigator.plugins && navigator.plugins.length){
        var names = [];
        each(navigator.plugins, function(p){
            names.push(p.name);
        });
        names = names.join();

        var f4m = names.indexOf('Flip4Mac') > -1;
        S.plugins = {
            fla:    names.indexOf('Shockwave Flash') > -1,
            qt:     names.indexOf('QuickTime') > -1,
            wmp:    !f4m && names.indexOf('Windows Media') > -1, // if it's Flip4Mac, it's not really WMP
            f4m:    f4m
        }
    }else{
        function detectPlugin(n){
            try{
                var axo = new ActiveXObject(n);
            }catch(e){}
            return !!axo;
        }

        S.plugins = {
            fla:    detectPlugin('ShockwaveFlash.ShockwaveFlash'),
            qt:     detectPlugin('QuickTime.QuickTime'),
            wmp:    detectPlugin('wmplayer.ocx'),
            f4m:    false
        }
    }

    /**
     * Waits for the DOM to be ready before firing the given callback
     * function. This function adapted from the jQuery framework.
     *
     * @param   Function    cb      The callback function
     * @return  void
     * @private
     */
    function waitDom(cb){
        // mozilla, opera and webkit nightlies currently support this event
        if(document.addEventListener){
            // use the handy event callback
            document.addEventListener( "DOMContentLoaded", function(){
                document.removeEventListener("DOMContentLoaded", arguments.callee, false);
                cb();
            }, false);

        // if IE event model is used
        }else if(document.attachEvent){
            // ensure firing before onload, maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", function(){
                if(document.readyState === "complete"){
                    document.detachEvent("onreadystatechange", arguments.callee);
                    cb();
                }
            });

            // if IE and not an iframe, continually check to see if the document is ready
            if(document.documentElement.doScroll && window == window.top) (function(){
                if(S.ready) return;

                try{
                    // if IE is used, use the trick by Diego Perini
                    // http://javascript.nwbox.com/IEContentLoaded/
                    document.documentElement.doScroll("left");
                }catch(error){
                    setTimeout(arguments.callee, 0);
                    return;
                }

                cb();
            })();
        }

        // a fallback to window.onload, that will always work
        if(typeof window.onload == 'function'){
            var oldonload = window.onload;
            window.onload = function(){
                oldonload();
                cb();
            }
        }else
            window.onload = cb;
    }

    /**
     * Waits for all necessary libraries to load before calling Shadowbox.load.
     * This is necessary because some browsers (Safari) will fire the DOM ready
     * event before dynamically included scripts are loaded.
     *
     * @return  void
     * @private
     */
    function waitLibs(){
        if(S.lib && S.lang)
            S.load(); // ready to go!
        else
            setTimeout(waitLibs, 0);
    }

    /**
     * Handles all clicks on links that have been set up to work with Shadowbox
     * and cancels the default event behavior when appropriate.
     *
     * @param   HTMLEvent   e           The click event object
     * @return  void
     * @private
     */
    function handleClick(e){
        var link;
        if(U.isLink(this)){
            link = this; // jQuery, Prototype, YUI
        }else{
            link = S.lib.getTarget(e); // Ext, standalone
            while(!U.isLink(link) && link.parentNode)
                link = link.parentNode;
        }

        S.lib.preventDefault(e); // good for debugging

        if(link){
            S.open(link);

            if(S.gallery.length)
                S.lib.preventDefault(e);
        }
    }

    /**
     * Sets up a listener on the document for keystrokes.
     *
     * @param   Boolean     on      True to enable the listener, false to disable
     * @return  void
     * @private
     */
    function listenKeys(on){
        if(!S.options.enableKeys) return;
        S.lib[(on ? 'add' : 'remove') + 'Event'](document, 'keydown', handleKey);
    }

    /**
     * A listener function that is fired when a key is pressed.
     *
     * @param   mixed       e       The event object
     * @return  void
     * @private
     */
    function handleKey(e){
        var code = S.lib.keyCode(e), handler;

        switch(code){
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
                handler = typeof slide_timer == 'number' ? S.pause : S.play;
        }

        if(handler){
            // attempt to prevent default key action
            S.lib.preventDefault(e);
            handler();
        }
    }

    /**
     * Loads the Shadowbox with the current piece.
     *
     * @return  void
     * @private
     */
    function loadContent(){
        var obj = S.getCurrent();
        if(!obj) return;

        // determine player, inline is really just HTML
        var p = obj.player == 'inline' ? 'html' : obj.player;
        if(typeof S[p] != 'function')
            S.error('Unknown player: ' + p);

        var change = false;
        if(S.content){
            // changing from some previous content
            S.content.remove(); // remove old content
            change = true;

            S.revertOptions();
            if(obj.options)
                S.applyOptions(obj.options);
        }

        // make sure the body element doesn't have any children, just in case
        U.removeChildren(S.skin.bodyEl());

        // load the content
        S.content = new S[p](obj);
        listenKeys(false); // disable the keyboard while content is loading

        S.skin.onLoad(S.content, change, function(){
            if(!S.content) return;

            if(typeof S.content.ready != 'undefined'){
                // if content object has a ready property, wait for it to be
                // ready before loading
                var id = setInterval(function(){
                    if(S.content){
                        if(S.content.ready){
                            clearInterval(id);
                            id = null;
                            S.skin.onReady(contentReady);
                        }
                    }else{ // content has been removed
                        clearInterval(id);
                        id = null;
                    }
                }, 100);
            }else
                S.skin.onReady(contentReady);
        });

        // preload neighboring gallery images
        if(S.gallery.length > 1){
            var next = S.gallery[S.current + 1] || S.gallery[0];
            if(next.player == 'img'){
                var a = new Image();
                a.src = next.content;
            }
            var prev = S.gallery[S.current - 1] || S.gallery[S.gallery.length - 1];
            if(prev.player == 'img'){
                var b = new Image();
                b.src = prev.content;
            }
        }
    }

    /**
     * Callback that should be called with the content is ready to be loaded.
     *
     * @return  void
     * @private
     */
    function contentReady(){
        if(!S.content) return;
        S.content.append(S.skin.bodyEl(), content_id, S.dimensions);
        S.skin.onFinish(finishContent);
    }

    /**
     * Callback that should be called when the content is finished loading.
     *
     * @return  void
     * @private
     */
    function finishContent(){
        if(!S.content) return;

        if(S.content.onLoad)
            S.content.onLoad();
        if(S.options.onFinish)
            S.options.onFinish();
        if(!S.isPaused())
            S.play(); // kick off next slide

        listenKeys(true); // re-enable keyboard when finished
    }

    // expose
    window['Shadowbox'] = S;

})();

/**
 * The default skin for Shadowbox. Separated out into its own class so that it may
 * be customized more easily by skin developers.
 */
(function(){

    var S = Shadowbox,
    U = S.util,

    /**
     * Keeps track of whether or not the overlay is activated.
     *
     * @var     Boolean
     * @private
     */
    overlay_on = false,

    /**
     * A cache of elements that are troublesome for modal overlays.
     *
     * @var     Array
     * @private
     */
    visibility_cache = [],

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
    ],

    // the Shadowbox.skin object
    K = {

        /**
         * The HTML markup to use.
         *
         * @var     String
         * @public
         */
        markup: '<div id="sb-container">' +
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
                '</div>',

        /**
         * Options that are specific to the skin.
         *
         * @var     Object
         * @public
         */
        options: {

            animSequence: 'sync',   // the sequence of the resizing animations. "hw" will resize
                                    // height, then width. "wh" resizes width, then height. "sync"
                                    // resizes both simultaneously
            autoDimensions: false,  // use the dimensions of the first piece as the initial dimensions
                                    // if they are available
            counterLimit: 10,       // limit to the number of counter links that
                                    // are displayed in a "skip" style counter
            counterType: 'default', // counter type. May be either "default" or
                                    // "skip". Skip counter displays a link for
                                    // each item in gallery
            displayCounter: true,   // display the gallery counter
            displayNav: true,       // show the navigation controls
            fadeDuration: 0.35,     // duration of the fade animations (in seconds)
            initialHeight: 160,     // initial height (pixels)
            initialWidth: 320,      // initial width (pixels)
            modal: false,           // trigger Shadowbox.close() when overlay is
                                    // clicked
            overlayColor: '#000',   // color to use for modal overlay
            overlayOpacity: 0.8,    // opacity to use for modal overlay
            resizeDuration: 0.35,   // duration of the resizing animations (in seconds)
            showOverlay: true,      // show the overlay
            troubleElements: ['select', 'object', 'embed', 'canvas']  // names of elements that are
                                                                      // troublesome for modal overlays

        },

        /**
         * Initialization function. Called immediately after this skin's markup
         * has been appended to the document with all of the necessary language
         * replacements done.
         *
         * @return  void
         * @public
         */
        init: function(){
            // append markup to body
            var markup = K.markup.replace(/\{(\w+)\}/g, function(m, p){
                return S.lang[p];
            });
            S.lib.append(document.body, markup);

            // several fixes for IE6
            if(S.client.isIE6){
                // trigger hasLayout on sb-body
                U.get('sb-body').style.zoom = 1;

                // support transparent PNG's via AlphaImageLoader
                var el, m, re = /url\("(.*\.png)"\)/;
                U.each(png, function(id){
                    el = U.get(id);
                    if(el){
                        m = S.lib.getStyle(el, 'backgroundImage').match(re);
                        if(m){
                            el.style.backgroundImage = 'none';
                            el.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true,src=' +
                                m[1] + ',sizingMethod=scale);';
                        }
                    }
                });
            }

            // set up window resize event handler
            var id;
            S.lib.addEvent(window, 'resize', function(){
                // use 50 ms event buffering to prevent jerky window resizing
                if(id){
                    clearTimeout(id);
                    id = null;
                }
                // check if activated because IE7 fires window resize event
                // when container display is set to block
                if(S.isActive()){
                    id = setTimeout(function(){
                        K.onWindowResize();
                        var c = S.content;
                        if(c && c.onWindowResize)
                            c.onWindowResize();
                    }, 50);
                }
            });
        },

        /**
         * Gets the element that content should be appended to.
         *
         * @return  HTMLElement     The body element
         * @public
         */
        bodyEl: function(){
            return U.get('sb-body-inner');
        },

        /**
         * Called when Shadowbox opens from an inactive state.
         *
         * @param   Object      obj     The object to open
         * @param   Function    cb      The function to call when finished
         * @return  void
         * @public
         */
        onOpen: function(obj, cb){
            toggleTroubleElements(false);

            var h = S.options.autoDimensions && 'height' in obj
                ? obj.height
                : S.options.initialHeight,
                w = S.options.autoDimensions && 'width' in obj
                ? obj.width
                : S.options.initialWidth;

            U.get('sb-container').style.display = 'block';

            var d = setDimensions(h, w);
            adjustHeight(d.inner_h, d.top, false);
            adjustWidth(d.width, d.left, false);
            toggleVisible(cb);
        },

        /**
         * Called when a new piece of content is being loaded.
         *
         * @param   mixed       content     The content object
         * @param   Boolean     change      True if the content is changing
         *                                  from some previous content
         * @param   Function    cb          A callback that should be fired when
         *                                  this function is finished
         * @return  void
         * @public
         */
        onLoad: function(content, change, cb){
            toggleLoading(true);

            hideBars(change, function(){ // if changing, animate the bars transition
                if(!content) return;

                // if opening, clear #sb-wrapper display
                if(!change) U.get('sb-wrapper').style.display = '';

                cb();
            });
        },

        /**
         * Called when the content is ready to be loaded (e.g. when the image
         * has finished loading). Should resize the content box and make any
         * other necessary adjustments.
         *
         * @param   Function    cb          A callback that should be fired when
         *                                  this function is finished
         * @return  void
         * @public
         */
        onReady: function(cb){
            var c = S.content;
            if(!c) return;

            // set new dimensions
            var d = setDimensions(c.height, c.width, c.resizable);

            K.resizeContent(d.inner_h, d.width, d.top, d.left, true, function(){
                showBars(cb);
            });
        },

        /**
         * Called when the content is loaded into the box and is ready to be
         * displayed.
         *
         * @param   Function    cb          A callback that should be fired when
         *                                  this function is finished
         * @return  void
         * @public
         */
        onFinish: function(cb){
            toggleLoading(false, cb);
        },

        /**
         * Called when Shadowbox is closed.
         *
         * @return  void
         * @public
         */
        onClose: function(){
            toggleVisible();
            toggleTroubleElements(true);
        },

        /**
         * Called in Shadowbox.play().
         *
         * @return  void
         * @public
         */
        onPlay: function(){
            toggleNav('play', false);
            toggleNav('pause', true);
        },

        /**
         * Called in Shadowbox.pause().
         *
         * @return  void
         * @public
         */
        onPause: function(){
            toggleNav('pause', false);
            toggleNav('play', true);
        },

        /**
         * Called when the window is resized.
         *
         * @return  void
         * @public
         */
        onWindowResize: function(){
            var c = S.content;
            if(!c) return;

            // set new dimensions
            var d = setDimensions(c.height, c.width, c.resizable);

            adjustWidth(d.width, d.left, false);
            adjustHeight(d.inner_h, d.top, false);

            var el = U.get(S.contentId());
            if(el){
                // resize resizable content when in resize mode
                if(c.resizable && S.options.handleOversize == 'resize'){
                    el.height = d.resize_h;
                    el.width = d.resize_w;
                }
            }
        },

        /**
         * Resizes Shadowbox to the appropriate height and width for the current
         * content.
         *
         * @param   Number      height  The new height to use
         * @param   Number      width   The new width to use
         * @param   Number      top     The new top to use
         * @param   Number      left    The new left to use
         * @param   Boolean     anim    True to animate the transition
         * @param   Function    cb      A callback function to execute after the
         *                              resize completes
         * @return  void
         * @public
         */
        resizeContent: function(height, width, top, left, anim, cb){
            var c = S.content;
            if(!c) return;

            // set new dimensions
            var d = setDimensions(c.height, c.width, c.resizable);

            switch(S.options.animSequence){
                case 'hw':
                    adjustHeight(d.inner_h, d.top, anim, function(){
                        adjustWidth(d.width, d.left, anim, cb);
                    });
                break;
                case 'wh':
                    adjustWidth(d.width, d.left, anim, function(){
                        adjustHeight(d.inner_h, d.top, anim, cb);
                    });
                break;
                default: // sync
                    adjustWidth(d.width, d.left, anim);
                    adjustHeight(d.inner_h, d.top, anim, cb);
            }
        }

    };

    /**
     * Sets the top of the container element. This is only necessary in IE6
     * where the container uses absolute positioning instead of fixed.
     *
     * @return  void
     * @private
     */
    function fixTop(){
        U.get('sb-container').style.top = document.documentElement.scrollTop + 'px';
    }

    /**
     * Toggles the visibility of elements that are troublesome for modal
     * overlays.
     *
     * @return  void
     * @private
     */
    function toggleTroubleElements(on){
        if(on){
            U.each(visibility_cache, function(c){
                c[0].style.visibility = c[1] || '';
            });
        }else{
            visibility_cache = [];
            U.each(S.options.troubleElements, function(tag){
                U.each(document.getElementsByTagName(tag), function(el){
                    visibility_cache.push([el, el.style.visibility]);
                    el.style.visibility = 'hidden';
                });
            });
        }
    }

    /**
     * Toggles the visibility of #sb-container and sets its size (if on
     * IE6). Also toggles the visibility of elements (<select>, <object>, and
     * <embed>) that are troublesome for semi-transparent modal overlays. IE has
     * problems with <select> elements, while Firefox has trouble with
     * <object>s.
     *
     * @param   Function    cb      A callback to call after toggling on, absent
     *                              when toggling off
     * @return  void
     * @private
     */
    function toggleVisible(cb){
        var so = U.get('sb-overlay'),
            sc = U.get('sb-container'),
            sb = U.get('sb-wrapper');

        if(cb){
            if(S.client.isIE6){
                // fix container top before showing
                fixTop();
                S.lib.addEvent(window, 'scroll', fixTop);
            }
            if(S.options.showOverlay){
                overlay_on = true;

                // set overlay color/opacity
                so.style.backgroundColor = S.options.overlayColor;
                U.setOpacity(so, 0);
                if(!S.options.modal) S.lib.addEvent(so, 'click', S.close);

                sb.style.display = 'none'; // cleared in onLoad
            }
            sc.style.visibility = 'visible';
            if(overlay_on){
                // fade in effect
                var op = parseFloat(S.options.overlayOpacity);
                U.animate(so, 'opacity', op, S.options.fadeDuration, cb);
            }else
                cb();
        }else{
            if(S.client.isIE6)
                S.lib.removeEvent(window, 'scroll', fixTop);
            S.lib.removeEvent(so, 'click', S.close);
            if(overlay_on){
                // fade out effect
                sb.style.display = 'none';
                U.animate(so, 'opacity', 0, S.options.fadeDuration, function(){
                    // the following is commented because it causes the overlay to
                    // be hidden on consecutive activations in IE8, even though we
                    // set the visibility to "visible" when we reactivate
                    //sc.style.visibility = 'hidden';
                    sc.style.display = '';
                    sb.style.display = '';
                    U.clearOpacity(so);
                });
            }else
                sc.style.visibility = 'hidden';
        }
    }

    /**
     * Toggles the display of the nav control with the given id.
     *
     * @param   String      id      The id of the navigation control
     * @param   Boolean     on      True to toggle on, false to toggle off
     * @return  void
     * @private
     */
    function toggleNav(id, on){
        var el = U.get('sb-nav-' + id);
        if(el) el.style.display = on ? '' : 'none';
    }

    /**
     * Toggles the visibility of the "loading" layer.
     *
     * @param   Boolean     on      True to toggle on, false to toggle off
     * @param   Function    cb      The callback function to call when toggling
     *                              completes
     * @return  void
     * @private
     */
    function toggleLoading(on, cb){
        var ld = U.get('sb-loading'),
            p = S.getCurrent().player,
            anim = (p == 'img' || p == 'html'); // fade on images & html

        if(on){
            function fn(){
                U.clearOpacity(ld);
                if(cb) cb();
            }

            U.setOpacity(ld, 0);
            ld.style.display = '';

            if(anim)
                U.animate(ld, 'opacity', 1, S.options.fadeDuration, fn);
            else
                fn();
        }else{
            function fn(){
                ld.style.display = 'none';
                U.clearOpacity(ld);
                if(cb) cb();
            }

            if(anim)
                U.animate(ld, 'opacity', 0, S.options.fadeDuration, fn);
            else
                fn();
        }
    }

    /**
     * Builds the content for the title and information bars.
     *
     * @param   Function    cb      A callback function to execute after the
     *                              bars are built
     * @return  void
     * @private
     */
    function buildBars(cb){
        var obj = S.getCurrent();

        // build the title, if present
        U.get('sb-title-inner').innerHTML = obj.title || '';

        // build the nav
        var c, n, pl, pa, p;
        if(S.options.displayNav){
            c = true;
            // next & previous links
            var len = S.gallery.length;
            if(len > 1){
                if(S.options.continuous)
                    n = p = true; // show both
                else{
                    n = (len - 1) > S.current; // not last in gallery, show next
                    p = S.current > 0; // not first in gallery, show previous
                }
            }
            // in a slideshow?
            if(S.options.slideshowDelay > 0 && S.hasNext()){
                pa = !S.isPaused();
                pl = !pa;
            }
        }else{
            c = n = pl = pa = p = false;
        }
        toggleNav('close', c);
        toggleNav('next', n);
        toggleNav('play', pl);
        toggleNav('pause', pa);
        toggleNav('previous', p);

        // build the counter
        var counter = '';
        if(S.options.displayCounter && S.gallery.length > 1){
            var len = S.gallery.length;

            if(S.options.counterType == 'skip'){
                // limit the counter?
                var i = 0,
                    end = len,
                    limit = parseInt(S.options.counterLimit) || 0;

                if(limit < len && limit > 2){ // support large galleries
                    var h = Math.floor(limit / 2);
                    i = S.current - h;
                    if(i < 0) i += len;
                    end = S.current + (limit - h);
                    if(end > len) end -= len;
                }
                while(i != end){
                    if(i == len) i = 0;
                    counter += '<a onclick="Shadowbox.change(' + i + ');"'
                    if(i == S.current) counter += ' class="sb-counter-current"';
                    counter += '>' + (i++) + '</a>';
                }
            }else
                var counter = (S.current + 1) + ' ' + S.lang.of + ' ' + len;
        }

        U.get('sb-counter').innerHTML = counter;

        cb();
    }

    /**
     * Hides the title and info bars.
     *
     * @param   Boolean     anim    True to animate the transition
     * @param   Function    cb      A callback function to execute after the
     *                              animation completes
     * @return  void
     * @private
     */
    function hideBars(anim, cb){
        var sw = U.get('sb-wrapper'),
            st = U.get('sb-title'),
            si = U.get('sb-info'),
            ti = U.get('sb-title-inner'),
            ii = U.get('sb-info-inner'),
            t = parseInt(S.lib.getStyle(ti, 'height')) || 0,
            b = parseInt(S.lib.getStyle(ii, 'height')) || 0;

        var fn = function(){
            // hide bars here in case of overflow, build after hidden
            ti.style.visibility = ii.style.visibility = 'hidden';
            buildBars(cb);
        }

        if(anim){
            U.animate(st, 'height', 0, 0.35);
            U.animate(si, 'height', 0, 0.35);
            U.animate(sw, 'paddingTop', t, 0.35);
            U.animate(sw, 'paddingBottom', b, 0.35, fn);
        }else{
            st.style.height = si.style.height = '0px';
            sw.style.paddingTop = t + 'px';
            sw.style.paddingBottom = b + 'px';
            fn();
        }
    }

    /**
     * Shows the title and info bars.
     *
     * @param   Function    cb      A callback function to execute after the
     *                              animation completes
     * @return  void
     * @private
     */
    function showBars(cb){
        var sw = U.get('sb-wrapper'),
            st = U.get('sb-title'),
            si = U.get('sb-info'),
            ti = U.get('sb-title-inner'),
            ii = U.get('sb-info-inner'),
            t = parseInt(S.lib.getStyle(ti, 'height')) || 0,
            b = parseInt(S.lib.getStyle(ii, 'height')) || 0;

        // clear visibility before animating into view
        ti.style.visibility = ii.style.visibility = '';

        // show title?
        if(ti.innerHTML != ''){
            U.animate(st, 'height', t, 0.35);
            U.animate(sw, 'paddingTop', 0, 0.35);
        }
        U.animate(si, 'height', b, 0.35);
        U.animate(sw, 'paddingBottom', 0, 0.35, cb);
    }

    /**
     * Adjusts the height of #sb-body and centers #sb-wrapper vertically
     * in the viewport.
     *
     * @param   Number      height      The height to use for #sb-body
     * @param   Number      top         The top to use for #sb-wrapper
     * @param   Boolean     anim        True to animate the transition
     * @param   Function    cb          A callback to use when the animation
     *                                  completes
     * @return  void
     * @private
     */
    function adjustHeight(height, top, anim, cb){
        var sb = U.get('sb-body'),
            s = U.get('sb-wrapper'),
            h = parseInt(height),
            t = parseInt(top);

        if(anim){
            U.animate(sb, 'height', h, S.options.resizeDuration);
            U.animate(s, 'top', t, S.options.resizeDuration, cb);
        }else{
            sb.style.height = h + 'px';
            s.style.top = t + 'px';
            if(cb) cb();
        }
    }

    /**
     * Adjusts the width and left of #sb-wrapper.
     *
     * @param   Number      width       The width to use for #sb-wrapper
     * @param   Number      left        The left to use for #sb-wrapper
     * @param   Boolean     anim        True to animate the transition
     * @param   Function    cb          A callback to use when the animation
     *                                  completes
     * @return  void
     * @private
     */
    function adjustWidth(width, left, anim, cb){
        var s = U.get('sb-wrapper'),
            w = parseInt(width),
            l = parseInt(left);

        if(anim){
            U.animate(s, 'width', w, S.options.resizeDuration);
            U.animate(s, 'left', l, S.options.resizeDuration, cb);
        }else{
            s.style.width = w + 'px';
            s.style.left = l + 'px';
            if(cb) cb();
        }
    }

    /**
     * Calculates the dimensions for Shadowbox, taking into account the borders
     * and surrounding elements of #sb-body.
     *
     * @param   Number      height      The content height
     * @param   Number      width       The content width
     * @param   Boolean     resizable   True if the content is able to be
     *                                  resized. Defaults to false
     * @return  Object                  The new dimensions object
     * @private
     */
    function setDimensions(height, width, resizable){
        var sbi = U.get('sb-body-inner')
            sw = U.get('sb-wrapper'),
            so = U.get('sb-overlay'),
            tb = sw.offsetHeight - sbi.offsetHeight,
            lr = sw.offsetWidth - sbi.offsetWidth,
            max_h = so.offsetHeight, // measure overlay to get viewport size for IE6
            max_w = so.offsetWidth;

        S.setDimensions(height, width, max_h, max_w, tb, lr, resizable);

        return S.dimensions;
    }

    // expose
    S.skin = K;

})();
