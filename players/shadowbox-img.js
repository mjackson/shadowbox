/**
 * The Shadowbox image player class.
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

(function(S){

    var U = S.util,

    /**
     * Keeps track of 4 floating values (x, y, start_x, & start_y) that are used
     * in the drag calculations.
     *
     * @var     Object
     * @private
     */
    drag,

    /**
     * Holds the draggable element so we don't have to fetch it every time
     * the mouse moves.
     *
     * @var     HTMLElement
     * @private
     */
    draggable,

    /**
     * The id to use for the drag layer.
     *
     * @var     String
     * @private
     */
    drag_id = 'sb-drag-layer',

    /**
     * Resource used to preload images. It's class-level so that when a new
     * image is requested, the same resource can be reassigned, cancelling
     * the original's callback.
     *
     * @var     HTMLElement
     * @private
     */
    pre;

    /**
     * Resets the class drag variable.
     *
     * @return  void
     * @private
     */
    function resetDrag(){
        drag = {
            x:          0,
            y:          0,
            start_x:    null,
            start_y:    null
        };
    }

    /**
     * Toggles the drag function on and off.
     *
     * @param   Boolean     on      True to toggle on, false to toggle off
     * @param   Number      h       The height of the drag layer
     * @param   Number      w       The width of the drag layer
     * @return  void
     * @private
     */
    function toggleDrag(on, h, w){
        if(on){
            resetDrag();
            // add transparent drag layer to prevent browser dragging of actual image
            var s = [
                'position:absolute',
                'height:' + h + 'px',
                'width:' + w + 'px',
                'cursor:' + (S.client.isGecko ? '-moz-grab' : 'move'),
                'background-color:' + (S.client.isIE ? '#fff;filter:alpha(opacity=0)' : 'transparent')
            ].join(';');
            S.lib.append(S.skin.bodyEl(), '<div id="' + drag_id + '" style="' + s + '"></div>');
            S.lib.addEvent(U.get(drag_id), 'mousedown', listenDrag);
        }else{
            var d = U.get(drag_id);
            if(d){
                S.lib.removeEvent(d, 'mousedown', listenDrag);
                S.lib.remove(d);
            }
            draggable = null;
        }
    }

    /**
     * Sets up a drag listener on the document. Called when the mouse button is
     * pressed (mousedown).
     *
     * @param   mixed       e       The mousedown event
     * @return  void
     * @private
     */
    function listenDrag(e){
        // prevent browser dragging
        S.lib.preventDefault(e);

        var coords = S.lib.getPageXY(e);
        drag.start_x = coords[0];
        drag.start_y = coords[1];

        draggable = U.get(S.contentId());
        S.lib.addEvent(document, 'mousemove', positionDrag);
        S.lib.addEvent(document, 'mouseup', unlistenDrag);

        if(S.client.isGecko)
            U.get(drag_id).style.cursor = '-moz-grabbing';
    }

    /**
     * Removes the drag listener. Called when the mouse button is released
     * (mouseup).
     *
     * @return  void
     * @private
     */
    function unlistenDrag(){
        S.lib.removeEvent(document, 'mousemove', positionDrag);
        S.lib.removeEvent(document, 'mouseup', unlistenDrag); // clean up

        if(S.client.isGecko)
            U.get(drag_id).style.cursor = '-moz-grab';
    }

    /**
     * Positions an oversized image on drag.
     *
     * @param   mixed       e       The drag event
     * @return  void
     * @private
     */
    function positionDrag(e){
        var c = S.content,
            d = S.dimensions,
            coords = S.lib.getPageXY(e);

        var move_x = coords[0] - drag.start_x;
        drag.start_x += move_x;
        // x boundaries
        drag.x = Math.max(Math.min(0, drag.x + move_x), d.inner_w - c.width);
        draggable.style.left = drag.x + 'px';

        var move_y = coords[1] - drag.start_y;
        drag.start_y += move_y;
        // y boundaries
        drag.y = Math.max(Math.min(0, drag.y + move_y), d.inner_h - c.height);
        draggable.style.top = drag.y + 'px';
    }

    /**
     * Constructor.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.img = function(obj){
        this.obj = obj;

        // images are resizable
        this.resizable = true;

        // preload the image
        this.ready = false;
        var self = this;
        pre = new Image();
        pre.onload = function(){
            // height/width defaults to image height/width
            self.height = obj.height ? parseInt(obj.height, 10) : pre.height;
            self.width = obj.width ? parseInt(obj.width, 10) : pre.width;

            // ready to go
            self.ready = true;

            // clean up to prevent memory leak in IE
            pre.onload = '';
            pre = null;
        }
        pre.src = obj.content;
    }

    S.img.prototype = {

        /**
         * Appends this image to the document.
         *
         * @param   HTMLElement     body    The body element
         * @param   String          id      The content id
         * @param   Object          d       The current Shadowbox dimensions
         * @return  void
         * @public
         */
        append: function(body, id, d){
            this.id = id;

            var img = document.createElement('img');
            img.id = id;
            img.src = this.obj.content;
            img.style.position = 'absolute';

            // need to use setAttribute here for IE's sake
            img.setAttribute('height', d.resize_h)
            img.setAttribute('width', d.resize_w)

            body.appendChild(img);
        },

        /**
         * Removes this image from the document.
         *
         * @return  void
         * @public
         */
        remove: function(){
            var el = U.get(this.id);
            if(el) S.lib.remove(el);

            // disable drag layer
            toggleDrag(false);

            // prevent old image requests from loading
            if(pre){
                pre.onload = '';
                pre = null;
            }
        },

        /**
         * An optional callback function to process after this content has been
         * loaded.
         *
         * @return  void
         * @public
         */
        onLoad: function(){
            var d = S.dimensions;

            // listen for drag, in the case of oversized images, the "resized"
            // height/width will actually be the original image height/width
            if(d.oversized && S.options.handleOversize == 'drag')
                toggleDrag(true, d.resize_h, d.resize_w);
        },

        /**
         * Called when the window is resized.
         *
         * @return  void
         * @public
         */
        onWindowResize: function(){
            // fix draggable positioning if enlarging viewport
            if(draggable){
                var c = S.content,
                    d = S.dimensions,
                    t = parseInt(S.lib.getStyle(draggable, 'top')),
                    l = parseInt(S.lib.getStyle(draggable, 'left'));

                if(t + c.height < d.inner_h)
                    draggable.style.top = d.inner_h - c.height + 'px';
                if(l + c.width < d.inner_w)
                    draggable.style.left = d.inner_w - c.width + 'px';
            }
        }

    };

})(Shadowbox);
