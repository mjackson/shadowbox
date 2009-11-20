/**
 * The Shadowbox iframe player class.
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
     * Constructor. This class is used to display web pages in an HTML iframe.
     *
     * @param   Object      obj     The content object
     * @public
     */
    S.iframe = function(obj){
        this.obj = obj;

        // height/width default to full viewport height/width
        var so = document.getElementById('sb-overlay');
        this.height = obj.height ? parseInt(obj.height, 10) : so.offsetHeight;
        this.width = obj.width ? parseInt(obj.width, 10) : so.offsetWidth;
    }

    S.iframe.prototype = {

        /**
         * Appends this iframe to the document.
         *
         * @param   HTMLElement     body    The body element
         * @param   String          id      The content id
         * @param   Object          dims    The current Shadowbox dimensions
         * @return  void
         * @public
         */
        append: function(body, id, dims){
            this.id = id;

            var html = '<iframe id="' + id + '" name="' + id + '" height="100%" ' +
                'width="100%" frameborder="0" marginwidth="0" marginheight="0" ' +
                'scrolling="auto"';

            if(S.client.isIE){
                // prevent brief whiteout while loading iframe source
                html += ' allowtransparency="true"';

                // prevent "secure content" warning for https on IE6
                // see http://www.zachleat.com/web/2007/04/24/adventures-in-i-frame-shims-or-how-i-learned-to-love-the-bomb/
                if(S.client.isIE6)
                    html += ' src="javascript:false;document.write(\'\');"';
            }

            html += '></iframe>';

            // use innerHTML method of insertion here instead of appendChild
            // because IE renders frameborder otherwise
            body.innerHTML = html;

            /*
            var iframe = document.createElement('iframe'),
            attr = {
                id:             id,
                name:           id,
                height:         '100%',
                width:          '100%',
                frameborder:    '0',
                marginwidth:    '0',
                marginheight:   '0',
                scrolling:      'auto'
            };

            if(S.client.isIE){
                // prevent brief whiteout while loading iframe source
                attr.allowtransparency = 'true';

                if(S.client.isIE6){
                    // prevent "secure content" warning for https on IE6
                    // see http://www.zachleat.com/web/2007/04/24/adventures-in-i-frame-shims-or-how-i-learned-to-love-the-bomb/
                    attr.src = 'javascript:false;document.write("");';
                }
            }

            for(var a in attr){
                iframe.setAttribute(a, attr[a]);
            }

            body.appendChild(iframe);
            */
        },

        /**
         * Removes this iframe from the document.
         *
         * @return  void
         * @public
         */
        remove: function(){
            var el = document.getElementById(this.id);
            if(el){
                S.lib.remove(el);
                if(S.client.isGecko)
                    delete window.frames[this.id]; // needed for Firefox
            }
        },

        /**
         * An optional callback function to process after this content has been
         * loaded.
         *
         * @return  void
         * @public
         */
        onLoad: function(){
            var win = S.client.isIE
                ? document.getElementById(this.id).contentWindow
                : window.frames[this.id];
            win.location.href = this.obj.content; // set the iframe's location
        }

    };

})(Shadowbox);
