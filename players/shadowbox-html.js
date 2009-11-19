/**
 * The Shadowbox HTML player class.
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
