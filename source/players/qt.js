/**
 * The QuickTime player for Shadowbox.
 */

/**
 * The height (in pixels) of the QuickTime controller.
 *
 * @type    {Number}
 * @private
 */
var qtControllerHeight = 16;

/**
 * Constructor. The QuickTime player class for Shadowbox.
 *
 * @param   {Object}    obj     The content object
 * @param   {String}    id      The player id
 * @public
 */
S.qt = function(obj, id) {
    this.obj = obj;
    this.id = id;

    // height/width default to 300 pixels
    this.height = obj.height ? parseInt(obj.height, 10) : 300;
    if (S.options.showMovieControls)
        this.height += qtControllerHeight;
    this.width = obj.width ? parseInt(obj.width, 10) : 300;
}

S.qt.ext = ["dv", "mov", "moov", "movie", "mp4", "avi", "mpg", "mpeg"];

S.qt.prototype = {

    /**
     * Appends this movie to the document.
     *
     * @param   {HTMLElement}   body    The body element
     * @param   {Object}        dims    The current Shadowbox dimensions
     * @public
     */
    append: function(body, dims) {
        var opt = S.options,
            autoplay = String(opt.autoplayMovies),
            controls = String(opt.showMovieControls);

        var html = "<object",
            movie = {
                id:         this.id,
                name:       this.id,
                height:     this.height,
                width:      this.width,
                kioskmode:  "true"
            };

        if (S.isIE) {
            movie.classid = "clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B";
            movie.codebase = "http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0";
        } else {
            movie.type = "video/quicktime";
            movie.data = this.obj.content;
        }

        for (var m in movie)
            html += " " + m + '="' + movie[m] + '"';
        html += ">";

        var params = {
            src:        this.obj.content,
            scale:      "aspect",
            controller: controls,
            autoplay:   autoplay
        };

        for (var p in params)
            html += '<param name="' + p + '" value="' + params[p] + '">';
        html += "</object>";

        body.innerHTML = html;
    },

    /**
     * Removes this movie from the DOM.
     *
     * @public
     */
    remove: function() {
        try {
            document[this.id].Stop(); // stop QT video stream
        } catch(e) {}

        var el = get(this.id);
        if (el)
            remove(el);
    }

}
