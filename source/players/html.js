/**
 * Constructor. The HTML player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @public
 */
S.html = function(obj) {
    this.obj = obj;

    // height defaults to 300, width defaults to 500
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    this.width = obj.width ? parseInt(obj.width, 10) : 500;
}

S.html.prototype = {

    /**
     * Appends this object to the DOM.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var div = document.createElement("div");
        div.id = S.playerId;
        div.className = "html"; // give special class to enable scrolling
        div.innerHTML = this.obj.content;

        body.appendChild(div);
    },

    /**
     * Removes this object from the DOM.
     *
     * @public
     */
    remove: function() {
        var el = get(S.playerId);
        if (el)
            S.remove(el);
    }

}
