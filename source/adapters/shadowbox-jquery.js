/**
 * An adapter for Shadowbox and the jQuery JavaScript library.
 */

if(typeof jQuery == 'undefined')
    throw 'Unable to load Shadowbox adapter, jQuery not found';

if(typeof Shadowbox == 'undefined')
    throw 'Unable to load Shadowbox adapter, Shadowbox not found';

(function($, S){

    S.lib = {

        /**
         * Gets the value of the style on the given element.
         *
         * @param   HTMLElement     el          The DOM element
         * @param   String          style       The script name of the style
         *                                      (e.g. marginTop, not margin-top)
         * @return  mixed                       The value of the given style
         * @public
         */
        getStyle: function(el, style){
            return $(el).css(style);
        },

        /**
         * Removes an element from the DOM.
         *
         * @param   HTMLElement     el          The element to remove
         * @return  void
         * @public
         */
        remove: function(el){
            $(el).remove();
        },

        /**
         * Gets the target of the given event. The event object passed will be
         * the same object that is passed to listeners registered with
         * addEvent().
         *
         * @param   mixed           e           The event object
         * @return  HTMLElement                 The event's target element
         * @public
         */
        getTarget: function(e){
            return e.target;
        },

        /**
         * Gets the page X/Y coordinates of the mouse event in an [x, y] array.
         * The page coordinates should be relative to the document, and not the
         * viewport. The event object provided here will be the same object that
         * is passed to listeners registered with addEvent().
         *
         * @param   mixed           e           The event object
         * @return  Array                       The page X/Y coordinates
         * @public
         */
        getPageXY: function(e){
            return [e.pageX, e.pageY];
        },

        /**
         * Prevents the event's default behavior. The event object passed will
         * be the same object that is passed to listeners registered with
         * addEvent().
         *
         * @param   mixed           e           The event object
         * @return  void
         * @public
         */
        preventDefault: function(e){
            e.preventDefault();
        },

        /**
         * Gets the key code of the given event object (keydown). The event
         * object here will be the same object that is passed to listeners
         * registered with addEvent().
         *
         * @param   mixed           e           The event object
         * @return  Number                      The key code of the event
         * @public
         */
        keyCode: function(e){
            return e.keyCode;
        },

        /**
         * Adds an event listener to the given element. It is expected that this
         * function will be passed the event as its first argument.
         *
         * @param   HTMLElement     el          The DOM element to listen to
         * @param   String          name        The name of the event to register
         *                                      (i.e. 'click', 'scroll', etc.)
         * @param   Function        handler     The event handler function
         * @return  void
         * @public
         */
        addEvent: function(el, name, handler){
            $(el).bind(name, handler);
        },

        /**
         * Removes an event listener from the given element.
         *
         * @param   HTMLElement     el          The DOM element to stop listening to
         * @param   String          name        The name of the event to stop
         *                                      listening for (i.e. 'click')
         * @param   Function        handler     The event handler function
         * @return  void
         * @public
         */
        removeEvent: function(el, name, handler){
            $(el).unbind(name, handler);
        },

        /**
         * Appends an HTML fragment to the given element.
         *
         * @param   HTMLElement     el          The element to append to
         * @param   String          html        The HTML fragment to use
         * @return  void
         * @public
         */
        append: function(el, html){
            $(el).append(html);
        }

    };

})(jQuery, Shadowbox);

/**
 * Passes the selected elements to the Shadowbox.setup() function. Supports
 * embedded height and width attributes within the class attribute.
 *
 * @param   Object      options     The options to pass to setup() for all
 *                                  selected elements
 * @return  Object                  The jQuery object
 * @public
 * @author  Mike Alsup
 * @author  Roger Barrett
 */
(function($){

    $.fn.shadowbox = function(options){
        return this.each(function(){
            var el = $(this);
            // support jQuery metadata plugin
            var opts = $.extend({}, options || {}, $.metadata ? el.metadata() : $.meta ? el.data() : {});
            // support embedded opts (for w/h) within the class attr
            var cls = this.className || '';
            opts.width  = parseInt((cls.match(/w:(\d+)/)||[])[1]) || opts.width;
            opts.height = parseInt((cls.match(/h:(\d+)/)||[])[1]) || opts.height;
            Shadowbox.setup(el, opts);
        });
    };

})(jQuery);
