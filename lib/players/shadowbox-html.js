/**
 * The Shadowbox HTML player class.
 */

(function(S){

    /**
     * Constructor. This class is used to display inline HTML.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.html = function(obj){
        this.obj = obj;

        // height defaults to 300, width defaults to 500
        this.height = obj.height ? parseInt(obj.height, 10) : 300;
        this.width = obj.width ? parseInt(obj.width, 10) : 500;
    }

    S.html.prototype = {

        /**
         * Appends this object to the document.
         *
         * @param   HTMLElement     body    The body element
         * @param   String          id      The content id
         * @param   Object          dims    The current Shadowbox dimensions
         * @return  void
         * @public
         */
        append: function(body, id, dims){
            this.id = id;

            var div = document.createElement('div');
            div.id = id;
            div.className = 'html'; // give special class to enable scrolling
            div.innerHTML = this.obj.content;

            body.appendChild(div);
        },

        /**
         * Removes this object from the document.
         *
         * @return  void
         * @public
         */
        remove: function(){
            var el = document.getElementById(this.id);
            if(el) S.lib.remove(el);
        }

    };

})(Shadowbox);
