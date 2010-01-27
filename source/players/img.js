/**
 * The image player for Shadowbox.
 */

/**
 * Resource used to preload images. It's class-level so that when a new image is requested,
 * the same resource can be reassigned, cancelling the original's callback.
 *
 * @type    {Image}
 * @private
 */
var pre,

/**
 * Keeps track of 4 floating values (x, y, startx, & starty) that are used in the drag calculations.
 *
 * @type    {Object}
 * @private
 */
dragData,

/**
 * The id to use for the drag layer.
 *
 * @type    {String}
 * @private
 */
dragId = "sb-drag-layer",

/**
 * The transparent element that is used to listen for drag events.
 *
 * @type    {HTMLElement}
 * @private
 */
dragLayer,

/**
 * The draggable element.
 *
 * @type    {HTMLElement}
 * @private
 */
dragTarget;

/**
 * Resets the class drag variable.
 *
 * @private
 */
function resetDrag() {
    dragData = {
        x:      0,
        y:      0,
        startX: null,
        startY: null
    };
}

/**
 * Enables a transparent drag layer on top of images.
 *
 * @param   {Number}    height  The height of the drag layer
 * @param   {Number}    width   The width of the drag layer
 * @private
 */
function enableDrag(height, width) {
    resetDrag();

    // add transparent drag layer to prevent browser dragging of actual image
    var style = [
        "position:absolute",
        "height:" + height + "px",
        "width:" + width + "px",
        "cursor:" + (S.isGecko ? "-moz-grab" : "move"),
        "background-color:" + (S.isIE ? "#fff;filter:alpha(opacity=0)" : "transparent")
    ].join(";");

    appendHTML(S.skin.body, '<div id="' + dragId + '" style="' + style + '"></div>');

    dragLayer = get(dragId);
    addEvent(dragLayer, "mousedown", startDrag);
}

/**
 * Disables the drag layer.
 *
 * @private
 */
function disableDrag() {
    if (dragLayer) {
        removeEvent(dragLayer, "mousedown", startDrag);
        remove(dragLayer);
        dragLayer = null;
    }

    dragTarget = null;
}

/**
 * Sets up a drag listener on the document.
 *
 * @param   {Event}     e   The mousedown event
 * @private
 */
function startDrag(e) {
    // prevent browser dragging
    preventDefault(e);

    var xy = getPageXY(e);
    drag.startX = xy[0];
    drag.startY = xy[1];

    dragTarget = get(S.player.id);

    addEvent(document, "mousemove", positionDrag);
    addEvent(document, "mouseup", endDrag);

    if (S.isGecko)
        dragLayer.style.cursor = "-moz-grabbing";
}

/**
 * Positions an oversized image on drag.
 *
 * @param   {Event}     e   The mousemove event
 * @private
 */
function positionDrag(e) {
    var player = S.player,
        dims = S.dimensions,
        xy = getPageXY(e);

    var moveX = xy[0] - drag.startX;
    drag.startX += moveX;
    drag.x = Math.max(Math.min(0, drag.x + moveX), dims.innerWidth - player.width);

    var moveY = xy[1] - drag.startY;
    drag.startY += moveY;
    drag.y = Math.max(Math.min(0, drag.y + moveY), dims.innerHeight - player.height);

    apply(dragTarget.style, {
        left: drag.x + "px",
        top: drag.y + "px"
    });
}

/**
 * Removes the drag listener from the document.
 *
 * @private
 */
function endDrag() {
    removeEvent(document, "mousemove", positionDrag);
    removeEvent(document, "mouseup", endDrag);

    if (S.isGecko)
        dragLayer.style.cursor = "-moz-grab";
}

/**
 * Constructor. The image player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.img = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // preload the image
    this.ready = false;
    var self = this;
    pre = new Image();
    pre.onload = function() {
        // height/width defaults to image height/width
        self.height = obj.height ? parseInt(obj.height, 10) : pre.height;
        self.width = obj.width ? parseInt(obj.width, 10) : pre.width;

        // ready to go
        self.ready = true;

        // clean up to prevent memory leak in IE
        pre.onload = null;
        pre = null;
    }
    pre.src = obj.content;
}

S.img.ext = ["bmp", "gif", "jpg", "jpeg", "png"];

S.img.prototype = {

    /**
     * Appends this image to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var img = document.createElement("img");
        img.id = this.id;
        img.src = this.obj.content;
        img.style.position = "absolute";

        // need to use setAttribute here for IE's sake
        img.setAttribute("height", dims.innerHeight)
        img.setAttribute("width", dims.innerWidth)

        body.appendChild(img);
    },

    /**
     * Removes this image from the document.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el)
            remove(el);

        disableDrag();

        // prevent old image requests from loading
        if (pre) {
            pre.onload = null;
            pre = null;
        }
    },

    /**
     * An optional callback function to process after this content has been
     * loaded.
     *
     * @public
     */
    onLoad: function() {
        var dims = S.dimensions;

        // listen for drag when image is oversized
        if (dims.oversized && S.options.handleOversize == "drag")
            enableDrag(dims.innerHeight, dims.innerWidth);
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions,
            el = get(this.id);

        if (!el)
            return;

        switch (S.options.handleOversize) {
        case "resize":
            el.height = dims.innerHeight;
            el.width = dims.innerWidth;
            break;
        case "drag":
            if (dragTarget) {
                var top = parseInt(getStyle(el, "top")),
                    left = parseInt(getStyle(el, "left"));
                // fix positioning when enlarging viewport
                if (top + this.height < dims.innerHeight)
                    el.style.top = dims.innerHeight - this.height + "px";
                if (left + this.width < dims.innerWidth)
                    el.style.left = dims.innerWidth - this.width + "px";
            }
            break;
        }
    }

}
