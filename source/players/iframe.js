/**
 * Constructor. The iframe player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @public
 */
S.iframe = function(obj) {
    this.obj = obj;

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
        var html = '<iframe id="' + S.playerId + '" name="' + S.playerId + '" height="100%" ' +
            'width="100%" frameborder="0" marginwidth="0" marginheight="0" ' +
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
        var el = get(S.playerId);
        if (el) {
            remove(el);
            if (S.isGecko)
                delete window.frames[S.playerId]; // needed for Firefox
        }
    },

    /**
     * An optional callback function to process after this content has been loaded.
     *
     * @public
     */
    onLoad: function() {
        var win = S.isIE ? get(S.playerId).contentWindow : window.frames[S.playerId];
        win.location.href = this.obj.content;
    }

}
