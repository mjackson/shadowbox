const root = document.documentElement;

const {
  remove
} = require('../util/dom');

class Photo {

  /**
   * The photo player is used for displaying images.
   *
   * @param {Object} obj
   * @param {String} obj.url The URL of the content to display
   * @param {number} [obj.width] The width of the content
   * @param {number} [obj.height] The height of the content
   * @param {String} id
   */
  constructor(obj, id) {
    this.url = obj.url;
    this.width = parseInt(obj.width, 10);
    this.height = parseInt(obj.height, 10);
    this.id = id;
    this.fadeCover = true;
    this.ready = false;
    this.__preload();
  }

  /**
   * reload the image so it's ready when needed
   *
   * @private
   */
  __preload() {
    let pre = new Image();
    pre.onload = () => {
      // Width and height default to image dimensions.
      this.width = this.width || this.width;
      this.height = this.height || this.height;
      // Ready to go.
      this.ready = true;
      // Clean up to prevent memory leak in IE.
      pre.onload = pre = null;
    }
    pre.src = this.url;
  }

  /**
   * Returns true if this player is supported on this browser.
   *
   * @returns {boolean}
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
    element.innerHTML = `
      <img id="${this.id}" width="100%" height="100%" src="${this.url}" />
    `;
    this.__el = element.firstChild;
    return this.__el;
  }

  /**
   * Removes this object from the DOM
   */
  remove() {
    if (this.__el) {
      remove(this.__el);
      this.__el = null;
    }
  }

}

module.exports = Photo;
