/**
 * A base library for Shadowbox used as a standalone (without another base
 * library/adapter combination).
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

if(typeof Shadowbox == 'undefined')
    throw 'Unable to load Shadowbox adapter, Shadowbox not found';

(function(S){

    var view = document.defaultView,
        events;

    // simple garbage collection for IE6
    if(S.client.isIE6){
        events = [];

        function unload(){
            var e;
            for(var i = 0, len = events.length; i < len; ++i){
                e = events[i];
                e[0].detachEvent('on' + e[1], e[2]);
            }
            window.detachEvent('onunload', unload);
        }

        window.attachEvent('onunload', unload);
    }

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
        getStyle: view && view.getComputedStyle
            ? function(el, style){
                var v, cs;
                if(style == 'float') style = 'cssFloat';
                if(v = el.style[style]) return v;
                if(cs = view.getComputedStyle(el, '')) return cs[style];
                return null;
            }
            : function(el, style){
                var v, cs;
                if(style == 'opacity'){
                    if(typeof el.style.filter == 'string'){
                        var m = el.style.filter.match(/alpha\(opacity=(.+)\)/i);
                        if(m){
                            var fv = parseFloat(m[1]);
                            if(!isNaN(fv)) return (fv ? fv / 100 : 0);
                        }
                    }
                    return 1;
                }
                if(style == 'float') style = 'styleFloat';
                if(v = el.style[style]) return v;
                if(cs = el.currentStyle) return cs[style];
                return null;
            },

        /**
         * Removes an element from the DOM.
         *
         * @param   HTMLElement     el          The element to remove
         * @return  void
         * @public
         */
        remove: function(el){
            el.parentNode.removeChild(el);
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
            var t = e.target ? e.target : e.srcElement;
            return t.nodeType == 3 ? t.parentNode : t;
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
            var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
            var y = e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
            return [x, y];
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
            if(e.preventDefault){
                e.preventDefault();
            }else{
                e.returnValue = false;
            }
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
            return e.which ? e.which : e.keyCode;
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
            // store event handlers for later removal on IE6
            if(events) events[events.length] = arguments;

            if(el.addEventListener){
                el.addEventListener(name, handler, false);
            }else if(el.attachEvent){
                el.attachEvent('on' + name, handler);
            }
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
            if(el.removeEventListener){
                el.removeEventListener(name, handler, false);
            }else if(el.detachEvent){
                el.detachEvent('on' + name, handler);
            }
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
