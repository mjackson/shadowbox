/**
 * The Shadowbox SWF movie player class.
 */

(function(S){

    var U = S.util;

    /**
     * Constructor. This class is used to display SWF movies.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.swf = function(obj){
        this.obj = obj;

        // SWF's are resizable
        this.resizable = true;

        // height/width default to 300 pixels
        this.height = obj.height ? parseInt(obj.height, 10) : 300;
        this.width = obj.width ? parseInt(obj.width, 10) : 300;
    }

    S.swf.prototype = {

        /**
         * Appends this swf to the document.
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
                swf = this.obj.content,
                version = S.options.flashVersion,
                express = S.path + 'libraries/swfobject/expressInstall.swf',
                flashvars = S.options.flashVars,
                params = S.options.flashParams;

            swfobject.embedSWF(swf, id, w, h, version, express, flashvars, params);
        },

        /**
         * Removes this swf from the document.
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
