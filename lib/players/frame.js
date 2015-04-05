const root = document.documentElement;

const {
  dom, remove, empty
} = require('../util/dom');

class Frame {

  /**
   * The iframe player is the default Shadowbox player. It is used for plain
   * web pages or when no other player is suitable for a piece of content.
   *
   * @param {Object} obj
   * @param {String} obj.url The URL of the content to display
   * @param {number} [obj.width] The width of the content
   * @param {number} [obj.height] The height of the content
   * @param {String} id
   */
  constructor(obj, id) {
    this.url = obj.url;
    this.width = obj.width ? parseInt(obj.width, 10) : root.clientWidth;
    this.height = obj.height ? parseInt(obj.height, 10) : root.clientHeight;
    this.id = id;
    this.ready = false;
    this.__preload();
  }

  /**
   * Preload the iframe so it's ready when needed.
   *
   * @private
   */
  __preload() {
    var iframe = dom('iframe');

    iframe.id = this.id;
    iframe.name = this.id;
    iframe.width = '0px';
    iframe.height = '0px';
    iframe.frameBorder = '0';
    iframe.marginWidth = '0';
    iframe.marginHeight = '0';
    iframe.scrolling = 'auto';
    iframe.allowTransparency = 'true';
    iframe.src = this.url;

    if (iframe.attachEvent) {
      iframe.attachEvent('onload', () => {
        this.ready = true;
      });
    } else {
      iframe.onload = () => {
        this.ready = true;
      };
    }

    // Starts the actual loading of the iframe.
    document.body.appendChild(iframe);

    this.__el = iframe;
  }

  /**
   * Returns true if this player is supported on this browser.
   */
  isSupported() {
    return true;
  }

  /**
   * Inserts this object as the only child of the given DOM element.
   *
   * @param {DOMElement} element
   * @returns {DOMElement|boolean} Returns the newly created element,
   *  false if none was created.
   */
  insert(element) {
    empty(element);
    this.__el.style.visibility = 'hidden';
    this.__el.width = '100%';
    this.__el.height = '100%';
    element.appendChild(this.__el);
    this.__el.style.visibility = '';
    return this.__el;
  }

  /**
   * Removes this object from the DOM.
   */
  remove() {
    if (this.__el) {
      remove(this.__el);
      this.__el = null;
      // Needed for Firefox, IE <= 8 throws error.
      try {
        delete window.frames[this.id];
      } catch (err) {}
    }
  }

}

module.exports = Frame;
