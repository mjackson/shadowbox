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
 * The id to use for the drag proxy element.
 *
 * @type    {String}
 * @private
 */
proxyId = "sb-drag-proxy",

/**
 * Keeps track of 4 floating values (x, y, startx, & starty) that are used in the drag calculations.
 *
 * @type    {Object}
 * @private
 */
dragData,

/**
 * The transparent element that is used to listen for drag events.
 *
 * @type    {HTMLElement}
 * @private
 */
dragProxy,

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
 * Updates the drag proxy dimensions.
 *
 * @private
 */
function updateProxy() {
    var dims = S.dimensions;
    apply(dragProxy.style, {
        height: dims.innerHeight + "px",
        width: dims.innerWidth + "px"
    });
}

/**
 * Enables a transparent drag layer on top of images.
 *
 * @private
 */
function enableDrag() {
    resetDrag();

    // add transparent proxy layer to prevent browser dragging of actual image
    var style = [
        "position:absolute",
        "cursor:" + (S.isGecko ? "-moz-grab" : "move"),
        "background-color:" + (S.isIE ? "#fff;filter:alpha(opacity=0)" : "transparent")
    ].join(";");
    S.appendHTML(S.skin.body, '<div id="' + proxyId + '" style="' + style + '"></div>');

    dragProxy = get(proxyId);
    updateProxy();

    addEvent(dragProxy, "mousedown", startDrag);
}

/**
 * Disables the drag layer.
 *
 * @private
 */
function disableDrag() {
    if (dragProxy) {
        removeEvent(dragProxy, "mousedown", startDrag);
        remove(dragProxy);
        dragProxy = null;
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
    dragData.startX = xy[0];
    dragData.startY = xy[1];

    dragTarget = get(S.player.id);

    addEvent(document, "mousemove", positionDrag);
    addEvent(document, "mouseup", endDrag);

    if (S.isGecko)
        dragProxy.style.cursor = "-moz-grabbing";
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

    var moveX = xy[0] - dragData.startX;
    dragData.startX += moveX;
    dragData.x = Math.max(Math.min(0, dragData.x + moveX), dims.innerWidth - player.width);

    var moveY = xy[1] - dragData.startY;
    dragData.startY += moveY;
    dragData.y = Math.max(Math.min(0, dragData.y + moveY), dims.innerHeight - player.height);

    apply(dragTarget.style, {
        left: dragData.x + "px",
        top: dragData.y + "px"
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
        dragProxy.style.cursor = "-moz-grab";
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

        var height, width;
        if (dims.oversized && S.options.handleOversize == "resize") {
            height = dims.innerHeight;
            width = dims.innerWidth;
        } else {
            height = this.height;
            width = this.width;
        }

        // need to use setAttribute here for IE's sake
        img.setAttribute("height", height);
        img.setAttribute("width", width);

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
            enableDrag();
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions;

        switch (S.options.handleOversize) {
        case "resize":
            var el = get(this.id);
            el.height = dims.innerHeight;
            el.width = dims.innerWidth;
            break;
        case "drag":
            if (dragTarget) {
                var top = parseInt(S.getStyle(dragTarget, "top")),
                    left = parseInt(S.getStyle(dragTarget, "left"));

                // fix positioning when viewport is enlarged
                if (top + this.height < dims.innerHeight)
                    dragTarget.style.top = dims.innerHeight - this.height + "px";
                if (left + this.width < dims.innerWidth)
                    dragTarget.style.left = dims.innerWidth - this.width + "px";

                updateProxy();
            }
            break;
        }
    }

}
