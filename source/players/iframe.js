/**
 * The iframe player for Shadowbox.
 */

/**
 * Constructor. The iframe player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.iframe = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to full viewport height/width
    var overlay = get("sb-overlay");
    this.height = obj.height ? parseInt(obj.height, 10) : overlay.offsetHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : overlay.offsetWidth;
}

S.iframe.prototype = {

    /**
     * Appends this iframe to the DOM.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var html = '<iframe id="' + this.id + '" name="' + this.id + '" height="100%" ' +
            'width="100%" frameborder="0" marginwidth="0" marginheight="0" ' +
            'style="visibility:hidden" onload="this.style.visibility=\'visible\'" ' +
            'scrolling="auto"';

        if (S.isIE) {
            // prevent brief whiteout while loading iframe source
            html += ' allowtransparency="true"';

            // prevent "secure content" warning for https on IE6
            // see http://www.zachleat.com/web/2007/04/24/adventures-in-i-frame-shims-or-how-i-learned-to-love-the-bomb/
            if (S.isIE6)
                html += ' src="javascript:false;document.write(\'\');"';
        }

        html += '></iframe>';

        // use innerHTML method of insertion here instead of appendChild
        // because IE renders frameborder otherwise
        body.innerHTML = html;
    },

    /**
     * Removes this iframe from the DOM.
     *
     * @public
     */
    remove: function() {
        var el = get(this.id);
        if (el) {
            remove(el);
            if (S.isGecko)
                delete window.frames[this.id]; // needed for Firefox
        }
    },

    /**
     * An optional callback function to process after this content has been loaded.
     *
     * @public
     */
    onLoad: function() {
        var win = S.isIE ? get(this.id).contentWindow : window.frames[this.id];
        win.location.href = this.obj.content;
    }

}
