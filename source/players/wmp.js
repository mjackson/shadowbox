/**
 * The WMP player for Shadowbox.
 */

/**
 * The height (in pixels) of the Windows Media Player controller.
 *
 * @type    {Number}
 * @private
 */
var wmpControllerHeight = (S.isIE ? 70 : 45);

/**
 * Constructor. The Windows Media player class for Shadowbox.
 *
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.wmp = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += wmpControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.wmp.ext = ["asf", "avi", "mpg", "mpeg", "wm", "wmv"];

S.wmp.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var opt = S.options,
            autoplay = opt.autoplayMovies ? 1 : 0;

        var movie = '<object id="' + this.id +
            '" name="' + this.id +
            '" height="' + this.height +
            '" width="' + this.width + '"',
            params = { autostart: opt.autoplayMovies ? 1 : 0 };

        if (S.isIE) {
            // movie += ' type="application/x-oleobject"';
            movie += ' classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6"';
            params.url = this.obj.content;
            params.uimode = opt.showMovieControls ? "full" : "none";
        } else {
            movie += ' type="video/x-ms-wmv"';
            movie += ' data="' + this.obj.content + '"'
            params.showcontrols = opt.showMovieControls ? 1 : 0;
        }

        movie += ">";

        for (var p in params)
            movie += '<param name="' + p + '" value="' + params[p] + '">';

        movie += "</object>";

        body.innerHTML = movie;
    },

    /**
     * Removes this movie from the document.
     *
     * @return  void
     * @public
     */
    remove: function(){
        if (S.isIE) {
            try {
                window[this.id].controls.stop(); // stop the movie
                window[this.id].URL = "movie" + now() + ".wmv"; // force player refresh
                window[this.id] = function(){}; // remove from window object
            } catch(e) {}
        }

        var el = get(this.id);
        if (el) {
            // using setTimeout here prevents browser crashes with WMP
            setTimeout(function() {
                remove(el);
            }, 10);
        }
    }

}
