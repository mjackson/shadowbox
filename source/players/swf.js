/**
 * The SWF player for Shadowbox.
 */

/**
 * Constructor. The SWF movie player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.swf = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.swf.ext = ["swf"];

S.swf.prototype = {

    /**
     * Appends this swf to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims){
        // append temporary content element to replace
        var tmp = document.createElement("div");
        tmp.id = this.id;
        body.appendChild(tmp);

        var height = dims.innerHeight,
            width = dims.innerWidth,
            swf = this.obj.content,
            version = S.options.flashVersion,
            express = S.path + "expressInstall.swf",
            flashvars = S.options.flashVars,
            params = S.options.flashParams;

        S.flash.embedSWF(swf, this.id, width, height, version, express, flashvars, params);
    },

    /**
     * Removes this swf from the document.
     *
     * @public
     */
    remove: function() {
        // call express install callback here in case express install is
        // active and user has not selected anything
        S.flash.expressInstallCallback();
        S.flash.removeSWF(this.id);
    },

    /**
     * Called when the window is resized.
     *
     * @public
     */
    onWindowResize: function() {
        var dims = S.dimensions,
            el = get(this.id);
        el.height = dims.innerHeight;
        el.width = dims.innerWidth;
    }

}
