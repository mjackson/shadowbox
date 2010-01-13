/**
 * The base adapter for Shadowbox.
 */

var view = document.defaultView;

/**
 * Gets the value of the style on the given element.
 *
 * @param   {HTMLElement}   el          The element
 * @param   {String}        style       The name of the style
 * @return  {mixed}                     The value of the given style
 * @private
 */
var getStyle;
if (view && view.getComputedStyle) {
    getStyle = function(el, style) {
        var value, computedStyle;
        if (style == 'float')
            style = 'cssFloat';

        if (value = el.style[style])
            return value;

        if (computedStyle = view.getComputedStyle(el, ''))
            return computedStyle[style];

        return null;
    }
} else {
    getStyle = function(el, style) {
        var value, currentStyle;
        if (style == "opacity") {
            if (typeof el.style.filter == "string") {
                var m = el.style.filter.match(/alpha\(opacity=(.+)\)/i);
                if (m) {
                    var floatValue = parseFloat(m[1]);
                    if (!isNaN(floatValue))
                        return (floatValue ? floatValue / 100 : 0);
                }
            }

            return 1;
        }

        if (style == 'float')
            style = 'styleFloat';

        if (value = el.style[style])
            return value;

        if (currentStyle = el.currentStyle)
            return currentStyle[style];

        return null;
    }
}

/**
 * Removes an element from the DOM.
 *
 * @param   {HTMLElement}   el          The element to remove
 * @private
 */
function remove(el) {
    el.parentNode.removeChild(el);
}

/**
 * Appends an HTML fragment to the given element.
 *
 * @param   {HTMLElement}   el          The element to append to
 * @param   {String}        html        The HTML fragment to use
 * @private
 */
function appendHTML(el, html) {
    if (el.insertAdjacentHTML) {
        el.insertAdjacentHTML("BeforeEnd", html);
    } else if (el.lastChild) {
        var range = el.ownerDocument.createRange();
        range.setStartAfter(el.lastChild);
        var frag = range.createContextualFragment(html);
        el.appendChild(frag);
    } else {
        el.innerHTML = html;
    }
}

/**
 * Gets the target of the given event. The event object passed will be
 * the same object that is passed to listeners registered with
 * addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {HTMLElement}       The event's target element
 * @private
 */
function getTarget(e) {
    var target = e.target ? e.target : e.srcElement;
    return target.nodeType == 3 ? target.parentNode : target;
}

/**
 * Gets the page X/Y coordinates of the mouse event in an [x, y] array.
 * The page coordinates should be relative to the document, and not the
 * viewport. The event object provided here will be the same object that
 * is passed to listeners registered with addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {Array}             The page X/Y coordinates
 * @private
 */
function getPageXY(e) {
    var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft)),
        y = e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
    return [x, y];
}

/**
 * Prevents the event's default behavior. The event object passed will
 * be the same object that is passed to listeners registered with
 * addEvent().
 *
 * @param   {Event}     e       The event object
 * @private
 */
function preventDefault(e) {
    e.preventDefault();
}

/**
 * Gets the key code of the given event object (keydown). The event
 * object here will be the same object that is passed to listeners
 * registered with addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {Number}            The key code of the event
 * @private
 */
function keyCode(e) {
    return e.which ? e.which : e.keyCode;
}

// Event handling functions below modified from original by Dean Edwards
// http://dean.edwards.name/my/events.js

/**
 * Adds an event handler to the given element. The handler should be called
 * in the scope of the element with the event object as its only argument.
 *
 * @param   {HTMLElement}   el          The element to listen to
 * @param   {String}        type        The type of the event to add
 * @param   {Function}      handler     The event handler function
 * @private
 */
function addEvent(el, type, handler) {
    if (el.addEventListener) {
        el.addEventListener(type, handler, false);
    } else {
        if (el.nodeType === 3 || el.nodeType === 8)
            return;

        if (el.setInterval && (el !== window && !el.frameElement))
            el = window;

        if (!handler.__guid)
            handler.__guid = addEvent.guid++;

        if (!el.events)
            el.events = {};

        var handlers = el.events[type];
        if (!handlers) {
            handlers = el.events[type] = {};

            if (el["on" + type])
                handlers[0] = el["on" + type];
        }

        handlers[handler.__guid] = handler;

        el["on" + type] = handleEvent;
    }
}

addEvent.guid = 1;

/**
 * Removes an event handler from the given element.
 *
 * @param   {HTMLElement}   el          The DOM element to stop listening to
 * @param   {String}        type        The type of the event to remove
 * @param   {Function}      handler     The event handler function
 * @private
 */
function removeEvent(el, type, handler) {
    if (el.removeEventListener) {
        el.removeEventListener(type, handler, false);
    } else {
        if (el.events && el.events[type])
            delete el.events[type][handler.__guid];
    }
}

function handleEvent(event) {
    var result = true;
    event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    var handlers = this.events[event.type];

    for (var i in handlers) {
        this.__handleEvent = handlers[i];
        if (this.__handleEvent(event) === false)
            result = false;
    }

    return result;
}

function fixEvent(event) {
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
}

fixEvent.preventDefault = function() {
    this.returnValue = false;
}

fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
}
