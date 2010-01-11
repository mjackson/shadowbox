/**
 * The height (in pixels) of the JW FLV player controller.
 *
 * @type    {Number}
 * @private
 */
var jwControllerHeight = 20;

/**
 * Constructor. The Flash video player class for Shadowbox.
 *
 * @constructor
 * @param   {Object}    obj     The content object
 * @public
 */
S.flv = function(obj) {
    this.obj = obj;

    // FLV's are resizable
    this.resizable = true;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += jwControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.flv.ext = ["flv", "m4v"];

S.flv.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        // append temporary content element to replace
        var tmp = document.createElement('div');
        tmp.id = S.playerId;
        body.appendChild(tmp);

        var height = dims.resizeHeight, // use resized dimensions
            width = dims.resizeWidth,
            swf = S.path + "player.swf",
            version = S.options.flashVersion,
            express = S.path + "expressInstall.swf",
            flashvars = apply({
                file:       this.obj.content,
                height:     height,
                width:      width,
                autostart:  (S.options.autoplayMovies ? "true" : "false"),
                controlbar: (S.options.showMovieControls ? "bottom" : "none"),
                backcolor:  "0x000000",
                frontcolor: "0xCCCCCC",
                lightcolor: "0x557722"
            }, S.options.flashVars),
            params = S.options.flashParams;

        S.flash.embedSWF(swf, S.playerId, width, height, version, express, flashvars, params);
    },

    /**
     * Removes this movie from the document.
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
