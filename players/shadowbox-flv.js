/**
 * The Shadowbox Flash video player class.
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

    var U = S.util,
        controller_height = 20; // height of JW FLV player controller

    /**
     * Constructor. This class is used to display Flash videos with the JW
     * FLV player.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.flv = function(obj){
        this.obj = obj;

        // FLV's are resizable
        this.resizable = true;

        // height/width default to 300 pixels
        this.height = obj.height ? parseInt(obj.height, 10) : 300;
        if(S.options.showMovieControls == true)
            this.height += controller_height;
        this.width = obj.width ? parseInt(obj.width, 10) : 300;
    }

    S.flv.prototype = {

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

            // append temporary content element to replace
            var tmp = document.createElement('div');
            tmp.id = id;
            body.appendChild(tmp);

            var h = dims.resize_h, // use resized dimensions
                w = dims.resize_w,
                swf = S.path + 'libraries/mediaplayer/player.swf',
                version = S.options.flashVersion,
                express = S.path + 'libraries/swfobject/expressInstall.swf',
                flashvars = U.apply({
                    file:       this.obj.content,
                    height:     h,
                    width:      w,
                    autostart:  (S.options.autoplayMovies ? 'true' : 'false'),
                    controlbar: (S.options.showMovieControls ? 'bottom' : 'none'),
                    backcolor:  '0x000000',
                    frontcolor: '0xCCCCCC',
                    lightcolor: '0x557722'
                }, S.options.flashVars),
                params = S.options.flashParams;

            swfobject.embedSWF(swf, id, w, h, version, express, flashvars, params);
        },

        /**
         * Removes this movie from the document.
         *
         * @return  void
         * @public
         */
        remove: function(){
            // call express install callback here in case express install is
            // active and user has not selected anything
            swfobject.expressInstallCallback();
            swfobject.removeSWF(this.id);
        }

    };

})(Shadowbox);
