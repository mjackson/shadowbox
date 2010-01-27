/**
 * The FLV player for Shadowbox.
 */

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
 * @param   {String}    id      The player id
 * @public
 */
S.flv = function(obj, id) {
    this.obj = obj;
    this.id = id;

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
        tmp.id = this.id;
        body.appendChild(tmp);

        var height = dims.innerHeight,
            width = dims.innerWidth,
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

        S.flash.embedSWF(swf, this.id, width, height, version, express, flashvars, params);
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
