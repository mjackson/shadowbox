/**
 * An adapter for Shadowbox and the Dojo Toolkit.
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
 * @author      Peter Higgins <dante@dojotoolkit.org> and Michael J. I. Jackson
 *              <michael@mjijackson.com>
 * @copyright   2008-2009 Peter Higgins and Michael J. I. Jackson
 */

if(typeof dojo == 'undefined')
    throw 'Unable to load Shadowbox adapter, Dojo not found';

if(typeof Shadowbox == 'undefined')
    throw 'Unable to load Shadowbox adapter, Shadowbox not found';

(function(S){

    /**
     * Holds all registered event handlers.
     *
     * @property    Array       events
     * @private
     */
    var events = [];

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
            return dojo.style(el, style);
        },

        /**
         * Removes an element from the DOM.
         *
         * @param   HTMLElement     el          The element to remove
         * @return  void
         * @public
         */
        remove: function(el){
            dojo._destroyElement(el);
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
            var t = dojo.connect(el, name, handler);
            // we need to store a handle to later disconnect
            events.push({
                el: el,
                name: name,
                handle: t
            });
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
            // probably a quicker way to match this
            dojo.forEach(events, function(ev, idx){
                if(ev && ev.el == el && ev.name == name){
                    dojo.disconnect(ev.handle);
                    events[idx] = null;
                }
            });
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
            if(el.insertAdjacentHTML){
                el.insertAdjacentHTML('BeforeEnd', html);
            }else if(el.lastChild){
                var range = el.ownerDocument.createRange();
                range.setStartAfter(el.lastChild);
                var frag = range.createContextualFragment(html);
                el.appendChild(frag);
            }else{
                el.innerHTML = html;
            }
        }

    };

})(Shadowbox);
