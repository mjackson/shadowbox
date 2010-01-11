/**
 * Constructor. The SWF movie player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @public
 */
S.swf = function(obj) {
    this.obj = obj;

    // SWF's are resizable
    this.resizable = true;

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
        tmp.id = S.playerId;
        body.appendChild(tmp);

        var height = dims.resizeHeight, // use resized dimensions
            width = dims.resizeWidth,
            swf = this.obj.content,
            version = S.options.flashVersion,
            express = S.path + "expressInstall.swf",
            flashvars = S.options.flashVars,
            params = S.options.flashParams;

        S.flash.embedSWF(swf, S.playerId, width, height, version, express, flashvars, params);
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
        S.flash.removeSWF(S.playerId);
    }

}
