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
 * @public
 */
S.qt = function(obj) {
    this.obj = obj;

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
                id:         S.playerId,
                name:       S.playerId,
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
            document[S.playerId].Stop(); // stop QT video stream
        } catch(e) {}

        var el = get(S.playerId);
        if (el)
            remove(el);
    }

}
