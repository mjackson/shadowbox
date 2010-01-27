/**
 * The jQuery adapter for Shadowbox.
 */

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
    return e.target;
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
    return [e.pageX, e.pageY];
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
    return e.keyCode;
}

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
    jQuery(el).bind(type, handler);
}

/**
 * Removes an event handler from the given element.
 *
 * @param   {HTMLElement}   el          The DOM element to stop listening to
 * @param   {String}        type        The type of the event to remove
 * @param   {Function}      handler     The event handler function
 * @private
 */
function removeEvent(el, type, handler) {
    jQuery(el).unbind(type, handler);
}

/**
 * Passes the selected elements to the Shadowbox.setup() function. Supports
 * embedded height and width attributes within the class attribute.
 *
 * @param   {Object}    options     The options to pass to setup() for all selected elements
 * @return  {Object}                The jQuery object
 * @public
 * @author  Mike Alsup
 * @author  Roger Barrett
 */
jQuery.fn.shadowbox = function(options) {
    return this.each(function() {
        var el = jQuery(this);
        // support jQuery metadata plugin
        var opts = jQuery.extend({}, options || {}, jQuery.metadata ? el.metadata() : jQuery.meta ? el.data() : {});
        // support embedded opts (for w/h) within the class attr
        var cls = this.className || '';
        opts.width  = parseInt((cls.match(/w:(\d+)/)||[])[1]) || opts.width;
        opts.height = parseInt((cls.match(/h:(\d+)/)||[])[1]) || opts.height;
        Shadowbox.setup(el, opts);
    });
}
