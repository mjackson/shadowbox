/**
 * The HTML player for Shadowbox.
 */

/**
 * Constructor. The HTML player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.html = function(obj, id) {
    this.obj = obj;
    this.id = id;

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
        div.id = this.id;
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
        var el = get(this.id);
        if (el)
            remove(el);
    }

}
