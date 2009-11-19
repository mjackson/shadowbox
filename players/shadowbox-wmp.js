/**
 * The Shadowbox Windows Media player class.
 *
 * This file is part of Shadowbox.
 *
 * Shadowbox is an online media viewer application that supports all of the
 * web's most popular media publishing formats. Shadowbox is written entirely
 * in JavaScript and CSS and is highly customizable. Using Shadowbox, website
 * authors can showcase a wide assortment of media in all major browsers without
 * navigating users away from the linking page.
 *
 * You should have received a license with this distribution explaining the terms
 * under which Shadowbox may be used. If you did not, you may obtain a copy of the
 * license at http://shadowbox-js.com/LICENSE
 *
 * @author      Michael J. I. Jackson <michael@mjijackson.com>
 * @copyright   2007-2009 Michael J. I. Jackson
 */

(function(S){

    var controller_height = (S.client.isIE ? 70 : 45); // height of WMP controller

    /**
     * Constructor. This class is used to display Windows Media Player movies.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.wmp = function(obj){
        this.obj = obj;

        // height/width default to 300 pixels
        this.height = obj.height ? parseInt(obj.height, 10) : 300;
        if(S.options.showMovieControls)
            this.height += controller_height;
        this.width = obj.width ? parseInt(obj.width, 10) : 300;
    }

    S.wmp.prototype = {

        /**
         * Appends this movie to the document.
         *
         * @param   HTMLElement     body    The body element
         * @param   String          id      The content id
         * @param   Object          dims    The current Shadowbox dimensions
         * @return  void
         * @public
         */
        append: function(body, id, dims){
            this.id = id;

            var opt = S.options,
                autoplay = opt.autoplayMovies ? 1 : 0;

            var movie = '<object id="' + id +
                '" name="' + id +
                '" height="' + this.height +
                '" width="' + this.width + '"',
                params = {autostart: opt.autoplayMovies ? 1 : 0};

            if(S.client.isIE){
                // movie += ' type="application/x-oleobject"';
                movie += ' classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6"';
                params.url = this.obj.content;
                params.uimode = opt.showMovieControls ? 'full' : 'none';
            }else{
                movie += ' type="video/x-ms-wmv"';
                movie += ' data="' + this.obj.content + '"'
                params.showcontrols = opt.showMovieControls ? 1 : 0;
            }

            movie += '>';

            for(var p in params)
                movie += '<param name="' + p + '" value="' + params[p] + '">';

            movie += '</object>'

            body.innerHTML = movie;
        },

        /**
         * Removes this movie from the document.
         *
         * @return  void
         * @public
         */
        remove: function(){
            var id = this.id;

            if(S.client.isIE){
                try{
                    window[id].controls.stop(); // stop the movie
                    window[id].URL = 'non-existent.wmv'; // force player refresh
                    window[id] = function(){}; // remove from window object
                }catch(e){}
            }

            var el = document.getElementById(id);
            if(el){
                setTimeout(function(){ // using setTimeout prevents browser crashes with WMP
                    S.lib.remove(el);
                }, 10);
            }
        }

    };

})(Shadowbox);
