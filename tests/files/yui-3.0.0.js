/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

(function() {

    var _instances = {}, 
        _startTime = new Date().getTime(), 
        p, 
        i,

        add = function () {
            if (window.addEventListener) {
                return function(el, type, fn, capture) {
                    el.addEventListener(type, fn, (!!capture));
                };
            } else if (window.attachEvent) {
                return function(el, type, fn) {
                    el.attachEvent("on" + type, fn);
                };
            } else {
                return function(){};
            }
        }(),

        remove = function() {
            if (window.removeEventListener) {
                return function (el, type, fn, capture) {
                    el.removeEventListener(type, fn, !!capture);
                };
            } else if (window.detachEvent) {
                return function (el, type, fn) {
                    el.detachEvent("on" + type, fn);
                };
            } else {
                return function(){};
            }
        }(),

        globalListener = function() {
            YUI.Env.windowLoaded = true;
            YUI.Env.DOMReady = true;
            remove(window, 'load', globalListener);
        },

// @TODO: this needs to be created at build time from module metadata

        _APPLY_TO_WHITE_LIST = {
          'io.xdrReady': 1,
          'io.xdrResponse':1
        },

        SLICE = Array.prototype.slice;
        
// reduce to one or the other
if (typeof YUI === 'undefined' || !YUI) {

    /**
     * The YUI global namespace object.  If YUI is already defined, the
     * existing YUI object will not be overwritten so that defined
     * namespaces are preserved.  
     *
     * @class YUI
     * @constructor
     * @global
     * @uses EventTarget
     * @param o* Up to five optional configuration objects.  This object is stored
     * in YUI.config.  See config for the list of supported properties.
     */

    /*global YUI*/
    // Make a function, disallow direct instantiation
    YUI = function(o1, o2, o3, o4, o5) {

        var Y = this, a = arguments, i, l = a.length;

        // Allow instantiation without the new operator
        if (!(Y instanceof YUI)) {
            return new YUI(o1, o2, o3, o4, o5);
        } else {
            // set up the core environment
            Y._init();

            for (i=0; i<l; i++) {
                Y._config(a[i]);
            }

            // bind the specified additional modules for this instance
            Y._setup();

            return Y;
        }
    };
}

// The prototype contains the functions that are required to allow the external
// modules to be registered and for the instance to be initialized.
YUI.prototype = {

    _config: function(o) {

        o = o || {};

        var c = this.config, i, j, m, mods;

        mods = c.modules;
        for (i in o) {
            if (mods && i == 'modules') {
                m = o[i];
                for (j in m) {
                    if (m.hasOwnProperty(j)) {
                        mods[j] = m[j];
                    }
                }
            } else if (i == 'win') {
                c[i] = o[i].contentWindow || o[i];
                c.doc = c[i].document;
            } else {
                c[i] = o[i];
            }
        }
    },

    /**
     * Initialize this YUI instance
     * @private
     */
    _init: function() {

        // find targeted window/frame
        // @TODO create facades
        var v = '3.0.0', Y = this;

        if (v.indexOf('@') > -1) {
            v = 'test';
        }

        Y.version = v;

        Y.Env = {
            // @todo expand the new module metadata
            mods: {},
            cdn: 'http://yui.yahooapis.com/' + v + '/build/',
            bootstrapped: false,
            _idx: 0,
            _used: {},
            _attached: {},
            _yidx: 0,
            _uidx: 0,
            _loaded: {}
        };

        Y.Env._loaded[v] = {};

        if (YUI.Env) {
            Y.Env._yidx = (++YUI.Env._yidx);
            Y.Env._guidp = ('yui_' + v + '-' + Y.Env._yidx + '-' + _startTime).replace(/\./g, '_');
            Y.id = Y.stamp(Y);
            _instances[Y.id] = Y;
        }

        Y.constructor = YUI;

        // configuration defaults
        Y.config = {

            win: window || {},
            doc: document,
            debug: true,
            useBrowserConsole: true,
            throwFail: true,
            bootstrap: true,
            fetchCSS: true,
        
            base: function() {
                var b, nodes, i, match;

                // get from querystring
                nodes = document.getElementsByTagName('script');

                for (i=0; i<nodes.length; i=i+1) {
                    match = nodes[i].src.match(/^(.*)yui\/yui[\.\-].*js(\?.*)?$/);
                    b = match && match[1];
                    if (b) {
                        break;
                    }
                }

                // use CDN default
                return b || Y.Env.cdn;

            }(),

            loaderPath: 'loader/loader-min.js'
        };

    },
    
    /**
     * Finishes the instance setup. Attaches whatever modules were defined
     * when the yui modules was registered.
     * @method _setup
     * @private
     */
    _setup: function(o) {
        this.use("yui-base");
    },

    /**
     * Executes a method on a YUI instance with
     * the specified id if the specified method is whitelisted.
     * @method applyTo
     * @param id {string} the YUI instance id
     * @param method {string} the name of the method to exectute.
     * Ex: 'Object.keys'
     * @param args {Array} the arguments to apply to the method
     * @return {object} the return value from the applied method or null
     */
    applyTo: function(id, method, args) {

        if (!(method in _APPLY_TO_WHITE_LIST)) {
            this.log(method + ': applyTo not allowed', 'warn', 'yui');
            return null;
        }

        var instance = _instances[id], nest, m, i;

        if (instance) {

            nest = method.split('.'); 
            m = instance;

            for (i=0; i<nest.length; i=i+1) {

                m = m[nest[i]];

                if (!m) {
                    this.log('applyTo not found: ' + method, 'warn', 'yui');
                }
            }

            return m.apply(instance, args);
        }

        return null;
    }, 

    /**
     * Register a module
     * @method add
     * @param name {string} module name
     * @param fn {Function} entry point into the module that
     * is used to bind module to the YUI instance
     * @param version {string} version string
     * @param details optional config data: 
     * requires   - features that should be present before loading
     * optional   - optional features that should be present if load optional defined
     * use  - features that should be attached automatically
     * skinnable  -
     * rollup
     * omit - features that should not be loaded if this module is present
     * @return {YUI} the YUI instance
     *
     */
    add: function(name, fn, version, details) {
        // this.log('Adding a new component ' + name);
        // @todo expand this to include version mapping
        // @todo may want to restore the build property
        // @todo fire moduleAvailable event
        
        YUI.Env.mods[name] = {
            name: name, 
            fn: fn,
            version: version,
            details: details || {}
        };

        return this; // chain support
    },

    _attach: function(r, fromLoader) {

        var mods = YUI.Env.mods,
            attached = this.Env._attached,
            i, l = r.length, name, m, d, req, use;

        for (i=0; i<l; i=i+1) {

            name = r[i]; 
            m    = mods[name];

            if (!attached[name] && m) {

                attached[name] = true;

                d   = m.details; 
                req = d.requires; 
                use = d.use;

                if (req) {
                    this._attach(this.Array(req));
                }

                // this.log('attaching ' + name, 'info', 'yui');

                if (m.fn) {
                    m.fn(this);
                }

                if (use) {
                    this._attach(this.Array(use));
                }
            }
        }

    },

    /**
     * Bind a module to a YUI instance
     * @param modules* {string} 1-n modules to bind (uses arguments array)
     * @param *callback {function} callback function executed when 
     * the instance has the required functionality.  If included, it
     * must be the last parameter.
     *
     * @TODO 
     * Implement versioning?  loader can load different versions?
     * Should sub-modules/plugins be normal modules, or do
     * we add syntax for specifying these?
     *
     * YUI().use('dragdrop')
     * YUI().use('dragdrop:2.4.0'); // specific version
     * YUI().use('dragdrop:2.4.0-'); // at least this version
     * YUI().use('dragdrop:2.4.0-2.9999.9999'); // version range
     * YUI().use('*'); // use all available modules
     * YUI().use('lang+dump+substitute'); // use lang and some plugins
     * YUI().use('lang+*'); // use lang and all known plugins
     *
     *
     * @return {YUI} the YUI instance
     */
    use: function() {

        if (this._loading) {
            this._useQueue = this._useQueue || new this.Queue();
            this._useQueue.add(SLICE.call(arguments, 0));
            return this;
        }

        var Y = this, 
            a=SLICE.call(arguments, 0), 
            mods = YUI.Env.mods, 
            used = Y.Env._used,
            loader, 
            firstArg = a[0], 
            dynamic = false,
            callback = a[a.length-1],
            boot = Y.config.bootstrap,
            k, i, l, missing = [], 
            r = [], 
            css = Y.config.fetchCSS,
            f = function(name) {

                // only attach a module once
                if (used[name]) {
                    return;
                }

                var m = mods[name], j, req, use;

                if (m) {


                    used[name] = true;

                    req = m.details.requires;
                    use = m.details.use;
                } else {

                    // CSS files don't register themselves, see if it has been loaded
                    if (!YUI.Env._loaded[Y.version][name]) {
                        missing.push(name);
                    } else {
                        // probably css
                        used[name] = true;
                    }
                }

                // make sure requirements are attached
                if (req) {
                    if (Y.Lang.isString(req)) {
                        f(req);
                    } else {
                        for (j = 0; j < req.length; j = j + 1) {
                            f(req[j]);
                        }
                    }
                }

                // add this module to full list of things to attach
                r.push(name);

            },

            onComplete;


        // The last argument supplied to use can be a load complete callback
        if (typeof callback === 'function') {
            a.pop();
        } else {
            callback = null;
        }

        onComplete = function(fromLoader) {


            fromLoader = fromLoader || {
                success: true,
                msg: 'not dynamic'
            };

            if (callback) {
                callback(Y, fromLoader);
            }

            if (Y.fire) {
                Y.fire('yui:load', Y, fromLoader);
            }

            // process queued use requests as long until done 
            // or dynamic load happens again.
            Y._loading = false;

            if (Y._useQueue && Y._useQueue.size() && !Y._loading) {
                Y.use.apply(Y, Y._useQueue.next());
            }
        };
 

        // YUI().use('*'); // bind everything available
        if (firstArg === "*") {
            a = [];
            for (k in mods) {
                if (mods.hasOwnProperty(k)) {
                    a.push(k);
                }
            }
            
            if (callback) {
                a.push(callback);
            }

            return Y.use.apply(Y, a);
        }
        

        // use loader to expand dependencies and sort the 
        // requirements if it is available.
        if (Y.Loader) {
            dynamic = true;
            loader = new Y.Loader(Y.config);
            loader.require(a);
            loader.ignoreRegistered = true;
            loader.allowRollup = false;
            // loader.calculate(null, (css && css == 'force') ? null : 'js');
            // loader.calculate();
            loader.calculate(null, (css) ? null : 'js');
            a = loader.sorted;
        }


        l = a.length;

        // process each requirement and any additional requirements 
        // the module metadata specifies
        for (i=0; i<l; i=i+1) {
            f(a[i]);
        }

        l = missing.length;


        if (l) {
            missing = Y.Object.keys(Y.Array.hash(missing));
        }

        // dynamic load
        if (boot && l && Y.Loader) {
            Y._loading = true;
            loader = new Y.Loader(Y.config);
            loader.onSuccess = onComplete;
            loader.onFailure = onComplete;
            loader.onTimeout = onComplete;
            loader.context = Y;
            loader.attaching = a;
            // loader.require(missing);
            loader.require((css) ? missing : a);
            loader.insert(null, (css) ? null : 'js');
        } else if (boot && l && Y.Get && !Y.Env.bootstrapped) {
            Y._loading = true;

            a = Y.Array(arguments, 0, true);
            // a.unshift('loader');

            Y.Get.script(Y.config.base + Y.config.loaderPath, {
                onEnd: function() {
                    Y._loading = false;
                    Y.Env.bootstrapped = true;
                    Y._attach(['loader']);
                    Y.use.apply(Y, a);
                }
            });

            return Y;

        } else {
            if (l) {
            }
            Y._attach(r);
            onComplete();
        }

        return Y; // chain support var yui = YUI().use('dragdrop');
    },


    /**
     * Returns the namespace specified and creates it if it doesn't exist
     * <pre>
     * YUI.namespace("property.package");
     * YUI.namespace("YAHOO.property.package");
     * </pre>
     * Either of the above would create YUI.property, then
     * YUI.property.package (YAHOO is scrubbed out, this is
     * to remain compatible with YUI2)
     *
     * Be careful when naming packages. Reserved words may work in some browsers
     * and not others. For instance, the following will fail in Safari:
     * <pre>
     * YUI.namespace("really.long.nested.namespace");
     * </pre>
     * This fails because "long" is a future reserved word in ECMAScript
     *
     * @method namespace
     * @param  {string*} arguments 1-n namespaces to create 
     * @return {object}  A reference to the last namespace object created
     */
    namespace: function() {
        var a=arguments, o=null, i, j, d;
        for (i=0; i<a.length; i=i+1) {
            d = ("" + a[i]).split(".");
            o = this;
            for (j=(d[0] == "YAHOO") ? 1 : 0; j<d.length; j=j+1) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        }
        return o;
    },

    // this is replaced if the log module is included
    log: function() {

    },

    /**
     * Report an error.  The reporting mechanism is controled by
     * the 'throwFail' configuration attribute.  If throwFail is
     * not specified, the message is written to the Logger, otherwise
     * a JS error is thrown
     * @method error
     * @param msg {string} the error message
     * @param e {Error} Optional JS error that was caught.  If supplied
     * and throwFail is specified, this error will be re-thrown.
     * @return {YUI} this YUI instance
     */
    error: function(msg, e) {
        if (this.config.throwFail) {
            throw (e || new Error(msg)); 
        } else {
            this.message(msg, "error"); // don't scrub this one
        }

        return this;
    },

    /**
     * Generate an id that is unique among all YUI instances
     * @method guid
     * @param pre {string} optional guid prefix
     * @return {string} the guid
     */
    guid: function(pre) {
        var id =  this.Env._guidp + (++this.Env._uidx);
        return (pre) ? (pre + id) : id;
    },

    /**
     * Returns a guid associated with an object.  If the object
     * does not have one, a new one is created unless readOnly
     * is specified.
     * @method stamp
     * @param o The object to stamp
     * @param readOnly {boolean} if true, a valid guid will only
     * be returned if the object has one assigned to it.
     * @return {string} The object's guid or null
     */
    stamp: function(o, readOnly) {

        if (!o) {
            return o;
        }

        var uid = (typeof o === 'string') ? o : o._yuid;

        if (!uid) {
            uid = this.guid();
            if (!readOnly) {
                try {
                    o._yuid = uid;
                } catch(e) {
                    uid = null;
                }
            }
        }

        return uid;
    }
};

// Give the YUI global the same properties as an instance.
// This makes it so that the YUI global can be used like the YAHOO
// global was used prior to 3.x.  More importantly, the YUI global
// provides global metadata, so env needs to be configured.
// @TODO review

    p = YUI.prototype;

    // inheritance utilities are not available yet
    for (i in p) {
        // if (1) { // intenionally ignoring hasOwnProperty check
        YUI[i] = p[i];
        // }
    }

    // set up the environment
    YUI._init();

    // add a window load event at load time so we can capture
    // the case where it fires before dynamic loading is
    // complete.
    add(window, 'load', globalListener);

    YUI.Env.add = add;
    YUI.Env.remove = remove;

    /*
     * Subscribe to an event.  The signature differs depending on the
     * type of event you are attaching to.
     * @method on 
     * @param type {string|function|object} The type of the event.  If
     * this is a function, this is dispatched to the aop system.  If an
     * object, it is parsed for multiple subsription definitions
     * @param fn {Function} The callback
     * @param elspec {any} DOM element(s), selector string(s), and or
     * Node ref(s) to attach DOM related events to (only applies to
     * DOM events).
     * @param
     * @return the event target or a detach handle per 'chain' config
     */

})();

/**
 * The config object contains all of the configuration options for
 * the YUI instance.  This object is supplied by the implementer 
 * when instantiating a YUI instance.  Some properties have default
 * values if they are not supplied by the implementer.
 *
 * @class config
 * @static
 */

/**
 * Allows the YUI seed file to fetch the loader component and library
 * metadata to dynamically load additional dependencies.
 *
 * @property bootstrap
 * @type boolean
 * @default true
 */

/**
 * Log to the browser console if debug is on and the browser has a
 * supported console.
 *
 * @property useBrowserConsole
 * @type boolean
 * @default true
 */

/**
 * A hash of log sources that should be logged.  If specified, only log messages from these sources will be logged.
 *
 * @property logInclude
 * @type object
 */

/**
 * A hash of log sources that should be not be logged.  If specified, all sources are logged if not on this list.
 *
 * @property logExclude
 * @type object
 */

/**
 * Set to true if the yui seed file was dynamically loaded in 
 * order to bootstrap components relying on the window load event 
 * and the 'domready' custom event.
 *
 * @property injected
 * @type object
 */

/**
 * If throwFail is set, Y.fail will generate or re-throw a JS Error.  Otherwise the failure is logged.
 *
 * @property throwFail
 * @type boolean
 * @default true
 */

/**
 * The window/frame that this instance should operate in.
 *
 * @property win
 * @type Window
 * @default the window hosting YUI
 */

/**
 * The document associated with the 'win' configuration.
 *
 * @property doc
 * @type Document
 * @default the document hosting YUI
 */

/**
 * A list of modules that defines the YUI core (overrides the default).
 *
 * @property core
 * @type string[]
 */

/**
 * The default date format
 *
 * @property dateFormat
 * @type string
 */

/**
 * The default locale
 *
 * @property locale
 * @type string
 */

/**
 * The default interval when polling in milliseconds.
 *
 * @property pollInterval
 * @type int
 * @default 20
 */

/**
 * The number of dynamic nodes to insert by default before
 * automatically removing them.  This applies to script nodes
 * because remove the node will not make the evaluated script
 * unavailable.  Dynamic CSS is not auto purged, because removing
 * a linked style sheet will also remove the style definitions.
 *
 * @property purgethreshold
 * @type int
 * @default 20
 */

/**
 * The default interval when polling in milliseconds.
 *
 * @property windowResizeDelay
 * @type int
 * @default 40
 */

/**
 * Base directory for dynamic loading
 *
 * @property base
 * @type string
 */

/**
 * The secure base dir (not implemented)
 *
 * For dynamic loading.
 *
 * @property secureBase
 * @type string
 */

/**
 * The YUI combo service base dir. Ex: http://yui.yahooapis.com/combo?
 *
 * For dynamic loading.
 *
 * @property comboBase
 * @type string
 */

/**
 * The root path to prepend to module names for the combo service. Ex: 3.0.0b1/build/
 *
 * For dynamic loading.
 *
 * @property root
 * @type string
 */

/**
 * A filter to apply to result urls.  This filter will modify the default
 * path for all modules.  The default path for the YUI library is the
 * minified version of the files (e.g., event-min.js).  The filter property
 * can be a predefined filter or a custom filter.  The valid predefined 
 * filters are:
 * <dl>
 *  <dt>DEBUG</dt>
 *  <dd>Selects the debug versions of the library (e.g., event-debug.js).
 *      This option will automatically include the Logger widget</dd>
 *  <dt>RAW</dt>
 *  <dd>Selects the non-minified version of the library (e.g., event.js).</dd>
 * </dl>
 * You can also define a custom filter, which must be an object literal 
 * containing a search expression and a replace string:
 * <pre>
 *  myFilter: &#123; 
 *      'searchExp': "-min\\.js", 
 *      'replaceStr': "-debug.js"
 *  &#125;
 * </pre>
 *
 * For dynamic loading.
 *
 * @property filter
 * @type string|object
 */

/**
 * Hash of per-component filter specification.  If specified for a given component, 
 * this overrides the filter config
 *
 * For dynamic loading.
 *
 * @property filters
 * @type object
 */

/**
 * Use the YUI combo service to reduce the number of http connections 
 * required to load your dependencies.
 *
 * For dynamic loading.
 *
 * @property combine
 * @type boolean
 * @default true if 'base' is not supplied, false if it is.
 */

/**
 * A list of modules that should never be dynamically loaded
 *
 * @property ignore
 * @type string[]
 */

/**
 * A list of modules that should always be loaded when required, even if already 
 * present on the page.
 *
 * @property force
 * @type string[]
 */

/**
 * Node or id for a node that should be used as the insertion point for new nodes
 * For dynamic loading.
 *
 * @property insertBefore
 * @type string
 */

/**
 * charset for dynamic nodes
 *
 * @property charset
 * @type string
 * @deprecated use jsAttributes cssAttributes
 */

/**
 * Object literal containing attributes to add to dynamically loaded script nodes.
 *
 * @property jsAttributes
 * @type string
 */

/**
 * Object literal containing attributes to add to dynamically loaded link nodes.
 *
 * @property cssAttributes
 * @type string
 */

/**
 * Number of milliseconds before a timeout occurs when dynamically 
 * loading nodes. If not set, there is no timeout.
 *
 * @property timeout
 * @type int
 */

/**
 * Callback for the 'CSSComplete' event.  When dynamically loading YUI 
 * components with CSS, this property fires when the CSS is finished
 * loading but script loading is still ongoing.  This provides an
 * opportunity to enhance the presentation of a loading page a little
 * bit before the entire loading process is done.
 *
 * @property onCSS
 * @type function
 */

/**
 * A list of module definitions to add to the list of YUI components.  
 * These components can then be dynamically loaded side by side with
 * YUI via the use() method.See Loader.addModule for the supported
 * module metadata.
 *
 * @property modules
 * @type function
 */
 
/**
 * The loader 'path' attribute to the loader itself.  This is combined
 * with the 'base' attribute to dynamically load the loader component
 * when boostrapping with the get utility alone.
 *
 * @property loaderPath
 * @default loader/loader-min.js
 */

/**
 * 
 * Specifies whether or not YUI().use(...) will attempt to load CSS
 * resources at all.  Any truthy value will cause CSS dependencies
 * to load when fetching script.  The special value 'force' will 
 * cause CSS dependencies to be loaded even if no script is needed.
 *
 * @property fetchCSS
 * @default true
 */
YUI.add('yui-base', function(Y) {

/*
 * YUI stub
 * @module yui
 * @submodule yui-base
 */
/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

/**
 * A simple FIFO queue.  Items are added to the Queue with add(1..n items) and
 * removed using next().
 *
 * @class Queue
 * @param item* {MIXED} 0..n items to seed the queue
 */
function Queue() {
    this._init();
    this.add.apply(this, arguments);
}

Queue.prototype = {
    /**
     * Initialize the queue
     *
     * @method _init
     * @protected
     */
    _init : function () {
        /**
         * The collection of enqueued items
         *
         * @property _q
         * @type {Array}
         * @protected
         */
        this._q = [];
    },

    /**
     * Get the next item in the queue.
     *
     * @method next
     * @return {MIXED} the next item in the queue
     */
    next : function () {
        return this._q.shift();
    },

    /**
     * Add 0..n items to the end of the queue
     *
     * @method add
     * @param item* {MIXED} 0..n items
     */
    add : function () {
        Y.Array.each(Y.Array(arguments,0,true),function (fn) {
            this._q.push(fn);
        },this);

        return this;
    },

    /**
     * Returns the current number of queued items
     *
     * @method size
     * @return {Number}
     */
    size : function () {
        return this._q.length;
    }
};

Y.Queue = Queue;
/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */
(function() {
/**
 * Provides the language utilites and extensions used by the library
 * @class Lang
 * @static
 */
Y.Lang    = Y.Lang || {};

var L     = Y.Lang, 

ARRAY     = 'array',
BOOLEAN   = 'boolean',
DATE      = 'date',
ERROR     = 'error',
FUNCTION  = 'function',
NUMBER    = 'number',
NULL      = 'null',
OBJECT    = 'object',
REGEX     = 'regexp',
STRING    = 'string',
TOSTRING  = Object.prototype.toString,
UNDEFINED = 'undefined',

TYPES     = {
    'undefined'         : UNDEFINED,
    'number'            : NUMBER,
    'boolean'           : BOOLEAN,
    'string'            : STRING,
    '[object Function]' : FUNCTION,
    '[object RegExp]'   : REGEX,
    '[object Array]'    : ARRAY,
    '[object Date]'     : DATE,
    '[object Error]'    : ERROR 
},

TRIMREGEX = /^\s+|\s+$/g,
EMPTYSTRING = '';

/**
 * Determines whether or not the provided item is an array.
 * Returns false for array-like collections such as the
 * function arguments collection or HTMLElement collection
 * will return false.  You can use @see Array.test if you 
 * want to
 * @method isArray
 * @static
 * @param o The object to test
 * @return {boolean} true if o is an array
 */
L.isArray = function(o) { 
    return L.type(o) === ARRAY;
};

/**
 * Determines whether or not the provided item is a boolean
 * @method isBoolean
 * @static
 * @param o The object to test
 * @return {boolean} true if o is a boolean
 */
L.isBoolean = function(o) {
    return typeof o === BOOLEAN;
};

/**
 * Determines whether or not the provided item is a function
 * Note: Internet Explorer thinks certain functions are objects:
 *
 * var obj = document.createElement("object");
 * Y.Lang.isFunction(obj.getAttribute) // reports false in IE
 *
 * var input = document.createElement("input"); // append to body
 * Y.Lang.isFunction(input.focus) // reports false in IE
 *
 * You will have to implement additional tests if these functions
 * matter to you.
 *
 * @method isFunction
 * @static
 * @param o The object to test
 * @return {boolean} true if o is a function
 */
L.isFunction = function(o) {
    return L.type(o) === FUNCTION;
};
    
/**
 * Determines whether or not the supplied item is a date instance
 * @method isDate
 * @static
 * @param o The object to test
 * @return {boolean} true if o is a date
 */
L.isDate = function(o) {
    // return o instanceof Date;
    return L.type(o) === DATE;
};

/**
 * Determines whether or not the provided item is null
 * @method isNull
 * @static
 * @param o The object to test
 * @return {boolean} true if o is null
 */
L.isNull = function(o) {
    return o === null;
};
    
/**
 * Determines whether or not the provided item is a legal number
 * @method isNumber
 * @static
 * @param o The object to test
 * @return {boolean} true if o is a number
 */
L.isNumber = function(o) {
    return typeof o === NUMBER && isFinite(o);
};
  
/**
 * Determines whether or not the provided item is of type object
 * or function
 * @method isObject
 * @static
 * @param o The object to test
 * @param failfn {boolean} fail if the input is a function
 * @return {boolean} true if o is an object
 */  
L.isObject = function(o, failfn) {
return (o && (typeof o === OBJECT || (!failfn && L.isFunction(o)))) || false;
};
    
/**
 * Determines whether or not the provided item is a string
 * @method isString
 * @static
 * @param o The object to test
 * @return {boolean} true if o is a string
 */
L.isString = function(o) {
    return typeof o === STRING;
};
    
/**
 * Determines whether or not the provided item is undefined
 * @method isUndefined
 * @static
 * @param o The object to test
 * @return {boolean} true if o is undefined
 */
L.isUndefined = function(o) {
    return typeof o === UNDEFINED;
};

/**
 * Returns a string without any leading or trailing whitespace.  If 
 * the input is not a string, the input will be returned untouched.
 * @method trim
 * @static
 * @param s {string} the string to trim
 * @return {string} the trimmed string
 */
L.trim = function(s){
    try {
        return s.replace(TRIMREGEX, EMPTYSTRING);
    } catch(e) {
        return s;
    }
};

/**
 * A convenience method for detecting a legitimate non-null value.
 * Returns false for null/undefined/NaN, true for other values, 
 * including 0/false/''
 * @method isValue
 * @static
 * @param o The item to test
 * @return {boolean} true if it is not null/undefined/NaN || false
 */
L.isValue = function(o) {
    var t = L.type(o);
    switch (t) {
        case NUMBER:
            return isFinite(o);
        case NULL:
        case UNDEFINED:
            return false;
        default:
            return !!(t);
    }
};

/**
 * Returns a string representing the type of the item passed in.
 * @method type
 * @param o the item to test
 * @return {string} the detected type
 */
L.type = function (o) {
    return  TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? OBJECT : NULL);
};

})();

/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

(function() {

var L = Y.Lang, Native = Array.prototype,

/**
 * Adds the following array utilities to the YUI instance.  Additional
 * array helpers can be found in the collection component.
 * @class Array
 */

/** 
 * Y.Array(o) returns an array:
 * - Arrays are return unmodified unless the start position is specified.
 * - "Array-like" collections (@see Array.test) are converted to arrays
 * - For everything else, a new array is created with the input as the sole item
 * - The start position is used if the input is or is like an array to return
 *   a subset of the collection.
 *
 *   @TODO this will not automatically convert elements that are also collections
 *   such as forms and selects.  Passing true as the third param will
 *   force a conversion.
 *
 * @method ()
 * @static
 *   @param o the item to arrayify
 *   @param i {int} if an array or array-like, this is the start index
 *   @param al {boolean} if true, it forces the array-like fork.  This
 *   can be used to avoid multiple array.test calls.
 *   @return {Array} the resulting array
 */
YArray = function(o, startIdx, al) {
    var t = (al) ? 2 : Y.Array.test(o), i, l, a;

    // switch (t) {
    //     case 1:
    //         // return (startIdx) ? o.slice(startIdx) : o;
    //     case 2:
    //         return Native.slice.call(o, startIdx || 0);
    //     default:
    //         return [o];
    // }

    if (t) {
        try {
            return Native.slice.call(o, startIdx || 0);
        // IE errors when trying to slice element collections
        } catch(e) {
            a=[];
            for (i=0, l=o.length; i<l; i=i+1) {
                a.push(o[i]);
            }
            return a;
        }
    } else {
        return [o];
    }

};

Y.Array = YArray;

/** 
 * Evaluates the input to determine if it is an array, array-like, or 
 * something else.  This is used to handle the arguments collection 
 * available within functions, and HTMLElement collections
 *
 * @method test
 * @static
 *
 * @todo current implementation (intenionally) will not implicitly 
 * handle html elements that are array-like (forms, selects, etc).  
 *
 * @return {int} a number indicating the results:
 * 0: Not an array or an array-like collection
 * 1: A real array. 
 * 2: array-like collection.
 */
YArray.test = function(o) {
    var r = 0;
    if (L.isObject(o)) {
        if (L.isArray(o)) {
            r = 1; 
        } else {
            try {
                // indexed, but no tagName (element) or alert (window)
                if ("length" in o && !("tagName" in o) && !("alert" in o) && 
                    (!Y.Lang.isFunction(o.size) || o.size() > 1)) {
                    r = 2;
                }
                    
            } catch(e) {}
        }
    }
    return r;
};

/**
 * Executes the supplied function on each item in the array.
 * @method each
 * @param a {Array} the array to iterate
 * @param f {Function} the function to execute on each item.  The 
 * function receives three arguments: the value, the index, the full array.
 * @param o Optional context object
 * @static
 * @return {YUI} the YUI instance
 */
YArray.each = (Native.forEach) ?
    function (a, f, o) { 
        Native.forEach.call(a || [], f, o || Y);
        return Y;
    } :
    function (a, f, o) { 
        var l = (a && a.length) || 0, i;
        for (i = 0; i < l; i=i+1) {
            f.call(o || Y, a[i], i, a);
        }
        return Y;
    };

/**
 * Returns an object using the first array as keys, and
 * the second as values.  If the second array is not
 * provided the value is set to true for each.
 * @method hash
 * @static
 * @param k {Array} keyset
 * @param v {Array} optional valueset
 * @return {object} the hash
 */
YArray.hash = function(k, v) {
    var o = {}, l = k.length, vl = v && v.length, i;
    for (i=0; i<l; i=i+1) {
        o[k[i]] = (vl && vl > i) ? v[i] : true;
    }

    return o;
};

/**
 * Returns the index of the first item in the array
 * that contains the specified value, -1 if the
 * value isn't found.
 * @method indexOf
 * @static
 * @param a {Array} the array to search
 * @param val the value to search for
 * @return {int} the index of the item that contains the value or -1
 */
YArray.indexOf = (Native.indexOf) ?
    function(a, val) {
        return Native.indexOf.call(a, val);
    } :
    function(a, val) {
        for (var i=0; i<a.length; i=i+1) {
            if (a[i] === val) {
                return i;
            }
        }

        return -1;
    };

/**
 * Numeric sort convenience function.
 * Y.ArrayAssert.itemsAreEqual([1, 2, 3], [3, 1, 2].sort(Y.Array.numericSort));
 * @method numericSort
 */
YArray.numericSort = function(a, b) { 
    return (a - b); 
};

/**
 * Executes the supplied function on each item in the array.
 * Returning true from the processing function will stop the 
 * processing of the remaining
 * items.
 * @method some
 * @param a {Array} the array to iterate
 * @param f {Function} the function to execute on each item. The function 
 * receives three arguments: the value, the index, the full array.
 * @param o Optional context object
 * @static
 * @return {boolean} true if the function returns true on
 * any of the items in the array
 */
 YArray.some = (Native.some) ?
    function (a, f, o) { 
        return Native.some.call(a, f, o);
    } :
    function (a, f, o) {
        var l = a.length, i;
        for (i=0; i<l; i=i+1) {
            if (f.call(o, a[i], i, a)) {
                return true;
            }
        }
        return false;
    };

})();


/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

(function() {

var L = Y.Lang, 
DELIMITER = '__',
// FROZEN = {
//     'prototype': 1,
//     '_yuid': 1
// },

/*
 * IE will not enumerate native functions in a derived object even if the
 * function was overridden.  This is a workaround for specific functions 
 * we care about on the Object prototype. 
 * @property _iefix
 * @for YUI
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @private
 */
_iefix = function(r, s) {
    var fn = s.toString;
    if (L.isFunction(fn) && fn != Object.prototype.toString) {
        r.toString = fn;
    }
};


/**
 * Returns a new object containing all of the properties of
 * all the supplied objects.  The properties from later objects
 * will overwrite those in earlier objects.  Passing in a
 * single object will create a shallow copy of it.  For a deep
 * copy, use clone.
 * @method merge
 * @for YUI
 * @param arguments {Object*} the objects to merge
 * @return {object} the new merged object
 */
Y.merge = function() {
    var a = arguments, o = {}, i, l = a.length;
    for (i=0; i<l; i=i+1) {
        Y.mix(o, a[i], true);
    }
    return o;
};
   
/**
 * Applies the supplier's properties to the receiver.  By default
 * all prototype and static propertes on the supplier are applied
 * to the corresponding spot on the receiver.  By default all
 * properties are applied, and a property that is already on the
 * reciever will not be overwritten.  The default behavior can
 * be modified by supplying the appropriate parameters.
 *
 * @TODO add constants for the modes
 *
 * @method mix
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @param ov {boolean} if true, properties already on the receiver
 * will be overwritten if found on the supplier.
 * @param wl {string[]} a whitelist.  If supplied, only properties in 
 * this list will be applied to the receiver.
 * @param {int} mode what should be copies, and to where
 *        default(0): object to object
 *        1: prototype to prototype (old augment)
 *        2: prototype to prototype and object props (new augment)
 *        3: prototype to object
 *        4: object to prototype
 * @param merge {boolean} merge objects instead of overwriting/ignoring
 * Used by Y.aggregate
 * @return {object} the augmented object
 */
Y.mix = function(r, s, ov, wl, mode, merge) {

    if (!s||!r) {
        return r || Y;
    }

    if (mode) {
        switch (mode) {
            case 1: // proto to proto
                return Y.mix(r.prototype, s.prototype, ov, wl, 0, merge);
            case 2: // object to object and proto to proto
                Y.mix(r.prototype, s.prototype, ov, wl, 0, merge);
                break; // pass through 
            case 3: // proto to static
                return Y.mix(r, s.prototype, ov, wl, 0, merge);
            case 4: // static to proto
                return Y.mix(r.prototype, s, ov, wl, 0, merge);
            default:  // object to object is what happens below
        }
    }

    // Maybe don't even need this wl && wl.length check anymore??
    var arr = merge && L.isArray(r), i, l, p;

    if (wl && wl.length) {
        for (i = 0, l = wl.length; i < l; ++i) {
            p = wl[i];
            if (p in s) {
                if (merge && L.isObject(r[p], true)) {
                    Y.mix(r[p], s[p]);
                } else if (!arr && (ov || !(p in r))) {
                    r[p] = s[p];
                } else if (arr) {
                    r.push(s[p]);
                }
            }
        }
    } else {
        for (i in s) { 
            // if (s.hasOwnProperty(i) && !(i in FROZEN)) {
                // check white list if it was supplied
                // if the receiver has this property, it is an object,
                // and merge is specified, merge the two objects.
                if (merge && L.isObject(r[i], true)) {
                    Y.mix(r[i], s[i]); // recursive
                // otherwise apply the property only if overwrite
                // is specified or the receiver doesn't have one.
                } else if (!arr && (ov || !(i in r))) {
                    r[i] = s[i];
                // if merge is specified and the receiver is an array,
                // append the array item
                } else if (arr) {
                    r.push(s[i]);
                }
            // }
        }
    
        if (Y.UA.ie) {
            _iefix(r, s);
        }
    }

    return r;
};

/**
 * Returns a wrapper for a function which caches the
 * return value of that function, keyed off of the combined 
 * argument values.
 * @function cached
 * @param source {function} the function to memoize
 * @param cache an optional cache seed
 * @param refetch if supplied, this value is tested against the cached
 * value.  If the values are equal, the wrapped function is executed again.
 * @return {Function} the wrapped function
 */
Y.cached = function(source, cache, refetch){
    cache = cache || {};

    return function(arg1, arg2) {

        var k = (arg2) ? Array.prototype.join.call(arguments, DELIMITER) : arg1,
            v = cache[k];

        if (!(k in cache) || (refetch && cache[k] == refetch)) {
            cache[k] = source.apply(source, arguments);
        }

        return cache[k];
    };

};

})();

/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */
(function() {

/**
 * Adds the following Object utilities to the YUI instance
 * @class Object
 */

/**
 * Y.Object(o) returns a new object based upon the supplied object.  
 * @TODO Use native Object.create() when available
 * @method ()
 * @static
 * @param o the supplier object
 * @return {Object} the new object
 */
Y.Object = function(o) {
    var F = function() {};
    F.prototype = o;
    return new F();
}; 

var O = Y.Object,

UNDEFINED = undefined,

/**
 * Extracts the keys, values, or size from an object
 * 
 * @method _extract
 * @param o the object
 * @param what what to extract (0: keys, 1: values, 2: size)
 * @return {boolean|Array} the extracted info
 * @static
 * @private
 */
_extract = function(o, what) {
    var count = (what === 2), out = (count) ? 0 : [], i;

    for (i in o) {
        if (count) {
            out++;
        } else {
            if (o.hasOwnProperty(i)) {
                out.push((what) ? o[i] : i);
            }
        }
    }

    return out;
};

/**
 * Returns an array containing the object's keys
 * @TODO use native Object.keys() if available
 * @method keys
 * @static
 * @param o an object
 * @return {string[]} the keys
 */
O.keys = function(o) {
    return _extract(o);
};

/**
 * Returns an array containing the object's values
 * @TODO use native Object.values() if available
 * @method values
 * @static
 * @param o an object
 * @return {Array} the values
 */
O.values = function(o) {
    return _extract(o, 1);
};

/**
 * Returns the size of an object
 * @TODO use native Object.size() if available
 * @method size
 * @static
 * @param o an object
 * @return {int} the size
 */
O.size = function(o) {
    return _extract(o, 2);
};

/**
 * Returns true if the object contains a given key
 * @method hasKey
 * @static
 * @param o an object
 * @param k the key to query
 * @return {boolean} true if the object contains the key
 */
O.hasKey = function(o, k) {
    // return (o.hasOwnProperty(k));
    return (k in o);
};

/**
 * Returns true if the object contains a given value
 * @method hasValue
 * @static
 * @param o an object
 * @param v the value to query
 * @return {boolean} true if the object contains the value
 */
O.hasValue = function(o, v) {
    return (Y.Array.indexOf(O.values(o), v) > -1);
};

/**
 * Determines whether or not the property was added
 * to the object instance.  Returns false if the property is not present
 * in the object, or was inherited from the prototype.
 *
 * @deprecated Safari 1.x support has been removed, so this is simply a 
 * wrapper for the native implementation.  Use the native implementation
 * directly instead.
 *
 * @TODO Remove in B1
 *
 * @method owns
 * @static
 * @param o {any} The object being testing
 * @param p {string} the property to look for
 * @return {boolean} true if the object has the property on the instance
 */
O.owns = function(o, k) {
    return (o.hasOwnProperty(k));
};

/**
 * Executes a function on each item. The function
 * receives the value, the key, and the object
 * as paramters (in that order).
 * @method each
 * @static
 * @param o the object to iterate
 * @param f {Function} the function to execute on each item. The function 
 * receives three arguments: the value, the the key, the full object.
 * @param c the execution context
 * @param proto {boolean} include proto
 * @return {YUI} the YUI instance
 */
O.each = function (o, f, c, proto) {
    var s = c || Y, i;

    for (i in o) {
        if (proto || o.hasOwnProperty(i)) {
            f.call(s, o[i], i, o);
        }
    }
    return Y;
};

/*
 * Executes a function on each item, but halts if the
 * function returns true.  The function
 * receives the value, the key, and the object
 * as paramters (in that order).
 * @method some
 * @static
 * @param o the object to iterate
 * @param f {Function} the function to execute on each item. The function 
 * receives three arguments: the value, the the key, the full object.
 * @param c the execution context
 * @param proto {boolean} include proto
 * @return {boolean} true if any execution of the function returns true, false otherwise
 */
// O.some = function (o, f, c, proto) {
//     var s = c || Y, i;
// 
//     for (i in o) {
//         if (proto || o.hasOwnProperty(i)) {
//             if (f.call(s, o[i], i, o)) {
//                 return true;
//             }
//         }
//     }
//     return false;
// };

/**
 * Retrieves the sub value at the provided path,
 * from the value object provided.
 *
 * @method getValue
 * @param o The object from which to extract the property value
 * @param path {Array} A path array, specifying the object traversal path
 * from which to obtain the sub value.
 * @return {Any} The value stored in the path, undefined if not found.
 * Returns the source object if an empty path is provided.
 */
O.getValue = function (o, path) {
    var p=Y.Array(path), l=p.length, i;

    for (i=0; o !== UNDEFINED && i < l; i=i+1) {
        o = o[p[i]];
    }

    return o;
};

/**
 * Sets the sub-attribute value at the provided path on the 
 * value object.  Returns the modified value object, or 
 * undefined if the path is invalid.
 *
 * @method setValue
 * @param o             The object on which to set the sub value.
 * @param path {Array}  A path array, specifying the object traversal path
 *                      at which to set the sub value.
 * @param val {Any}     The new value for the sub-attribute.
 * @return {Object}     The modified object, with the new sub value set, or 
 *                      undefined, if the path was invalid.
 */
O.setValue = function(o, path, val) {

    var p=Y.Array(path), leafIdx=p.length-1, i, ref=o;

    if (leafIdx >= 0) {
        for (i=0; ref !== UNDEFINED && i < leafIdx; i=i+1) {
            ref = ref[p[i]];
        }

        if (ref !== UNDEFINED) {
            ref[p[i]] = val;
        } else {
            return UNDEFINED;
        }
    }

    return o;
};


})();

/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

/**
 * YUI user agent detection.
 * Do not fork for a browser if it can be avoided.  Use feature detection when
 * you can.  Use the user agent as a last resort.  UA stores a version
 * number for the browser engine, 0 otherwise.  This value may or may not map
 * to the version number of the browser using the engine.  The value is 
 * presented as a float so that it can easily be used for boolean evaluation 
 * as well as for looking for a particular range of versions.  Because of this, 
 * some of the granularity of the version info may be lost (e.g., Gecko 1.8.0.9 
 * reports 1.8).
 * @class UA
 * @static
 */
Y.UA = function() {

    var numberfy = function(s) {
            var c = 0;
            return parseFloat(s.replace(/\./g, function() {
                return (c++ == 1) ? '' : '.';
            }));
        },
    
        nav = navigator,

        o = {

        /**
         * Internet Explorer version number or 0.  Example: 6
         * @property ie
         * @type float
         * @static
         */
        ie: 0,

        /**
         * Opera version number or 0.  Example: 9.2
         * @property opera
         * @type float
         * @static
         */
        opera: 0,

        /**
         * Gecko engine revision number.  Will evaluate to 1 if Gecko 
         * is detected but the revision could not be found. Other browsers
         * will be 0.  Example: 1.8
         * <pre>
         * Firefox 1.0.0.4: 1.7.8   <-- Reports 1.7
         * Firefox 1.5.0.9: 1.8.0.9 <-- Reports 1.8
         * Firefox 2.0.0.3: 1.8.1.3 <-- Reports 1.8
         * Firefox 3 alpha: 1.9a4   <-- Reports 1.9
         * </pre>
         * @property gecko
         * @type float
         * @static
         */
        gecko: 0,

        /**
         * AppleWebKit version.  KHTML browsers that are not WebKit browsers 
         * will evaluate to 1, other browsers 0.  Example: 418.9
         * <pre>
         * Safari 1.3.2 (312.6): 312.8.1 <-- Reports 312.8 -- currently the 
         *                                   latest available for Mac OSX 10.3.
         * Safari 2.0.2:         416     <-- hasOwnProperty introduced
         * Safari 2.0.4:         418     <-- preventDefault fixed
         * Safari 2.0.4 (419.3): 418.9.1 <-- One version of Safari may run
         *                                   different versions of webkit
         * Safari 2.0.4 (419.3): 419     <-- Tiger installations that have been
         *                                   updated, but not updated
         *                                   to the latest patch.
         * Webkit 212 nightly:   522+    <-- Safari 3.0 precursor (with native SVG
         *                                   and many major issues fixed).
         * Safari 3.0.4 (523.12) 523.12  <-- First Tiger release - automatic update
         *                                   from 2.x via the 10.4.11 OS patch
         * Webkit nightly 1/2008:525+    <-- Supports DOMContentLoaded event.
         *                                   yahoo.com user agent hack removed.
         * </pre>
         * http://en.wikipedia.org/wiki/Safari_(web_browser)#Version_history
         * @property webkit
         * @type float
         * @static
         */
        webkit: 0,

        /**
         * The mobile property will be set to a string containing any relevant
         * user agent information when a modern mobile browser is detected.
         * Currently limited to Safari on the iPhone/iPod Touch, Nokia N-series
         * devices with the WebKit-based browser, and Opera Mini.  
         * @property mobile 
         * @type string
         * @static
         */
        mobile: null,

        /**
         * Adobe AIR version number or 0.  Only populated if webkit is detected.
         * Example: 1.0
         * @property air
         * @type float
         */
        air: 0,

        /**
         * Google Caja version number or 0.
         * @property caja
         * @type float
         */
        caja: nav.cajaVersion,

        /**
         * Set to true if the page appears to be in SSL
         * @property secure
         * @type boolean
         * @static
         */
        secure: false,

        /**
         * The operating system.  Currently only detecting windows or macintosh
         * @property os
         * @type string
         * @static
         */
        os: null
        
    },

    ua = nav && nav.userAgent, 

    loc = Y.config.win.location,

    href = loc && loc.href,
    
    m;

    o.secure = href && (href.toLowerCase().indexOf("https") === 0);

    if (ua) {

        if ((/windows|win32/i).test(ua)) {
            o.os = 'windows';
        } else if ((/macintosh/i).test(ua)) {
            o.os = 'macintosh';
        }

        // Modern KHTML browsers should qualify as Safari X-Grade
        if ((/KHTML/).test(ua)) {
            o.webkit=1;
        }
        // Modern WebKit browsers are at least X-Grade
        m=ua.match(/AppleWebKit\/([^\s]*)/);
        if (m&&m[1]) {
            o.webkit=numberfy(m[1]);

            // Mobile browser check
            if (/ Mobile\//.test(ua)) {
                o.mobile = "Apple"; // iPhone or iPod Touch
            } else {
                m=ua.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);
                if (m) {
                    o.mobile = m[0]; // Nokia N-series, Android, webOS, ex: NokiaN95
                }
            }

            m=ua.match(/AdobeAIR\/([^\s]*)/);
            if (m) {
                o.air = m[0]; // Adobe AIR 1.0 or better
            }

        }

        if (!o.webkit) { // not webkit
            // @todo check Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1316; fi; U; ssr)
            m=ua.match(/Opera[\s\/]([^\s]*)/);
            if (m&&m[1]) {
                o.opera=numberfy(m[1]);
                m=ua.match(/Opera Mini[^;]*/);
                if (m) {
                    o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
                }
            } else { // not opera or webkit
                m=ua.match(/MSIE\s([^;]*)/);
                if (m&&m[1]) {
                    o.ie=numberfy(m[1]);
                } else { // not opera, webkit, or ie
                    m=ua.match(/Gecko\/([^\s]*)/);
                    if (m) {
                        o.gecko=1; // Gecko detected, look for revision
                        m=ua.match(/rv:([^\s\)]*)/);
                        if (m&&m[1]) {
                            o.gecko=numberfy(m[1]);
                        }
                    }
                }
            }
        }
    }
    
    return o;
}();
/**
 * The YUI module contains the components required for building the YUI seed file.
 * This includes the script loading mechanism, a simple queue, and the core utilities for the library.
 * @module yui
 * @submodule yui-base
 */

(function() {

    var min = ['yui-base'], core, C = Y.config, mods = YUI.Env.mods,
        extras, i;

    // apply the minimal required functionality
    Y.use.apply(Y, min);


    if (C.core) {
        core = C.core;
    } else {
        core = [];
        extras = ['get', 'loader', 'yui-log', 'yui-later'];

        for (i=0; i<extras.length; i++) {
            if (mods[extras[i]]) {
                core.push(extras[i]);
            }
        }
    }

    Y.use.apply(Y, core);
     
})();



}, '3.0.0' );
YUI.add('get', function(Y) {

(function() {

/**
 * Provides a mechanism to fetch remote resources and
 * insert them into a document.
 * @module yui
 * @submodule get
 */

var ua         = Y.UA, 
    L          = Y.Lang,
    // PREFIX     = Y.guid(),
    TYPE_JS    = "text/javascript",
    TYPE_CSS   = "text/css",
    STYLESHEET = "stylesheet";

/**
 * Fetches and inserts one or more script or link nodes into the document 
 * @class Get
 * @static
 */
Y.Get = function() {

    /**
     * hash of queues to manage multiple requests
     * @property queues
     * @private
     */
    var queues={}, 
        
    /**
     * queue index used to generate transaction ids
     * @property qidx
     * @type int
     * @private
     */
        qidx=0, 
        
    /**
     * interal property used to prevent multiple simultaneous purge 
     * processes
     * @property purging
     * @type boolean
     * @private
     */
        purging=false,

    
    /** 
     * Generates an HTML element, this is not appended to a document
     * @method _node
     * @param type {string} the type of element
     * @param attr {string} the attributes
     * @param win {Window} optional window to create the element in
     * @return {HTMLElement} the generated node
     * @private
     */
    _node = function(type, attr, win) {
        var w = win || Y.config.win, d=w.document, n=d.createElement(type),
            i;

        for (i in attr) {
            if (attr[i] && attr.hasOwnProperty(i)) {
                n.setAttribute(i, attr[i]);
            }
        }

        return n;
    },

    /**
     * Generates a link node
     * @method _linkNode
     * @param url {string} the url for the css file
     * @param win {Window} optional window to create the node in
     * @param attributes optional attributes collection to apply to the new node
     * @return {HTMLElement} the generated node
     * @private
     */
    _linkNode = function(url, win, attributes) {
        var o = {
            id:   Y.guid(),
            type: TYPE_CSS,
            rel:  STYLESHEET,
            href: url
        };
        if (attributes) {
            Y.mix(o, attributes);
        }
        return _node("link", o, win);
    },

    /**
     * Generates a script node
     * @method _scriptNode
     * @param url {string} the url for the script file
     * @param win {Window} optional window to create the node in
     * @param attributes optional attributes collection to apply to the new node
     * @return {HTMLElement} the generated node
     * @private
     */
    _scriptNode = function(url, win, attributes) {
        var o = {
            id:   Y.guid(),
            type: TYPE_JS,
            src:  url
        };

        if (attributes) {
            Y.mix(o, attributes);
        }

        return _node("script", o, win);
    },

    /**
     * Removes the nodes for the specified queue
     * @method _purge
     * @private
     */
    _purge = function(tId) {
        var q=queues[tId], n, l, d, h, s, i, node, attr;
        if (q) {
            n = q.nodes; 
            l = n.length;
            d = q.win.document;
            h = d.getElementsByTagName("head")[0];

            if (q.insertBefore) {
                s = _get(q.insertBefore, tId);
                if (s) {
                    h = s.parentNode;
                }
            }

            for (i=0; i<l; i=i+1) {
                node = n[i];
                if (node.clearAttributes) {
                    node.clearAttributes();
                } else {
                    // This is a hostile delete
                    // operation attempting to improve
                    // memory performance.  As such, the
                    // hasOwnProperty check is intentionally
                    // ommitted.
                    for (attr in node) {
                        delete node[attr];
                    }
                }

                h.removeChild(node);
            }
        }
        q.nodes = [];
    },

    /**
     * Returns the data payload for callback functions
     * @method _returnData
     * @private
     */
    _returnData = function(q, msg, result) {
        return {
                tId: q.tId,
                win: q.win,
                data: q.data,
                nodes: q.nodes,
                msg: msg,
                statusText: result,
                purge: function() {
                    _purge(this.tId);
                }
            };
    },

    /**
     * The transaction is finished
     * @method _end
     * @param id {string} the id of the request
     * @private
     */
    _end = function(id, msg, result) {
        var q = queues[id], sc;
        if (q && q.onEnd) {
            sc = q.context || q;
            q.onEnd.call(sc, _returnData(q, msg, result));
        }
    },

    /*
     * The request failed, execute fail handler with whatever
     * was accomplished.  There isn't a failure case at the
     * moment unless you count aborted transactions
     * @method _fail
     * @param id {string} the id of the request
     * @private
     */
    _fail = function(id, msg) {


        var q = queues[id], sc;
        if (q.timer) {
            // q.timer.cancel();
            clearTimeout(q.timer);
        }

        // execute failure callback
        if (q.onFailure) {
            sc = q.context || q;
            q.onFailure.call(sc, _returnData(q, msg));
        }

        _end(id, msg, 'failure');
    },

    _get = function(nId, tId) {
        var q = queues[tId],
            n = (L.isString(nId)) ? q.win.document.getElementById(nId) : nId;
        if (!n) {
            _fail(tId, "target node not found: " + nId);
        }

        return n;
    },

    /**
     * The request is complete, so executing the requester's callback
     * @method _finish
     * @param id {string} the id of the request
     * @private
     */
    _finish = function(id) {
        var q = queues[id], msg, sc;
        if (q.timer) {
            // q.timer.cancel();
            clearTimeout(q.timer);
        }
        q.finished = true;

        if (q.aborted) {
            msg = "transaction " + id + " was aborted";
            _fail(id, msg);
            return;
        }

        // execute success callback
        if (q.onSuccess) {
            sc = q.context || q;
            q.onSuccess.call(sc, _returnData(q));
        }

        _end(id, msg, 'OK');
    },

    /**
     * Timeout detected
     * @method _timeout
     * @param id {string} the id of the request
     * @private
     */
    _timeout = function(id) {
        var q = queues[id], sc;
        if (q.onTimeout) {
            sc = q.context || q;
            q.onTimeout.call(sc, _returnData(q));
        }

        _end(id, 'timeout', 'timeout');
    },
    

    /**
     * Loads the next item for a given request
     * @method _next
     * @param id {string} the id of the request
     * @param loaded {string} the url that was just loaded, if any
     * @private
     */
    _next = function(id, loaded) {


        var q = queues[id], msg, w, d, h, n, url, s;

        if (q.timer) {
            // q.timer.cancel();
            clearTimeout(q.timer);
        }

        if (q.aborted) {
            msg = "transaction " + id + " was aborted";
            _fail(id, msg);
            return;
        }

        if (loaded) {
            q.url.shift(); 
            if (q.varName) {
                q.varName.shift(); 
            }
        } else {
            // This is the first pass: make sure the url is an array
            q.url = (L.isString(q.url)) ? [q.url] : q.url;
            if (q.varName) {
                q.varName = (L.isString(q.varName)) ? [q.varName] : q.varName;
            }
        }

        w = q.win; 
        d = w.document; 
        h = d.getElementsByTagName("head")[0];

        if (q.url.length === 0) {
            _finish(id);
            return;
        } 

        url = q.url[0];

        // if the url is undefined, this is probably a trailing comma problem in IE
        if (!url) {
            q.url.shift(); 
            return _next(id);
        }


        if (q.timeout) {
            // q.timer = L.later(q.timeout, q, _timeout, id);
            q.timer = setTimeout(function() { 
                _timeout(id);
            }, q.timeout);
        }

        if (q.type === "script") {
            n = _scriptNode(url, w, q.attributes);
        } else {
            n = _linkNode(url, w, q.attributes);
        }

        // track this node's load progress
        _track(q.type, n, id, url, w, q.url.length);

        // add the node to the queue so we can return it to the user supplied callback
        q.nodes.push(n);

        // add it to the head or insert it before 'insertBefore'
        if (q.insertBefore) {
            s = _get(q.insertBefore, id);
            if (s) {
                s.parentNode.insertBefore(n, s);
            }
        } else {
            h.appendChild(n);
        }
        

        // FireFox does not support the onload event for link nodes, so there is
        // no way to make the css requests synchronous. This means that the css 
        // rules in multiple files could be applied out of order in this browser
        // if a later request returns before an earlier one.  Safari too.
        if ((ua.webkit || ua.gecko) && q.type === "css") {
            _next(id, url);
        }
    },

    /**
     * Removes processed queues and corresponding nodes
     * @method _autoPurge
     * @private
     */
    _autoPurge = function() {

        if (purging) {
            return;
        }

        purging = true;

        var i, q;

        for (i in queues) {
            if (queues.hasOwnProperty(i)) {
                q = queues[i];
                if (q.autopurge && q.finished) {
                    _purge(q.tId);
                    delete queues[i];
                }
            }
        }

        purging = false;
    },

    /**
     * Saves the state for the request and begins loading
     * the requested urls
     * @method queue
     * @param type {string} the type of node to insert
     * @param url {string} the url to load
     * @param opts the hash of options for this request
     * @private
     */
    _queue = function(type, url, opts) {

        opts = opts || {};

        var id = "q" + (qidx++), q,
            thresh = opts.purgethreshold || Y.Get.PURGE_THRESH;

        if (qidx % thresh === 0) {
            _autoPurge();
        }

        queues[id] = Y.merge(opts, {
            tId: id,
            type: type,
            url: url,
            finished: false,
            nodes: []
        });

        q           = queues[id];
        q.win       = q.win || Y.config.win;
        q.context   = q.context || q;
        q.autopurge = ("autopurge" in q) ? q.autopurge : 
                      (type === "script") ? true : false;

        if (opts.charset) {
            q.attributes = q.attributes || {};
            q.attributes.charset = opts.charset;
        }

        // L.later(0, q, _next, id);
        setTimeout(function() {
            _next(id);
        }, 0);

        return {
            tId: id
        };
    },

    /**
     * Detects when a node has been loaded.  In the case of
     * script nodes, this does not guarantee that contained
     * script is ready to use.
     * @method _track
     * @param type {string} the type of node to track
     * @param n {HTMLElement} the node to track
     * @param id {string} the id of the request
     * @param url {string} the url that is being loaded
     * @param win {Window} the targeted window
     * @param qlength the number of remaining items in the queue,
     * including this one
     * @param trackfn {Function} function to execute when finished
     * the default is _next
     * @private
     */
    _track = function(type, n, id, url, win, qlength, trackfn) {
        var f = trackfn || _next;

        // IE supports the readystatechange event for script and css nodes
        // Opera only for script nodes.  Opera support onload for script
        // nodes, but this doesn't fire when there is a load failure.
        // The onreadystatechange appears to be a better way to respond
        // to both success and failure.
        if (ua.ie) {
            n.onreadystatechange = function() {
                var rs = this.readyState;
                if ("loaded" === rs || "complete" === rs) {
                    n.onreadystatechange = null;
                    f(id, url);
                }
            };

        // webkit prior to 3.x is no longer supported
        } else if (ua.webkit) {

            if (type === "script") {
                // Safari 3.x supports the load event for script nodes (DOM2)
                n.addEventListener("load", function() {
                    f(id, url);
                });
            } 

        // FireFox and Opera support onload (but not DOM2 in FF) handlers for
        // script nodes.  Opera, but not FF, supports the onload event for link
        // nodes.
        } else { 

            n.onload = function() {
                f(id, url);
            };

            n.onerror = function(e) {
                _fail(id, e + ": " + url);
            };
        }
    };

    return {

        /**
         * The number of request required before an automatic purge.
         * Can be configured via the 'purgethreshold' config
         * property PURGE_THRESH
         * @static
         * @type int
         * @default 20
         * @private
         */
        PURGE_THRESH: 20,

        /**
         * Called by the the helper for detecting script load in Safari
         * @method _finalize
         * @static
         * @param id {string} the transaction id
         * @private
         */
        _finalize: function(id) {
            // L.later(0, null, _finish, id);
            setTimeout(function() {
                _finish(id);
            }, 0);
        },

        /**
         * Abort a transaction
         * @method abort
         * @static
         * @param o {string|object} Either the tId or the object returned from
         * script() or css()
         */
        abort: function(o) {
            var id = (L.isString(o)) ? o : o.tId,
                q = queues[id];
            if (q) {
                q.aborted = true;
            }
        }, 

        /**
         * Fetches and inserts one or more script nodes into the head
         * of the current document or the document in a specified window.
         *
         * @method script
         * @static
         * @param url {string|string[]} the url or urls to the script(s)
         * @param opts {object} Options: 
         * <dl>
         * <dt>onSuccess</dt>
         * <dd>
         * callback to execute when the script(s) are finished loading
         * The callback receives an object back with the following
         * data:
         * <dl>
         * <dt>win</dt>
         * <dd>the window the script(s) were inserted into</dd>
         * <dt>data</dt>
         * <dd>the data object passed in when the request was made</dd>
         * <dt>nodes</dt>
         * <dd>An array containing references to the nodes that were
         * inserted</dd>
         * <dt>purge</dt>
         * <dd>A function that, when executed, will remove the nodes
         * that were inserted</dd>
         * <dt>
         * </dl>
         * </dd>
         * <dt>onTimeout</dt>
         * <dd>
         * callback to execute when a timeout occurs.
         * The callback receives an object back with the following
         * data:
         * <dl>
         * <dt>win</dt>
         * <dd>the window the script(s) were inserted into</dd>
         * <dt>data</dt>
         * <dd>the data object passed in when the request was made</dd>
         * <dt>nodes</dt>
         * <dd>An array containing references to the nodes that were
         * inserted</dd>
         * <dt>purge</dt>
         * <dd>A function that, when executed, will remove the nodes
         * that were inserted</dd>
         * <dt>
         * </dl>
         * </dd>
         * <dt>onEnd</dt>
         * <dd>a function that executes when the transaction finishes, regardless of the exit path</dd>
         * <dt>onFailure</dt>
         * <dd>
         * callback to execute when the script load operation fails
         * The callback receives an object back with the following
         * data:
         * <dl>
         * <dt>win</dt>
         * <dd>the window the script(s) were inserted into</dd>
         * <dt>data</dt>
         * <dd>the data object passed in when the request was made</dd>
         * <dt>nodes</dt>
         * <dd>An array containing references to the nodes that were
         * inserted successfully</dd>
         * <dt>purge</dt>
         * <dd>A function that, when executed, will remove any nodes
         * that were inserted</dd>
         * <dt>
         * </dl>
         * </dd>
         * <dt>context</dt>
         * <dd>the execution context for the callbacks</dd>
         * <dt>win</dt>
         * <dd>a window other than the one the utility occupies</dd>
         * <dt>autopurge</dt>
         * <dd>
         * setting to true will let the utilities cleanup routine purge 
         * the script once loaded
         * </dd>
         * <dt>purgethreshold</dt>
         * <dd>
         * The number of transaction before autopurge should be initiated
         * </dd>
         * <dt>data</dt>
         * <dd>
         * data that is supplied to the callback when the script(s) are
         * loaded.
         * </dd>
         * <dt>insertBefore</dt>
         * <dd>node or node id that will become the new node's nextSibling</dd>
         * </dl>
         * <dt>charset</dt>
         * <dd>Node charset, default utf-8 (deprecated, use the attributes config)</dd>
         * <dt>attributes</dt>
         * <dd>An object literal containing additional attributes to add to the link tags</dd>
         * <dt>timeout</dt>
         * <dd>Number of milliseconds to wait before aborting and firing the timeout event</dd>
         * <pre>
         * &nbsp;&nbsp;Y.Get.script(
         * &nbsp;&nbsp;["http://yui.yahooapis.com/2.5.2/build/yahoo/yahoo-min.js",
         * &nbsp;&nbsp;&nbsp;"http://yui.yahooapis.com/2.5.2/build/event/event-min.js"], &#123;
         * &nbsp;&nbsp;&nbsp;&nbsp;onSuccess: function(o) &#123;
         * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.log("won't cause error because Y is the context");
         * &nbsp;&nbsp;&nbsp;&nbsp;&#125;,
         * &nbsp;&nbsp;&nbsp;&nbsp;onFailure: function(o) &#123;
         * &nbsp;&nbsp;&nbsp;&nbsp;&#125;,
         * &nbsp;&nbsp;&nbsp;&nbsp;onTimeout: function(o) &#123;
         * &nbsp;&nbsp;&nbsp;&nbsp;&#125;,
         * &nbsp;&nbsp;&nbsp;&nbsp;data: "foo",
         * &nbsp;&nbsp;&nbsp;&nbsp;timeout: 10000, // 10 second timeout
         * &nbsp;&nbsp;&nbsp;&nbsp;context: Y, // make the YUI instance
         * &nbsp;&nbsp;&nbsp;&nbsp;// win: otherframe // target another window/frame
         * &nbsp;&nbsp;&nbsp;&nbsp;autopurge: true // allow the utility to choose when to remove the nodes
         * &nbsp;&nbsp;&nbsp;&nbsp;purgetheshold: 1 // purge previous transaction before next transaction
         * &nbsp;&nbsp;&#125;);
         * </pre>
         * @return {tId: string} an object containing info about the transaction
         */
        script: function(url, opts) { 
            return _queue("script", url, opts); 
        },

        /**
         * Fetches and inserts one or more css link nodes into the 
         * head of the current document or the document in a specified
         * window.
         * @method css
         * @static
         * @param url {string} the url or urls to the css file(s)
         * @param opts Options: 
         * <dl>
         * <dt>onSuccess</dt>
         * <dd>
         * callback to execute when the css file(s) are finished loading
         * The callback receives an object back with the following
         * data:
         * <dl>win</dl>
         * <dd>the window the link nodes(s) were inserted into</dd>
         * <dt>data</dt>
         * <dd>the data object passed in when the request was made</dd>
         * <dt>nodes</dt>
         * <dd>An array containing references to the nodes that were
         * inserted</dd>
         * <dt>purge</dt>
         * <dd>A function that, when executed, will remove the nodes
         * that were inserted</dd>
         * <dt>
         * </dl>
         * </dd>
         * <dt>context</dt>
         * <dd>the execution context for the callbacks</dd>
         * <dt>win</dt>
         * <dd>a window other than the one the utility occupies</dd>
         * <dt>data</dt>
         * <dd>
         * data that is supplied to the callbacks when the nodes(s) are
         * loaded.
         * </dd>
         * <dt>insertBefore</dt>
         * <dd>node or node id that will become the new node's nextSibling</dd>
         * <dt>charset</dt>
         * <dd>Node charset, default utf-8 (deprecated, use the attributes config)</dd>
         * <dt>attributes</dt>
         * <dd>An object literal containing additional attributes to add to the link tags</dd>
         * </dl>
         * <pre>
         *      Y.Get.css("http://yui.yahooapis.com/2.3.1/build/menu/assets/skins/sam/menu.css");
         * </pre>
         * <pre>
         * &nbsp;&nbsp;Y.Get.css(
         * &nbsp;&nbsp;["http://yui.yahooapis.com/2.3.1/build/menu/assets/skins/sam/menu.css",
         * &nbsp;&nbsp;&nbsp;&nbsp;insertBefore: 'custom-styles' // nodes will be inserted before the specified node
         * &nbsp;&nbsp;&#125;);
         * </pre>
         * @return {tId: string} an object containing info about the transaction
         */
        css: function(url, opts) {
            return _queue("css", url, opts); 
        }
    };
}();

})();


}, '3.0.0' );
YUI.add('yui-log', function(Y) {

/**
 * Provides console log capability and exposes a custom event for
 * console implementations.
 * @module yui
 * @submodule yui-log
 */
(function() {

var INSTANCE = Y,
    LOGEVENT = 'yui:log',
    UNDEFINED = 'undefined',
    LEVELS = { debug: 1, info: 1, warn: 1, error: 1 },
    _published;

/**
 * If the 'debug' config is true, a 'yui:log' event will be
 * dispatched, which the Console widget and anything else
 * can consume.  If the 'useBrowserConsole' config is true, it will
 * write to the browser console if available.  YUI-specific log
 * messages will only be present in the -debug versions of the
 * JS files.  The build system is supposed to remove log statements
 * from the raw and minified versions of the files.
 *
 * @method log
 * @for YUI
 * @param  {String}  msg  The message to log.
 * @param  {String}  cat  The log category for the message.  Default
 *                        categories are "info", "warn", "error", time".
 *                        Custom categories can be used as well. (opt)
 * @param  {String}  src  The source of the the message (opt)
 * @param  {boolean} silent If true, the log event won't fire
 * @return {YUI}      YUI instance
 */
INSTANCE.log = function(msg, cat, src, silent) {
    var Y = INSTANCE, c = Y.config, bail = false, excl, incl, m, f;
    // suppress log message if the config is off or the event stack
    // or the event call stack contains a consumer of the yui:log event
    if (c.debug) {
        // apply source filters
        if (src) {
            excl = c.logExclude; 
            incl = c.logInclude;

            if (incl && !(src in incl)) {
                bail = 1;
            } else if (excl && (src in excl)) {
                bail = 1;
            }
        }

        if (!bail) {

            if (c.useBrowserConsole) {
                m = (src) ? src + ': ' + msg : msg;
                if (typeof console != UNDEFINED && console.log) {
                    f = (cat && console[cat] && (cat in LEVELS)) ? cat : 'log';
                    console[f](m);
                } else if (typeof opera != UNDEFINED) {
                    opera.postError(m);
                }
            }

            if (Y.fire && !silent) {
                if (!_published) {
                    Y.publish(LOGEVENT, {
                        broadcast: 2,
                        emitFacade: 1
                    });

                    _published = 1;

                }
                Y.fire(LOGEVENT, {
                    msg: msg, 
                    cat: cat, 
                    src: src
                });
            }
        }
    }

    return Y;
};

/**
 * Write a system message.  This message will be preserved in the
 * minified and raw versions of the YUI files, unlike log statements.
 * @method message
 * @for YUI
 * @param  {String}  msg  The message to log.
 * @param  {String}  cat  The log category for the message.  Default
 *                        categories are "info", "warn", "error", time".
 *                        Custom categories can be used as well. (opt)
 * @param  {String}  src  The source of the the message (opt)
 * @param  {boolean} silent If true, the log event won't fire
 * @return {YUI}      YUI instance
 */
INSTANCE.message = function() {
    return INSTANCE.log.apply(INSTANCE, arguments);
};

})();


}, '3.0.0' ,{requires:['yui-base']});
YUI.add('yui-later', function(Y) {

/**
 * Provides a setTimeout/setInterval wrapper
 * @module yui
 * @submodule yui-later
 */
(function() {
    var L = Y.Lang,

    /**
     * Executes the supplied function in the context of the supplied 
     * object 'when' milliseconds later.  Executes the function a 
     * single time unless periodic is set to true.
     * @method later
     * @for YUI
     * @param when {int} the number of milliseconds to wait until the fn 
     * is executed.
     * @param o the context object.
     * @param fn {Function|String} the function to execute or the name of 
     * the method in the 'o' object to execute.
     * @param data [Array] data that is provided to the function.  This accepts
     * either a single item or an array.  If an array is provided, the
     * function is executed with one parameter for each array item.  If
     * you need to pass a single array parameter, it needs to be wrapped in
     * an array [myarray].
     * @param periodic {boolean} if true, executes continuously at supplied 
     * interval until canceled.
     * @return {object} a timer object. Call the cancel() method on this object to 
     * stop the timer.
     */
    later = function(when, o, fn, data, periodic) {
        when = when || 0; 
        o = o || {};
        var m=fn, d=Y.Array(data), f, r;

        if (L.isString(fn)) {
            m = o[fn];
        }

        if (!m) {
        }

        f = function() {
            m.apply(o, d);
        };

        r = (periodic) ? setInterval(f, when) : setTimeout(f, when);

        return {
            id: r,
            interval: periodic,
            cancel: function() {
                if (this.interval) {
                    clearInterval(r);
                } else {
                    clearTimeout(r);
                }
            }
        };
    };

    Y.later = later;
    L.later = later;

})();


}, '3.0.0' ,{requires:['yui-base']});


YUI.add('yui', function(Y){}, '3.0.0' ,{use:['yui-base','get','yui-log','yui-later']});

/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
YUI.add('oop', function(Y) {

/**
 * Supplies object inheritance and manipulation utilities.  This adds
 * additional functionaity to what is provided in yui-base, and the
 * methods are applied directly to the YUI instance.  This module
 * is required for most YUI components.
 * @module oop
 */

    var L  = Y.Lang, 
        A  = Y.Array,
        OP = Object.prototype,
        CLONE_MARKER = "_~yuim~_";

        // dispatch = function(o, f, c, proto, action) {
        //     if (o[action] && o.item) {
        //         return o[action].call(o, f, c);
        //     } else {
        //         switch (A.test(o)) {
        //             case 1:
        //                 return A[action](o, f, c);
        //             case 2:
        //                 return A[action](Y.Array(o, 0, true), f, c);
        //             default:
        //                 return Y.Object[action](o, f, c, proto);
        //         }
        //     }
        // };

    /**
     * The following methods are added to the YUI instance
     * @class YUI~oop
     */

    /**
     * Applies prototype properties from the supplier to the receiver.
     * The receiver can be a constructor or an instance.
     * @method augment
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param ov {boolean} if true, properties already on the receiver
     * will be overwritten if found on the supplier.
     * @param wl {string[]} a whitelist.  If supplied, only properties in 
     * this list will be applied to the receiver.
     * @param args {Array | Any} arg or arguments to apply to the supplier
     * constructor when initializing.
     * @return {object} the augmented object
     *
     * @todo constructor optional?
     * @todo understanding what an instance is augmented with
     * @TODO best practices for overriding sequestered methods.
     */
    Y.augment = function(r, s, ov, wl, args) {
        var sProto           = s.prototype, 
            newProto         = null, 
            construct        = s, 
            a                = (args) ? Y.Array(args) : [], 
            rProto           = r.prototype, 
            target           = rProto || r, 
            applyConstructor = false,
            sequestered, replacements, i;

        // working on a class, so apply constructor infrastructure
        if (rProto && construct) {
            sequestered  = {};
            replacements = {};
            newProto     = {};

            // sequester all of the functions in the supplier and replace with
            // one that will restore all of them.
            Y.each(sProto, function(v, k) {
                replacements[k] = function() {

// overwrite the prototype with all of the sequestered functions,
// but only if it hasn't been overridden
                    for (i in sequestered) {
                        if (sequestered.hasOwnProperty(i) && (this[i] === replacements[i])) {
                            this[i] = sequestered[i];
                        }
                    }

                    // apply the constructor
                    construct.apply(this, a);

                    // apply the original sequestered function
                    return sequestered[k].apply(this, arguments);
                };

                if ((!wl || (k in wl)) && (ov || !(k in this))) {
                    if (L.isFunction(v)) {
                        // sequester the function
                        sequestered[k] = v;

// replace the sequestered function with a function that will
// restore all sequestered functions and exectue the constructor.
                        this[k] = replacements[k];
                    } else {
                        this[k] = v;
                    }

                }

            }, newProto, true);

        // augmenting an instance, so apply the constructor immediately
        } else {
            applyConstructor = true;
        }

        Y.mix(target, newProto || sProto, ov, wl);

        if (applyConstructor) {
            s.apply(target, a);
        }

        return r;
    };

    /**
     * Applies object properties from the supplier to the receiver.  If
     * the target has the property, and the property is an object, the target
     * object will be augmented with the supplier's value.  If the property
     * is an array, the suppliers value will be appended to the target.
     * @method aggregate
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param ov {boolean} if true, properties already on the receiver
     * will be overwritten if found on the supplier.
     * @param wl {string[]} a whitelist.  If supplied, only properties in 
     * this list will be applied to the receiver.
     * @return {object} the extended object
     */
    Y.aggregate = function(r, s, ov, wl) {
        return Y.mix(r, s, ov, wl, 0, true);
    };

    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @param {Function} r   the object to modify
     * @param {Function} s the object to inherit
     * @param {Object} px prototype properties to add/override
     * @param {Object} sx static properties to add/override
     * @return {YUI} the YUI instance
     */
    Y.extend = function(r, s, px, sx) {
        if (!s||!r) {
            // @TODO error symbols
            Y.error("extend failed, verify dependencies");
        }

        var sp = s.prototype, rp=Y.Object(sp);
        r.prototype=rp;

        rp.constructor=r;
        r.superclass=sp;

        // assign constructor property
        if (s != Object && sp.constructor == OP.constructor) {
            sp.constructor=s;
        }
    
        // add prototype overrides
        if (px) {
            Y.mix(rp, px, true);
        }

        // add object overrides
        if (sx) {
            Y.mix(r, sx, true);
        }

        return r;
    };

    /**
     * Executes the supplied function for each item in
     * a collection.  Supports arrays, objects, and
     * Y.NodeLists
     * @method each
     * @param o the object to iterate
     * @param f the function to execute.  This function
     * receives the value, key, and object as parameters
     * @param proto if true, prototype properties are
     * iterated on objects
     * @return {YUI} the YUI instance
     */
    Y.each = function(o, f, c, proto) {

        if (o.each && o.item) {
            return o.each.call(o, f, c);
        } else {
            switch (A.test(o)) {
                case 1:
                    return A.each(o, f, c);
                case 2:
                    return A.each(Y.Array(o, 0, true), f, c);
                default:
                    return Y.Object.each(o, f, c, proto);
            }
        }

        // return Y.Object.each(o, f, c);
    };

    // Y.each = function(o, f, c, proto) {
    //     return dispatch(o, f, c, proto, 'each');
    // };

    /*
     * Executes the supplied function for each item in
     * a collection.  The operation stops if the function
     * returns true. Supports arrays, objects, and
     * Y.NodeLists.
     * @method some
     * @param o the object to iterate
     * @param f the function to execute.  This function
     * receives the value, key, and object as parameters
     * @param proto if true, prototype properties are
     * iterated on objects
     * @return {boolean} true if the function ever returns true, false otherwise
     */
    // Y.some = function(o, f, c, proto) {
    //     return dispatch(o, f, c, proto, 'some');
    // };

    /**
     * Deep obj/array copy.  Functions are cloned with Y.bind.
     * Array-like objects are treated as arrays.
     * Primitives are returned untouched.  Optionally, a
     * function can be provided to handle other data types,
     * filter keys, validate values, etc.
     *
     * @method clone
     * @param o what to clone
     * @param safe {boolean} if true, objects will not have prototype
     * items from the source.  If false, they will.  In this case, the
     * original is initially protected, but the clone is not completely immune
     * from changes to the source object prototype.  Also, cloned prototype
     * items that are deleted from the clone will result in the value
     * of the source prototype being exposed.  If operating on a non-safe
     * clone, items should be nulled out rather than deleted.
     * @TODO review
     * @param f optional function to apply to each item in a collection;
     *          it will be executed prior to applying the value to
     *          the new object.  Return false to prevent the copy.
     * @param c optional execution context for f
     * @param owner Owner object passed when clone is iterating an
     * object.  Used to set up context for cloned functions.
     * @return {Array|Object} the cloned object
     */
    Y.clone = function(o, safe, f, c, owner, cloned) {

        if (!L.isObject(o)) {
            return o;
        }

        var o2, marked = cloned || {}, stamp;

        switch (L.type(o)) {
            case 'date':
                return new Date(o);
            case 'regexp':
                return new RegExp(o.source);
            case 'function':
                o2 = Y.bind(o, owner);
                break;
            case 'array':
                o2 = [];
                break;
            default:

                // #2528250 only one clone of a given object should be created.
                if (o[CLONE_MARKER]) {
                    return marked[o[CLONE_MARKER]];
                }

                stamp = Y.guid();

                o2 = (safe) ? {} : Y.Object(o);

                o[CLONE_MARKER] = stamp;
                marked[stamp] = o;
        }

        // #2528250 don't try to clone element properties
        if (!o.addEventListener && !o.attachEvent) {
            Y.each(o, function(v, k) {
                if (!f || (f.call(c || this, v, k, this, o) !== false)) {
                    if (k !== CLONE_MARKER) {
                        this[k] = Y.clone(v, safe, f, c, owner || o, marked);
                    }
                }
            }, o2);
        }

        if (!cloned) {
            Y.each(marked, function(v, k) {
                delete v[CLONE_MARKER];
            });
            marked = null;
        }

        return o2;
    };


    /**
     * Returns a function that will execute the supplied function in the
     * supplied object's context, optionally adding any additional
     * supplied parameters to the beginning of the arguments collection the 
     * supplied to the function.
     *
     * @method bind
     * @param f {Function|String} the function to bind, or a function name
     * to execute on the context object
     * @param c the execution context
     * @param args* 0..n arguments to include before the arguments the 
     * function is executed with.
     * @return {function} the wrapped function
     */
    Y.bind = function(f, c) {
        var xargs = arguments.length > 2 ? Y.Array(arguments, 2, true) : null;
        return function () {
            var fn = L.isString(f) ? c[f] : f, 
                args = (xargs) ? xargs.concat(Y.Array(arguments, 0, true)) : arguments;
            return fn.apply(c || fn, args);
        };
    };
    
    /**
     * Returns a function that will execute the supplied function in the
     * supplied object's context, optionally adding any additional
     * supplied parameters to the end of the arguments the function
     * is executed with.
     *
     * @method rbind
     * @param f {Function|String} the function to bind, or a function name
     * to execute on the context object
     * @param c the execution context
     * @param args* 0..n arguments to append to the end of arguments collection
     * supplied to the function
     * @return {function} the wrapped function
     */
    Y.rbind = function(f, c) {
        var xargs = arguments.length > 2 ? Y.Array(arguments, 2, true) : null;
        return function () {
            var fn = L.isString(f) ? c[f] : f, 
                args = (xargs) ? Y.Array(arguments, 0, true).concat(xargs) : arguments;
            return fn.apply(c || fn, args);
        };
    };



}, '3.0.0' );
/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
YUI.add('dom-base', function(Y) {

(function(Y) {
/** 
 * The DOM utility provides a cross-browser abtraction layer
 * normalizing DOM tasks, and adds extra helper functionality
 * for other common tasks. 
 * @module dom
 * @submodule dom-base
 *
 */

/**
 * Provides DOM helper methods.
 * @class DOM
 *
 */
var NODE_TYPE = 'nodeType',
    OWNER_DOCUMENT = 'ownerDocument',
    DEFAULT_VIEW = 'defaultView',
    PARENT_WINDOW = 'parentWindow',
    TAG_NAME = 'tagName',
    PARENT_NODE = 'parentNode',
    FIRST_CHILD = 'firstChild',
    PREVIOUS_SIBLING = 'previousSibling',
    NEXT_SIBLING = 'nextSibling',
    CONTAINS = 'contains',
    COMPARE_DOCUMENT_POSITION = 'compareDocumentPosition',

    documentElement = document.documentElement,

    re_tag = /<([a-z]+)/i;

Y.DOM = {
    /**
     * Returns the HTMLElement with the given ID (Wrapper for document.getElementById).
     * @method byId         
     * @param {String} id the id attribute 
     * @param {Object} doc optional The document to search. Defaults to current document 
     * @return {HTMLElement | null} The HTMLElement with the id, or null if none found. 
     */
    byId: function(id, doc) {
        doc = doc || Y.config.doc;
        // TODO: IE Name
        return doc.getElementById(id);
    },

    // @deprecated
    children: function(node, tag) {
        var ret = [];
        if (node) {
            tag = tag || '*';
            ret = Y.Selector.query('> ' + tag, node); 
        }
        return ret;
    },

    // @deprecated
    firstByTag: function(tag, root) {
        var ret;
        root = root || Y.config.doc;

        if (tag && root.getElementsByTagName) {
            ret = root.getElementsByTagName(tag)[0];
        }

        return ret || null;
    },

    /**
     * Returns the text content of the HTMLElement. 
     * @method getText         
     * @param {HTMLElement} element The html element. 
     * @return {String} The text content of the element (includes text of any descending elements).
     */
    getText: (documentElement.textContent !== undefined) ?
        function(element) {
            var ret = '';
            if (element) {
                ret = element.textContent;
            }
            return ret || '';
        } : function(element) {
            var ret = '';
            if (element) {
                ret = element.innerText;
            }
            return ret || '';
        },

    /**
     * Sets the text content of the HTMLElement. 
     * @method setText         
     * @param {HTMLElement} element The html element. 
     * @param {String} content The content to add. 
     */
    setText: (documentElement.textContent !== undefined) ?
        function(element, content) {
            if (element) {
                element.textContent = content;
            }
        } : function(element, content) {
            if (element) {
                element.innerText = content;
            }
        },

    /*
     * Finds the previous sibling of the element.
     * @method previous
     * @deprecated Use elementByAxis
     * @param {HTMLElement} element The html element.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current DOM node being tested as its only argument.
     * If no function is given, the first sibling is returned.
     * @param {Boolean} all optional Whether all node types should be scanned, or just element nodes.
     * @return {HTMLElement | null} The matching DOM node or null if none found. 
     */
    previous: function(element, fn, all) {
        return Y.DOM.elementByAxis(element, PREVIOUS_SIBLING, fn, all);
    },

    /*
     * Finds the next sibling of the element.
     * @method next
     * @deprecated Use elementByAxis
     * @param {HTMLElement} element The html element.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current DOM node being tested as its only argument.
     * If no function is given, the first sibling is returned.
     * @param {Boolean} all optional Whether all node types should be scanned, or just element nodes.
     * @return {HTMLElement | null} The matching DOM node or null if none found. 
     */
    next: function(element, fn, all) {
        return Y.DOM.elementByAxis(element, NEXT_SIBLING, fn, all);
    },

    /*
     * Finds the ancestor of the element.
     * @method ancestor
     * @deprecated Use elementByAxis
     * @param {HTMLElement} element The html element.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current DOM node being tested as its only argument.
     * If no function is given, the parentNode is returned.
     * @param {Boolean} all optional Whether all node types should be scanned, or just element nodes.
     * @return {HTMLElement | null} The matching DOM node or null if none found. 
     */
     // TODO: optional stopAt node?
    ancestor: function(element, fn, all) {
        return Y.DOM.elementByAxis(element, PARENT_NODE, fn, all);
    },

    /**
     * Searches the element by the given axis for the first matching element.
     * @method elementByAxis
     * @param {HTMLElement} element The html element.
     * @param {String} axis The axis to search (parentNode, nextSibling, previousSibling).
     * @param {Function} fn optional An optional boolean test to apply.
     * @param {Boolean} all optional Whether all node types should be returned, or just element nodes.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, the first element is returned.
     * @return {HTMLElement | null} The matching element or null if none found.
     */
    elementByAxis: function(element, axis, fn, all) {
        while (element && (element = element[axis])) { // NOTE: assignment
                if ( (all || element[TAG_NAME]) && (!fn || fn(element)) ) {
                    return element;
                }
        }
        return null;
    },

    /**
     * Determines whether or not one HTMLElement is or contains another HTMLElement.
     * @method contains
     * @param {HTMLElement} element The containing html element.
     * @param {HTMLElement} needle The html element that may be contained.
     * @return {Boolean} Whether or not the element is or contains the needle.
     */
    contains: function(element, needle) {
        var ret = false;

        if ( !needle || !element || !needle[NODE_TYPE] || !element[NODE_TYPE]) {
            ret = false;
        } else if (element[CONTAINS])  {
            if (Y.UA.opera || needle[NODE_TYPE] === 1) { // IE & SAF contains fail if needle not an ELEMENT_NODE
                ret = element[CONTAINS](needle);
            } else {
                ret = Y.DOM._bruteContains(element, needle); 
            }
        } else if (element[COMPARE_DOCUMENT_POSITION]) { // gecko
            if (element === needle || !!(element[COMPARE_DOCUMENT_POSITION](needle) & 16)) { 
                ret = true;
            }
        }

        return ret;
    },

    /**
     * Determines whether or not the HTMLElement is part of the document.
     * @method inDoc
     * @param {HTMLElement} element The containing html element.
     * @param {HTMLElement} doc optional The document to check.
     * @return {Boolean} Whether or not the element is attached to the document. 
     */
    inDoc: function(element, doc) {
        doc = doc || element[OWNER_DOCUMENT];
        var id = element.id;
        if (!id) { // TODO: remove when done?
            id = element.id = Y.guid();
        }

        return !! (doc.getElementById(id));
    },

    /**
     * Creates a new dom node using the provided markup string. 
     * @method create
     * @param {String} html The markup used to create the element
     * @param {HTMLDocument} doc An optional document context 
     */
    create: function(html, doc) {
        if (typeof html === 'string') {
            html = Y.Lang.trim(html); // match IE which trims whitespace from innerHTML
        }

        if (!doc && Y.DOM._cloneCache[html]) {
            return Y.DOM._cloneCache[html].cloneNode(true); // NOTE: return
        }

        doc = doc || Y.config.doc;
        var m = re_tag.exec(html),
            create = Y.DOM._create,
            custom = Y.DOM.creators,
            ret = null,
            tag, nodes;

        if (m && custom[m[1]]) {
            if (typeof custom[m[1]] === 'function') {
                create = custom[m[1]];
            } else {
                tag = custom[m[1]];
            }
        }

        nodes = create(html, doc, tag).childNodes;

        if (nodes.length === 1) { // return single node, breaking parentNode ref from "fragment"
            ret = nodes[0].parentNode.removeChild(nodes[0]);
        } else { // return multiple nodes as a fragment
             ret = Y.DOM._nl2frag(nodes, doc);
        }

        if (ret) {
            Y.DOM._cloneCache[html] = ret.cloneNode(true);
        }
        return ret;
    },

    _nl2frag: function(nodes, doc) {
        var ret = null,
            i, len;

        if (nodes && (nodes.push || nodes.item) && nodes[0]) {
            doc = doc || nodes[0].ownerDocument; 
            ret = doc.createDocumentFragment();

            if (nodes.item) { // convert live list to static array
                nodes = Y.Array(nodes, 0, true);
            }

            for (i = 0, len = nodes.length; i < len; i++) {
                ret.appendChild(nodes[i]); 
            }
        } // else inline with log for minification
        return ret;
    },


    CUSTOM_ATTRIBUTES: (!documentElement.hasAttribute) ? { // IE < 8
        'for': 'htmlFor',
        'class': 'className'
    } : { // w3c
        'htmlFor': 'for',
        'className': 'class'
    },

    /**
     * Provides a normalized attribute interface. 
     * @method setAttibute
     * @param {String | HTMLElement} el The target element for the attribute.
     * @param {String} attr The attribute to set.
     * @param {String} val The value of the attribute.
     */
    setAttribute: function(el, attr, val, ieAttr) {
        if (el && el.setAttribute) {
            attr = Y.DOM.CUSTOM_ATTRIBUTES[attr] || attr;
            el.setAttribute(attr, val, ieAttr);
        }
    },


    /**
     * Provides a normalized attribute interface. 
     * @method getAttibute
     * @param {String | HTMLElement} el The target element for the attribute.
     * @param {String} attr The attribute to get.
     * @return {String} The current value of the attribute. 
     */
    getAttribute: function(el, attr, ieAttr) {
        ieAttr = (ieAttr !== undefined) ? ieAttr : 2;
        var ret = '';
        if (el && el.getAttribute) {
            attr = Y.DOM.CUSTOM_ATTRIBUTES[attr] || attr;
            ret = el.getAttribute(attr, ieAttr);

            if (ret === null) {
                ret = ''; // per DOM spec
            }
        }
        return ret;
    },

    isWindow: function(obj) {
        return obj.alert && obj.document;
    },

    _fragClones: {
        div: document.createElement('div')
    },

    _create: function(html, doc, tag) {
        tag = tag || 'div';

        var frag = Y.DOM._fragClones[tag];
        if (frag) {
            frag = frag.cloneNode(false);
        } else {
            frag = Y.DOM._fragClones[tag] = doc.createElement(tag);
        }
        frag.innerHTML = html;
        return frag;
    },

    _removeChildNodes: function(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    },

    _cloneCache: {},

    /**
     * Inserts content in a node at the given location 
     * @method addHTML
     * @param {HTMLElement} node The node to insert into
     * @param {String} content The content to be inserted 
     * @param {String} where Where to insert the content; default is after lastChild 
     */
    addHTML: function(node, content, where) {
        if (typeof content === 'string') {
            content = Y.Lang.trim(content); // match IE which trims whitespace from innerHTML
        }

        var newNode = Y.DOM._cloneCache[content],
            nodeParent = node.parentNode;
            
        if (newNode) {
            newNode = newNode.cloneNode(true);
        } else {
            if (content.nodeType) { // domNode
                newNode = content;
            } else { // create from string and cache
                newNode = Y.DOM.create(content);
            }
        }

        if (where) {
            if (where.nodeType) { // insert regardless of relationship to node
                // TODO: check if node.contains(where)?
                where.parentNode.insertBefore(newNode, where);
            } else {
                switch (where) {
                    case 'replace':
                        while (node.firstChild) {
                            node.removeChild(node.firstChild);
                        }
                        node.appendChild(newNode);
                        break;
                    case 'before':
                        nodeParent.insertBefore(newNode, node);
                        break;
                    case 'after':
                        if (node.nextSibling) { // IE errors if refNode is null
                            nodeParent.insertBefore(newNode, node.nextSibling);
                        } else {
                            nodeParent.appendChild(newNode);
                        }
                        break;
                    default:
                        node.appendChild(newNode);
                }
            }
        } else {
            node.appendChild(newNode);
        }

        return newNode;
    },

    VALUE_SETTERS: {},

    VALUE_GETTERS: {},

    getValue: function(node) {
        var ret = '', // TODO: return null?
            getter;

        if (node && node[TAG_NAME]) {
            getter = Y.DOM.VALUE_GETTERS[node[TAG_NAME].toLowerCase()];

            if (getter) {
                ret = getter(node);
            } else {
                ret = node.value;
            }
        }

        return (typeof ret === 'string') ? ret : '';
    },

    setValue: function(node, val) {
        var setter;

        if (node && node[TAG_NAME]) {
            setter = Y.DOM.VALUE_SETTERS[node[TAG_NAME].toLowerCase()];

            if (setter) {
                setter(node, val);
            } else {
                node.value = val;
            }
        }
    },

    /**
     * Brute force version of contains.
     * Used for browsers without contains support for non-HTMLElement Nodes (textNodes, etc).
     * @method _bruteContains
     * @private
     * @param {HTMLElement} element The containing html element.
     * @param {HTMLElement} needle The html element that may be contained.
     * @return {Boolean} Whether or not the element is or contains the needle.
     */
    _bruteContains: function(element, needle) {
        while (needle) {
            if (element === needle) {
                return true;
            }
            needle = needle.parentNode;
        }
        return false;
    },

// TODO: move to Lang?
    /**
     * Memoizes dynamic regular expressions to boost runtime performance. 
     * @method _getRegExp
     * @private
     * @param {String} str The string to convert to a regular expression.
     * @param {String} flags optional An optinal string of flags.
     * @return {RegExp} An instance of RegExp
     */
    _getRegExp: function(str, flags) {
        flags = flags || '';
        Y.DOM._regexCache = Y.DOM._regexCache || {};
        if (!Y.DOM._regexCache[str + flags]) {
            Y.DOM._regexCache[str + flags] = new RegExp(str, flags);
        }
        return Y.DOM._regexCache[str + flags];
    },

// TODO: make getDoc/Win true privates?
    /**
     * returns the appropriate document.
     * @method _getDoc
     * @private
     * @param {HTMLElement} element optional Target element.
     * @return {Object} The document for the given element or the default document. 
     */
    _getDoc: function(element) {
        element = element || {};

        return (element[NODE_TYPE] === 9) ? element : // element === document
                element[OWNER_DOCUMENT] || // element === DOM node
                element.document || // element === window
                Y.config.doc; // default
    },

    /**
     * returns the appropriate window.
     * @method _getWin
     * @private
     * @param {HTMLElement} element optional Target element.
     * @return {Object} The window for the given element or the default window. 
     */
    _getWin: function(element) {
        var doc = Y.DOM._getDoc(element);
        return doc[DEFAULT_VIEW] || doc[PARENT_WINDOW] || Y.config.win;
    },

    _batch: function(nodes, fn, arg1, arg2, arg3, etc) {
        fn = (typeof name === 'string') ? Y.DOM[fn] : fn;
        var result,
            ret = [];

        if (fn && nodes) {
            Y.each(nodes, function(node) {
                if ((result = fn.call(Y.DOM, node, arg1, arg2, arg3, etc)) !== undefined) {
                    ret[ret.length] = result;
                }
            });
        }

        return ret.length ? ret : nodes;
    },

    _testElement: function(element, tag, fn) {
        tag = (tag && tag !== '*') ? tag.toUpperCase() : null;
        return (element && element[TAG_NAME] &&
                (!tag || element[TAG_NAME].toUpperCase() === tag) &&
                (!fn || fn(element)));
    },

    creators: {},

    _IESimpleCreate: function(html, doc) {
        doc = doc || Y.config.doc;
        return doc.createElement(html);
    }
};


(function(Y) {
    var creators = Y.DOM.creators,
        create = Y.DOM.create,
        re_tbody = /(?:\/(?:thead|tfoot|tbody|caption|col|colgroup)>)+\s*<tbody/,

        TABLE_OPEN = '<table>',
        TABLE_CLOSE = '</table>';

    if (Y.UA.ie) {
        Y.mix(creators, {
        // TODO: thead/tfoot with nested tbody
            // IE adds TBODY when creating TABLE elements (which may share this impl)
            tbody: function(html, doc) {
                var frag = create(TABLE_OPEN + html + TABLE_CLOSE, doc),
                    tb = frag.children.tags('tbody')[0];

                if (frag.children.length > 1 && tb && !re_tbody.test(html)) {
                    tb[PARENT_NODE].removeChild(tb); // strip extraneous tbody
                }
                return frag;
            },

            script: function(html, doc) {
                var frag = doc.createElement('div');

                frag.innerHTML = '-' + html;
                frag.removeChild(frag[FIRST_CHILD]);
                return frag;
            }

        }, true);

        Y.mix(Y.DOM.VALUE_GETTERS, {
            button: function(node) {
                return (node.attributes && node.attributes.value) ? node.attributes.value.value : '';
            }
        });

        Y.mix(Y.DOM.VALUE_SETTERS, {
            // IE: node.value changes the button text, which should be handled via innerHTML
            button: function(node, val) {
                var attr = node.attributes.value;
                if (!attr) {
                    attr = node[OWNER_DOCUMENT].createAttribute('value');
                    node.setAttributeNode(attr);
                }

                attr.value = val;
            }
        });
    }

    if (Y.UA.gecko || Y.UA.ie) {
        Y.mix(creators, {
            option: function(html, doc) {
                return create('<select>' + html + '</select>', doc);
            },

            tr: function(html, doc) {
                return create('<tbody>' + html + '</tbody>', doc);
            },

            td: function(html, doc) {
                return create('<tr>' + html + '</tr>', doc);
            }, 

            tbody: function(html, doc) {
                return create(TABLE_OPEN + html + TABLE_CLOSE, doc);
            }
        });

        Y.mix(creators, {
            legend: 'fieldset',
            th: creators.td,
            thead: creators.tbody,
            tfoot: creators.tbody,
            caption: creators.tbody,
            colgroup: creators.tbody,
            col: creators.tbody,
            optgroup: creators.option
        });
    }

    Y.mix(Y.DOM.VALUE_GETTERS, {
        option: function(node) {
            var attrs = node.attributes;
            return (attrs.value && attrs.value.specified) ? node.value : node.text;
        },

        select: function(node) {
            var val = node.value,
                options = node.options;

            if (options && val === '') {
                if (node.multiple) {
                } else {
                    val = Y.DOM.getValue(options[node.selectedIndex], 'value');
                }
            }

            return val;
        }
    });
})(Y);

})(Y);
var addClass, hasClass, removeClass;

Y.mix(Y.DOM, {
    /**
     * Determines whether a DOM element has the given className.
     * @method hasClass
     * @param {HTMLElement} element The DOM element. 
     * @param {String} className the class name to search for
     * @return {Boolean} Whether or not the element has the given class. 
     */
    hasClass: function(node, className) {
        var re = Y.DOM._getRegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
        return re.test(node.className);
    },

    /**
     * Adds a class name to a given DOM element.
     * @method addClass         
     * @param {HTMLElement} element The DOM element. 
     * @param {String} className the class name to add to the class attribute
     */
    addClass: function(node, className) {
        if (!Y.DOM.hasClass(node, className)) { // skip if already present 
            node.className = Y.Lang.trim([node.className, className].join(' '));
        }
    },

    /**
     * Removes a class name from a given element.
     * @method removeClass         
     * @param {HTMLElement} element The DOM element. 
     * @param {String} className the class name to remove from the class attribute
     */
    removeClass: function(node, className) {
        if (className && hasClass(node, className)) {
            node.className = Y.Lang.trim(node.className.replace(Y.DOM._getRegExp('(?:^|\\s+)' +
                            className + '(?:\\s+|$)'), ' '));

            if ( hasClass(node, className) ) { // in case of multiple adjacent
                removeClass(node, className);
            }
        }                 
    },

    /**
     * Replace a class with another class for a given element.
     * If no oldClassName is present, the newClassName is simply added.
     * @method replaceClass  
     * @param {HTMLElement} element The DOM element. 
     * @param {String} oldClassName the class name to be replaced
     * @param {String} newClassName the class name that will be replacing the old class name
     */
    replaceClass: function(node, oldC, newC) {
        addClass(node, newC);
        removeClass(node, oldC);
    },

    /**
     * If the className exists on the node it is removed, if it doesn't exist it is added.
     * @method toggleClass  
     * @param {HTMLElement} element The DOM element. 
     * @param {String} className the class name to be toggled
     */
    toggleClass: function(node, className) {
        if (hasClass(node, className)) {
            removeClass(node, className);
        } else {
            addClass(node, className);
        }
    }
});

hasClass = Y.DOM.hasClass;
removeClass = Y.DOM.removeClass;
addClass = Y.DOM.addClass;



}, '3.0.0' ,{requires:['oop']});
YUI.add('dom-style', function(Y) {

(function(Y) {
/** 
 * Add style management functionality to DOM.
 * @module dom
 * @submodule dom-style
 * @for DOM
 */

var DOCUMENT_ELEMENT = 'documentElement',
    DEFAULT_VIEW = 'defaultView',
    OWNER_DOCUMENT = 'ownerDocument',
    STYLE = 'style',
    FLOAT = 'float',
    CSS_FLOAT = 'cssFloat',
    STYLE_FLOAT = 'styleFloat',
    TRANSPARENT = 'transparent',
    GET_COMPUTED_STYLE = 'getComputedStyle',

    DOCUMENT = Y.config.doc,
    UNDEFINED = undefined,

    re_color = /color$/i;


Y.mix(Y.DOM, {
    CUSTOM_STYLES: {
    },


    /**
     * Sets a style property for a given element.
     * @method setStyle
     * @param {HTMLElement} An HTMLElement to apply the style to.
     * @param {String} att The style property to set. 
     * @param {String|Number} val The value. 
     */
    setStyle: function(node, att, val, style) {
        style = style || node.style;
        var CUSTOM_STYLES = Y.DOM.CUSTOM_STYLES;

        if (style) {
            if (val === null) {
                val = ''; // normalize for unsetting
            }
            if (att in CUSTOM_STYLES) {
                if (CUSTOM_STYLES[att].set) {
                    CUSTOM_STYLES[att].set(node, val, style);
                    return; // NOTE: return
                } else if (typeof CUSTOM_STYLES[att] === 'string') {
                    att = CUSTOM_STYLES[att];
                }
            }
            style[att] = val; 
        }
    },

    /**
     * Returns the current style value for the given property.
     * @method getStyle
     * @param {HTMLElement} An HTMLElement to get the style from.
     * @param {String} att The style property to get. 
     */
    getStyle: function(node, att) {
        var style = node[STYLE],
            CUSTOM_STYLES = Y.DOM.CUSTOM_STYLES,
            val = '';

        if (style) {
            if (att in CUSTOM_STYLES) {
                if (CUSTOM_STYLES[att].get) {
                    return CUSTOM_STYLES[att].get(node, att, style); // NOTE: return
                } else if (typeof CUSTOM_STYLES[att] === 'string') {
                    att = CUSTOM_STYLES[att];
                }
            }
            val = style[att];
            if (val === '') { // TODO: is empty string sufficient?
                val = Y.DOM[GET_COMPUTED_STYLE](node, att);
            }
        }

        return val;
    },

    /**
     * Sets multiple style properties.
     * @method setStyles
     * @param {HTMLElement} node An HTMLElement to apply the styles to. 
     * @param {Object} hash An object literal of property:value pairs. 
     */
    setStyles: function(node, hash) {
        var style = node.style;
        Y.each(hash, function(v, n) {
            Y.DOM.setStyle(node, n, v, style);
        }, Y.DOM);
    },

    /**
     * Returns the computed style for the given node.
     * @method getComputedStyle
     * @param {HTMLElement} An HTMLElement to get the style from.
     * @param {String} att The style property to get. 
     * @return {String} The computed value of the style property. 
     */
    getComputedStyle: function(node, att) {
        var val = '',
            doc = node[OWNER_DOCUMENT];

        if (node[STYLE]) {
            val = doc[DEFAULT_VIEW][GET_COMPUTED_STYLE](node, null)[att];
        }
        return val;
    }
});

// normalize reserved word float alternatives ("cssFloat" or "styleFloat")
if (DOCUMENT[DOCUMENT_ELEMENT][STYLE][CSS_FLOAT] !== UNDEFINED) {
    Y.DOM.CUSTOM_STYLES[FLOAT] = CSS_FLOAT;
} else if (DOCUMENT[DOCUMENT_ELEMENT][STYLE][STYLE_FLOAT] !== UNDEFINED) {
    Y.DOM.CUSTOM_STYLES[FLOAT] = STYLE_FLOAT;
}

// fix opera computedStyle default color unit (convert to rgb)
if (Y.UA.opera) {
    Y.DOM[GET_COMPUTED_STYLE] = function(node, att) {
        var view = node[OWNER_DOCUMENT][DEFAULT_VIEW],
            val = view[GET_COMPUTED_STYLE](node, '')[att];

        if (re_color.test(att)) {
            val = Y.Color.toRGB(val);
        }

        return val;
    };

}

// safari converts transparent to rgba(), others use "transparent"
if (Y.UA.webkit) {
    Y.DOM[GET_COMPUTED_STYLE] = function(node, att) {
        var view = node[OWNER_DOCUMENT][DEFAULT_VIEW],
            val = view[GET_COMPUTED_STYLE](node, '')[att];

        if (val === 'rgba(0, 0, 0, 0)') {
            val = TRANSPARENT; 
        }

        return val;
    };

}
})(Y);
(function(Y) {
var PARSE_INT = parseInt,
    RE = RegExp;

Y.Color = {
    KEYWORDS: {
        black: '000',
        silver: 'c0c0c0',
        gray: '808080',
        white: 'fff',
        maroon: '800000',
        red: 'f00',
        purple: '800080',
        fuchsia: 'f0f',
        green: '008000',
        lime: '0f0',
        olive: '808000',
        yellow: 'ff0',
        navy: '000080',
        blue: '00f',
        teal: '008080',
        aqua: '0ff'
    },

    re_RGB: /^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,
    re_hex: /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
    re_hex3: /([0-9A-F])/gi,

    toRGB: function(val) {
        if (!Y.Color.re_RGB.test(val)) {
            val = Y.Color.toHex(val);
        }

        if(Y.Color.re_hex.exec(val)) {
            val = 'rgb(' + [
                PARSE_INT(RE.$1, 16),
                PARSE_INT(RE.$2, 16),
                PARSE_INT(RE.$3, 16)
            ].join(', ') + ')';
        }
        return val;
    },

    toHex: function(val) {
        val = Y.Color.KEYWORDS[val] || val;
        if (Y.Color.re_RGB.exec(val)) {
            val = [
                Number(RE.$1).toString(16),
                Number(RE.$2).toString(16),
                Number(RE.$3).toString(16)
            ];

            for (var i = 0; i < val.length; i++) {
                if (val[i].length < 2) {
                    val[i] = val[i].replace(Y.Color.re_hex3, '$1$1');
                }
            }

            val = '#' + val.join('');
        }

        if (val.length < 6) {
            val = val.replace(Y.Color.re_hex3, '$1$1');
        }

        if (val !== 'transparent' && val.indexOf('#') < 0) {
            val = '#' + val;
        }

        return val.toLowerCase();
    }
};
})(Y);

(function(Y) {
var HAS_LAYOUT = 'hasLayout',
    PX = 'px',
    FILTER = 'filter',
    FILTERS = 'filters',
    OPACITY = 'opacity',
    AUTO = 'auto',

    BORDER_WIDTH = 'borderWidth',
    BORDER_TOP_WIDTH = 'borderTopWidth',
    BORDER_RIGHT_WIDTH = 'borderRightWidth',
    BORDER_BOTTOM_WIDTH = 'borderBottomWidth',
    BORDER_LEFT_WIDTH = 'borderLeftWidth',
    WIDTH = 'width',
    HEIGHT = 'height',
    TRANSPARENT = 'transparent',
    VISIBLE = 'visible',
    GET_COMPUTED_STYLE = 'getComputedStyle',
    UNDEFINED = undefined,
    documentElement = document.documentElement,

    // TODO: unit-less lineHeight (e.g. 1.22)
    re_unit = /^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i,

    _getStyleObj = function(node) {
        return node.currentStyle || node.style;
    },

    ComputedStyle = {
        CUSTOM_STYLES: {},

        get: function(el, property) {
            var value = '',
                current;

            if (el) {
                    current = _getStyleObj(el)[property];

                if (property === OPACITY && Y.DOM.CUSTOM_STYLES[OPACITY]) {
                    value = Y.DOM.CUSTOM_STYLES[OPACITY].get(el);        
                } else if (!current || (current.indexOf && current.indexOf(PX) > -1)) { // no need to convert
                    value = current;
                } else if (Y.DOM.IE.COMPUTED[property]) { // use compute function
                    value = Y.DOM.IE.COMPUTED[property](el, property);
                } else if (re_unit.test(current)) { // convert to pixel
                    value = ComputedStyle.getPixel(el, property) + PX;
                } else {
                    value = current;
                }
            }

            return value;
        },

        sizeOffsets: {
            width: ['Left', 'Right'],
            height: ['Top', 'Bottom'],
            top: ['Top'],
            bottom: ['Bottom']
        },

        getOffset: function(el, prop) {
            var current = _getStyleObj(el)[prop],                     // value of "width", "top", etc.
                capped = prop.charAt(0).toUpperCase() + prop.substr(1), // "Width", "Top", etc.
                offset = 'offset' + capped,                             // "offsetWidth", "offsetTop", etc.
                pixel = 'pixel' + capped,                               // "pixelWidth", "pixelTop", etc.
                sizeOffsets = ComputedStyle.sizeOffsets[prop], 
                value = '';

            // IE pixelWidth incorrect for percent
            // manually compute by subtracting padding and border from offset size
            // NOTE: clientWidth/Height (size minus border) is 0 when current === AUTO so offsetHeight is used
            // reverting to auto from auto causes position stacking issues (old impl)
            if (current === AUTO || current.indexOf('%') > -1) {
                value = el['offset' + capped];

                if (sizeOffsets[0]) {
                    value -= ComputedStyle.getPixel(el, 'padding' + sizeOffsets[0]);
                    value -= ComputedStyle.getBorderWidth(el, 'border' + sizeOffsets[0] + 'Width', 1);
                }

                if (sizeOffsets[1]) {
                    value -= ComputedStyle.getPixel(el, 'padding' + sizeOffsets[1]);
                    value -= ComputedStyle.getBorderWidth(el, 'border' + sizeOffsets[1] + 'Width', 1);
                }

            } else { // use style.pixelWidth, etc. to convert to pixels
                // need to map style.width to currentStyle (no currentStyle.pixelWidth)
                if (!el.style[pixel] && !el.style[prop]) {
                    el.style[prop] = current;
                }
                value = el.style[pixel];
                
            }
            return value + PX;
        },

        borderMap: {
            thin: '2px', 
            medium: '4px', 
            thick: '6px'
        },

        getBorderWidth: function(el, property, omitUnit) {
            var unit = omitUnit ? '' : PX,
                current = el.currentStyle[property];

            if (current.indexOf(PX) < 0) { // look up keywords
                if (ComputedStyle.borderMap[current]) {
                    current = ComputedStyle.borderMap[current];
                } else {
                }
            }
            return (omitUnit) ? parseFloat(current) : current;
        },

        getPixel: function(node, att) {
            // use pixelRight to convert to px
            var val = null,
                style = _getStyleObj(node),
                styleRight = style.right,
                current = style[att];

            node.style.right = current;
            val = node.style.pixelRight;
            node.style.right = styleRight; // revert

            return val;
        },

        getMargin: function(node, att) {
            var val,
                style = _getStyleObj(node);

            if (style[att] == AUTO) {
                val = 0;
            } else {
                val = ComputedStyle.getPixel(node, att);
            }
            return val + PX;
        },

        getVisibility: function(node, att) {
            var current;
            while ( (current = node.currentStyle) && current[att] == 'inherit') { // NOTE: assignment in test
                node = node.parentNode;
            }
            return (current) ? current[att] : VISIBLE;
        },

        getColor: function(node, att) {
            var current = _getStyleObj(node)[att];

            if (!current || current === TRANSPARENT) {
                Y.DOM.elementByAxis(node, 'parentNode', null, function(parent) {
                    current = _getStyleObj(parent)[att];
                    if (current && current !== TRANSPARENT) {
                        node = parent;
                        return true;
                    }
                });
            }

            return Y.Color.toRGB(current);
        },

        getBorderColor: function(node, att) {
            var current = _getStyleObj(node),
                val = current[att] || current.color;
            return Y.Color.toRGB(Y.Color.toHex(val));
        }
    },

    //fontSize: getPixelFont,
    IEComputed = {};

// use alpha filter for IE opacity
try {
    if (documentElement.style[OPACITY] === UNDEFINED &&
            documentElement[FILTERS]) {
        Y.DOM.CUSTOM_STYLES[OPACITY] = {
            get: function(node) {
                var val = 100;
                try { // will error if no DXImageTransform
                    val = node[FILTERS]['DXImageTransform.Microsoft.Alpha'][OPACITY];

                } catch(e) {
                    try { // make sure its in the document
                        val = node[FILTERS]('alpha')[OPACITY];
                    } catch(err) {
                    }
                }
                return val / 100;
            },

            set: function(node, val, style) {
                var current,
                    styleObj;

                if (val === '') { // normalize inline style behavior
                    styleObj = _getStyleObj(node);
                    current = (OPACITY in styleObj) ? styleObj[OPACITY] : 1; // revert to original opacity
                    val = current;
                }

                if (typeof style[FILTER] == 'string') { // in case not appended
                    style[FILTER] = 'alpha(' + OPACITY + '=' + val * 100 + ')';
                    
                    if (!node.currentStyle || !node.currentStyle[HAS_LAYOUT]) {
                        style.zoom = 1; // needs layout 
                    }
                }
            }
        };
    }
} catch(e) {
}

try {
    document.createElement('div').style.height = '-1px';
} catch(e) { // IE throws error on invalid style set; trap common cases
    Y.DOM.CUSTOM_STYLES.height = {
        set: function(node, val, style) {
            var floatVal = parseFloat(val);
            if (isNaN(floatVal) || floatVal >= 0) {
                style.height = val;
            } else {
            }
        }
    };

    Y.DOM.CUSTOM_STYLES.width = {
        set: function(node, val, style) {
            var floatVal = parseFloat(val);
            if (isNaN(floatVal) || floatVal >= 0) {
                style.width = val;
            } else {
            }
        }
    };
}

// TODO: top, right, bottom, left
IEComputed[WIDTH] = IEComputed[HEIGHT] = ComputedStyle.getOffset;

IEComputed.color = IEComputed.backgroundColor = ComputedStyle.getColor;

IEComputed[BORDER_WIDTH] = IEComputed[BORDER_TOP_WIDTH] = IEComputed[BORDER_RIGHT_WIDTH] =
        IEComputed[BORDER_BOTTOM_WIDTH] = IEComputed[BORDER_LEFT_WIDTH] =
        ComputedStyle.getBorderWidth;

IEComputed.marginTop = IEComputed.marginRight = IEComputed.marginBottom =
        IEComputed.marginLeft = ComputedStyle.getMargin;

IEComputed.visibility = ComputedStyle.getVisibility;
IEComputed.borderColor = IEComputed.borderTopColor =
        IEComputed.borderRightColor = IEComputed.borderBottomColor =
        IEComputed.borderLeftColor = ComputedStyle.getBorderColor;

if (!Y.config.win[GET_COMPUTED_STYLE]) {
    Y.DOM[GET_COMPUTED_STYLE] = ComputedStyle.get; 
}

Y.namespace('DOM.IE');
Y.DOM.IE.COMPUTED = IEComputed;
Y.DOM.IE.ComputedStyle = ComputedStyle;

})(Y);


}, '3.0.0' ,{requires:['dom-base']});
YUI.add('dom-screen', function(Y) {

(function(Y) {

/**
 * Adds position and region management functionality to DOM.
 * @module dom
 * @submodule dom-screen
 * @for DOM
 */

var DOCUMENT_ELEMENT = 'documentElement',
    COMPAT_MODE = 'compatMode',
    POSITION = 'position',
    FIXED = 'fixed',
    RELATIVE = 'relative',
    LEFT = 'left',
    TOP = 'top',
    _BACK_COMPAT = 'BackCompat',
    MEDIUM = 'medium',
    BORDER_LEFT_WIDTH = 'borderLeftWidth',
    BORDER_TOP_WIDTH = 'borderTopWidth',
    GET_BOUNDING_CLIENT_RECT = 'getBoundingClientRect',
    GET_COMPUTED_STYLE = 'getComputedStyle',

    // TODO: how about thead/tbody/tfoot/tr?
    // TODO: does caption matter?
    RE_TABLE = /^t(?:able|d|h)$/i;

Y.mix(Y.DOM, {
    /**
     * Returns the inner height of the viewport (exludes scrollbar). 
     * @method winHeight
     * @return {Number} The current height of the viewport.
     */
    winHeight: function(node) {
        var h = Y.DOM._getWinSize(node).height;
        return h;
    },

    /**
     * Returns the inner width of the viewport (exludes scrollbar). 
     * @method winWidth
     * @return {Number} The current width of the viewport.
     */
    winWidth: function(node) {
        var w = Y.DOM._getWinSize(node).width;
        return w;
    },

    /**
     * Document height 
     * @method docHeight
     * @return {Number} The current height of the document.
     */
    docHeight:  function(node) {
        var h = Y.DOM._getDocSize(node).height;
        return Math.max(h, Y.DOM._getWinSize(node).height);
    },

    /**
     * Document width 
     * @method docWidth
     * @return {Number} The current width of the document.
     */
    docWidth:  function(node) {
        var w = Y.DOM._getDocSize(node).width;
        return Math.max(w, Y.DOM._getWinSize(node).width);
    },

    /**
     * Amount page has been scroll horizontally 
     * @method docScrollX
     * @return {Number} The current amount the screen is scrolled horizontally.
     */
    docScrollX: function(node) {
        var doc = Y.DOM._getDoc(node);
        return Math.max(doc[DOCUMENT_ELEMENT].scrollLeft, doc.body.scrollLeft);
    },

    /**
     * Amount page has been scroll vertically 
     * @method docScrollY
     * @return {Number} The current amount the screen is scrolled vertically.
     */
    docScrollY:  function(node) {
        var doc = Y.DOM._getDoc(node);
        return Math.max(doc[DOCUMENT_ELEMENT].scrollTop, doc.body.scrollTop);
    },

    /**
     * Gets the current position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getXY
     * @param element The target element
     * @return {Array} The XY position of the element

     TODO: test inDocument/display?
     */
    getXY: function() {
        if (document[DOCUMENT_ELEMENT][GET_BOUNDING_CLIENT_RECT]) {
            return function(node) {
                var xy = null,
                    scrollLeft,
                    scrollTop,
                    box,
                    off1, off2,
                    bLeft, bTop,
                    mode,
                    doc;

                if (node) {
                    if (Y.DOM.inDoc(node)) {
                        scrollLeft = Y.DOM.docScrollX(node);
                        scrollTop = Y.DOM.docScrollY(node);
                        box = node[GET_BOUNDING_CLIENT_RECT]();
                        doc = Y.DOM._getDoc(node);
                        xy = [box.left, box.top];

                            if (Y.UA.ie) {
                                off1 = 2;
                                off2 = 2;
                                mode = doc[COMPAT_MODE];
                                bLeft = Y.DOM[GET_COMPUTED_STYLE](doc[DOCUMENT_ELEMENT], BORDER_LEFT_WIDTH);
                                bTop = Y.DOM[GET_COMPUTED_STYLE](doc[DOCUMENT_ELEMENT], BORDER_TOP_WIDTH);

                                if (Y.UA.ie === 6) {
                                    if (mode !== _BACK_COMPAT) {
                                        off1 = 0;
                                        off2 = 0;
                                    }
                                }
                                
                                if ((mode == _BACK_COMPAT)) {
                                    if (bLeft !== MEDIUM) {
                                        off1 = parseInt(bLeft, 10);
                                    }
                                    if (bTop !== MEDIUM) {
                                        off2 = parseInt(bTop, 10);
                                    }
                                }
                                
                                xy[0] -= off1;
                                xy[1] -= off2;

                            }

                        if ((scrollTop || scrollLeft)) {
                            xy[0] += scrollLeft;
                            xy[1] += scrollTop;
                        }
                    } else { // default to current offsets
                        xy = Y.DOM._getOffset(node);
                    }
                }
                return xy;                   
            };
        } else {
            return function(node) { // manually calculate by crawling up offsetParents
                //Calculate the Top and Left border sizes (assumes pixels)
                var xy = null,
                    parentNode,
                    bCheck,
                    scrollTop,
                    scrollLeft;

                if (node) {
                    if (Y.DOM.inDoc(node)) {
                        xy = [node.offsetLeft, node.offsetTop];
                        parentNode = node;
                        // TODO: refactor with !! or just falsey
                        bCheck = ((Y.UA.gecko || Y.UA.webkit > 519) ? true : false);

                        // TODO: worth refactoring for TOP/LEFT only?
                        while ((parentNode = parentNode.offsetParent)) {
                            xy[0] += parentNode.offsetLeft;
                            xy[1] += parentNode.offsetTop;
                            if (bCheck) {
                                xy = Y.DOM._calcBorders(parentNode, xy);
                            }
                        }

                        // account for any scrolled ancestors
                        if (Y.DOM.getStyle(node, POSITION) != FIXED) {
                            parentNode = node;

                            while ((parentNode = parentNode.parentNode)) {
                                scrollTop = parentNode.scrollTop;
                                scrollLeft = parentNode.scrollLeft;

                                //Firefox does something funky with borders when overflow is not visible.
                                if (Y.UA.gecko && (Y.DOM.getStyle(parentNode, 'overflow') !== 'visible')) {
                                        xy = Y.DOM._calcBorders(parentNode, xy);
                                }
                                

                                if (scrollTop || scrollLeft) {
                                    xy[0] -= scrollLeft;
                                    xy[1] -= scrollTop;
                                }
                            }
                            xy[0] += Y.DOM.docScrollX(node);
                            xy[1] += Y.DOM.docScrollY(node);

                        } else {
                            //Fix FIXED position -- add scrollbars
                            xy[0] += Y.DOM.docScrollX(node);
                            xy[1] += Y.DOM.docScrollY(node);
                        }
                    } else {
                        xy = Y.DOM._getOffset(node);
                    }
                }

                return xy;                
            };
        }
    }(),// NOTE: Executing for loadtime branching

    _getOffset: function(node) {
        var pos,
            xy = null;

        if (node) {
            pos = Y.DOM.getStyle(node, POSITION);
            xy = [
                parseInt(Y.DOM[GET_COMPUTED_STYLE](node, LEFT), 10),
                parseInt(Y.DOM[GET_COMPUTED_STYLE](node, TOP), 10)
            ];

            if ( isNaN(xy[0]) ) { // in case of 'auto'
                xy[0] = parseInt(Y.DOM.getStyle(node, LEFT), 10); // try inline
                if ( isNaN(xy[0]) ) { // default to offset value
                    xy[0] = (pos === RELATIVE) ? 0 : node.offsetLeft || 0;
                }
            } 

            if ( isNaN(xy[1]) ) { // in case of 'auto'
                xy[1] = parseInt(Y.DOM.getStyle(node, TOP), 10); // try inline
                if ( isNaN(xy[1]) ) { // default to offset value
                    xy[1] = (pos === RELATIVE) ? 0 : node.offsetTop || 0;
                }
            } 
        }

        return xy;

    },

    /**
     * Gets the current X position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getX
     * @param element The target element
     * @return {Int} The X position of the element
     */

    getX: function(node) {
        return Y.DOM.getXY(node)[0];
    },

    /**
     * Gets the current Y position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getY
     * @param element The target element
     * @return {Int} The Y position of the element
     */

    getY: function(node) {
        return Y.DOM.getXY(node)[1];
    },

    /**
     * Set the position of an html element in page coordinates.
     * The element must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setXY
     * @param element The target element
     * @param {Array} xy Contains X & Y values for new position (coordinates are page-based)
     * @param {Boolean} noRetry By default we try and set the position a second time if the first fails
     */
    setXY: function(node, xy, noRetry) {
        var setStyle = Y.DOM.setStyle,
            pos,
            delta,
            newXY,
            currentXY;

        if (node && xy) {
            pos = Y.DOM.getStyle(node, POSITION);

            delta = Y.DOM._getOffset(node);       

            if (pos == 'static') { // default to relative
                pos = RELATIVE;
                setStyle(node, POSITION, pos);
            }

            currentXY = Y.DOM.getXY(node);

            if (xy[0] !== null) {
                setStyle(node, LEFT, xy[0] - currentXY[0] + delta[0] + 'px');
            }

            if (xy[1] !== null) {
                setStyle(node, TOP, xy[1] - currentXY[1] + delta[1] + 'px');
            }

            if (!noRetry) {
                newXY = Y.DOM.getXY(node);
                if (newXY[0] !== xy[0] || newXY[1] !== xy[1]) {
                    Y.DOM.setXY(node, xy, true); 
                }
            }
          
        } else {
        }
    },

    /**
     * Set the X position of an html element in page coordinates, regardless of how the element is positioned.
     * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setX
     * @param element The target element
     * @param {Int} x The X values for new position (coordinates are page-based)
     */
    setX: function(node, x) {
        return Y.DOM.setXY(node, [x, null]);
    },

    /**
     * Set the Y position of an html element in page coordinates, regardless of how the element is positioned.
     * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setY
     * @param element The target element
     * @param {Int} y The Y values for new position (coordinates are page-based)
     */
    setY: function(node, y) {
        return Y.DOM.setXY(node, [null, y]);
    },

    _calcBorders: function(node, xy2) {
        var t = parseInt(Y.DOM[GET_COMPUTED_STYLE](node, BORDER_TOP_WIDTH), 10) || 0,
            l = parseInt(Y.DOM[GET_COMPUTED_STYLE](node, BORDER_LEFT_WIDTH), 10) || 0;
        if (Y.UA.gecko) {
            if (RE_TABLE.test(node.tagName)) {
                t = 0;
                l = 0;
            }
        }
        xy2[0] += l;
        xy2[1] += t;
        return xy2;
    },

    _getWinSize: function(node) {
        var doc = Y.DOM._getDoc(),
            win = doc.defaultView || doc.parentWindow,
            mode = doc[COMPAT_MODE],
            h = win.innerHeight,
            w = win.innerWidth,
            root = doc[DOCUMENT_ELEMENT];

        if ( mode && !Y.UA.opera ) { // IE, Gecko
            if (mode != 'CSS1Compat') { // Quirks
                root = doc.body; 
            }
            h = root.clientHeight;
            w = root.clientWidth;
        }
        return { height: h, width: w }; 
    },

    _getDocSize: function(node) {
        var doc = Y.DOM._getDoc(),
            root = doc[DOCUMENT_ELEMENT];

        if (doc[COMPAT_MODE] != 'CSS1Compat') {
            root = doc.body;
        }

        return { height: root.scrollHeight, width: root.scrollWidth };
    }
});
})(Y);
(function(Y) {
var TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    LEFT = 'left',

    getOffsets = function(r1, r2) {
        var t = Math.max(r1[TOP], r2[TOP]),
            r = Math.min(r1[RIGHT], r2[RIGHT]),
            b = Math.min(r1[BOTTOM], r2[BOTTOM]),
            l = Math.max(r1[LEFT], r2[LEFT]),
            ret = {};
        
        ret[TOP] = t;
        ret[RIGHT] = r;
        ret[BOTTOM] = b;
        ret[LEFT] = l;
        return ret;
    },

    DOM = Y.DOM;

Y.mix(DOM, {
    /**
     * Returns an Object literal containing the following about this element: (top, right, bottom, left)
     * @method region
     * @param {HTMLElement} element The DOM element. 
     @return {Object} Object literal containing the following about this element: (top, right, bottom, left)
     */
    region: function(node) {
        var xy = DOM.getXY(node),
            ret = false;
        
        if (node && xy) {
            ret = DOM._getRegion(
                xy[1], // top
                xy[0] + node.offsetWidth, // right
                xy[1] + node.offsetHeight, // bottom
                xy[0] // left
            );
        }

        return ret;
    },

    /**
     * Find the intersect information for the passes nodes.
     * @method intersect
     * @param {HTMLElement} element The first element 
     * @param {HTMLElement | Object} element2 The element or region to check the interect with
     * @param {Object} altRegion An object literal containing the region for the first element if we already have the data (for performance i.e. DragDrop)
     @return {Object} Object literal containing the following intersection data: (top, right, bottom, left, area, yoff, xoff, inRegion)
     */
    intersect: function(node, node2, altRegion) {
        var r = altRegion || DOM.region(node), region = {},
            n = node2,
            off;

        if (n.tagName) {
            region = DOM.region(n);
        } else if (Y.Lang.isObject(node2)) {
            region = node2;
        } else {
            return false;
        }
        
        off = getOffsets(region, r);
        return {
            top: off[TOP],
            right: off[RIGHT],
            bottom: off[BOTTOM],
            left: off[LEFT],
            area: ((off[BOTTOM] - off[TOP]) * (off[RIGHT] - off[LEFT])),
            yoff: ((off[BOTTOM] - off[TOP])),
            xoff: (off[RIGHT] - off[LEFT]),
            inRegion: DOM.inRegion(node, node2, false, altRegion)
        };
        
    },
    /**
     * Check if any part of this node is in the passed region
     * @method inRegion
     * @param {Object} node2 The node to get the region from or an Object literal of the region
     * $param {Boolean} all Should all of the node be inside the region
     * @param {Object} altRegion An object literal containing the region for this node if we already have the data (for performance i.e. DragDrop)
     * @return {Boolean} True if in region, false if not.
     */
    inRegion: function(node, node2, all, altRegion) {
        var region = {},
            r = altRegion || DOM.region(node),
            n = node2,
            off;

        if (n.tagName) {
            region = DOM.region(n);
        } else if (Y.Lang.isObject(node2)) {
            region = node2;
        } else {
            return false;
        }
            
        if (all) {
            return (
                r[LEFT]   >= region[LEFT]   &&
                r[RIGHT]  <= region[RIGHT]  && 
                r[TOP]    >= region[TOP]    && 
                r[BOTTOM] <= region[BOTTOM]  );
        } else {
            off = getOffsets(region, r);
            if (off[BOTTOM] >= off[TOP] && off[RIGHT] >= off[LEFT]) {
                return true;
            } else {
                return false;
            }
            
        }
    },

    /**
     * Check if any part of this element is in the viewport
     * @method inViewportRegion
     * @param {HTMLElement} element The DOM element. 
     * @param {Boolean} all Should all of the node be inside the region
     * @param {Object} altRegion An object literal containing the region for this node if we already have the data (for performance i.e. DragDrop)
     * @return {Boolean} True if in region, false if not.
     */
    inViewportRegion: function(node, all, altRegion) {
        return DOM.inRegion(node, DOM.viewportRegion(node), all, altRegion);
            
    },

    _getRegion: function(t, r, b, l) {
        var region = {};

        region[TOP] = region[1] = t;
        region[LEFT] = region[0] = l;
        region[BOTTOM] = b;
        region[RIGHT] = r;
        region.width = region[RIGHT] - region[LEFT];
        region.height = region[BOTTOM] - region[TOP];

        return region;
    },

    /**
     * Returns an Object literal containing the following about the visible region of viewport: (top, right, bottom, left)
     * @method viewportRegion
     @return {Object} Object literal containing the following about the visible region of the viewport: (top, right, bottom, left)
     */
    viewportRegion: function(node) {
        node = node || Y.config.doc.documentElement;
        var ret = false,
            scrollX,
            scrollY;

        if (node) {
            scrollX = DOM.docScrollX(node);
            scrollY = DOM.docScrollY(node);

            ret = DOM._getRegion(scrollY, // top
                DOM.winWidth(node) + scrollX, // right
                scrollY + DOM.winHeight(node), // bottom
                scrollX); // left
        }

        return ret;
    }
});
})(Y);


}, '3.0.0' ,{requires:['dom-base', 'dom-style']});
YUI.add('selector-native', function(Y) {

(function(Y) {
/**
 * The selector-native module provides support for native querySelector
 * @module dom
 * @submodule selector-native
 * @for Selector
 */

/**
 * Provides support for using CSS selectors to query the DOM 
 * @class Selector 
 * @static
 * @for Selector
 */

Y.namespace('Selector'); // allow native module to standalone

var COMPARE_DOCUMENT_POSITION = 'compareDocumentPosition',
    OWNER_DOCUMENT = 'ownerDocument',
    TMP_PREFIX = 'yui-tmp-',
    g_counter = 0;

var Selector = {
    _foundCache: [],

    useNative: true,

    _compare: ('sourceIndex' in document.documentElement) ?
        function(nodeA, nodeB) {
            var a = nodeA.sourceIndex,
                b = nodeB.sourceIndex;

            if (a === b) {
                return 0;
            } else if (a > b) {
                return 1;
            }

            return -1;

        } : (document.documentElement[COMPARE_DOCUMENT_POSITION] ?
        function(nodeA, nodeB) {
            if (nodeA[COMPARE_DOCUMENT_POSITION](nodeB) & 4) {
                return -1;
            } else {
                return 1;
            }
        } :
        function(nodeA, nodeB) {
            var rangeA, rangeB, compare;
            if (nodeA && nodeB) {
                rangeA = nodeA[OWNER_DOCUMENT].createRange();
                rangeA.setStart(nodeA, 0);
                rangeB = nodeB[OWNER_DOCUMENT].createRange();
                rangeB.setStart(nodeB, 0);
                compare = rangeA.compareBoundaryPoints(1, rangeB); // 1 === Range.START_TO_END
            }

            return compare;
        
    }),

    _sort: function(nodes) {
        if (nodes) {
            nodes = Y.Array(nodes, 0, true);
            if (nodes.sort) {
                nodes.sort(Selector._compare);
            }
        }

        return nodes;
    },

    _deDupe: function(nodes) {
        var ret = [],
            i, node;

        for (i = 0; (node = nodes[i++]);) {
            if (!node._found) {
                ret[ret.length] = node;
                node._found = true;
            }
        }

        for (i = 0; (node = ret[i++]);) {
            node._found = null;
            node.removeAttribute('_found');
        }

        return ret;
    },

    /**
     * Retrieves a set of nodes based on a given CSS selector. 
     * @method query
     *
     * @param {string} selector The CSS Selector to test the node against.
     * @param {HTMLElement} root optional An HTMLElement to start the query from. Defaults to Y.config.doc
     * @param {Boolean} firstOnly optional Whether or not to return only the first match.
     * @return {Array} An array of nodes that match the given selector.
     * @static
     */
    query: function(selector, root, firstOnly, skipNative) {
        root = root || Y.config.doc;
        var ret = [],
            useNative = (Y.Selector.useNative && document.querySelector && !skipNative),
            queries = [[selector, root]],
            query,
            result,
            i,
            fn = (useNative) ? Y.Selector._nativeQuery : Y.Selector._bruteQuery;

        if (selector && fn) {
            // split group into seperate queries
            if (!skipNative && // already done if skipping
                    (!useNative || root.tagName)) { // split native when element scoping is needed
                queries = Selector._splitQueries(selector, root);
            }

            for (i = 0; (query = queries[i++]);) {
                result = fn(query[0], query[1], firstOnly);
                if (!firstOnly) { // coerce DOM Collection to Array
                    result = Y.Array(result, 0, true);
                }
                if (result) {
                    ret = ret.concat(result);
                }
            }

            if (queries.length > 1) { // remove dupes and sort by doc order 
                ret = Selector._sort(Selector._deDupe(ret));
            }
        }

        return (firstOnly) ? (ret[0] || null) : ret;

    },

    // allows element scoped queries to begin with combinator
    // e.g. query('> p', document.body) === query('body > p')
    _splitQueries: function(selector, node) {
        var groups = selector.split(','),
            queries = [],
            prefix = '',
            i, len;

        if (node) {
            // enforce for element scoping
            if (node.tagName) {
                node.id = node.id || Y.guid();
                prefix = '#' + node.id + ' ';
            }

            for (i = 0, len = groups.length; i < len; ++i) {
                selector =  prefix + groups[i];
                queries.push([selector, node]);
            }
        }

        return queries;
    },

    _nativeQuery: function(selector, root, one) {
        try {
            return root['querySelector' + (one ? '' : 'All')](selector);
        } catch(e) { // fallback to brute if available
            return Y.Selector.query(selector, root, one, true); // redo with skipNative true
        }
    },

    filter: function(nodes, selector) {
        var ret = [],
            i, node;

        if (nodes && selector) {
            for (i = 0; (node = nodes[i++]);) {
                if (Y.Selector.test(node, selector)) {
                    ret[ret.length] = node;
                }
            }
        } else {
        }

        return ret;
    },

    test: function(node, selector, root) {
        var ret = false,
            groups = selector.split(','),
            item,
            i, group;

        if (node && node.tagName) { // only test HTMLElements
            root = root || node.ownerDocument;

            if (!node.id) {
                node.id = TMP_PREFIX + g_counter++;
            }
            for (i = 0; (group = groups[i++]);) { // TODO: off-dom test
                group += '#' + node.id; // add ID for uniqueness
                item = Y.Selector.query(group, root, true);
                ret = (item === node);
                if (ret) {
                    break;
                }
            }
        }

        return ret;
    }
};

Y.mix(Y.Selector, Selector, true);

})(Y);


}, '3.0.0' ,{requires:['dom-base']});
YUI.add('selector-css2', function(Y) {

/**
 * The selector module provides helper methods allowing CSS2 Selectors to be used with DOM elements.
 * @module dom
 * @submodule selector-css2
 * @for Selector
 */

/**
 * Provides helper methods for collecting and filtering DOM elements.
 */

var PARENT_NODE = 'parentNode',
    TAG_NAME = 'tagName',
    ATTRIBUTES = 'attributes',
    COMBINATOR = 'combinator',
    PSEUDOS = 'pseudos',

    Selector = Y.Selector,

    SelectorCSS2 = {
        SORT_RESULTS: true,
        _children: function(node, tag) {
            var ret = node.children,
                i,
                children = [],
                childNodes,
                child;

            if (node.children && tag && node.children.tags) {
                children = node.children.tags(tag);
            } else if ((!ret && node[TAG_NAME]) || (ret && tag)) { // only HTMLElements have children
                childNodes = ret || node.childNodes;
                ret = [];
                for (i = 0; (child = childNodes[i++]);) {
                    if (child.tagName) {
                        if (!tag || tag === child.tagName) {
                            ret.push(child);
                        }
                    }
                }
            }

            return ret || [];
        },

        _regexCache: {},

        _re: {
            attr: /(\[.*\])/g,
            pseudos: /:([\-\w]+(?:\(?:['"]?(.+)['"]?\)))*/i
        },

        /**
         * Mapping of shorthand tokens to corresponding attribute selector 
         * @property shorthand
         * @type object
         */
        shorthand: {
            '\\#(-?[_a-z]+[-\\w]*)': '[id=$1]',
            '\\.(-?[_a-z]+[-\\w]*)': '[className~=$1]'
        },

        /**
         * List of operators and corresponding boolean functions. 
         * These functions are passed the attribute and the current node's value of the attribute.
         * @property operators
         * @type object
         */
        operators: {
            '': function(node, attr) { return Y.DOM.getAttribute(node, attr) !== ''; }, // Just test for existence of attribute
            //'': '.+',
            //'=': '^{val}$', // equality
            '~=': '(?:^|\\s+){val}(?:\\s+|$)', // space-delimited
            '|=': '^{val}-?' // optional hyphen-delimited
        },

        pseudos: {
           'first-child': function(node) { 
                return Y.Selector._children(node[PARENT_NODE])[0] === node; 
            } 
        },

        _bruteQuery: function(selector, root, firstOnly) {
            var ret = [],
                nodes = [],
                tokens = Selector._tokenize(selector),
                token = tokens[tokens.length - 1],
                rootDoc = Y.DOM._getDoc(root),
                id,
                className,
                tagName;


            // if we have an initial ID, set to root when in document
            if (tokens[0] && rootDoc === root &&  
                    (id = tokens[0].id) &&
                    rootDoc.getElementById(id)) {
                root = rootDoc.getElementById(id);
            }

            if (token) {
                // prefilter nodes
                id = token.id;
                className = token.className;
                tagName = token.tagName || '*';

                // try ID first
                if (id) {
                    if (rootDoc.getElementById(id)) { // if in document
                    nodes = [rootDoc.getElementById(id)]; // TODO: DOM.byId?
                }
                // try className if supported
                } else if (className) {
                    nodes = root.getElementsByClassName(className);
                } else if (tagName) { // default to tagName
                    nodes = root.getElementsByTagName(tagName || '*');
                }

                if (nodes.length) {
                    ret = Selector._filterNodes(nodes, tokens, firstOnly);
                }
            }

            return ret;
        },
        
        _filterNodes: function(nodes, tokens, firstOnly) {
            var i = 0,
                j,
                len = tokens.length,
                n = len - 1,
                result = [],
                node = nodes[0],
                tmpNode = node,
                getters = Y.Selector.getters,
                operator,
                combinator,
                token,
                path,
                pass,
                //FUNCTION = 'function',
                value,
                tests,
                test;

            //do {
            for (i = 0; (tmpNode = node = nodes[i++]);) {
                n = len - 1;
                path = null;
                
                testLoop:
                while (tmpNode && tmpNode.tagName) {
                    token = tokens[n];
                    tests = token.tests;
                    j = tests.length;
                    if (j && !pass) {
                        while ((test = tests[--j])) {
                            operator = test[1];
                            if (getters[test[0]]) {
                                value = getters[test[0]](tmpNode, test[0]);
                            } else {
                                value = tmpNode[test[0]];
                                // use getAttribute for non-standard attributes
                                if (value === undefined && tmpNode.getAttribute) {
                                    value = tmpNode.getAttribute(test[0]);
                                }
                            }

                            if ((operator === '=' && value !== test[2]) ||  // fast path for equality
                                (operator.test && !operator.test(value)) ||  // regex test
                                (operator.call && !operator(tmpNode, test[0]))) { // function test

                                // skip non element nodes or non-matching tags
                                if ((tmpNode = tmpNode[path])) {
                                    while (tmpNode &&
                                        (!tmpNode.tagName ||
                                            (token.tagName && token.tagName !== tmpNode.tagName))
                                    ) {
                                        tmpNode = tmpNode[path]; 
                                    }
                                }
                                continue testLoop;
                            }
                        }
                    }

                    n--; // move to next token
                    // now that we've passed the test, move up the tree by combinator
                    if (!pass && (combinator = token.combinator)) {
                        path = combinator.axis;
                        tmpNode = tmpNode[path];

                        // skip non element nodes
                        while (tmpNode && !tmpNode.tagName) {
                            tmpNode = tmpNode[path]; 
                        }

                        if (combinator.direct) { // one pass only
                            path = null; 
                        }

                    } else { // success if we made it this far
                        result.push(node);
                        if (firstOnly) {
                            return result;
                        }
                        break;
                    }
                }
            }// while (tmpNode = node = nodes[++i]);
            node = tmpNode = null;
            return result;
        },

        _getRegExp: function(str, flags) {
            var regexCache = Selector._regexCache;
            flags = flags || '';
            if (!regexCache[str + flags]) {
                regexCache[str + flags] = new RegExp(str, flags);
            }
            return regexCache[str + flags];
        },

        combinators: {
            ' ': {
                axis: 'parentNode'
            },

            '>': {
                axis: 'parentNode',
                direct: true
            },


            '+': {
                axis: 'previousSibling',
                direct: true
            }
        },

        _parsers: [
            {
                name: ATTRIBUTES,
                re: /^\[([a-z]+\w*)+([~\|\^\$\*!=]=?)?['"]?([^\]]*?)['"]?\]/i,
                fn: function(match, token) {
                    var operator = match[2] || '',
                        operators = Y.Selector.operators,
                        test;

                    // add prefiltering for ID and CLASS
                    if ((match[1] === 'id' && operator === '=') ||
                            (match[1] === 'className' &&
                            document.getElementsByClassName &&
                            (operator === '~=' || operator === '='))) {
                        token.prefilter = match[1];
                        token[match[1]] = match[3];
                    }

                    // add tests
                    if (operator in operators) {
                        test = operators[operator];
                        if (typeof test === 'string') {
                            test = Y.Selector._getRegExp(test.replace('{val}', match[3]));
                        }
                        match[2] = test;
                    }
                    if (!token.last || token.prefilter !== match[1]) {
                        return match.slice(1);
                    }
                }

            },
            {
                name: TAG_NAME,
                re: /^((?:-?[_a-z]+[\w-]*)|\*)/i,
                fn: function(match, token) {
                    var tag = match[1].toUpperCase();
                    token.tagName = tag;

                    if (tag !== '*' && (!token.last || token.prefilter)) {
                        return [TAG_NAME, '=', tag];
                    }
                    if (!token.prefilter) {
                        token.prefilter = 'tagName';
                    }
                }
            },
            {
                name: COMBINATOR,
                re: /^\s*([>+~]|\s)\s*/,
                fn: function(match, token) {
                }
            },
            {
                name: PSEUDOS,
                re: /^:([\-\w]+)(?:\(['"]?(.+)['"]?\))*/i,
                fn: function(match, token) {
                    var test = Selector[PSEUDOS][match[1]];
                    if (test) { // reorder match array
                        return [match[2], test];
                    } else { // selector token not supported (possibly missing CSS3 module)
                        return false;
                    }
                }
            }
            ],

        _getToken: function(token) {
            return {
                tagName: null,
                id: null,
                className: null,
                attributes: {},
                combinator: null,
                tests: []
            };
        },

        /**
            Break selector into token units per simple selector.
            Combinator is attached to the previous token.
         */
        _tokenize: function(selector) {
            selector = selector || '';
            selector = Selector._replaceShorthand(Y.Lang.trim(selector)); 
            var token = Selector._getToken(),     // one token per simple selector (left selector holds combinator)
                query = selector, // original query for debug report
                tokens = [],    // array of tokens
                found = false,  // whether or not any matches were found this pass
                match,         // the regex match
                test,
                i, parser;

            /*
                Search for selector patterns, store, and strip them from the selector string
                until no patterns match (invalid selector) or we run out of chars.

                Multiple attributes and pseudos are allowed, in any order.
                for example:
                    'form:first-child[type=button]:not(button)[lang|=en]'
            */
            outer:
            do {
                found = false; // reset after full pass
                for (i = 0; (parser = Selector._parsers[i++]);) {
                    if ( (match = parser.re.exec(selector)) ) { // note assignment
                        if (parser !== COMBINATOR ) {
                            token.selector = selector;
                        }
                        selector = selector.replace(match[0], ''); // strip current match from selector
                        if (!selector.length) {
                            token.last = true;
                        }

                        if (Selector._attrFilters[match[1]]) { // convert class to className, etc.
                            match[1] = Selector._attrFilters[match[1]];
                        }

                        test = parser.fn(match, token);
                        if (test === false) { // selector not supported
                            found = false;
                            break outer;
                        } else if (test) {
                            token.tests.push(test);
                        }

                        if (!selector.length || parser.name === COMBINATOR) {
                            tokens.push(token);
                            token = Selector._getToken(token);
                            if (parser.name === COMBINATOR) {
                                token.combinator = Y.Selector.combinators[match[1]];
                            }
                        }
                        found = true;
                    }
                }
            } while (found && selector.length);

            if (!found || selector.length) { // not fully parsed
                tokens = [];
            }
            return tokens;
        },

        _replaceShorthand: function(selector) {
            var shorthand = Selector.shorthand,
                attrs = selector.match(Selector._re.attr), // pull attributes to avoid false pos on "." and "#"
                pseudos = selector.match(Selector._re.pseudos), // pull attributes to avoid false pos on "." and "#"
                re, i, len;

            if (pseudos) {
                selector = selector.replace(Selector._re.pseudos, '!!REPLACED_PSEUDO!!');
            }

            if (attrs) {
                selector = selector.replace(Selector._re.attr, '!!REPLACED_ATTRIBUTE!!');
            }

            for (re in shorthand) {
                if (shorthand.hasOwnProperty(re)) {
                    selector = selector.replace(Selector._getRegExp(re, 'gi'), shorthand[re]);
                }
            }

            if (attrs) {
                for (i = 0, len = attrs.length; i < len; ++i) {
                    selector = selector.replace('!!REPLACED_ATTRIBUTE!!', attrs[i]);
                }
            }
            if (pseudos) {
                for (i = 0, len = pseudos.length; i < len; ++i) {
                    selector = selector.replace('!!REPLACED_PSEUDO!!', pseudos[i]);
                }
            }
            return selector;
        },

        _attrFilters: {
            'class': 'className',
            'for': 'htmlFor'
        },

        getters: {
            href: function(node, attr) {
                return Y.DOM.getAttribute(node, attr);
            }
        }
    };

Y.mix(Y.Selector, SelectorCSS2, true);
Y.Selector.getters.src = Y.Selector.getters.rel = Y.Selector.getters.href;

// IE wants class with native queries
if (Y.Selector.useNative && document.querySelector) {
    Y.Selector.shorthand['\\.(-?[_a-z]+[-\\w]*)'] = '[class~=$1]';
}



}, '3.0.0' ,{requires:['selector-native']});


YUI.add('selector', function(Y){}, '3.0.0' ,{use:['selector-native', 'selector-css2']});



YUI.add('dom', function(Y){}, '3.0.0' ,{use:['dom-base', 'dom-style', 'dom-screen', 'selector']});

/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
YUI.add('event-custom-base', function(Y) {

/**
 * Custom event engine, DOM event listener abstraction layer, synthetic DOM
 * events.
 * @module event-custom
 */

Y.Env.evt = {
    handles: {},
    plugins: {}
};


/**
 * Custom event engine, DOM event listener abstraction layer, synthetic DOM 
 * events.
 * @module event-custom
 * @submodule event-custom-base
 */
(function() {

/**
 * Allows for the insertion of methods that are executed before or after
 * a specified method
 * @class Do
 * @static
 */

var BEFORE = 0,
    AFTER = 1;

Y.Do = {

    /**
     * Cache of objects touched by the utility
     * @property objs
     * @static
     */
    objs: {},

    /**
     * Execute the supplied method before the specified function
     * @method before
     * @param fn {Function} the function to execute
     * @param obj the object hosting the method to displace
     * @param sFn {string} the name of the method to displace
     * @param c The execution context for fn
     * @return {string} handle for the subscription
     * @static
     */
    before: function(fn, obj, sFn, c) {
        var f = fn, a;
        if (c) {
            a = [fn, c].concat(Y.Array(arguments, 4, true));
            f = Y.rbind.apply(Y, a);
        }

        return this._inject(BEFORE, f, obj, sFn);
    },

    /**
     * Execute the supplied method after the specified function
     * @method after
     * @param fn {Function} the function to execute
     * @param obj the object hosting the method to displace
     * @param sFn {string} the name of the method to displace
     * @param c The execution context for fn
     * @return {string} handle for the subscription
     * @static
     */
    after: function(fn, obj, sFn, c) {
        var f = fn, a;
        if (c) {
            a = [fn, c].concat(Y.Array(arguments, 4, true));
            f = Y.rbind.apply(Y, a);
        }

        return this._inject(AFTER, f, obj, sFn);
    },

    /**
     * Execute the supplied method after the specified function
     * @method _inject
     * @param when {string} before or after
     * @param fn {Function} the function to execute
     * @param obj the object hosting the method to displace
     * @param sFn {string} the name of the method to displace
     * @param c The execution context for fn
     * @return {string} handle for the subscription
     * @private
     * @static
     */
    _inject: function(when, fn, obj, sFn) {

        // object id
        var id = Y.stamp(obj), o, sid;

        if (! this.objs[id]) {
            // create a map entry for the obj if it doesn't exist
            this.objs[id] = {};
        }

        o = this.objs[id];

        if (! o[sFn]) {
            // create a map entry for the method if it doesn't exist
            o[sFn] = new Y.Do.Method(obj, sFn);

            // re-route the method to our wrapper
            obj[sFn] = 
                function() {
                    return o[sFn].exec.apply(o[sFn], arguments);
                };
        }

        // subscriber id
        sid = id + Y.stamp(fn) + sFn;

        // register the callback
        o[sFn].register(sid, fn, when);

        return new Y.EventHandle(o[sFn], sid);

    },

    /**
     * Detach a before or after subscription
     * @method detach
     * @param handle {string} the subscription handle
     */
    detach: function(handle) {

        if (handle.detach) {
            handle.detach();
        }

    },

    _unload: function(e, me) {

    }
};

//////////////////////////////////////////////////////////////////////////

/**
 * Wrapper for a displaced method with aop enabled
 * @class Do.Method
 * @constructor
 * @param obj The object to operate on
 * @param sFn The name of the method to displace
 */
Y.Do.Method = function(obj, sFn) {
    this.obj = obj;
    this.methodName = sFn;
    this.method = obj[sFn];
    this.before = {};
    this.after = {};
};

/**
 * Register a aop subscriber
 * @method register
 * @param sid {string} the subscriber id
 * @param fn {Function} the function to execute
 * @param when {string} when to execute the function
 */
Y.Do.Method.prototype.register = function (sid, fn, when) {
    if (when) {
        this.after[sid] = fn;
    } else {
        this.before[sid] = fn;
    }
};

/**
 * Unregister a aop subscriber
 * @method delete
 * @param sid {string} the subscriber id
 * @param fn {Function} the function to execute
 * @param when {string} when to execute the function
 */
Y.Do.Method.prototype._delete = function (sid) {
    delete this.before[sid];
    delete this.after[sid];
};

/**
 * Execute the wrapped method
 * @method exec
 */
Y.Do.Method.prototype.exec = function () {

    var args = Y.Array(arguments, 0, true), 
        i, ret, newRet, 
        bf = this.before,
        af = this.after,
        prevented = false;

    // execute before
    for (i in bf) {
        if (bf.hasOwnProperty(i)) {
            ret = bf[i].apply(this.obj, args);
            if (ret) {
                switch (ret.constructor) {
                    case Y.Do.Halt:
                        return ret.retVal;
                    case Y.Do.AlterArgs:
                        args = ret.newArgs;
                        break;
                    case Y.Do.Prevent:
                        prevented = true;
                        break;
                    default:
                }
            }
        }
    }

    // execute method
    if (!prevented) {
        ret = this.method.apply(this.obj, args);
    }

    // execute after methods.
    for (i in af) {
        if (af.hasOwnProperty(i)) {
            newRet = af[i].apply(this.obj, args);
            // Stop processing if a Halt object is returned
            if (newRet && newRet.constructor == Y.Do.Halt) {
                return newRet.retVal;
            // Check for a new return value
            } else if (newRet && newRet.constructor == Y.Do.AlterReturn) {
                ret = newRet.newRetVal;
            }
        }
    }

    return ret;
};

//////////////////////////////////////////////////////////////////////////


/**
 * Return an AlterArgs object when you want to change the arguments that
 * were passed into the function.  An example would be a service that scrubs
 * out illegal characters prior to executing the core business logic.
 * @class Do.AlterArgs
 */
Y.Do.AlterArgs = function(msg, newArgs) {
    this.msg = msg;
    this.newArgs = newArgs;
};

/**
 * Return an AlterReturn object when you want to change the result returned
 * from the core method to the caller
 * @class Do.AlterReturn
 */
Y.Do.AlterReturn = function(msg, newRetVal) {
    this.msg = msg;
    this.newRetVal = newRetVal;
};

/**
 * Return a Halt object when you want to terminate the execution
 * of all subsequent subscribers as well as the wrapped method
 * if it has not exectued yet.
 * @class Do.Halt
 */
Y.Do.Halt = function(msg, retVal) {
    this.msg = msg;
    this.retVal = retVal;
};

/**
 * Return a Prevent object when you want to prevent the wrapped function
 * from executing, but want the remaining listeners to execute
 * @class Do.Prevent
 */
Y.Do.Prevent = function(msg) {
    this.msg = msg;
};

/**
 * Return an Error object when you want to terminate the execution
 * of all subsequent method calls.
 * @class Do.Error
 * @deprecated use Y.Do.Halt or Y.Do.Prevent
 */
Y.Do.Error = Y.Do.Halt;

//////////////////////////////////////////////////////////////////////////

// Y["Event"] && Y.Event.addListener(window, "unload", Y.Do._unload, Y.Do);

})();

/**
 * Custom event engine, DOM event listener abstraction layer, synthetic DOM 
 * events.
 * @module event-custom
 * @submodule event-custom-base
 */

/**
 * Return value from all subscribe operations
 * @class EventHandle
 * @constructor
 * @param evt {CustomEvent} the custom event
 * @param sub {Subscriber} the subscriber
 */

// var onsubscribeType = "_event:onsub",
var AFTER = 'after', 
    CONFIGS = [
        'broadcast',
        'bubbles',
        'context',
        'contextFn',
        'currentTarget',
        'defaultFn',
        'details',
        'emitFacade',
        'fireOnce',
        'host',
        'preventable',
        'preventedFn',
        'queuable',
        'silent',
        'stoppedFn',
        'target',
        'type'
    ],


    YUI3_SIGNATURE = 9,
    YUI_LOG = 'yui:log';

Y.EventHandle = function(evt, sub) {

    /**
     * The custom event
     * @type CustomEvent
     */
    this.evt = evt;

    /**
     * The subscriber object
     * @type Subscriber
     */
    this.sub = sub;
};

Y.EventHandle.prototype = {

    /**
     * Detaches this subscriber
     * @method detach
     */
    detach: function() {
        var evt = this.evt, i;
        if (evt) {
            if (Y.Lang.isArray(evt)) {
                for (i=0; i<evt.length; i++) {
                    evt[i].detach();
                }
            } else { 
                evt._delete(this.sub);
            }
        }
    }
};

/**
 * The CustomEvent class lets you define events for your application
 * that can be subscribed to by one or more independent component.
 *
 * @param {String}  type The type of event, which is passed to the callback
 *                  when the event fires
 * @param o configuration object
 * @class CustomEvent
 * @constructor
 */
Y.CustomEvent = function(type, o) {

    // if (arguments.length > 2) {
// this.log('CustomEvent context and silent are now in the config', 'warn', 'Event');
    // }

    o = o || {};

    this.id = Y.stamp(this);

    /**
     * The type of event, returned to subscribers when the event fires
     * @property type
     * @type string
     */
    this.type = type;

    /**
     * The context the the event will fire from by default.  Defaults to the YUI
     * instance.
     * @property context
     * @type object
     */
    this.context = Y;

    this.logSystem = (type == YUI_LOG);

    /**
     * If 0, this event does not broadcast.  If 1, the YUI instance is notified
     * every time this event fires.  If 2, the YUI instance and the YUI global
     * (if event is enabled on the global) are notified every time this event
     * fires.
     * @property broadcast
     * @type int
     */
    // this.broadcast = 0;

    /**
     * By default all custom events are logged in the debug build, set silent
     * to true to disable debug outpu for this event.
     * @property silent
     * @type boolean
     */
    this.silent = this.logSystem;

    /**
     * Specifies whether this event should be queued when the host is actively
     * processing an event.  This will effect exectution order of the callbacks
     * for the various events.
     * @property queuable
     * @type boolean
     * @default false
     */
    // this.queuable = false;

    /**
     * The subscribers to this event
     * @property subscribers
     * @type Subscriber{}
     */
    this.subscribers = {};

    /**
     * 'After' subscribers
     * @property afters
     * @type Subscriber{}
     */
    this.afters = {};

    /**
     * This event has fired if true
     *
     * @property fired
     * @type boolean
     * @default false;
     */
    // this.fired = false;

    /**
     * An array containing the arguments the custom event
     * was last fired with.
     * @property firedWith
     * @type Array
     */
    // this.firedWith;

    /**
     * This event should only fire one time if true, and if
     * it has fired, any new subscribers should be notified
     * immediately.
     *
     * @property fireOnce
     * @type boolean
     * @default false;
     */
    // this.fireOnce = false;

    /**
     * Flag for stopPropagation that is modified during fire()
     * 1 means to stop propagation to bubble targets.  2 means
     * to also stop additional subscribers on this target.
     * @property stopped
     * @type int
     */
    // this.stopped = 0;

    /**
     * Flag for preventDefault that is modified during fire().
     * if it is not 0, the default behavior for this event
     * @property prevented
     * @type int
     */
    // this.prevented = 0;

    /**
     * Specifies the host for this custom event.  This is used
     * to enable event bubbling
     * @property host
     * @type EventTarget
     */
    // this.host = null;

    /**
     * The default function to execute after event listeners
     * have fire, but only if the default action was not
     * prevented.
     * @property defaultFn
     * @type Function
     */
    // this.defaultFn = null;

    /**
     * The function to execute if a subscriber calls
     * stopPropagation or stopImmediatePropagation
     * @property stoppedFn
     * @type Function
     */
    // this.stoppedFn = null;

    /**
     * The function to execute if a subscriber calls
     * preventDefault
     * @property preventedFn
     * @type Function
     */
    // this.preventedFn = null;

    /**
     * Specifies whether or not this event's default function
     * can be cancelled by a subscriber by executing preventDefault() 
     * on the event facade 
     * @property preventable 
     * @type boolean 
     * @default true
     */
    this.preventable = true;

    /**
     * Specifies whether or not a subscriber can stop the event propagation
     * via stopPropagation(), stopImmediatePropagation(), or halt()
     * @property bubbles
     * @type boolean
     * @default true
     */
    this.bubbles = true;

    /**
     * Supports multiple options for listener signatures in order to
     * port YUI 2 apps.
     * @property signature
     * @type int
     * @default 9
     */
    this.signature = YUI3_SIGNATURE;

    // this.hasSubscribers = false;

    // this.hasAfters = false;

    /**
     * If set to true, the custom event will deliver an EventFacade object
     * that is similar to a DOM event object.
     * @property emitFacade
     * @type boolean
     * @default false
     */
    // this.emitFacade = false;

    this.applyConfig(o, true);

    // this.log("Creating " + this.type);

};

Y.CustomEvent.prototype = {

    /**
     * Apply configuration properties.  Only applies the CONFIG whitelist
     * @method applyConfig
     * @param o hash of properties to apply
     * @param force {boolean} if true, properties that exist on the event 
     * will be overwritten.
     */
    applyConfig: function(o, force) {
        if (o) {
            Y.mix(this, o, force, CONFIGS);
        }
    },

    _on: function(fn, context, args, when) {

        if (!fn) {
            this.log("Invalid callback for CE: " + this.type);
        }

        var s = new Y.Subscriber(fn, context, args, when);

        if (this.fireOnce && this.fired) {
            Y.later(0, this, Y.bind(this._notify, this, s, this.firedWith));
        }

        if (when == AFTER) {
            this.afters[s.id] = s;
            this.hasAfters = true;
        } else {
            this.subscribers[s.id] = s;
            this.hasSubscribers = true;
        }

        return new Y.EventHandle(this, s);

    },

    /**
     * Listen for this event
     * @method subscribe
     * @param {Function} fn        The function to execute
     * @return {EventHandle|EventTarget} unsubscribe handle or a
     * chainable event target depending on the 'chain' config.
     * @deprecated use on
     */
    subscribe: function(fn, context) {
        var a = (arguments.length > 2) ? Y.Array(arguments, 2, true): null;
        return this._on(fn, context, a, true);
    },

    /**
     * Listen for this event
     * @method on
     * @param {Function} fn        The function to execute
     * @return {EventHandle|EventTarget} unsubscribe handle or a
     * chainable event target depending on the 'chain' config.
     */
    on: function(fn, context) {
        var a = (arguments.length > 2) ? Y.Array(arguments, 2, true): null;
        return this._on(fn, context, a, true);
    },

    /**
     * Listen for this event after the normal subscribers have been notified and
     * the default behavior has been applied.  If a normal subscriber prevents the 
     * default behavior, it also prevents after listeners from firing.
     * @method after
     * @param {Function} fn        The function to execute
     * @return {EventHandle|EventTarget} unsubscribe handle or a
     * chainable event target depending on the 'chain' config.
     */
    after: function(fn, context) {
        var a = (arguments.length > 2) ? Y.Array(arguments, 2, true): null;
        return this._on(fn, context, a, AFTER);
    },

    /**
     * Detach listeners.
     * @method detach 
     * @param {Function} fn  The subscribed function to remove, if not supplied
     *                       all will be removed
     * @param {Object}   context The context object passed to subscribe.
     * @return {int|EventTarget} returns a chainable event target
     * or the number of subscribers unsubscribed.
     */
    detach: function(fn, context) {
        // unsubscribe handle
        if (fn && fn.detach) {
            return fn.detach();
        }

        var found = 0, subs = this.subscribers, i, s;

        for (i in subs) {
            if (subs.hasOwnProperty(i)) {
                s = subs[i];
                if (s && (!fn || fn === s.fn)) {
                    this._delete(s);
                    found++;
                }
            }
        }

        return found;
    },

    /**
     * Detach listeners.
     * @method unsubscribe
     * @param {Function} fn  The subscribed function to remove, if not supplied
     *                       all will be removed
     * @param {Object}   context The context object passed to subscribe.
     * @return {boolean|EventTarget} returns a chainable event target
     * or a boolean for legacy detach support.
     * @deprecated use detach
     */
    unsubscribe: function() {
        return this.detach.apply(this, arguments);
    },


    /**
     * Notify a single subscriber
     * @method _notify
     * @param s {Subscriber} the subscriber
     * @param args {Array} the arguments array to apply to the listener
     * @private
     */
    _notify: function(s, args, ef) {

        this.log(this.type + "->" + "sub: " +  s.id);

        var ret;

        ret = s.notify(args, this);

        if (false === ret || this.stopped > 1) {
            this.log(this.type + " cancelled by subscriber");
            return false;
        }

        return true;
    },

    /**
     * Logger abstraction to centralize the application of the silent flag
     * @method log
     * @param msg {string} message to log
     * @param cat {string} log category
     */
    log: function(msg, cat) {
        if (!this.silent) {
        }
    },

    /**
     * Notifies the subscribers.  The callback functions will be executed
     * from the context specified when the event was created, and with the 
     * following parameters:
     *   <ul>
     *   <li>The type of event</li>
     *   <li>All of the arguments fire() was executed with as an array</li>
     *   <li>The custom object (if any) that was passed into the subscribe() 
     *       method</li>
     *   </ul>
     * @method fire 
     * @param {Object*} arguments an arbitrary set of parameters to pass to 
     *                            the handler.
     * @return {boolean} false if one of the subscribers returned false, 
     *                   true otherwise
     * 
     */
    fire: function() {
        if (this.fireOnce && this.fired) {
            this.log('fireOnce event: ' + this.type + ' already fired');
            return true;
        } else {

            var args = Y.Array(arguments, 0, true);

            this.fired = true;
            this.firedWith = args;

            if (this.emitFacade) {
                return this.fireComplex(args);
            } else {
                return this.fireSimple(args);
            }
        }
    },

    fireSimple: function(args) {
        if (this.hasSubscribers || this.hasAfters) {
            this._procSubs(Y.merge(this.subscribers, this.afters), args);
        }
        this._broadcast(args);
        return this.stopped ? false : true;
    },

    // Requires the event-custom-complex module for full funcitonality.
    fireComplex: function(args) {
        args[0] = args[0] || {};
        return this.fireSimple(args);
    },

    _procSubs: function(subs, args, ef) {
        var s, i;
        for (i in subs) {
            if (subs.hasOwnProperty(i)) {
                s = subs[i];
                if (s && s.fn) {
                    if (false === this._notify(s, args, ef)) {
                        this.stopped = 2;
                    }
                    if (this.stopped == 2) {
                        return false;
                    }
                }
            }
        }

        return true;
    },

    _broadcast: function(args) {
        if (!this.stopped && this.broadcast) {

            var a = Y.Array(args);
            a.unshift(this.type);

            if (this.host !== Y) {
                Y.fire.apply(Y, a);
            }

            if (this.broadcast == 2) {
                Y.Global.fire.apply(Y.Global, a);
            }
        }
    },

    /**
     * Removes all listeners
     * @method unsubscribeAll
     * @return {int} The number of listeners unsubscribed
     * @deprecated use detachAll
     */
    unsubscribeAll: function() {
        return this.detachAll.apply(this, arguments);
    },

    /**
     * Removes all listeners
     * @method detachAll
     * @return {int} The number of listeners unsubscribed
     */
    detachAll: function() {
        return this.detach();
    },

    /**
     * @method _delete
     * @param subscriber object
     * @private
     */
    _delete: function(s) {
        if (s) {
            delete s.fn;
            delete s.context;
            delete this.subscribers[s.id];
            delete this.afters[s.id];
        }
    }
};

/////////////////////////////////////////////////////////////////////

/**
 * Stores the subscriber information to be used when the event fires.
 * @param {Function} fn       The wrapped function to execute
 * @param {Object}   context  The value of the keyword 'this' in the listener
 * @param {Array} args*       0..n additional arguments to supply the listener
 *
 * @class Subscriber
 * @constructor
 */
Y.Subscriber = function(fn, context, args) {

    /**
     * The callback that will be execute when the event fires
     * This is wrapped by Y.rbind if obj was supplied.
     * @property fn
     * @type Function
     */
    this.fn = fn;

    /**
     * Optional 'this' keyword for the listener
     * @property context
     * @type Object
     */
    this.context = context;

    /**
     * Unique subscriber id
     * @property id
     * @type String
     */
    this.id = Y.stamp(this);

    /**
     * Additional arguments to propagate to the subscriber
     * @property args
     * @type Array
     */
    this.args = args;

    /**
     * Custom events for a given fire transaction.
     * @property events
     * @type {EventTarget}
     */
    this.events = null;
    
};

Y.Subscriber.prototype = {

    _notify: function(c, args, ce) {
        var a = this.args, ret;
        switch (ce.signature) {
            case 0:
                ret = this.fn.call(c, ce.type, args, c);
                break;
            case 1:
                ret = this.fn.call(c, args[0] || null, c);
                break;
            default:
                if (a || args) {
                    args = args || [];
                    a = (a) ? args.concat(a) : args;
                    ret = this.fn.apply(c, a);
                } else {
                    ret = this.fn.call(c);
                }
        }

        return ret;
    },

    /**
     * Executes the subscriber.
     * @method notify
     * @param args {Array} Arguments array for the subscriber
     * @param ce {CustomEvent} The custom event that sent the notification
     */
    notify: function(args, ce) {
        var c = this.context,
            ret = true;

        if (!c) {
            c = (ce.contextFn) ? ce.contextFn() : ce.context;
        }

        // only catch errors if we will not re-throw them.
        if (Y.config.throwFail) {
            ret = this._notify(c, args, ce);
        } else {
            try {
                ret = this._notify(c, args, ce);
            } catch(e) {
                Y.error(this + ' failed: ' + e.message, e);
            }
        }

        return ret;
    },

    /**
     * Returns true if the fn and obj match this objects properties.
     * Used by the unsubscribe method to match the right subscriber.
     *
     * @method contains
     * @param {Function} fn the function to execute
     * @param {Object} context optional 'this' keyword for the listener
     * @return {boolean} true if the supplied arguments match this 
     *                   subscriber's signature.
     */
    contains: function(fn, context) {
        if (context) {
            return ((this.fn == fn) && this.context == context);
        } else {
            return (this.fn == fn);
        }
    }

};

/**
 * Custom event engine, DOM event listener abstraction layer, synthetic DOM 
 * events.
 * @module event-custom
 * @submodule event-custom-base
 */
(function() {

/**
 * EventTarget provides the implementation for any object to
 * publish, subscribe and fire to custom events, and also
 * alows other EventTargets to target the object with events
 * sourced from the other object.
 * EventTarget is designed to be used with Y.augment to wrap 
 * EventCustom in an interface that allows events to be listened to 
 * and fired by name.  This makes it possible for implementing code to
 * subscribe to an event that either has not been created yet, or will
 * not be created at all.
 * @class EventTarget
 * @param opts a configuration object
 * @config emitFacade {boolean} if true, all events will emit event 
 * facade payloads by default (default false)
 * @config prefix {string} the prefix to apply to non-prefixed event names 
 * @config chain {boolean} if true, on/after/detach return the host to allow 
 * chaining, otherwise they return an EventHandle (default false)
 */

var L = Y.Lang,
    PREFIX_DELIMITER = ':',
    CATEGORY_DELIMITER = '|',
    AFTER_PREFIX = '~AFTER~',

    /**
     * If the instance has a prefix attribute and the
     * event type is not prefixed, the instance prefix is
     * applied to the supplied type.
     * @method _getType
     * @private
     */
    _getType = Y.cached(function(type, pre) {

        if (!pre || !L.isString(type) || type.indexOf(PREFIX_DELIMITER) > -1) {
            return type;
        } 

        return pre + PREFIX_DELIMITER + type;
    }),

    /**
     * Returns an array with the detach key (if provided),
     * and the prefixed event name from _getType
     * Y.on('detachcategory, menu:click', fn)
     * @method _parseType
     * @private
     */
    _parseType = Y.cached(function(type, pre) {

        var t = type, detachcategory, after, i;

        if (!L.isString(t)) {
            return t;
        } 
        
        i = t.indexOf(AFTER_PREFIX);

        if (i > -1) {
            after = true;
            t = t.substr(AFTER_PREFIX.length);
        }

        i = t.indexOf(CATEGORY_DELIMITER);

        if (i > -1) {
            detachcategory = t.substr(0, (i));
            t = t.substr(i+1);
            if (t == '*') {
                t = null;
            }
        }

        // detach category, full type with instance prefix, is this an after listener, short type
        return [detachcategory, (pre) ? _getType(t, pre) : t, after, t];
    }),

    ET = function(opts) {


        var o = (L.isObject(opts)) ? opts : {};

        this._yuievt = this._yuievt || {

            id: Y.guid(),

            events: {},

            targets: {},

            config: o,

            chain: ('chain' in o) ? o.chain : Y.config.chain,

            defaults: {
                context: o.context || this, 
                host: this,
                emitFacade: o.emitFacade,
                fireOnce: o.fireOnce,
                queuable: o.queuable,
                broadcast: o.broadcast,
                bubbles: ('bubbles' in o) ? o.bubbles : true
            }
        };

    };


ET.prototype = {

    /**
     * Subscribe to a custom event hosted by this object
     * @method on 
     * @param type    {string}   The type of the event
     * @param fn {Function} The callback
     * @return the event target or a detach handle per 'chain' config
     */
    on: function(type, fn, context, x) {

        var parts = _parseType(type, this._yuievt.config.prefix), f, c, args, ret, ce,
            detachcategory, handle, store = Y.Env.evt.handles, after, adapt, shorttype,
            Node = Y.Node, n, domevent;

        if (L.isObject(type)) {

            if (L.isFunction(type)) {
                return Y.Do.before.apply(Y.Do, arguments);
            }

            f = fn; 
            c = context; 
            args = Y.Array(arguments, 0, true);
            ret = {};
            after = type._after;
            delete type._after;

            Y.each(type, function(v, k) {

                if (v) {
                    f = v.fn || ((Y.Lang.isFunction(v)) ? v : f);
                    c = v.context || c;
                }

                args[0] = (after) ? AFTER_PREFIX + k : k;
                args[1] = f;
                args[2] = c;

                ret[k] = this.on.apply(this, args); 

            }, this);

            return (this._yuievt.chain) ? this : new Y.EventHandle(ret);

        }
        
        detachcategory = parts[0];
        after = parts[2];
        shorttype = parts[3];

        // extra redirection so we catch adaptor events too.  take a look at this.
        if (Node && (this instanceof Node) && (shorttype in Node.DOM_EVENTS)) {
            args = Y.Array(arguments, 0, true);
            args.splice(2, 0, Node.getDOMNode(this));
            return Y.on.apply(Y, args);
        }

        type = parts[1];

        if (this instanceof YUI) {

            adapt = Y.Env.evt.plugins[type];
            args  = Y.Array(arguments, 0, true);
            args[0] = shorttype;

            if (Node) {
                n = args[2];

                if (n instanceof Y.NodeList) {
                    n = Y.NodeList.getDOMNodes(n);
                } else if (n instanceof Node) {
                    n = Node.getDOMNode(n);
                }

                domevent = (shorttype in Node.DOM_EVENTS);

                // Captures both DOM events and event plugins.
                if (domevent) {
                    args[2] = n;
                }
            }

            // check for the existance of an event adaptor
            if (adapt) {
                handle = adapt.on.apply(Y, args);
            } else if ((!type) || domevent) {
                handle = Y.Event._attach(args);
            }

        } 

        if (!handle) {
            ce = this._yuievt.events[type] || this.publish(type);
            handle = ce._on(fn, context, (arguments.length > 3) ? Y.Array(arguments, 3, true) : null, (after) ? 'after' : true);
        }

        if (detachcategory) {
            store[detachcategory] = store[detachcategory] || {};
            store[detachcategory][type] = store[detachcategory][type] || [];
            store[detachcategory][type].push(handle);
        }

        return (this._yuievt.chain) ? this : handle;

    },

    /**
     * subscribe to an event
     * @method subscribe
     * @deprecated use on
     */
    subscribe: function() {
        return this.on.apply(this, arguments);
    },

    /**
     * Detach one or more listeners the from the specified event
     * @method detach 
     * @param type {string|Object}   Either the handle to the subscriber or the 
     *                        type of event.  If the type
     *                        is not specified, it will attempt to remove
     *                        the listener from all hosted events.
     * @param fn   {Function} The subscribed function to unsubscribe, if not
     *                          supplied, all subscribers will be removed.
     * @param context  {Object}   The custom object passed to subscribe.  This is
     *                        optional, but if supplied will be used to
     *                        disambiguate multiple listeners that are the same
     *                        (e.g., you subscribe many object using a function
     *                        that lives on the prototype)
     * @return {EventTarget} the host
     */
    detach: function(type, fn, context) {
        var evts = this._yuievt.events, i, ret,
            Node = Y.Node, isNode = (this instanceof Node);

        // detachAll disabled on the Y instance.
        if (!type && (this !== Y)) {
            for (i in evts) {
                if (evts.hasOwnProperty(i)) {
                    ret = evts[i].detach(fn, context);
                }
            }
            if (isNode) {

                Y.Event.purgeElement(Node.getDOMNode(this));
            }

            return ret;
        }

        var parts = _parseType(type, this._yuievt.config.prefix), 
        detachcategory = L.isArray(parts) ? parts[0] : null,
        shorttype = (parts) ? parts[3] : null,
        handle, adapt, store = Y.Env.evt.handles, cat, args,
        ce,

        keyDetacher = function(lcat, ltype) {
            var handles = lcat[ltype];
            if (handles) {
                while (handles.length) {
                    handle = handles.pop();
                    handle.detach();
                }
            }
        };

        if (detachcategory) {

            cat = store[detachcategory];
            type = parts[1];

            if (cat) {
                if (type) {
                    keyDetacher(cat, type);
                } else {
                    for (i in cat) {
                        if (cat.hasOwnProperty(i)) {
                            keyDetacher(cat, i);
                        }
                    }
                }

                return (this._yuievt.chain) ? this : true;
            }

        // If this is an event handle, use it to detach
        } else if (L.isObject(type) && type.detach) {
            ret = type.detach();
            return (this._yuievt.chain) ? this : ret;
        // extra redirection so we catch adaptor events too.  take a look at this.
        } else if (isNode && ((!shorttype) || (shorttype in Node.DOM_EVENTS))) {
            args = Y.Array(arguments, 0, true);
            args[2] = Node.getDOMNode(this);
            return Y.detach.apply(Y, args);
        }

        adapt = Y.Env.evt.plugins[shorttype];

        // The YUI instance handles DOM events and adaptors
        if (this instanceof YUI) {
            args = Y.Array(arguments, 0, true);
            // use the adaptor specific detach code if
            if (adapt && adapt.detach) {
                return adapt.detach.apply(Y, args);
            // DOM event fork
            } else if (!type || (!adapt && Node && (type in Node.DOM_EVENTS))) {
                args[0] = type;
                return Y.Event.detach.apply(Y.Event, args);
            }
        }

        ce = evts[type];
        if (ce) {
            ret = ce.detach(fn, context);
        }

        return (this._yuievt.chain) ? this : ret;
    },

    /**
     * detach a listener
     * @method unsubscribe
     * @deprecated use detach
     */
    unsubscribe: function() {
        return this.detach.apply(this, arguments);
    },
    
    /**
     * Removes all listeners from the specified event.  If the event type
     * is not specified, all listeners from all hosted custom events will
     * be removed.
     * @method detachAll
     * @param type {string}   The type, or name of the event
     */
    detachAll: function(type) {
        return this.detach(type);
    },

    /**
     * Removes all listeners from the specified event.  If the event type
     * is not specified, all listeners from all hosted custom events will
     * be removed.
     * @method unsubscribeAll
     * @param type {string}   The type, or name of the event
     * @deprecated use detachAll
     */
    unsubscribeAll: function() {
        return this.detachAll.apply(this, arguments);
    },

    /**
     * Creates a new custom event of the specified type.  If a custom event
     * by that name already exists, it will not be re-created.  In either
     * case the custom event is returned. 
     *
     * @method publish
     *
     * @param type {string} the type, or name of the event
     * @param opts {object} optional config params.  Valid properties are:
     *
     *  <ul>
     *    <li>
     *   'broadcast': whether or not the YUI instance and YUI global are notified when the event is fired (false)
     *    </li>
     *    <li>
     *   'bubbles': whether or not this event bubbles (true)
     *    </li>
     *    <li>
     *   'context': the default execution context for the listeners (this)
     *    </li>
     *    <li>
     *   'defaultFn': the default function to execute when this event fires if preventDefault was not called
     *    </li>
     *    <li>
     *   'emitFacade': whether or not this event emits a facade (false)
     *    </li>
     *    <li>
     *   'prefix': the prefix for this targets events, e.g., 'menu' in 'menu:click' 
     *    </li>
     *    <li>
     *   'fireOnce': if an event is configured to fire once, new subscribers after
     *   the fire will be notified immediately.
     *    </li>
     *    <li>
     *   'preventable': whether or not preventDefault() has an effect (true)
     *    </li>
     *    <li>
     *   'preventedFn': a function that is executed when preventDefault is called
     *    </li>
     *    <li>
     *   'queuable': whether or not this event can be queued during bubbling (false)
     *    </li>
     *    <li>
     *   'silent': if silent is true, debug messages are not provided for this event.
     *    </li>
     *    <li>
     *   'stoppedFn': a function that is executed when stopPropagation is called
     *    </li>
     *    <li>
     *   'type': the event type (valid option if not provided as the first parameter to publish)
     *    </li>
     *  </ul>
     *
     *  @return {Event.Custom} the custom event
     *
     */
    publish: function(type, opts) {
        var events, ce, ret, pre = this._yuievt.config.prefix;

        type = (pre) ? _getType(type, pre) : type;


        if (L.isObject(type)) {
            ret = {};
            Y.each(type, function(v, k) {
                ret[k] = this.publish(k, v || opts); 
            }, this);

            return ret;
        }

        events = this._yuievt.events; 
        ce = events[type];

        if (ce) {
// ce.log("publish applying new config to published event: '"+type+"' exists", 'info', 'event');
            if (opts) {
                ce.applyConfig(opts, true);
            }
        } else {
            // apply defaults
            ce = new Y.CustomEvent(type, (opts) ? Y.mix(opts, this._yuievt.defaults) : this._yuievt.defaults);
            events[type] = ce;
        }

        // make sure we turn the broadcast flag off if this
        // event was published as a result of bubbling
        // if (opts instanceof Y.CustomEvent) {
          //   events[type].broadcast = false;
        // }

        return events[type];
    },

    /**
     * Registers another EventTarget as a bubble target.  Bubble order
     * is determined by the order registered.  Multiple targets can
     * be specified.
     * @method addTarget
     * @param o {EventTarget} the target to add
     */
    addTarget: function(o) {
        this._yuievt.targets[Y.stamp(o)] = o;
        this._yuievt.hasTargets = true;
    },

    /**
     * Removes a bubble target
     * @method removeTarget
     * @param o {EventTarget} the target to remove
     */
    removeTarget: function(o) {
        delete this._yuievt.targets[Y.stamp(o)];
    },

   /**
     * Fire a custom event by name.  The callback functions will be executed
     * from the context specified when the event was created, and with the 
     * following parameters.
     *
     * If the custom event object hasn't been created, then the event hasn't 
     * been published and it has no subscribers.  For performance sake, we 
     * immediate exit in this case.  This means the event won't bubble, so 
     * if the intention is that a bubble target be notified, the event must 
     * be published on this object first.
     *
     * The first argument is the event type, and any additional arguments are
     * passed to the listeners as parameters.  If the first of these is an
     * object literal, and the event is configured to emit an event facade,
     * that object is mixed into the event facade and the facade is provided 
     * in place of the original object.
     *
     * @method fire
     * @param type {String|Object} The type of the event, or an object that contains
     * a 'type' property.
     * @param arguments {Object*} an arbitrary set of parameters to pass to 
     * the handler.  If the first of these is an object literal and the event is
     * configured to emit an event facade, the event facade will replace that
     * parameter after the properties the object literal contains are copied to
     * the event facade.
     * @return {Event.Target} the event host
     *                   
     */
    fire: function(type) {

        var typeIncluded = L.isString(type),
            t = (typeIncluded) ? type : (type && type.type),
            ce, a, ret, pre=this._yuievt.config.prefix;

        t = (pre) ? _getType(t, pre) : t;
        ce = this.getEvent(t, true);

        // this event has not been published or subscribed to
        if (!ce) {
            
            if (this._yuievt.hasTargets) {
                a = (typeIncluded) ? arguments : Y.Array(arguments, 0, true).unshift(t);
                return this.bubble(null, a, this);
            }

            // otherwise there is nothing to be done
            ret = true;

        } else {

            a = Y.Array(arguments, (typeIncluded) ? 1 : 0, true);
            ret = ce.fire.apply(ce, a);

            // clear target for next fire()
            ce.target = null;
        }

        return (this._yuievt.chain) ? this : ret;
    },

    /**
     * Returns the custom event of the provided type has been created, a
     * falsy value otherwise
     * @method getEvent
     * @param type {string} the type, or name of the event
     * @param prefixed {string} if true, the type is prefixed already
     * @return {Event.Custom} the custom event or null
     */
    getEvent: function(type, prefixed) {
        var pre, e;
        if (!prefixed) {
            pre = this._yuievt.config.prefix;
            type = (pre) ? _getType(type, pre) : type;
        }
        e = this._yuievt.events;
        return (e && type in e) ? e[type] : null;
    },

    /**
     * Subscribe to a custom event hosted by this object.  The
     * supplied callback will execute after any listeners add
     * via the subscribe method, and after the default function,
     * if configured for the event, has executed.
     * @method after
     * @param type    {string}   The type of the event
     * @param fn {Function} The callback
     * @return the event target or a detach handle per 'chain' config
     */
    after: function(type, fn) {

        var a = Y.Array(arguments, 0, true);

        switch (L.type(type)) {
            case 'function':
                return Y.Do.after.apply(Y.Do, arguments);
            case 'object':
                a[0]._after = true;
                break;
            default:
                a[0] = AFTER_PREFIX + type;
        }

        return this.on.apply(this, a);

    },

    /**
     * Executes the callback before a DOM event, custom event
     * or method.  If the first argument is a function, it
     * is assumed the target is a method.  For DOM and custom
     * events, this is an alias for Y.on.
     *
     * For DOM and custom events:
     * type, callback, context, 0-n arguments
     *  
     * For methods:
     * callback, object (method host), methodName, context, 0-n arguments
     *
     * @method before
     * @return detach handle
     * @deprecated use the on method
     */
    before: function() { 
        return this.on.apply(this, arguments);
    }

};

Y.EventTarget = ET;

// make Y an event target
Y.mix(Y, ET.prototype, false, false, { 
    bubbles: false 
});

ET.call(Y);

YUI.Env.globalEvents = YUI.Env.globalEvents || new ET();

/**
 * Hosts YUI page level events.  This is where events bubble to
 * when the broadcast config is set to 2.  This property is
 * only available if the custom event module is loaded.
 * @property Global
 * @type EventTarget
 * @for YUI
 */
Y.Global = YUI.Env.globalEvents;

// @TODO implement a global namespace function on Y.Global?

})();


/**
 * <code>YUI</code>'s <code>on</code> method is a unified interface for subscribing to
 * most events exposed by YUI.  This includes custom events, DOM events, and 
 * function events.  <code>detach</code> is also provided to remove listeners
 * serviced by this function.
 *
 * The signature that <code>on</code> accepts varies depending on the type
 * of event being consumed.  Refer to the specific methods that will
 * service a specific request for additional information about subscribing
 * to that type of event.
 *
 * <ul>
 * <li>Custom events.  These events are defined by various
 * modules in the library.  This type of event is delegated to
 * <code>EventTarget</code>'s <code>on</code> method.
 *   <ul>
 *     <li>The type of the event</li>
 *     <li>The callback to execute</li>
 *     <li>An optional context object</li>
 *     <li>0..n additional arguments to supply the callback.</li>
 *   </ul>
 *   Example: 
 *   <code>Y.on('domready', function() { // start work });</code>
 * </li>
 * <li>DOM events.  These are moments reported by the browser related
 * to browser functionality and user interaction.
 * This type of event is delegated to <code>Event</code>'s 
 * <code>attach</code> method.
 *   <ul>
 *     <li>The type of the event</li>
 *     <li>The callback to execute</li>
 *     <li>The specification for the Node(s) to attach the listener
 *     to.  This can be a selector, collections, or Node/Element
 *     refereces.</li>
 *     <li>An optional context object</li>
 *     <li>0..n additional arguments to supply the callback.</li>
 *   </ul>
 *   Example: 
 *   <code>Y.on('click', function(e) { // something was clicked }, '#someelement');</code>
 * </li>
 * <li>Function events.  These events can be used to react before or after a
 * function is executed.  This type of event is delegated to <code>Event.Do</code>'s 
 * <code>before</code> method.
 *   <ul>
 *     <li>The callback to execute</li>
 *     <li>The object that has the function that will be listened for.</li>
 *     <li>The name of the function to listen for.</li>
 *     <li>An optional context object</li>
 *     <li>0..n additional arguments to supply the callback.</li>
 *   </ul>
 *   Example <code>Y.on(function(arg1, arg2, etc) { // obj.methodname was executed }, obj 'methodname');</code>
 * </li>
 * </ul>
 *
 * <code>on</code> corresponds to the moment before any default behavior of
 * the event.  <code>after</code> works the same way, but these listeners
 * execute after the event's default behavior.  <code>before</code> is an
 * alias for <code>on</code>.
 *
 * @method on 
 * @param type** event type (this parameter does not apply for function events)
 * @param fn the callback
 * @param target** a descriptor for the target (applies to custom events only).
 * For function events, this is the object that contains the function to
 * execute.
 * @param extra** 0..n Extra information a particular event may need.  These
 * will be documented with the event.  In the case of function events, this
 * is the name of the function to execute on the host.  In the case of
 * delegate listeners, this is the event delegation specification.
 * @param context optionally change the value of 'this' in the callback
 * @param args* 0..n additional arguments to pass to the callback.
 * @return the event target or a detach handle per 'chain' config
 * @for YUI
 */

/**
 * after() is a unified interface for subscribing to
 * most events exposed by YUI.  This includes custom events,
 * DOM events, and AOP events.  This works the same way as
 * the on() function, only it operates after any default
 * behavior for the event has executed. @see <code>on</code> for more 
 * information.
 * @method after
 * @param type event type (this parameter does not apply for function events)
 * @param fn the callback
 * @param target a descriptor for the target (applies to custom events only).
 * For function events, this is the object that contains the function to
 * execute.
 * @param extra 0..n Extra information a particular event may need.  These
 * will be documented with the event.  In the case of function events, this
 * is the name of the function to execute on the host.  In the case of
 * delegate listeners, this is the event delegation specification.
 * @param context optionally change the value of 'this' in the callback
 * @param args* 0..n additional arguments to pass to the callback.
 * @return the event target or a detach handle per 'chain' config
 * @for YUI
 */


}, '3.0.0' ,{requires:['oop']});
/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
/*
 * DOM event listener abstraction layer
 * @module event
 * @submodule event-base
 */

(function() {


// Unlike most of the library, this code has to be executed as soon as it is
// introduced into the page -- and it should only be executed one time
// regardless of the number of instances that use it.

var GLOBAL_ENV = YUI.Env, 

    C = YUI.config, 

    D = C.doc, 

    POLL_INTERVAL = C.pollInterval || 40,

    _ready = function(e) {
        GLOBAL_ENV._ready();
    };

    if (!GLOBAL_ENV._ready) {

        GLOBAL_ENV._ready = function() {
            if (!GLOBAL_ENV.DOMReady) {
                GLOBAL_ENV.DOMReady=true;

                // Remove the DOMContentLoaded (FF/Opera/Safari)
                if (D.removeEventListener) {
                    D.removeEventListener("DOMContentLoaded", _ready, false);
                }
            }
        };

        // create custom event

/*! DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller/Diego Perini */

        // Internet Explorer: use the readyState of a defered script.
        // This isolates what appears to be a safe moment to manipulate
        // the DOM prior to when the document's readyState suggests
        // it is safe to do so.
        if (navigator.userAgent.match(/MSIE/)) {

            if (self !== self.top) {
                document.onreadystatechange = function() {
                    if (document.readyState == 'complete') {
                        document.onreadystatechange = null;
                        _ready();
                    }
                };
            } else {

                GLOBAL_ENV._dri = setInterval(function() {
                    try {
                        // throws an error if doc is not ready
                        document.documentElement.doScroll('left');
                        clearInterval(GLOBAL_ENV._dri);
                        GLOBAL_ENV._dri = null;
                        _ready();
                    } catch (ex) { 
                    }
                }, POLL_INTERVAL); 
            }

        // FireFox, Opera, Safari 3+: These browsers provide a event for this
        // moment.
        } else {
            D.addEventListener("DOMContentLoaded", _ready, false);
        }

        /////////////////////////////////////////////////////////////
    }

})();
YUI.add('event-base', function(Y) {

(function() {
/*
 * DOM event listener abstraction layer
 * @module event
 * @submodule event-base
 */

var GLOBAL_ENV = YUI.Env,
    
    yready = function() {
        Y.fire('domready');
    };

Y.publish('domready', {
    fireOnce: true
});

if (GLOBAL_ENV.DOMReady) {
    // console.log('DOMReady already fired', 'info', 'event');
    yready();
} else {
    // console.log('setting up before listener', 'info', 'event');
    // console.log('env: ' + YUI.Env.windowLoaded, 'info', 'event');
    Y.before(yready, GLOBAL_ENV, "_ready");
}

})();
(function() {

/**
 * Custom event engine, DOM event listener abstraction layer, synthetic DOM 
 * events.
 * @module event
 * @submodule event-base
 */

/**
 * Wraps a DOM event, properties requiring browser abstraction are
 * fixed here.  Provids a security layer when required.
 * @class DOMEventFacade
 * @param ev {Event} the DOM event
 * @param currentTarget {HTMLElement} the element the listener was attached to
 * @param wrapper {Event.Custom} the custom event wrapper for this DOM event
 */

/*
 * @TODO constants? LEFTBUTTON, MIDDLEBUTTON, RIGHTBUTTON, keys
 */

/*

var whitelist = {
    altKey          : 1,
    // "button"          : 1, // we supply
    // "bubbles"         : 1, // needed?
    // "cancelable"      : 1, // needed? 
    // "charCode"        : 1, // we supply
    cancelBubble    : 1,
    // "currentTarget"   : 1, // we supply
    ctrlKey         : 1,
    clientX         : 1, // needed?
    clientY         : 1, // needed?
    detail          : 1, // not fully implemented
    // "fromElement"     : 1,
    keyCode         : 1,
    // "height"          : 1, // needed?
    // "initEvent"       : 1, // need the init events?
    // "initMouseEvent"  : 1,
    // "initUIEvent"     : 1,
    // "layerX"          : 1, // needed?
    // "layerY"          : 1, // needed?
    metaKey         : 1,
    // "modifiers"       : 1, // needed?
    // "offsetX"         : 1, // needed?
    // "offsetY"         : 1, // needed?
    // "preventDefault"  : 1, // we supply
    // "reason"          : 1, // IE proprietary
    // "relatedTarget"   : 1,
    // "returnValue"     : 1, // needed?
    shiftKey        : 1,
    // "srcUrn"          : 1, // IE proprietary
    // "srcElement"      : 1,
    // "srcFilter"       : 1, IE proprietary
    // "stopPropagation" : 1, // we supply
    // "target"          : 1,
    // "timeStamp"       : 1, // needed?
    // "toElement"       : 1,
    type            : 1,
    // "view"            : 1,
    // "which"           : 1, // we supply
    // "width"           : 1, // needed?
    x               : 1,
    y               : 1
},

*/

    var ua = Y.UA,

    /**
     * webkit key remapping required for Safari < 3.1
     * @property webkitKeymap
     * @private
     */
    webkitKeymap = {
        63232: 38, // up
        63233: 40, // down
        63234: 37, // left
        63235: 39, // right
        63276: 33, // page up
        63277: 34, // page down
        25:     9, // SHIFT-TAB (Safari provides a different key code in
                   // this case, even though the shiftKey modifier is set)
		63272: 46, // delete
		63273: 36, // home
		63275: 35  // end
    },

    /**
     * Returns a wrapped node.  Intended to be used on event targets,
     * so it will return the node's parent if the target is a text
     * node.
     *
     * If accessing a property of the node throws an error, this is
     * probably the anonymous div wrapper Gecko adds inside text
     * nodes.  This likely will only occur when attempting to access
     * the relatedTarget.  In this case, we now return null because
     * the anonymous div is completely useless and we do not know
     * what the related target was because we can't even get to
     * the element's parent node.
     *
     * @method resolve
     * @private
     */
    resolve = function(n) {
        try {
            if (n && 3 == n.nodeType) {
                n = n.parentNode;
            }
        } catch(e) { 
            return null;
        }

        return Y.one(n);
    };


// provide a single event with browser abstractions resolved
//
// include all properties for both browers?
// include only DOM2 spec properties?
// provide browser-specific facade?

Y.DOMEventFacade = function(ev, currentTarget, wrapper) {

    wrapper = wrapper || {};

    var e = ev, ot = currentTarget, d = Y.config.doc, b = d.body,
        x = e.pageX, y = e.pageY, c, t;

    this.altKey   = e.altKey;
    this.ctrlKey  = e.ctrlKey;
    this.metaKey  = e.metaKey;
    this.shiftKey = e.shiftKey;
    this.type     = e.type;
    this.clientX  = e.clientX;
    this.clientY  = e.clientY;

    //////////////////////////////////////////////////////

    if (!x && 0 !== x) {
        x = e.clientX || 0;
        y = e.clientY || 0;

        if (ua.ie) {
            x += Math.max(d.documentElement.scrollLeft, b.scrollLeft);
            y += Math.max(d.documentElement.scrollTop, b.scrollTop);
        }
    }

    this._yuifacade = true;

    /**
     * The native event
     * @property _event
     */
    this._event = e;

    /**
     * The X location of the event on the page (including scroll)
     * @property pageX
     * @type int
     */
    this.pageX = x;

    /**
     * The Y location of the event on the page (including scroll)
     * @property pageY
     * @type int
     */
    this.pageY = y;

    //////////////////////////////////////////////////////

    c = e.keyCode || e.charCode || 0;

    if (ua.webkit && (c in webkitKeymap)) {
        c = webkitKeymap[c];
    }

    /**
     * The keyCode for key events.  Uses charCode if keyCode is not available
     * @property keyCode
     * @type int
     */
    this.keyCode = c;

    /**
     * The charCode for key events.  Same as keyCode
     * @property charCode
     * @type int
     */
    this.charCode = c;

    //////////////////////////////////////////////////////

    /**
     * The button that was pushed.
     * @property button
     * @type int
     */
    this.button = e.which || e.button;

    /**
     * The button that was pushed.  Same as button.
     * @property which
     * @type int
     */
    this.which = this.button;

    //////////////////////////////////////////////////////

    /**
     * Node reference for the targeted element
     * @propery target
     * @type Node
     */
    this.target = resolve(e.target || e.srcElement);

    /**
     * Node reference for the element that the listener was attached to.
     * @propery currentTarget
     * @type Node
     */
    this.currentTarget = resolve(ot);

    t = e.relatedTarget;

    if (!t) {
        if (e.type == "mouseout") {
            t = e.toElement;
        } else if (e.type == "mouseover") {
            t = e.fromElement;
        }
    }

    /**
     * Node reference to the relatedTarget
     * @propery relatedTarget
     * @type Node
     */
    this.relatedTarget = resolve(t);

    /**
     * Number representing the direction and velocity of the movement of the mousewheel.
     * Negative is down, the higher the number, the faster.  Applies to the mousewheel event.
     * @property wheelDelta
     * @type int
     */
    if (e.type == "mousewheel" || e.type == "DOMMouseScroll") {
        this.wheelDelta = (e.detail) ? (e.detail * -1) : Math.round(e.wheelDelta / 80) || ((e.wheelDelta < 0) ? -1 : 1);
    }

    //////////////////////////////////////////////////////
    // methods

    /**
     * Stops the propagation to the next bubble target
     * @method stopPropagation
     */
    this.stopPropagation = function() {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
        wrapper.stopped = 1;
    };

    /**
     * Stops the propagation to the next bubble target and
     * prevents any additional listeners from being exectued
     * on the current target.
     * @method stopImmediatePropagation
     */
    this.stopImmediatePropagation = function() {
        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        } else {
            this.stopPropagation();
        }
        wrapper.stopped = 2;
    };

    /**
     * Prevents the event's default behavior
     * @method preventDefault
     * @param returnValue {string} sets the returnValue of the event to this value
     * (rather than the default false value).  This can be used to add a customized 
     * confirmation query to the beforeunload event).
     */
    this.preventDefault = function(returnValue) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.returnValue = returnValue || false;
        wrapper.prevented = 1;
    };

    /**
     * Stops the event propagation and prevents the default
     * event behavior.
     * @method halt
     * @param immediate {boolean} if true additional listeners
     * on the current target will not be executed
     */
    this.halt = function(immediate) {
        if (immediate) {
            this.stopImmediatePropagation();
        } else {
            this.stopPropagation();
        }

        this.preventDefault();
    };

};

})();
(function() {
/**
 * DOM event listener abstraction layer
 * @module event
 * @submodule event-base
 */

/**
 * The event utility provides functions to add and remove event listeners,
 * event cleansing.  It also tries to automatically remove listeners it
 * registers during the unload event.
 *
 * @class Event
 * @static
 */

Y.Env.evt.dom_wrappers = {};
Y.Env.evt.dom_map = {};

var _eventenv = Y.Env.evt,
add = YUI.Env.add,
remove = YUI.Env.remove,

onLoad = function() {
    YUI.Env.windowLoaded = true;
    Y.Event._load();
    remove(window, "load", onLoad);
},

onUnload = function() {
    Y.Event._unload();
    remove(window, "unload", onUnload);
},

EVENT_READY = 'domready',

COMPAT_ARG = '~yui|2|compat~',

shouldIterate = function(o) {
    try {
        return (o && typeof o !== "string" && Y.Lang.isNumber(o.length) && !o.tagName && !o.alert);
    } catch(ex) {
        return false;
    }

},

Event = function() {

    /**
     * True after the onload event has fired
     * @property _loadComplete
     * @type boolean
     * @static
     * @private
     */
    var _loadComplete =  false,

    /**
     * The number of times to poll after window.onload.  This number is
     * increased if additional late-bound handlers are requested after
     * the page load.
     * @property _retryCount
     * @static
     * @private
     */
    _retryCount = 0,

    /**
     * onAvailable listeners
     * @property _avail
     * @static
     * @private
     */
    _avail = [],

    /**
     * Custom event wrappers for DOM events.  Key is 
     * 'event:' + Element uid stamp + event type
     * @property _wrappers
     * @type Y.Event.Custom
     * @static
     * @private
     */
    _wrappers = _eventenv.dom_wrappers,

    _windowLoadKey = null,

    /**
     * Custom event wrapper map DOM events.  Key is 
     * Element uid stamp.  Each item is a hash of custom event
     * wrappers as provided in the _wrappers collection.  This
     * provides the infrastructure for getListeners.
     * @property _el_events
     * @static
     * @private
     */
    _el_events = _eventenv.dom_map;

    return {

        /**
         * The number of times we should look for elements that are not
         * in the DOM at the time the event is requested after the document
         * has been loaded.  The default is 1000@amp;40 ms, so it will poll
         * for 40 seconds or until all outstanding handlers are bound
         * (whichever comes first).
         * @property POLL_RETRYS
         * @type int
         * @static
         * @final
         */
        POLL_RETRYS: 1000,

        /**
         * The poll interval in milliseconds
         * @property POLL_INTERVAL
         * @type int
         * @static
         * @final
         */
        POLL_INTERVAL: 40,

        /**
         * addListener/removeListener can throw errors in unexpected scenarios.
         * These errors are suppressed, the method returns false, and this property
         * is set
         * @property lastError
         * @static
         * @type Error
         */
        lastError: null,


        /**
         * poll handle
         * @property _interval
         * @static
         * @private
         */
        _interval: null,

        /**
         * document readystate poll handle
         * @property _dri
         * @static
         * @private
         */
         _dri: null,

        /**
         * True when the document is initially usable
         * @property DOMReady
         * @type boolean
         * @static
         */
        DOMReady: false,

        /**
         * @method startInterval
         * @static
         * @private
         */
        startInterval: function() {
            var E = Y.Event;

            if (!E._interval) {
E._interval = setInterval(Y.bind(E._poll, E), E.POLL_INTERVAL);
            }
        },

        /**
         * Executes the supplied callback when the item with the supplied
         * id is found.  This is meant to be used to execute behavior as
         * soon as possible as the page loads.  If you use this after the
         * initial page load it will poll for a fixed time for the element.
         * The number of times it will poll and the frequency are
         * configurable.  By default it will poll for 10 seconds.
         *
         * <p>The callback is executed with a single parameter:
         * the custom object parameter, if provided.</p>
         *
         * @method onAvailable
         *
         * @param {string||string[]}   id the id of the element, or an array
         * of ids to look for.
         * @param {function} fn what to execute when the element is found.
         * @param {object}   p_obj an optional object to be passed back as
         *                   a parameter to fn.
         * @param {boolean|object}  p_override If set to true, fn will execute
         *                   in the context of p_obj, if set to an object it
         *                   will execute in the context of that object
         * @param checkContent {boolean} check child node readiness (onContentReady)
         * @static
         * @deprecated Use Y.on("available")
         */
        // @TODO fix arguments
        onAvailable: function(id, fn, p_obj, p_override, checkContent, compat) {

            var a = Y.Array(id), i, availHandle;


            for (i=0; i<a.length; i=i+1) {
                _avail.push({ 
                    id:         a[i], 
                    fn:         fn, 
                    obj:        p_obj, 
                    override:   p_override, 
                    checkReady: checkContent,
                    compat:     compat 
                });
            }
            _retryCount = this.POLL_RETRYS;

            // We want the first test to be immediate, but async
            setTimeout(Y.bind(Y.Event._poll, Y.Event), 0);

            availHandle = new Y.EventHandle({

                _delete: function() {
                    // set by the event system for lazy DOM listeners
                    if (availHandle.handle) {
                        availHandle.handle.detach();
						return;
                    }

                    var i, j;

                    // otherwise try to remove the onAvailable listener(s)
                    for (i = 0; i < a.length; i++) {
                        for (j = 0; j < _avail.length; j++) {
                            if (a[i] === _avail[j].id) {
                                _avail.splice(j, 1);
                            }
                        }
                    }
                }

            });

            return availHandle;
        },

        /**
         * Works the same way as onAvailable, but additionally checks the
         * state of sibling elements to determine if the content of the
         * available element is safe to modify.
         *
         * <p>The callback is executed with a single parameter:
         * the custom object parameter, if provided.</p>
         *
         * @method onContentReady
         *
         * @param {string}   id the id of the element to look for.
         * @param {function} fn what to execute when the element is ready.
         * @param {object}   p_obj an optional object to be passed back as
         *                   a parameter to fn.
         * @param {boolean|object}  p_override If set to true, fn will execute
         *                   in the context of p_obj.  If an object, fn will
         *                   exectute in the context of that object
         *
         * @static
         * @deprecated Use Y.on("contentready")
         */
        // @TODO fix arguments
        onContentReady: function(id, fn, p_obj, p_override, compat) {
            return this.onAvailable(id, fn, p_obj, p_override, true, compat);
        },

        /**
         * Adds an event listener
         *
         * @method attach
         *
         * @param {String}   type     The type of event to append
         * @param {Function} fn        The method the event invokes
         * @param {String|HTMLElement|Array|NodeList} el An id, an element 
         *  reference, or a collection of ids and/or elements to assign the 
         *  listener to.
         * @param {Object}   context optional context object
         * @param {Boolean|object}  args 0..n arguments to pass to the callback
         * @return {EventHandle} an object to that can be used to detach the listener
         *                     
         * @static
         */

        attach: function(type, fn, el, context) {
            return Y.Event._attach(Y.Array(arguments, 0, true));
        },

		_createWrapper: function (el, type, capture, compat, facade) {

            var ek = Y.stamp(el),
	            key = 'event:' + ek + type,
	            cewrapper;


            if (false === facade) {
                key += 'native';
            }
            if (capture) {
                key += 'capture';
            }


            cewrapper = _wrappers[key];
            

            if (!cewrapper) {
                // create CE wrapper
                cewrapper = Y.publish(key, {
                    silent: true,
                    bubbles: false,
                    contextFn: function() {
                        cewrapper.nodeRef = cewrapper.nodeRef || Y.one(cewrapper.el);
                        return cewrapper.nodeRef;
                    }
                });
            
                // for later removeListener calls
                cewrapper.el = el;
                cewrapper.key = key;
                cewrapper.domkey = ek;
                cewrapper.type = type;
                cewrapper.fn = function(e) {
                    cewrapper.fire(Y.Event.getEvent(e, el, (compat || (false === facade))));
                };
				cewrapper.capture = capture;
            
                if (el == Y.config.win && type == "load") {
                    // window load happens once
                    cewrapper.fireOnce = true;
                    _windowLoadKey = key;
                }
            
                _wrappers[key] = cewrapper;
                _el_events[ek] = _el_events[ek] || {};
                _el_events[ek][key] = cewrapper;
            
                add(el, type, cewrapper.fn, capture);
            }

			return cewrapper;
			
		},

        _attach: function(args, config) {

            var compat, E=Y.Event,
                handles, oEl, cewrapper, context, 
                fireNow = false, ret,
                type = args[0],
                fn = args[1],
                el = args[2] || Y.config.win,
                facade = config && config.facade,
                capture = config && config.capture;

            if (args[args.length-1] === COMPAT_ARG) {
                compat = true;
                // trimmedArgs.pop();
            }

            if (!fn || !fn.call) {
// throw new TypeError(type + " attach call failed, callback undefined");
                return false;
            }

            // The el argument can be an array of elements or element ids.
            if (shouldIterate(el)) {

                handles=[];
                
                Y.each(el, function(v, k) {
                    args[2] = v;
                    handles.push(E._attach(args, config));
                });

                // return (handles.length === 1) ? handles[0] : handles;
                return new Y.EventHandle(handles);

            // If the el argument is a string, we assume it is 
            // actually the id of the element.  If the page is loaded
            // we convert el to the actual element, otherwise we 
            // defer attaching the event until the element is
            // ready
            } else if (Y.Lang.isString(el)) {

                // oEl = (compat) ? Y.DOM.byId(el) : Y.Selector.query(el);

                if (compat) {
                    oEl = Y.DOM.byId(el);
                } else {

                    oEl = Y.Selector.query(el);

                    switch (oEl.length) {
                        case 0:
                            oEl = null;
                            break;
                        case 1:
                            oEl = oEl[0];
                            break;
                        default:
                            args[2] = oEl;
                            return E._attach(args, config);
                    }
                }

                if (oEl) {

                    el = oEl;

                // Not found = defer adding the event until the element is available
                } else {

                    ret = this.onAvailable(el, function() {
                        
                        ret.handle = E._attach(args, config);

                    }, E, true, false, compat);

                    return ret;

                }
            }

            // Element should be an html element or node
            if (!el) {
                return false;
            }

            if (Y.Node && el instanceof Y.Node) {
                el = Y.Node.getDOMNode(el);
            }

 			cewrapper = this._createWrapper(el, type, capture, compat, facade);

            if (el == Y.config.win && type == "load") {

                // if the load is complete, fire immediately.
                // all subscribers, including the current one
                // will be notified.
                if (YUI.Env.windowLoaded) {
                    fireNow = true;
                }
            }

            if (compat) {
                args.pop();
            }

            context = args[3];

            // set context to the Node if not specified
            // ret = cewrapper.on.apply(cewrapper, trimmedArgs);
            ret = cewrapper._on(fn, context, (args.length > 4) ? args.slice(4) : null);

            if (fireNow) {
                cewrapper.fire();
            }

            return ret;

        },

        /**
         * Removes an event listener.  Supports the signature the event was bound
         * with, but the preferred way to remove listeners is using the handle
         * that is returned when using Y.on
         *
         * @method detach
         *
         * @param {String} type the type of event to remove.
         * @param {Function} fn the method the event invokes.  If fn is
         * undefined, then all event handlers for the type of event are 
         * removed.
         * @param {String|HTMLElement|Array|NodeList|EventHandle} el An 
         * event handle, an id, an element reference, or a collection 
         * of ids and/or elements to remove the listener from.
         * @return {boolean} true if the unbind was successful, false otherwise.
         * @static
         */
        detach: function(type, fn, el, obj) {

            var args=Y.Array(arguments, 0, true), compat, i, l, ok,
                id, ce;

            if (args[args.length-1] === COMPAT_ARG) {
                compat = true;
                // args.pop();
            }

            if (type && type.detach) {
                return type.detach();
            }

            // The el argument can be a string
            if (typeof el == "string") {

                // el = (compat) ? Y.DOM.byId(el) : Y.all(el);
                if (compat) {
                    el = Y.DOM.byId(el);
                } else {
                    el = Y.Selector.query(el);
                    l = el.length;
                    if (l < 1) {
                        el = null;
                    } else if (l == 1) {
                        el = el[0];
                    }
                }
                // return Y.Event.detach.apply(Y.Event, args);

            // The el argument can be an array of elements or element ids.
            } 
            
            if (!el) {
                return false;
            }
            
            if (shouldIterate(el)) {

                ok = true;
                for (i=0, l=el.length; i<l; ++i) {
                    args[2] = el[i];
                    ok = ( Y.Event.detach.apply(Y.Event, args) && ok );
                }

                return ok;

            }

            if (!type || !fn || !fn.call) {
                return this.purgeElement(el, false, type);
            }

            id = 'event:' + Y.stamp(el) + type;
            ce = _wrappers[id];

            if (ce) {
                return ce.detach(fn);
            } else {
                return false;
            }

        },

        /**
         * Finds the event in the window object, the caller's arguments, or
         * in the arguments of another method in the callstack.  This is
         * executed automatically for events registered through the event
         * manager, so the implementer should not normally need to execute
         * this function at all.
         * @method getEvent
         * @param {Event} e the event parameter from the handler
         * @param {HTMLElement} el the element the listener was attached to
         * @return {Event} the event 
         * @static
         */
        getEvent: function(e, el, noFacade) {
            var ev = e || window.event;

            return (noFacade) ? ev : 
                new Y.DOMEventFacade(ev, el, _wrappers['event:' + Y.stamp(el) + e.type]);
        },

        /**
         * Generates an unique ID for the element if it does not already 
         * have one.
         * @method generateId
         * @param el the element to create the id for
         * @return {string} the resulting id of the element
         * @static
         */
        generateId: function(el) {
            var id = el.id;

            if (!id) {
                id = Y.stamp(el);
                el.id = id;
            }

            return id;
        },

        /**
         * We want to be able to use getElementsByTagName as a collection
         * to attach a group of events to.  Unfortunately, different 
         * browsers return different types of collections.  This function
         * tests to determine if the object is array-like.  It will also 
         * fail if the object is an array, but is empty.
         * @method _isValidCollection
         * @param o the object to test
         * @return {boolean} true if the object is array-like and populated
         * @deprecated was not meant to be used directly
         * @static
         * @private
         */
        _isValidCollection: shouldIterate,

        /**
         * hook up any deferred listeners
         * @method _load
         * @static
         * @private
         */
        _load: function(e) {

            if (!_loadComplete) {


                _loadComplete = true;

                // Just in case DOMReady did not go off for some reason
                // E._ready();
                if (Y.fire) {
                    Y.fire(EVENT_READY);
                }

                // Available elements may not have been detected before the
                // window load event fires. Try to find them now so that the
                // the user is more likely to get the onAvailable notifications
                // before the window load notification
                Y.Event._poll();

            }
        },

        /**
         * Polling function that runs before the onload event fires, 
         * attempting to attach to DOM Nodes as soon as they are 
         * available
         * @method _poll
         * @static
         * @private
         */
        _poll: function() {

            if (this.locked) {
                return;
            }

            if (Y.UA.ie && !YUI.Env.DOMReady) {
                // Hold off if DOMReady has not fired and check current
                // readyState to protect against the IE operation aborted
                // issue.
                this.startInterval();
                return;
            }

            this.locked = true;


            // keep trying until after the page is loaded.  We need to 
            // check the page load state prior to trying to bind the 
            // elements so that we can be certain all elements have been 
            // tested appropriately
            var tryAgain = !_loadComplete, notAvail, executeItem,
                i, len, item, el;

            if (!tryAgain) {
                tryAgain = (_retryCount > 0);
            }

            // onAvailable
            notAvail = [];

            executeItem = function (el, item) {

                var context, ov = item.override;

                if (item.compat) {

                    if (item.override) {
                        if (ov === true) {
                            context = item.obj;
                        } else {
                            context = ov;
                        }
                    } else {
                        context = el;
                    }

                    item.fn.call(context, item.obj);

                } else {
                    context = item.obj || Y.one(el);
                    item.fn.apply(context, (Y.Lang.isArray(ov)) ? ov : []);
                }

            };


            // onAvailable
            for (i=0,len=_avail.length; i<len; ++i) {
                item = _avail[i];
                if (item && !item.checkReady) {

                    // el = (item.compat) ? Y.DOM.byId(item.id) : Y.one(item.id);
                    el = (item.compat) ? Y.DOM.byId(item.id) : Y.Selector.query(item.id, null, true);

                    if (el) {
                        executeItem(el, item);
                        _avail[i] = null;
                    } else {
                        notAvail.push(item);
                    }
                }
            }

            // onContentReady
            for (i=0,len=_avail.length; i<len; ++i) {
                item = _avail[i];
                if (item && item.checkReady) {

                    // el = (item.compat) ? Y.DOM.byId(item.id) : Y.one(item.id);
                    el = (item.compat) ? Y.DOM.byId(item.id) : Y.Selector.query(item.id, null, true);

                    if (el) {
                        // The element is available, but not necessarily ready
                        // @todo should we test parentNode.nextSibling?
                        if (_loadComplete || (el.get && el.get('nextSibling')) || el.nextSibling) {
                            executeItem(el, item);
                            _avail[i] = null;
                        }
                    } else {
                        notAvail.push(item);
                    }
                }
            }

            _retryCount = (notAvail.length === 0) ? 0 : _retryCount - 1;

            if (tryAgain) {
                // we may need to strip the nulled out items here
                this.startInterval();
            } else {
                clearInterval(this._interval);
                this._interval = null;
            }

            this.locked = false;

            return;

        },

        /**
         * Removes all listeners attached to the given element via addListener.
         * Optionally, the node's children can also be purged.
         * Optionally, you can specify a specific type of event to remove.
         * @method purgeElement
         * @param {HTMLElement} el the element to purge
         * @param {boolean} recurse recursively purge this element's children
         * as well.  Use with caution.
         * @param {string} type optional type of listener to purge. If
         * left out, all listeners will be removed
         * @static
         */
        purgeElement: function(el, recurse, type) {
            // var oEl = (Y.Lang.isString(el)) ? Y.one(el) : el,
            var oEl = (Y.Lang.isString(el)) ?  Y.Selector.query(el, null, true) : el,
                lis = this.getListeners(oEl, type), i, len, props;
            if (lis) {
                for (i=0,len=lis.length; i<len ; ++i) {
                    props = lis[i];
                    props.detachAll();
                    remove(props.el, props.type, props.fn, props.capture);
                    delete _wrappers[props.key];
                    delete _el_events[props.domkey][props.key];
                }

            }

            if (recurse && oEl && oEl.childNodes) {
                for (i=0,len=oEl.childNodes.length; i<len ; ++i) {
                    this.purgeElement(oEl.childNodes[i], recurse, type);
                }
            }

        },

        /**
         * Returns all listeners attached to the given element via addListener.
         * Optionally, you can specify a specific type of event to return.
         * @method getListeners
         * @param el {HTMLElement|string} the element or element id to inspect 
         * @param type {string} optional type of listener to return. If
         * left out, all listeners will be returned
         * @return {Y.Custom.Event} the custom event wrapper for the DOM event(s)
         * @static
         */           
        getListeners: function(el, type) {
            var ek = Y.stamp(el, true), evts = _el_events[ek],
                results=[] , key = (type) ? 'event:' + ek + type : null;

            if (!evts) {
                return null;
            }

            if (key) {
                if (evts[key]) {
                    results.push(evts[key]);
                }

                // get native events as well
                key += 'native';
                if (evts[key]) {
                    results.push(evts[key]);
                }

            } else {
                Y.each(evts, function(v, k) {
                    results.push(v);
                });
            }

            return (results.length) ? results : null;
        },

        /**
         * Removes all listeners registered by pe.event.  Called 
         * automatically during the unload event.
         * @method _unload
         * @static
         * @private
         */
        _unload: function(e) {
            Y.each(_wrappers, function(v, k) {
                v.detachAll();
                remove(v.el, v.type, v.fn, v.capture);
                delete _wrappers[k];
                delete _el_events[v.domkey][k];
            });
        },

        
        /**
         * Adds a DOM event directly without the caching, cleanup, context adj, etc
         *
         * @method nativeAdd
         * @param {HTMLElement} el      the element to bind the handler to
         * @param {string}      type   the type of event handler
         * @param {function}    fn      the callback to invoke
         * @param {boolen}      capture capture or bubble phase
         * @static
         * @private
         */
        nativeAdd: add,

        /**
         * Basic remove listener
         *
         * @method nativeRemove
         * @param {HTMLElement} el      the element to bind the handler to
         * @param {string}      type   the type of event handler
         * @param {function}    fn      the callback to invoke
         * @param {boolen}      capture capture or bubble phase
         * @static
         * @private
         */
        nativeRemove: remove
    };

}();

Y.Event = Event;


if (Y.config.injected || YUI.Env.windowLoaded) {
    onLoad();
} else {
    add(window, "load", onLoad);
}

// Process onAvailable/onContentReady items when when the DOM is ready in IE
if (Y.UA.ie) {
    Y.on(EVENT_READY, Event._poll, Event, true);
}

Y.on("unload", onUnload);

Event.Custom = Y.CustomEvent;
Event.Subscriber = Y.Subscriber;
Event.Target = Y.EventTarget;
Event.Handle = Y.EventHandle;
Event.Facade = Y.EventFacade;

Event._poll();

})();

/**
 * DOM event listener abstraction layer
 * @module event
 * @submodule event-base
 */

/**
 * Executes the callback as soon as the specified element 
 * is detected in the DOM.
 * @event available
 * @param type {string} 'available'
 * @param fn {function} the callback function to execute.
 * @param el {string|HTMLElement|collection} the element(s) to attach
 * @param context optional argument that specifies what 'this' refers to.
 * @param args* 0..n additional arguments to pass on to the callback function.
 * These arguments will be added after the event object.
 * @return {EventHandle} the detach handle
 * @for YUI
 */
Y.Env.evt.plugins.available = {
    on: function(type, fn, id, o) {
        var a = arguments.length > 4 ?  Y.Array(arguments, 4, true) : [];
        return Y.Event.onAvailable.call(Y.Event, id, fn, o, a);
    }
};

/**
 * Executes the callback as soon as the specified element 
 * is detected in the DOM with a nextSibling property
 * (indicating that the element's children are available)
 * @event contentready
 * @param type {string} 'contentready'
 * @param fn {function} the callback function to execute.
 * @param el {string|HTMLElement|collection} the element(s) to attach
 * @param context optional argument that specifies what 'this' refers to.
 * @param args* 0..n additional arguments to pass on to the callback function.
 * These arguments will be added after the event object.
 * @return {EventHandle} the detach handle
 * @for YUI
 */
Y.Env.evt.plugins.contentready = {
    on: function(type, fn, id, o) {
        var a = arguments.length > 4 ?  Y.Array(arguments, 4, true) : [];
        return Y.Event.onContentReady.call(Y.Event, id, fn, o, a);
    }
};


}, '3.0.0' ,{requires:['event-custom-base']});
YUI.add('event-delegate', function(Y) {

/**
 * Adds event delegation support to the library.
 * 
 * @module event
 * @submodule event-delegate
 */

var Event = Y.Event,
	Lang = Y.Lang,

	delegates = {},
	
	specialTypes = {
		mouseenter: "mouseover",
		mouseleave: "mouseout"
	},

	resolveTextNode = function(n) {
	    try {
	        if (n && 3 == n.nodeType) {
	            return n.parentNode;
	        }
	    } catch(e) { }
	    return n;
	},

    delegateHandler = function(delegateKey, e, el) {

        var target = resolveTextNode((e.target || e.srcElement)), 
            tests  = delegates[delegateKey],
            spec, 
			ename,
			matched,
			fn,
			ev;


		var getMatch = function(el, selector, container) {
			
			var returnVal;
			
			if (!el || el === container) {
				returnVal = false;
			}
			else {
				returnVal = Y.Selector.test(el, selector) ? el: getMatch(el.parentNode, selector, container);
			}
			
			return returnVal;
			
		};


        for (spec in tests) {

            if (tests.hasOwnProperty(spec)) {

                ename  = tests[spec];
				fn	= tests.fn;
				matched = null;


				if (Y.Selector.test(target, spec, el)) {
					matched = target;
				}
				else if (Y.Selector.test(target, ((spec.replace(/,/gi, " *,")) + " *"), el)) {
						
					//	The target is a descendant of an element matching 
					//	the selector, so crawl up to find the ancestor that 
					//	matches the selector
					
					matched = getMatch(target, spec, el);
					
				}


				if (matched) {

                    if (!ev) {
                        ev = new Y.DOMEventFacade(e, el);
                        ev.container = ev.currentTarget;
                    }

                    ev.currentTarget = Y.Node.get(matched);

					Y.publish(ename, {
			               contextFn: function() {
			                   return ev.currentTarget;
			               }
			           });

					if (fn) {
						fn(ev, ename);
					}
					else {
                    	Y.fire(ename, ev);								
					}
					
				}

            }
        }

    },

	attach = function (type, key, element) {

		var focusMethods = {
				focus: Event._attachFocus,
				blur: Event._attachBlur
			},

			attachFn = focusMethods[type],

			args = [type, 
			function (e) {
	            delegateHandler(key, (e || window.event), element);
			}, 
			element];


		if (attachFn) {
			return attachFn(args, { capture: true, facade: false });
		}
		else {
			return Event._attach(args, { facade: false });
		}
		
	},

    sanitize = Y.cached(function(str) {
        return str.replace(/[|,:]/g, '~');
    });

/**
 * Sets up event delegation on a container element.  The delegated event
 * will use a supplied selector to test if the target or one of the
 * descendants of the target match it.  The supplied callback function 
 * will only be executed if a match was encountered, and, in fact, 
 * will be executed for each element that matches if you supply an 
 * ambiguous selector.
 *
 * The event object for the delegated event is supplied to the callback
 * function.  It is modified slightly in order to support all properties
 * that may be needed for event delegation.  'currentTarget' is set to
 * the element that matched the delegation specifcation.  'container' is
 * set to the element that the listener is bound to (this normally would
 * be the 'currentTarget').
 *
 * @event delegate
 * @param type {string} 'delegate'
 * @param fn {function} the callback function to execute.  This function
 * will be provided the event object for the delegated event.
 * @param el {string|node} the element that is the delegation container
 * @param delegateType {string} the event type to delegate
 * @param spec {string} a selector that must match the target of the
 * event.
 * @param context optional argument that specifies what 'this' refers to.
 * @param args* 0..n additional arguments to pass on to the callback function.
 * These arguments will be added after the event object.
 * @return {EventHandle} the detach handle
 * @for YUI
 * @deprecated use Y.delegate
 */
Y.Env.evt.plugins.delegate = {

    on: function(type, fn, el, delegateType, spec) {


		var args = Y.Array(arguments, 0, true);
		
		args.splice(3, 1);
		
		args[0] = delegateType;

		return Y.delegate.apply(Y, args);

    }

};


/**
 * Sets up event delegation on a container element.  The delegated event
 * will use a supplied selector to test if the target or one of the
 * descendants of the target match it.  The supplied callback function 
 * will only be executed if a match was encountered, and, in fact, 
 * will be executed for each element that matches if you supply an 
 * ambiguous selector.
 *
 * The event object for the delegated event is supplied to the callback
 * function.  It is modified slightly in order to support all properties
 * that may be needed for event delegation.  'currentTarget' is set to
 * the element that matched the delegation specifcation.  'container' is
 * set to the element that the listener is bound to (this normally would
 * be the 'currentTarget').
 *
 * @method delegate
 * @param type {string} the event type to delegate
 * @param fn {function} the callback function to execute.  This function
 * will be provided the event object for the delegated event.
 * @param el {string|node} the element that is the delegation container
 * @param spec {string} a selector that must match the target of the
 * event.
 * @param context optional argument that specifies what 'this' refers to.
 * @param args* 0..n additional arguments to pass on to the callback function.
 * These arguments will be added after the event object.
 * @return {EventHandle} the detach handle
 * @for YUI
 */
Event.delegate = function (type, fn, el, spec) {

    if (!spec) {
        return false;
    }


    var args = Y.Array(arguments, 0, true),	    
		element = el,	// HTML element serving as the delegation container
		availHandle;	


	if (Lang.isString(el)) {
		
		//	Y.Selector.query returns an array of matches unless specified 
		//	to return just the first match.  Since the primary use case for
		//	event delegation is to use a single event handler on a container,
		//	Y.delegate doesn't currently support being able to bind a 
		//	single listener to multiple containers.
		
		element = Y.Selector.query(el, null, true);
		
		if (!element) { // Not found, check using onAvailable

			availHandle = Event.onAvailable(el, function() {

				availHandle.handle = Event.delegate.apply(Event, args);

            }, Event, true, false);

            return availHandle;
			
		}
		
	}


	element = Y.Node.getDOMNode(element);


	var	guid = Y.stamp(element),
            
        // The Custom Event for the delegation spec
        ename = 'delegate:' + guid + type + sanitize(spec),

        // The key to the listener for the event type and container
        delegateKey = type + guid,

		delegate = delegates[delegateKey],

		domEventHandle,
		
		ceHandle,
		
		listeners;
	

    if (!delegate) {

		delegate = {};

		if (specialTypes[type]) {
			
			if (!Event._fireMouseEnter) {
				return false;				
			}
			
			type = specialTypes[type];
			delegate.fn = Event._fireMouseEnter;
			
		}

		//	Create the DOM Event wrapper that will fire the Custom Event

		domEventHandle = attach(type, delegateKey, element);


		//	Hook into the _delete method for the Custom Event wrapper of this
		//	DOM Event in order to clean up the 'delegates' map and unsubscribe
		//	the associated Custom Event listeners fired by this DOM event
		//	listener if/when the user calls "purgeElement" OR removes all 
		//	listeners of the Custom Event.
		
		Y.after(function (sub) {

			if (domEventHandle.sub == sub) {

				//	Delete this event from the map of known delegates
				delete delegates[delegateKey];


				//	Unsubscribe all listeners of the Custom Event fired 
				//	by this DOM event.
				Y.detachAll(ename);
				
			}

		}, domEventHandle.evt, "_delete");
			
		delegate.handle = domEventHandle;

        delegates[delegateKey] = delegate;

    }


	listeners = delegate.listeners;

	delegate.listeners = listeners ? (listeners + 1) : 1;
    delegate[spec] = ename;


    args[0] = ename;

    // Remove element, delegation spec
    args.splice(2, 2);
        

    // Subscribe to the Custom Event for the delegation spec

	ceHandle = Y.on.apply(Y, args);


	//	Hook into the detach method of the handle in order to clean up the 
	//	'delegates' map and remove the associated DOM event handler 
	//	responsible for firing this Custom Event if all listener for this 
	//	event have been removed.

	Y.after(function () {
			
		delegate.listeners = (delegate.listeners - 1);
		
		if (delegate.listeners === 0) {
			delegate.handle.detach();
		}

	}, ceHandle, "detach");

    return ceHandle;
	
};

Y.delegate = Event.delegate;


}, '3.0.0' ,{requires:['node-base']});
YUI.add('event-mousewheel', function(Y) {

/**
 * Adds mousewheel event support
 * @module event
 * @submodule event-mousewheel
 */
var DOM_MOUSE_SCROLL = 'DOMMouseScroll',
    fixArgs = function(args) {
        var a = Y.Array(args, 0, true), target;
        if (Y.UA.gecko) {
            a[0] = DOM_MOUSE_SCROLL;
            target = Y.config.win;
        } else {
            target = Y.config.doc;
        }

        if (a.length < 3) {
            a[2] = target;
        } else {
            a.splice(2, 0, target);
        }

        return a;
    };

/**
 * Mousewheel event.  This listener is automatically attached to the
 * correct target, so one should not be supplied.  Mouse wheel 
 * direction and velocity is stored in the 'mouseDelta' field.
 * @event mousewheel
 * @param type {string} 'mousewheel'
 * @param fn {function} the callback to execute
 * @param context optional context object
 * @param args 0..n additional arguments to provide to the listener.
 * @return {EventHandle} the detach handle
 * @for YUI
 */
Y.Env.evt.plugins.mousewheel = {
    on: function() {
        return Y.Event._attach(fixArgs(arguments));
    },

    detach: function() {
        return Y.Event.detach.apply(Y.Event, fixArgs(arguments));
    }
};


}, '3.0.0' ,{requires:['node-base']});
YUI.add('event-mouseenter', function(Y) {

/**
 * Adds support for mouseenter/mouseleave events
 * @module event
 * @submodule event-mouseenter
 */
var Event = Y.Event,
	Lang = Y.Lang,

	plugins = Y.Env.evt.plugins,
	
	listeners = {},

	eventConfig = {

    	on: function(type, fn, el) {

		    var args = Y.Array(arguments, 0, true),	    
				element = el,
				availHandle;


			if (Lang.isString(el)) {

				//	Need to use Y.all because if el is a string it could be a 
				//	selector that returns a NodeList

				element = Y.all(el);

				if (element.size() === 0) { // Not found, check using onAvailable

		            availHandle = Event.onAvailable(el, function() {

		                availHandle.handle = Y.on.apply(Y, args);

		            }, Event, true, false);
		
					return availHandle;

				}

			}
			

	        var sDOMEvent = (type === "mouseenter") ? "mouseover" : "mouseout",

				//	The name of the custom event
				sEventName = type + ":" + Y.stamp(element) + sDOMEvent,

				listener = listeners[sEventName],

				domEventHandle,
				
				ceHandle,
				
				nListeners;


			//	Bind an actual DOM event listener that will call the 
			//	the custom event				
			if (!listener) {
				
				domEventHandle = Y.on(sDOMEvent, Y.rbind(Event._fireMouseEnter, Y, sEventName), element);

				//	Hook into the _delete method for the Custom Event wrapper of this
				//	DOM Event in order to clean up the 'listeners' map and unsubscribe
				//	the associated Custom Event listeners fired by this DOM event
				//	listener if/when the user calls "purgeElement" OR removes all 
				//	listeners of the Custom Event.

				Y.after(function (sub) {

					if (domEventHandle.sub == sub) {

						//	Delete this event from the map of known mouseenter 
						//	and mouseleave listeners
						delete listeners[sEventName];


						//	Unsubscribe all listeners of the Custom Event fired 
						//	by this DOM event.
						Y.detachAll(sEventName);

					}

				}, domEventHandle.evt, "_delete");
				

				listener = {};				
				listener.handle = domEventHandle;				

				listeners[sEventName] = listener;

			}

			nListeners = listener.count;

			listener.count = nListeners ? (nListeners + 1) : 1;

	        args[0] = sEventName;

	        // Remove the element from the args
			args.splice(2, 1);

	        // Subscribe to the custom event
	        ceHandle = Y.on.apply(Y, args);
	
			//	Hook into the detach method of the handle in order to clean up the 
			//	'listeners' map and remove the associated DOM event handler 
			//	responsible for firing this Custom Event if all listener for this 
			//	event have been removed.

			Y.after(function () {

				listener.count = (listener.count - 1);

				if (listener.count === 0) {
					listener.handle.detach();
				}

			}, ceHandle, "detach");	
	
	
			return ceHandle;

	    }

	};
	

Event._fireMouseEnter = function (e, eventName) {

	var relatedTarget = e.relatedTarget,
		currentTarget = e.currentTarget;

	if (currentTarget !== relatedTarget && 
		!currentTarget.contains(relatedTarget)) {

		Y.publish(eventName, {
               contextFn: function() {
                   return currentTarget;
               }
           });			

		Y.fire(eventName, e);

	}

};	


/**
 * Sets up a "mouseenter" listener&#151;a listener that is called the first time 
 * the user's mouse enters the specified element(s).
 * 
 * @event mouseenter
 * @param type {string} "mouseenter"
 * @param fn {function} The method the event invokes.
 * @param el {string|node} The element(s) to assign the listener to.
 * @param spec {string} Optional.  String representing a selector that must 
 * match the target of the event in order for the listener to be called.
 * @return {EventHandle} the detach handle
 * @for YUI
 */
plugins.mouseenter = eventConfig;

/**
* Sets up a "mouseleave" listener&#151;a listener that is called the first time 
* the user's mouse leaves the specified element(s).
* 
* @event mouseleave
* @param type {string} "mouseleave"
* @param fn {function} The method the event invokes.
* @param el {string|node} The element(s) to assign the listener to.
* @param spec {string} Optional.  String representing a selector that must 
* match the target of the event in order for the listener to be called.
* @return {EventHandle} the detach handle
* @for YUI
 */
plugins.mouseleave = eventConfig;


}, '3.0.0' ,{requires:['node-base']});
YUI.add('event-key', function(Y) {

/**
 * Functionality to listen for one or more specific key combinations.
 * @module event
 * @submodule event-key
 */

/**
 * Add a key listener.  The listener will only be notified if the
 * keystroke detected meets the supplied specification.  The
 * spec consists of the key event type, followed by a colon,
 * followed by zero or more comma separated key codes, followed
 * by zero or more modifiers delimited by a plus sign.  Ex:
 * press:12,65+shift+ctrl
 * @event key
 * @for YUI
 * @param type {string} 'key'
 * @param fn {function} the function to execute
 * @param id {string|HTMLElement|collection} the element(s) to bind
 * @param spec {string} the keyCode and modifier specification
 * @param o optional context object
 * @param args 0..n additional arguments to provide to the listener.
 * @return {Event.Handle} the detach handle
 */
Y.Env.evt.plugins.key = {

    on: function(type, fn, id, spec, o) {
        var a = Y.Array(arguments, 0, true), parsed, etype, criteria, ename;

        parsed = spec && spec.split(':');

        if (!spec || spec.indexOf(':') == -1 || !parsed[1]) {
            a[0] = 'key' + ((parsed && parsed[0]) || 'press');
            return Y.on.apply(Y, a);
        }

        // key event type: 'down', 'up', or 'press'
        etype = parsed[0];

        // list of key codes optionally followed by modifiers
        criteria = (parsed[1]) ? parsed[1].split(/,|\+/) : null;

        // the name of the custom event that will be created for the spec
        ename = (Y.Lang.isString(id) ? id : Y.stamp(id)) + spec;

        ename = ename.replace(/,/g, '_');

        if (!Y.getEvent(ename)) {

            // subscribe spec validator to the DOM event
            Y.on(type + etype, function(e) {

                
                var passed = false, failed = false, i, crit, critInt;

                for (i=0; i<criteria.length; i=i+1) {
                    crit = criteria[i]; 
                    critInt = parseInt(crit, 10);

                    // pass this section if any supplied keyCode 
                    // is found
                    if (Y.Lang.isNumber(critInt)) {

                        if (e.charCode === critInt) {
                            passed = true;
                        } else {
                            failed = true;
                        }

                    // only check modifier if no keyCode was specified
                    // or the keyCode check was successful.  pass only 
                    // if every modifier passes
                    } else if (passed || !failed) {
                        passed = (e[crit + 'Key']);
                        failed = !passed;
                    }                    
                }

                // fire spec custom event if spec if met
                if (passed) {
                    Y.fire(ename, e);
                }

            }, id);

        }

        // subscribe supplied listener to custom event for spec validator
        // remove element and spec.
        a.splice(2, 2);
        a[0] = ename;

        return Y.on.apply(Y, a);
    }
};


}, '3.0.0' ,{requires:['node-base']});
YUI.add('event-focus', function(Y) {

/**
 * Adds focus and blur event listener support.  These events normally
 * do not bubble, so this adds support for that so these events
 * can be used in event delegation scenarios.
 * 
 * @module event
 * @submodule event-focus
 */
(function() {

var UA = Y.UA,
	Event = Y.Event,
	plugins = Y.Env.evt.plugins,
	ie = UA.ie,
	bUseMutation = (UA.opera || UA.webkit),
	eventNames = {
		focus: (ie ? 'focusin' : (bUseMutation ? 'DOMFocusIn' : 'focus')),
		blur: (ie ? 'focusout' : (bUseMutation ? 'DOMFocusOut' : 'blur'))
	},

	//	Only need to use capture phase for Gecko since it doesn't support 
	//	focusin, focusout, DOMFocusIn, or DOMFocusOut
    CAPTURE_CONFIG = { capture: (UA.gecko ? true : false) },


	attach = function (args, config) {

	    var a = Y.Array(args, 0, true);
		a[0] = eventNames[a[0]];
	    return Event._attach(a, config);

	},
	
	eventAdapter = {

		on: function () {
			return attach(arguments, CAPTURE_CONFIG);
		}

	};


Event._attachFocus = attach;
Event._attachBlur = attach;

/**
 * Adds a DOM focus listener.  Uses the focusin event in IE, 
 * DOMFocusIn for Opera and Webkit, and the capture phase for Gecko so that
 * the event propagates in a way that enables event delegation.
 *
 * @for YUI
 * @event focus
 * @param type {string} 'focus'
 * @param fn {function} the callback function to execute
 * @param o {string|HTMLElement|collection} the element(s) to bind
 * @param context optional context object
 * @param args 0..n additional arguments to provide to the listener.
 * @return {EventHandle} the detach handle
 */
plugins.focus = eventAdapter;

/**
 * Adds a DOM blur listener.  Uses the focusout event in IE, 
 * DOMFocusOut for Opera and Webkit, and the capture phase for Gecko so that
 * the event propagates in a way that enables event delegation.
 *
 * @for YUI
 * @event blur
 * @param type {string} 'blur'
 * @param fn {function} the callback function to execute
 * @param o {string|HTMLElement|collection} the element(s) to bind
 * @param context optional context object
 * @param args 0..n additional arguments to provide to the listener.
 * @return {EventHandle} the detach handle
 */
plugins.blur = eventAdapter;

})();


}, '3.0.0' ,{requires:['node-base']});
YUI.add('event-resize', function(Y) {

/**
 * Adds a window resize event that has its behavior normalized to fire at the
 * end of the resize rather than constantly during the resize.
 * @module event
 * @submodule event-resize
 */
(function() {

var detachHandle,

    timerHandle,

    CE_NAME = 'window:resize',

    handler = function(e) {

        if (Y.UA.gecko) {

            Y.fire(CE_NAME, e);

        } else {

            if (timerHandle) {
                timerHandle.cancel();
            }

            timerHandle = Y.later(Y.config.windowResizeDelay || 40, Y, function() {
                Y.fire(CE_NAME, e);
            });
        }
        
    };


/**
 * Firefox fires the window resize event once when the resize action
 * finishes, other browsers fire the event periodically during the
 * resize.  This code uses timeout logic to simulate the Firefox 
 * behavior in other browsers.
 * @event windowresize
 * @for YUI
 */
Y.Env.evt.plugins.windowresize = {

    on: function(type, fn) {

        // check for single window listener and add if needed
        if (!detachHandle) {
            detachHandle = Y.Event._attach(['resize', handler]);
        }

        var a = Y.Array(arguments, 0, true);
        a[0] = CE_NAME;

        return Y.on.apply(Y, a);
    }
};

})();


}, '3.0.0' ,{requires:['node-base']});


YUI.add('event', function(Y){}, '3.0.0' ,{use:['event-base', 'event-delegate', 'event-mousewheel', 'event-mouseenter', 'event-key', 'event-focus', 'event-resize']});

/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
YUI.add('node-base', function(Y) {

/**
 * The Node Utility provides a DOM-like interface for interacting with DOM nodes.
 * @module node
 * @submodule node-base
 */    

/**
 * The Node class provides a wrapper for manipulating DOM Nodes.
 * Node properties can be accessed via the set/get methods.
 * Use Y.get() to retrieve Node instances.
 *
 * <strong>NOTE:</strong> Node properties are accessed using
 * the <code>set</code> and <code>get</code> methods.
 *
 * @class Node
 * @constructor
 * @for Node
 */

// "globals"
var DOT = '.',
    NODE_NAME = 'nodeName',
    NODE_TYPE = 'nodeType',
    OWNER_DOCUMENT = 'ownerDocument',
    TAG_NAME = 'tagName',
    UID = '_yuid',

    Node = function(node) {
        var uid = node[UID];

        if (uid && Node._instances[uid] && Node._instances[uid]._node !== node) {
            node[UID] = null; // unset existing uid to prevent collision (via clone or hack)
        }

        uid = Y.stamp(node);
        if (!uid) { // stamp failed; likely IE non-HTMLElement
            uid = Y.guid();
        }

        this[UID] = uid;

        this._node = node;
        Node._instances[uid] = this;

        this._stateProxy = node; // when augmented with Attribute

        if (this._initPlugins) { // when augmented with Plugin.Host
            this._initPlugins();
        }
    },

    // used with previous/next/ancestor tests
    _wrapFn = function(fn) {
        var ret = null;
        if (fn) {
            ret = (typeof fn === 'string') ?
            function(n) {
                return Y.Selector.test(n, fn);
            } : 
            function(n) {
                return fn(Node.get(n));
            };
        }

        return ret;
    };
// end "globals"

Node.NAME = 'Node';

Node.re_aria = /^(?:role$|aria-)/;

Node.DOM_EVENTS = {
    abort: true,
    beforeunload: true,
    blur: true,
    change: true,
    click: true,
    close: true,
    command: true,
    contextmenu: true,
    drag: true,
    dragstart: true,
    dragenter: true,
    dragover: true,
    dragleave: true,
    dragend: true,
    drop: true,
    dblclick: true,
    error: true,
    focus: true,
    keydown: true,
    keypress: true,
    keyup: true,
    load: true,
    message: true,
    mousedown: true,
    mousemove: true,
    mouseout: true, 
    mouseover: true, 
    mouseup: true,
    mousemultiwheel: true,
    mousewheel: true,
    submit: true,
    mouseenter: true,
    mouseleave: true,
    scroll: true,
    reset: true,
    resize: true,
    select: true,
    textInput: true,
    unload: true
};

// Add custom event adaptors to this list.  This will make it so
// that delegate, key, available, contentready, etc all will
// be available through Node.on
Y.mix(Node.DOM_EVENTS, Y.Env.evt.plugins);

Node._instances = {};

/**
 * Retrieves the DOM node bound to a Node instance
 * @method Node.getDOMNode
 * @static
 *
 * @param {Y.Node || HTMLNode} node The Node instance or an HTMLNode
 * @return {HTMLNode} The DOM node bound to the Node instance.  If a DOM node is passed
 * as the node argument, it is simply returned.
 */
Node.getDOMNode = function(node) {
    if (node) {
        return (node.nodeType) ? node : node._node || null;
    }
    return null;
};
 
Node.scrubVal = function(val, node) {
    if (node && val) { // only truthy values are risky
        if (typeof val === 'object' || typeof val === 'function') { // safari nodeList === function
            if (NODE_TYPE in val || Y.DOM.isWindow(val)) {// node || window
                val = Node.get(val);
            } else if ((val.item && !val._nodes) || // dom collection or Node instance
                    (val[0] && val[0][NODE_TYPE])) { // array of DOM Nodes
                val = Y.all(val);
            }
        }
    } else if (val === undefined) {
        val = node; // for chaining
    }

    return val;
};

Node.addMethod = function(name, fn, context) {
    if (name && fn && typeof fn === 'function') {
        Node.prototype[name] = function() {
            context = context || this;
            var args = Y.Array(arguments),
                ret;

            if (args[0] && args[0] instanceof Node) {
                args[0] = args[0]._node;
            }

            if (args[1] && args[1] instanceof Node) {
                args[1] = args[1]._node;
            }
            args.unshift(this._node);
            ret = Node.scrubVal(fn.apply(context, args), this);
            return ret;
        };
    } else {
    }
};

Node.importMethod = function(host, name, altName) {
    if (typeof name === 'string') {
        altName = altName || name;
        Node.addMethod(altName, host[name], host);
    } else {
        Y.each(name, function(n) {
            Node.importMethod(host, n);
        });
    }
};

/**
 * Returns a single Node instance bound to the node or the
 * first element matching the given selector.
 * @method Y.one
 * @static
 * @param {String | HTMLElement} node a node or Selector 
 * @param {Y.Node || HTMLElement} doc an optional document to scan. Defaults to Y.config.doc. 
 */
Node.one = function(node) {
    var instance = null,
        cachedNode,
        uid;

    if (node) {
        if (typeof node === 'string') {
            if (node.indexOf('doc') === 0) { // doc OR document
                node = Y.config.doc;
            } else if (node.indexOf('win') === 0) { // win OR window
                node = Y.config.win;
            } else {
                node = Y.Selector.query(node, null, true);
            }
            if (!node) {
                return null;
            }
        } else if (node instanceof Node) {
            return node; // NOTE: return
        }

        uid = node._yuid;
        instance = Node._instances[uid]; // reuse exising instances
        cachedNode = instance ? instance._node : null;
        if (!instance || (cachedNode && node !== cachedNode)) { // new Node when nodes don't match
            instance = new Node(node);
        }
    }
    return instance;
};

/**
 * Returns a single Node instance bound to the node or the
 * first element matching the given selector.
 * @method Y.get
 * @deprecated Use Y.one
 * @static
 * @param {String | HTMLElement} node a node or Selector 
 * @param {Y.Node || HTMLElement} doc an optional document to scan. Defaults to Y.config.doc. 
 */
Node.get = function() {
    return Node.one.apply(Node, arguments);
};

/**
 * Creates a new dom node using the provided markup string. 
 * @method create
 * @static
 * @param {String} html The markup used to create the element
 * @param {HTMLDocument} doc An optional document context 
 * @return {Node} A Node instance bound to a DOM node or fragment 
 */
Node.create = function() {
    return Node.get(Y.DOM.create.apply(Y.DOM, arguments));
};

Node.ATTRS = {
    /**
     * Allows for getting and setting the text of an element.
     * Formatting is preserved and special characters are treated literally.
     * @config text
     * @type String
     */
    text: {
        getter: function() {
            return Y.DOM.getText(this._node);
        },

        setter: function(content) {
            Y.DOM.setText(this._node, content);
            return content;
        }
    },

    'options': {
        getter: function() {
            return this._node.getElementsByTagName('option');
        }
    },

     // IE: elements collection is also FORM node which trips up scrubVal.
     // preconverting to NodeList
     // TODO: break out for IE only
    'elements': {
        getter: function() {
            return Y.all(this._node.elements);
        }
    },

    /**
     * Returns a NodeList instance of all HTMLElement children.
     * @readOnly
     * @config children
     * @type NodeList
     */
    'children': {
        getter: function() {
            var node = this._node,
                children = node.children,
                childNodes, i, len;

            if (!children) {
                childNodes = node.childNodes;
                children = [];

                for (i = 0, len = childNodes.length; i < len; ++i) {
                    if (childNodes[i][TAG_NAME]) {
                        children[children.length] = childNodes[i];
                    }
                }
            }
            return Y.all(children);
        }
    },

    value: {
        getter: function() {
            return Y.DOM.getValue(this._node);
        },

        setter: function(val) {
            Y.DOM.setValue(this._node, val);
            return val;
        }
    },

    data: {
        getter: function() {
            return this._data;
        },

        setter: function(val) {
            this._data = val;
            return val;
        }
    }
};

// call with instance context
Node.DEFAULT_SETTER = function(name, val) {
    var node = this._stateProxy,
        strPath;

    if (name.indexOf(DOT) > -1) {
        strPath = name;
        name = name.split(DOT);
        // only allow when defined on node
        Y.Object.setValue(node, name, val);
    } else if (node[name] !== undefined) { // pass thru DOM properties 
        node[name] = val;
    }

    return val;
};

// call with instance context
Node.DEFAULT_GETTER = function(name) {
    var node = this._stateProxy,
        val;

    if (name.indexOf && name.indexOf(DOT) > -1) {
        val = Y.Object.getValue(node, name.split(DOT));
    } else if (node[name] !== undefined) { // pass thru from DOM
        val = node[name];
    }

    return val;
};

Y.augment(Node, Y.Event.Target);

Y.mix(Node.prototype, {
    toString: function() {
        var str = '',
            errorMsg = this[UID] + ': not bound to a node',
            node = this._node;

        if (node) {
            str += node[NODE_NAME];
            if (node.id) {
                str += '#' + node.id; 
            }

            if (node.className) {
                str += '.' + node.className.replace(' ', '.'); 
            }

            // TODO: add yuid?
            str += ' ' + this[UID];
        }
        return str || errorMsg;
    },

    /**
     * Returns an attribute value on the Node instance
     * @method get
     * @param {String} attr The attribute to be set
     * @return {any} The current value of the attribute
     */
    get: function(attr) {
        var val;

        if (this._getAttr) { // use Attribute imple
            val = this._getAttr(attr);
        } else {
            val = this._get(attr);
        }

        if (val) {
            val = Y.Node.scrubVal(val, this);
        }
        return val;
    },

    _get: function(attr) {
        var attrConfig = Node.ATTRS[attr],
            val;

        if (attrConfig && attrConfig.getter) {
            val = attrConfig.getter.call(this);
        } else if (Node.re_aria.test(attr)) {
            val = this._node.getAttribute(attr, 2); 
        } else {
            val = Node.DEFAULT_GETTER.apply(this, arguments);
        }

        return val;
    },

    /**
     * Sets an attribute on the Node instance.
     * @method set
     * @param {String} attr The attribute to be set.  
     * @param {any} val The value to set the attribute to.  
     * @chainable
     */
    set: function(attr, val) {
        var attrConfig = Node.ATTRS[attr];

        if (this._setAttr) { // use Attribute imple
            this._setAttr.apply(this, arguments);
        } else { // use setters inline
            if (attrConfig && attrConfig.setter) {
                attrConfig.setter.call(this, val);
            } else if (Node.re_aria.test(attr)) { // special case Aria
                this._node.setAttribute(attr, val);
            } else {
                Node.DEFAULT_SETTER.apply(this, arguments);
            }
        }

        return this;
    },

    /**
     * Sets multiple attributes. 
     * @method setAttrs
     * @param {Object} attrMap an object of name/value pairs to set  
     * @chainable
     */
    setAttrs: function(attrMap) {
        if (this._setAttrs) { // use Attribute imple
            this._setAttrs(attrMap);
        } else { // use setters inline
            Y.Object.each(attrMap, function(v, n) {
                this.set(n, v); 
            }, this);
        }

        return this;
    },

    /**
     * Returns an object containing the values for the requested attributes. 
     * @method getAttrs
     * @param {Array} attrs an array of attributes to get values  
     * @return {Object} An object with attribute name/value pairs.
     */
    getAttrs: function(attrs) {
        var ret = {};
        if (this._getAttrs) { // use Attribute imple
            this._getAttrs(attrs);
        } else { // use setters inline
            Y.Array.each(attrs, function(v, n) {
                ret[v] = this.get(v); 
            }, this);
        }

        return ret;
    },

    /**
     * Creates a new Node using the provided markup string. 
     * @method create
     * @param {String} html The markup used to create the element
     * @param {HTMLDocument} doc An optional document context 
     * @return {Node} A Node instance bound to a DOM node or fragment 
     */
    create: Node.create,

    /**
     * Compares nodes to determine if they match.
     * Node instances can be compared to each other and/or HTMLElements.
     * @method compareTo
     * @param {HTMLElement | Node} refNode The reference node to compare to the node.
     * @return {Boolean} True if the nodes match, false if they do not. 
     */
    compareTo: function(refNode) {
        var node = this._node;
        if (refNode instanceof Y.Node) { 
            refNode = refNode._node;
        }
        return node === refNode;
    },

    /**
     * Determines whether the node is appended to the document.
     * @method inDoc
     * @param {Node|HTMLElement} doc optional An optional document to check against.
     * Defaults to current document. 
     * @return {Boolean} Whether or not this node is appended to the document. 
     */
    inDoc: function(doc) {
        var node = this._node;
        doc = (doc) ? doc._node || doc : node[OWNER_DOCUMENT];
        if (doc.documentElement) {
            return Y.DOM.contains(doc.documentElement, node);
        }
    },

    getById: function(id) {
        var node = this._node,
            ret = Y.DOM.byId(id, node[OWNER_DOCUMENT]);
        if (ret && Y.DOM.contains(node, ret)) {
            ret = Y.one(ret);
        } else {
            ret = null;
        }
        return ret;
    },

   /**
     * Returns the nearest ancestor that passes the test applied by supplied boolean method.
     * @method ancestor
     * @param {String | Function} fn A selector string or boolean method for testing elements.
     * If a function is used, it receives the current node being tested as the only argument.
     * @return {Node} The matching Node instance or null if not found
     */
    ancestor: function(fn) {
        return Node.get(Y.DOM.elementByAxis(this._node, 'parentNode', _wrapFn(fn)));
    },

    /**
     * Returns the previous matching sibling. 
     * Returns the nearest element node sibling if no method provided.
     * @method previous
     * @param {String | Function} fn A selector or boolean method for testing elements.
     * If a function is used, it receives the current node being tested as the only argument.
     * @return {Node} Node instance or null if not found
     */
    previous: function(fn, all) {
        return Node.get(Y.DOM.elementByAxis(this._node, 'previousSibling', _wrapFn(fn), all));
    }, 

    /**
     * Returns the next matching sibling. 
     * Returns the nearest element node sibling if no method provided.
     * @method next
     * @param {String | Function} fn A selector or boolean method for testing elements.
     * If a function is used, it receives the current node being tested as the only argument.
     * @return {Node} Node instance or null if not found
     */
    next: function(node, fn, all) {
        return Node.get(Y.DOM.elementByAxis(this._node, 'nextSibling', _wrapFn(fn), all));
    },
        
    /**
     * Retrieves a Node instance of nodes based on the given CSS selector. 
     * @method one
     *
     * @param {string} selector The CSS selector to test against.
     * @return {Node} A Node instance for the matching HTMLElement.
     */
    one: function(selector) {
        return Y.one(Y.Selector.query(selector, this._node, true));
    },

    /**
     * Retrieves a Node instance of nodes based on the given CSS selector. 
     * @method query
     * @deprecated Use one()
     * @param {string} selector The CSS selector to test against.
     * @return {Node} A Node instance for the matching HTMLElement.
     */
    query: function(selector) {
        return this.one(selector);
    },

    /**
     * Retrieves a nodeList based on the given CSS selector. 
     * @method all
     *
     * @param {string} selector The CSS selector to test against.
     * @return {NodeList} A NodeList instance for the matching HTMLCollection/Array.
     */
    all: function(selector) {
        var nodelist = Y.all(Y.Selector.query(selector, this._node));
        nodelist._query = selector;
        return nodelist;
    },

    /**
     * Retrieves a nodeList based on the given CSS selector. 
     * @method queryAll
     * @deprecated Use all()
     * @param {string} selector The CSS selector to test against.
     * @return {NodeList} A NodeList instance for the matching HTMLCollection/Array.
     */
    queryAll: function(selector) {
        return this.all(selector);
    },

    // TODO: allow fn test
    /**
     * Test if the supplied node matches the supplied selector.
     * @method test
     *
     * @param {string} selector The CSS selector to test against.
     * @return {boolean} Whether or not the node matches the selector.
     */
    test: function(selector) {
        return Y.Selector.test(this._node, selector);
    },

    /**
     * Removes the node from its parent.
     * Shortcut for myNode.get('parentNode').removeChild(myNode);
     * @method remove
     * @chainable
     *
     */
    remove: function(destroy) {
        var node = this._node;
        node.parentNode.removeChild(node);
        if (destroy) {
            this.destroy(true);
        }
        return this;
    },

    /**
     * Replace the node with the other node. This is a DOM update only
     * and does not change the node bound to the Node instance.
     * Shortcut for myNode.get('parentNode').replaceChild(newNode, myNode);
     * @method replace
     * @chainable
     *
     */
    replace: function(newNode) {
        var node = this._node;
        node.parentNode.replaceChild(newNode, node);
        return this;
    },

    purge: function(recurse, type) {
        Y.Event.purgeElement(this._node, recurse, type);
    },

    destroy: function(purge) {
        delete Node._instances[this[UID]];
        if (purge) {
            this.purge(true);
        }

        if (this.unplug) {
            this.unplug();
        }

        this._node._yuid = null;
        this._node = null;
        this._stateProxy = null;
    },

    /**
     * Invokes a method on the Node instance 
     * @method invoke
     * @param {String} method The name of the method to invoke
     * @param {Any}  a, b, c, etc. Arguments to invoke the method with. 
     * @return Whatever the underly method returns. 
     * DOM Nodes and Collections return values
     * are converted to Node/NodeList instances.
     *
     */
    invoke: function(method, a, b, c, d, e) {
        var node = this._node,
            ret;

        if (a && a instanceof Y.Node) {
            a = a._node;
        }

        if (b && b instanceof Y.Node) {
            b = b._node;
        }

        ret = node[method](a, b, c, d, e);    
        return Y.Node.scrubVal(ret, this);
    },

    /**
     * Applies the given function to each Node in the NodeList.
     * @method each
     * @deprecated Use NodeList
     * @param {Function} fn The function to apply 
     * @param {Object} context optional An optional context to apply the function with
     * Default context is the NodeList instance
     * @chainable
     */
    each: function(fn, context) {
        context = context || this;
        return fn.call(context, this);
    },

    /**
     * Retrieves the Node instance at the given index. 
     * @method item
     * @deprecated Use NodeList
     *
     * @param {Number} index The index of the target Node.
     * @return {Node} The Node instance at the given index.
     */
    item: function(index) {
        return this;
    },

    /**
     * Returns the current number of items in the Node.
     * @method size
     * @deprecated Use NodeList
     * @return {Int} The number of items in the Node. 
     */
    size: function() {
        return this._node ? 1 : 0;
    },

    /**
     * Inserts the content before the reference node. 
     * @method insert
     * @param {String | Y.Node | HTMLElement} content The content to insert 
     * @param {Int | Y.Node | HTMLElement | String} where The position to insert at.
     * @chainable
     */
    insert: function(content, where) {
        var node = this._node;

        if (content) {
            if (typeof where === 'number') { // allow index
                where = this._node.childNodes[where];
            }

            if (typeof content !== 'string') { // allow Node or NodeList/Array instances
                if (content._node) { // Node
                    content = content._node;
                } else if (content._nodes || (!content.nodeType && content.length)) { // NodeList or Array
                    Y.each(content._nodes, function(n) {
                        Y.DOM.addHTML(node, n, where);
                    });

                    return this; // NOTE: early return
                }
            }
            Y.DOM.addHTML(node, content, where);
        }
        return this;
    },

    /**
     * Inserts the content as the firstChild of the node. 
     * @method prepend
     * @param {String | Y.Node | HTMLElement} content The content to insert 
     * @chainable
     */
    prepend: function(content) {
        return this.insert(content, 0);
    },

    /**
     * Inserts the content as the lastChild of the node. 
     * @method append
     * @param {String | Y.Node | HTMLElement} content The content to insert 
     * @chainable
     */
    append: function(content) {
        return this.insert(content, null);
    },

    /**
     * Replaces the node's current content with the content.
     * @method setContent
     * @param {String | Y.Node | HTMLElement} content The content to insert 
     * @chainable
     */
    setContent: function(content) {
        Y.DOM.addHTML(this._node, content, 'replace');
        return this;
    },

    // TODO: need this?
    hasMethod: function(method) {
        var node = this._node;
        return (node && (typeof node === 'function'));
    }
}, true);

Y.Node = Node;
Y.get = Y.Node.get;
Y.one = Y.Node.one;
/**
 * The NodeList module provides support for managing collections of Nodes.
 * @module node
 * @submodule nodelist
 */    

/**
 * The NodeList class provides a wrapper for manipulating DOM NodeLists.
 * NodeList properties can be accessed via the set/get methods.
 * Use Y.all() to retrieve NodeList instances.
 *
 * @class NodeList
 * @constructor
 */

var NodeList = function(nodes) {
    if (typeof nodes === 'string') {
        this._query = nodes;
        nodes = Y.Selector.query(nodes);
    } else {
        nodes = Y.Array(nodes, 0, true);
    }

    NodeList._instances[Y.stamp(this)] = this;
    this._nodes = nodes;
};
// end "globals"

NodeList.NAME = 'NodeList';

/**
 * Retrieves the DOM nodes bound to a NodeList instance
 * @method NodeList.getDOMNodes
 * @static
 *
 * @param {Y.NodeList} node The NodeList instance
 * @return {Array} The array of DOM nodes bound to the NodeList
 */
NodeList.getDOMNodes = function(nodeList) {
    return nodeList._nodes;
};

NodeList._instances = [];

NodeList.each = function(instance, fn, context) {
    var nodes = instance._nodes;
    if (nodes && nodes.length) {
        Y.Array.each(nodes, fn, context || instance);
    } else {
    }
};

NodeList.addMethod = function(name, fn, context) {
    if (name && fn) {
        NodeList.prototype[name] = function() {
            var ret = [],
                args = arguments;

            Y.Array.each(this._nodes, function(node) {
                var UID = '_yuid',
                    instance = Y.Node._instances[node[UID]],
                    ctx,
                    result;

                if (!instance) {
                    instance = NodeList._getTempNode(node);
                }
                ctx = context || instance;
                result = fn.apply(ctx, args);
                if (result !== undefined && result !== instance) {
                    ret[ret.length] = result;
                }
            });

            // TODO: remove tmp pointer
            return ret.length ? ret : this;
        };
    } else {
    }
};

NodeList.importMethod = function(host, name, altName) {
    if (typeof name === 'string') {
        altName = altName || name;
        NodeList.addMethod(name, host[name]);
    } else {
        Y.each(name, function(n) {
            NodeList.importMethod(host, n);
        });
    }
};

NodeList._getTempNode = function(node) {
    var tmp = NodeList._tempNode;
    if (!tmp) {
        tmp = Y.Node.create('<div></div>');
        NodeList._tempNode = tmp;
    }

    tmp._node = node;
    tmp._stateProxy = node;
    return tmp;
};

Y.mix(NodeList.prototype, {
    /**
     * Retrieves the Node instance at the given index. 
     * @method item
     *
     * @param {Number} index The index of the target Node.
     * @return {Node} The Node instance at the given index.
     */
    item: function(index) {
        return Y.one((this._nodes || [])[index]);
    },

    /**
     * Applies the given function to each Node in the NodeList.
     * @method each
     * @param {Function} fn The function to apply. It receives 3 arguments:
     * the current node instance, the node's index, and the NodeList instance
     * @param {Object} context optional An optional context to apply the function with
     * Default context is the current Node instance
     * @chainable
     */
    each: function(fn, context) {
        var instance = this;
        Y.Array.each(this._nodes, function(node, index) {
            node = Y.one(node);
            return fn.call(context || node, node, index, instance);
        });
        return instance;
    },

    batch: function(fn, context) {
        var nodelist = this;

        Y.Array.each(this._nodes, function(node, index) {
            var instance = Y.Node._instances[node[UID]];
            if (!instance) {
                instance = NodeList._getTempNode(node);
            }

            return fn.call(context || instance, instance, index, nodelist);
        });
        return nodelist;
    },

    /**
     * Executes the function once for each node until a true value is returned.
     * @method some
     * @param {Function} fn The function to apply. It receives 3 arguments:
     * the current node instance, the node's index, and the NodeList instance
     * @param {Object} context optional An optional context to execute the function from.
     * Default context is the current Node instance
     * @return {Boolean} Whether or not the function returned true for any node.
     */
    some: function(fn, context) {
        var instance = this;
        return Y.Array.some(this._nodes, function(node, index) {
            node = Y.one(node);
            context = context || node;
            return fn.call(context, node, index, instance);
        });
    },

    /**
     * Creates a documenFragment from the nodes bound to the NodeList instance 
     * @method toDocFrag
     * @return Node a Node instance bound to the documentFragment
     */
    toFrag: function() {
        return Y.one(Y.DOM._nl2frag(this._nodes));
    },

    /**
     * Returns the index of the node in the NodeList instance
     * or -1 if the node isn't found.
     * @method indexOf
     * @param {Y.Node || DOMNode} node the node to search for
     * @return {Int} the index of the node value or -1 if not found
     */
    indexOf: function(node) {
        return Y.Array.indexOf(this._nodes, Y.Node.getDOMNode(node));
    },

    /**
     * Filters the NodeList instance down to only nodes matching the given selector.
     * @method filter
     * @param {String} selector The selector to filter against
     * @return {NodeList} NodeList containing the updated collection 
     * @see Selector
     */
    filter: function(selector) {
        return Y.all(Y.Selector.filter(this._nodes, selector));
    },


    /**
     * Creates a new NodeList containing all nodes at every n indices, where 
     * remainder n % index equals r.
     * (zero-based index).
     * @method modulus
     * @param {Int} n The offset to use (return every nth node)
     * @param {Int} r An optional remainder to use with the modulus operation (defaults to zero) 
     * @return {NodeList} NodeList containing the updated collection 
     */
    modulus: function(n, r) {
        r = r || 0;
        var nodes = [];
        NodeList.each(this, function(node, i) {
            if (i % n === r) {
                nodes.push(node);
            }
        });

        return Y.all(nodes);
    },

    /**
     * Creates a new NodeList containing all nodes at odd indices
     * (zero-based index).
     * @method odd
     * @return {NodeList} NodeList containing the updated collection 
     */
    odd: function() {
        return this.modulus(2, 1);
    },

    /**
     * Creates a new NodeList containing all nodes at even indices
     * (zero-based index), including zero. 
     * @method even
     * @return {NodeList} NodeList containing the updated collection 
     */
    even: function() {
        return this.modulus(2);
    },

    destructor: function() {
        delete NodeList._instances[this[UID]];
    },

    /**
     * Reruns the initial query, when created using a selector query 
     * @method refresh
     * @chainable
     */
    refresh: function() {
        var doc,
            nodes = this._nodes;
        if (this._query) {
            if (nodes && nodes[0] && nodes[0].ownerDocument) {
                doc = nodes[0].ownerDocument;
            }

            this._nodes = Y.Selector.query(this._query, doc || Y.config.doc);        
        }

        return this;
    },

    /**
     * Applies an event listener to each Node bound to the NodeList. 
     * @method on
     * @param {String} type The event being listened for
     * @param {Function} fn The handler to call when the event fires
     * @param {Object} context The context to call the handler with.
     * Default is the NodeList instance. 
     * @return {Object} Returns an event handle that can later be use to detach(). 
     * @see Event.on
     */
    on: function(type, fn, context) {
        var args = Y.Array(arguments, 0, true);
        args.splice(2, 0, this._nodes);
        args[3] = context || this;
        return Y.on.apply(Y, args);
    },

    /**
     * Applies an event listener to each Node bound to the NodeList. 
     * The handler is called only after all on() handlers are called
     * and the event is not prevented.
     * @method after
     * @param {String} type The event being listened for
     * @param {Function} fn The handler to call when the event fires
     * @param {Object} context The context to call the handler with.
     * Default is the NodeList instance. 
     * @return {Object} Returns an event handle that can later be use to detach(). 
     * @see Event.on
     */
    after: function(type, fn, context) {
        var args = Y.Array(arguments, 0, true);
        args.splice(2, 0, this._nodes);
        args[3] = context || this;
        return Y.after.apply(Y, args);
    },

    /**
     * Returns the current number of items in the NodeList.
     * @method size
     * @return {Int} The number of items in the NodeList. 
     */
    size: function() {
        return this._nodes.length;
    },

    toString: function() {
        var str = '',
            errorMsg = this[UID] + ': not bound to any nodes',
            nodes = this._nodes,
            node;

        if (nodes && nodes[0]) {
            node = nodes[0];
            str += node[NODE_NAME];
            if (node.id) {
                str += '#' + node.id; 
            }

            if (node.className) {
                str += '.' + node.className.replace(' ', '.'); 
            }

            if (nodes.length > 1) {
                str += '...[' + nodes.length + ' items]';
            }
        }
        return str || errorMsg;
    }

}, true);

NodeList.importMethod(Y.Node.prototype, [
    /**
     * Called on each Node instance
     * @for NodeList
     * @method append
     * @see Node.append
     */
    'append',

    /**
      * Called on each Node instance
      * @method detach
      * @see Node.detach
      */
    'detach',
    
    /** Called on each Node instance
      * @method detachAll
      * @see Node.detachAll
      */
    'detachAll',

    /** Called on each Node instance
      * @method insert
      * @see NodeInsert
      */
    'insert',

    /** Called on each Node instance
      * @method prepend
      * @see Node.prepend
      */
    'prepend',

    /** Called on each Node instance
      * @method remove
      * @see Node.remove
      */
    'remove',

    /** Called on each Node instance
      * @method set
      * @see Node.set
      */
    'set',

    /** Called on each Node instance
      * @method setContent
      * @see Node.setContent
      */
    'setContent'
]);

// one-off implementation to convert array of Nodes to NodeList
// e.g. Y.all('input').get('parentNode');

/** Called on each Node instance
  * @method get
  * @see Node
  */
NodeList.prototype.get = function(attr) {
    var ret = [],
        nodes = this._nodes,
        isNodeList = false,
        getTemp = NodeList._getTempNode,
        instance,
        val;

    if (nodes[0]) {
        instance = Y.Node._instances[nodes[0]._yuid] || getTemp(nodes[0]);
        val = instance._get(attr);
        if (val && val.nodeType) {
            isNodeList = true;
        }
    }

    Y.Array.each(nodes, function(node) {
        instance = Y.Node._instances[node._yuid];

        if (!instance) {
            instance = getTemp(node);
        }

        val = instance._get(attr);
        if (!isNodeList) { // convert array of Nodes to NodeList
            val = Y.Node.scrubVal(val, instance);
        }

        ret.push(val);
    });

    return (isNodeList) ? Y.all(ret) : ret;
};

Y.NodeList = NodeList;

Y.all = function(nodes) {
    return new NodeList(nodes);
};

Y.Node.all = Y.all;
Y.Array.each([
    /**
     * Passes through to DOM method.
     * @method replaceChild
     * @for Node
     * @param {HTMLElement | Node} node Node to be inserted 
     * @param {HTMLElement | Node} refNode Node to be replaced 
     * @return {Node} The replaced node 
     */
    'replaceChild',

    /**
     * Passes through to DOM method.
     * @method appendChild
     * @param {HTMLElement | Node} node Node to be appended 
     * @return {Node} The appended node 
     */
    'appendChild',

    /**
     * Passes through to DOM method.
     * @method insertBefore
     * @param {HTMLElement | Node} newNode Node to be appended 
     * @param {HTMLElement | Node} refNode Node to be inserted before 
     * @return {Node} The inserted node 
     */
    'insertBefore',

    /**
     * Passes through to DOM method.
     * @method removeChild
     * @param {HTMLElement | Node} node Node to be removed 
     * @return {Node} The removed node 
     */
    'removeChild',

    /**
     * Passes through to DOM method.
     * @method hasChildNodes
     * @return {Boolean} Whether or not the node has any childNodes 
     */
    'hasChildNodes',

    /**
     * Passes through to DOM method.
     * @method cloneNode
     * @param {Boolean} deep Whether or not to perform a deep clone, which includes
     * subtree and attributes
     * @return {Node} The clone 
     */
    'cloneNode',

    /**
     * Passes through to DOM method.
     * @method hasAttribute
     * @param {String} attribute The attribute to test for 
     * @return {Boolean} Whether or not the attribute is present 
     */
    'hasAttribute',

    /**
     * Passes through to DOM method.
     * @method removeAttribute
     * @param {String} attribute The attribute to be removed 
     * @chainable
     */
    'removeAttribute',

    /**
     * Passes through to DOM method.
     * @method scrollIntoView
     * @chainable
     */
    'scrollIntoView',

    /**
     * Passes through to DOM method.
     * @method getElementsByTagName
     * @param {String} tagName The tagName to collect 
     * @return {NodeList} A NodeList representing the HTMLCollection
     */
    'getElementsByTagName',

    /**
     * Passes through to DOM method.
     * @method focus
     * @chainable
     */
    'focus',

    /**
     * Passes through to DOM method.
     * @method blur
     * @chainable
     */
    'blur',

    /**
     * Passes through to DOM method.
     * Only valid on FORM elements
     * @method submit
     * @chainable
     */
    'submit',

    /**
     * Passes through to DOM method.
     * Only valid on FORM elements
     * @method reset
     * @chainable
     */
    'reset',

    /**
     * Passes through to DOM method.
     * @method select
     * @chainable
     */
     'select'
], function(method) {
    Y.Node.prototype[method] = function(arg1, arg2, arg3) {
        var ret = this.invoke(method, arg1, arg2, arg3);
        return ret;
    };
});

Node.importMethod(Y.DOM, [
    /**
     * Determines whether the ndoe is an ancestor of another HTML element in the DOM hierarchy.
     * @method contains
     * @param {Node | HTMLElement} needle The possible node or descendent
     * @return {Boolean} Whether or not this node is the needle its ancestor
     */
    'contains',
    /**
     * Allows setting attributes on DOM nodes, normalizing in some cases.
     * This passes through to the DOM node, allowing for custom attributes.
     * @method setAttribute
     * @for Node
     * @for NodeList
     * @chainable
     * @param {string} name The attribute name 
     * @param {string} value The value to set
     */
    'setAttribute',
    /**
     * Allows getting attributes on DOM nodes, normalizing in some cases.
     * This passes through to the DOM node, allowing for custom attributes.
     * @method getAttribute
     * @for Node
     * @for NodeList
     * @param {string} name The attribute name 
     * @return {string} The attribute value 
     */
    'getAttribute'
]);

/**
 * Allows setting attributes on DOM nodes, normalizing in some cases.
 * This passes through to the DOM node, allowing for custom attributes.
 * @method setAttribute
 * @see Node
 * @for NodeList
 * @chainable
 * @param {string} name The attribute name 
 * @param {string} value The value to set
 */

/**
 * Allows getting attributes on DOM nodes, normalizing in some cases.
 * This passes through to the DOM node, allowing for custom attributes.
 * @method getAttribute
 * @see Node
 * @for NodeList
 * @param {string} name The attribute name 
 * @return {string} The attribute value 
 */
Y.NodeList.importMethod(Y.Node.prototype, ['getAttribute', 'setAttribute']);
(function(Y) {
    var methods = [
    /**
     * Determines whether each node has the given className.
     * @method hasClass
     * @for Node
     * @param {String} className the class name to search for
     * @return {Array} An array of booleans for each node bound to the NodeList. 
     */
     'hasClass',

    /**
     * Adds a class name to each node.
     * @method addClass         
     * @param {String} className the class name to add to the node's class attribute
     * @chainable
     */
     'addClass',

    /**
     * Removes a class name from each node.
     * @method removeClass         
     * @param {String} className the class name to remove from the node's class attribute
     * @chainable
     */
     'removeClass',

    /**
     * Replace a class with another class for each node.
     * If no oldClassName is present, the newClassName is simply added.
     * @method replaceClass  
     * @param {String} oldClassName the class name to be replaced
     * @param {String} newClassName the class name that will be replacing the old class name
     * @chainable
     */
     'replaceClass',

    /**
     * If the className exists on the node it is removed, if it doesn't exist it is added.
     * @method toggleClass  
     * @param {String} className the class name to be toggled
     * @chainable
     */
     'toggleClass'
    ];

    Y.Node.importMethod(Y.DOM, methods);
    /**
     * Determines whether each node has the given className.
     * @method hasClass
     * @see Node.hasClass
     * @for NodeList
     * @param {String} className the class name to search for
     * @return {Array} An array of booleans for each node bound to the NodeList. 
     */

    /**
     * Adds a class name to each node.
     * @method addClass         
     * @see Node.addClass
     * @param {String} className the class name to add to the node's class attribute
     * @chainable
     */

    /**
     * Removes a class name from each node.
     * @method removeClass         
     * @see Node.removeClass
     * @param {String} className the class name to remove from the node's class attribute
     * @chainable
     */

    /**
     * Replace a class with another class for each node.
     * If no oldClassName is present, the newClassName is simply added.
     * @method replaceClass  
     * @see Node.replaceClass
     * @param {String} oldClassName the class name to be replaced
     * @param {String} newClassName the class name that will be replacing the old class name
     * @chainable
     */

    /**
     * If the className exists on the node it is removed, if it doesn't exist it is added.
     * @method toggleClass  
     * @see Node.toggleClass
     * @param {String} className the class name to be toggled
     * @chainable
     */
    Y.NodeList.importMethod(Y.Node.prototype, methods);
})(Y);

if (!document.documentElement.hasAttribute) { // IE < 8
    Y.Node.prototype.hasAttribute = function(attr) {
        return Y.DOM.getAttribute(this._node, attr) !== '';
    };
}

// IE throws error when setting input.type = 'hidden',
// input.setAttribute('type', 'hidden') and input.attributes.type.value = 'hidden'
Y.Node.ATTRS.type = {
    setter: function(val) {
        if (val === 'hidden') {
            try {
                this._node.type = 'hidden';
            } catch(e) {
                this.setStyle('display', 'none');
                this._inputType = 'hidden';
            }
        } else {
            try { // IE errors when changing the type from "hidden'
                this._node.type = val;
            } catch (e) {
            }
        }
        return val;
    },

    getter: function() {
        return this._inputType || this._node.type;
    },

    _bypassProxy: true // don't update DOM when using with Attribute
};


}, '3.0.0' ,{requires:['dom-base', 'selector-css2', 'event-base']});
