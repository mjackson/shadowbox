const root = document.documentElement;

const {
  supportsFixedPosition,
  supportsTouch,
  getComputedStyle,
  dom, remove, empty,
  animateStyle, getStyle, setStyle,
  addEvent, removeEvent, handleEvent,
  preventDefault, stopPropagation,
  fixEvent
} = require('./util/dom');

const {
  guid,
  isFunction, noop,
  toArray, each,
  apply,
  removeTimeout
} = require('./util');

const {
  Frame,
  Photo
} = require('./players');

const animate = require('./util/animate');

/**
 * Indicates that the Shadowbox markup has been created
 * and injected into the DOM.
 *
 * This only happens after a Shadowbox instance calls `open()`
 */
let initialized = false;

/**
 * Indicates if any Shadowbox instance is open
 */
let isOpen = false;

class Shadowbox {

  /**
   * The current version of Shadowbox.
   *
   * @static
   */
  static version = '5.0.0';

  /**
   * A map of file extensions to the player class that should be used to play
   * files with that extension.
   *
   * @private
   * @static
   */
  static __players = {};

  /**
   * A list of elements that should be hidden when the shadowbox is showing
   *
   * @private
   * @static
   */
  static __troubleElements = ['select', 'object', 'embed', 'canvas'];
  
  /**
   * A list of elements that have their visibility toggled
   *
   * @private
   * @static
   */
  static __visibilityCache = [];

  /**
   * A map of elements that make up the shadowbox
   *
   * @private
   * @static
   */
  static __$elements = {};

  /**
   * The default set of options
   *
   * @private
   * @static
   */
  static options = {
    // Animate height/width transitions.
    animate: true,
    // Automatically close when done playing movies.
    autoClose: false,
    // Able to navigate from one end of a gallery to the other (i.e. from
    // last item to first or vice versa) by choosing next/previous?
    continuous: false,
    // Easing function for animations. Based on a cubic polynomial.
    ease: state => {
      return 1 + Math.pow(state - 1, 3);
    },
    // Enable control of Shadowbox via the keyboard?
    enableKeys: true,
    // The amount of margin to maintain around the edge of Shadowbox at all times.
    margin: 40,
    // A hook function that is called when closing.
    onClose: noop,
    // A hook function that is called when a player is finished loading and
    // all display transitions are complete. Receives the player object as
    // its only argument.
    onDone: noop,
    // A hook function that is called when opening.
    onOpen: noop,
    // A hook function that is called when a player is ready to be
    // displayed. Receives the player object as its only argument.
    onShow: noop,
    // Background color for the overlay.
    overlayColor: '#333',
    // Opacity for the overlay.
    overlayOpacity: 0.5,
    // The index in the current gallery at which to start when first opening.
    startIndex: 0
  };

  /**
   * Registers the given player class to be used with the given file
   * extensions.
   *
   * @param {Object} player
   * @param {Array|String} exts
   * @example
   *
   * shadowbox.register(shadowbox.Video, 'mov');
   * shadowbox.register(shadowbox.Photo, ['jpg', 'jpeg']);
   */
  static register(player, exts) {
    exts = exts || [];
    exts = toArray(exts);
    for (var i = 0, len = exts.length; i < len; ++i) {
      this.__players[exts[i]] = player;
    }
  }

  /**
   * Creates a new player object based on the attributes in the given object.
   *
   * If a string is given, it will be used as the value of the URL. If a DOM
   * element is given, it should have an href property (i.e. either an <a> or
   * an <area> element) which will be used as the URL. It may also contain
   * a data-shadowbox attribute that has any of the other options formatted
   * in a JSON string.
   *
   * If no player is specified, it will be guessed using the registered player
   * for the URL's file extension (see shadowbox.register).
   *
   * @static
   * @param {Object|String|DOMElement} obj
   * @param {String} obj.url The URL of the content to display
   * @param {number} [obj.width] The width of the content
   * @param {number} [obj.height] The height of the content
   * @param {Object} [obj.player] The player class to use to play the content.
   *  Can be guessed in most cases from the URL
   * @param {Object} [obj.encoding] (video only) Encoding name/URL pairs of
   *  alternate URL's for the video. Possible encoding names are
   *  "h264", "ogg" "webm", and "flv"
   * @param {String} [obj.postedUrl] (video only) The URL to a
   *  poster image of the video
   * @param {Object} [obj.flashParams] (flash only) Name/value pairs of <param>'s
   *  to use for the Flash <object>
   * @param {Object} [obj.flashVars] (flash only) Name/value pairs of variables
   *  to pass to the Flash object as variables
   * @returns {Object|boolean} Returns false if no player is able to be created,
   *  or this browser does not have proper support for that content.
   */
  static makePlayer(obj) {
    if (typeof obj === 'string') {
      obj = { url: obj };
    } else if (obj.nodeType === 1 && obj.href) {
      // The object is a DOM element. Should be an <a> or <area>. The
      // data-shadowbox attribute may contain a JSON string specifying
      // options for the player object.
      var data = obj.getAttribute('data-shadowbox');
      obj = {url: obj.href};
      if (data) {
        apply(obj, JSON.parse(data));
      }
    }
    if (obj && typeof obj.url === 'string') {
      let id = `sb-player-${guid()}`;
      let player, playerFn;
      if (obj.player) {
        playerFn = obj.player;
      } else {
        // Guess the player class using the URL's file extension.
        let match = obj.url.match(/\.([0-9a-z]+)(\?.*)?$/i);
        if (match) {
          playerFn = this.__players[match[1].toLowerCase()];
        }
      }
      playerFn = playerFn || Frame;
      player = new playerFn(obj, id);
      if (player.isSupported()) {
        return player;
      }
    }
    return false;
  }

  /**
   * Opens an object (or an array of objects) in Shadowbox.
   *
   * Options may be any of shadowbox.options. 
   *
   * @param {Object|Array|String} items
   * @param {Object} [options]
   */
  constructor(items, options) {
    items = toArray(items);
    options = this.options = apply({}, this.constructor.options, options || {});
    // Setup
    this.isOpen = false;
    this.__gallery = [];
    this.__current = -1;
    // Binding
    this.__handleWindowResize = this.__handleWindowResize.bind(this);
    this.__handleWindowScroll = this.__handleWindowScroll.bind(this);
    this.__handleMouseMove = this.__handleMouseMove.bind(this);
    this.__handleKey = this.__handleKey.bind(this);
    this.__handleClose = this.__handleClose.bind(this);
    this.__handleNext = this.__handleNext.bind(this);
    this.__handlePrev = this.__handlePrev.bind(this);
    // Normalize into player objects and append them to the gallery.
    let index = options.startIndex;
    items.forEach((obj, i) => {
      let player = this.constructor.makePlayer(obj);
      if (player) {
        this.__gallery.push(player);
      } else {
        /*if (i < index) {
          index -= 1;
        } else if (i == index) {
          index = 0;
        }*/
      }
    });
  }

  /**
   * Display the shadowbox
   *
   * @returns {boolean} A boolean indicating if the shadobox can
   *  actually be opened
   */
  open() {
    // Only one shadowbox can be open at a time
    if (isOpen) {
      console.warn('Only a single Shadowbox instance can be open at a time.');
      return false;
    }
    const {
      startIndex, overlayOpacity, overlayColor, ease
    } = this.options;
    // Display the first item in the gallery
    if (this.__gallery.length > 0) {
      if (this.__current == -1) {
        this.__initialize();
        const {
          $container, $overlay, $wrapper
        } = this.constructor.__$elements;
        if (isFunction(this.options.onOpen)) {
          this.options.onOpen();
        }
        setStyle($container, 'display', 'block');
        this.__setContainerPosition();
        this.__setContainerSize();
        this.__toggleTroubleElements(0);
        setStyle($overlay, 'backgroundColor', overlayColor);
        setStyle($overlay, 'opacity', 0);
        setStyle($container, 'visibility', 'visible');
        animateStyle($overlay, 'opacity', overlayOpacity, 0.35, ease, () => {
          this.__setWrapperSize(340, 200);
          setStyle($wrapper, 'visibility', 'visible');
          this.show(startIndex);
        });
      } else {
        this.show(startIndex);
      }
      this.isOpen = isOpen = true;
      return true;
    }
    else {
      console.warn('No valid gallery items to show');
      return false;
    }
  }

  /**
   * Displays the gallery item at the given index in Shadowbox.
   * Assumes that Shadowbox is already initialized and open.
   *
   * @param {number} index
   */
  show(index) {
    // Guard against invalid indices.
    if (index < 0 || !this.__gallery[index]) {
      console.warn(`Invalid index - ${index}`);
      return;
    }
    const {
      $overlay, $wrapper, $cover, $content, $close, $prev, $next
    } = this.constructor.__$elements;
    // Unmount the previous player
    if (this.__player) {
      this.__player.remove();
    }
    // Show
    setStyle($cover, 'display', 'block');
    setStyle($cover, 'opacity', 1);
    // Update current gallery position.
    this.__current = index;
    this.__player = this.__gallery[index];
    // Wait for the player to be ready before proceeding.
    let interval = setInterval(() => {
      // Protect against an infinite interval
      if (!this.__player) {
        clearInterval(interval);
        interval = null;
      }
      // The player isn't ready yet
      if (this.__player.ready === false) {
        return;
      }
      // The player is ready
      clearInterval(interval);
      interval = null;
      // Delegate
      if (isFunction(this.options.onShow)) {
        this.options.onShow(this.__player);
      }
      // Calculate the new size
      const prev_w = parseInt(getStyle($wrapper, 'width')) || 0;
      const prev_h = parseInt(getStyle($wrapper, 'height')) || 0;
      const [next_w,next_h] = this.__getWrapperSize();
      const delta_w = next_w - prev_w;
      const delta_h = next_h - prev_h;
      // Open to the correct dimensions. Use the low-level animation
      // primitive to make this transition as smooth as possible.
      animate(0, 1, 0.5, this.options.ease, value => {
        if (!this.__player) {
          return false; // Cancel the animation.
        }
        this.__setWrapperSize(
          prev_w + (delta_w * value),
          prev_h + (delta_h * value)
        );
        // Animation is done
        if (value === 1) {
          if (this.__player.fadeCover) {
            this.__player.insert($content);
            animateStyle($cover, 'opacity', 0, 0.5, this.options.ease, () => {
              if (this.__player) this.__showAfter();
            });
          } else {
            this.__showAfter();
            this.__player.insert($content);
          }
        }
      });
    }, 10);
  }

  /**
   * Hide the shadowbox immediately
   */
  close() {
    // Make sure the shadowbox is open
    if (!this.isOpen) return;
    const {
      $container, $overlay, $wrapper, $cover, $content, $close, $prev, $next
    } = this.constructor.__$elements;
    // Reset
    this.__current = -1;
    this.__player = null;
    // Hide
    setStyle($wrapper, 'visibility', 'hidden');
    setStyle($cover, 'opacity', 1);
    $content.innerHTML = '';
    // Remove scroll/keyboard/mouse events
    this.__toggleControls(0);
    this.__toggleWindowHandlers(0);
    this.__toggleMouseHandlers(0);
    this.__toggleKeyHandlers(0);
    // Remove ui events
    removeEvent($overlay, 'click', this.__handleClose);
    removeEvent($close, 'click', this.__handleClose);
    removeEvent($next, 'click', this.__handleNext);
    removeEvent($prev, 'click', this.__handleClose);
    // Hide
    animateStyle($overlay, 'opacity', 0, 0.5, this.options.ease, () => {
      setStyle($container, 'visibility', 'hidden');
      setStyle($container, 'display', 'none');
      this.isOpen = isOpen = false;
      this.__toggleTroubleElements(1);
      if (isFunction(this.options.onClose)) {
        this.options.onClose();
      }
    });
  }

  /**
   * Gets the index of the next item in the gallery or -1 if there is none
   *
   * @returns {number}
   */
  getNext() {
    if (this.__current === this.__gallery.length - 1) {
      return (this.options.continuous && this.__current != 0) ? 0 : -1;
    }
    return this.__current + 1;
  }

  /**
   * Returns true if there is a next item in the gallery
   *
   * @returns {boolean}
   */
  hasNext() {
    return this.getNext() >= 0;
  }

  /**
   * Show the next item in the gallery
   */
  next() {
    this.show(this.getNext());
  }

  /**
   * Gets the index of the previous item in the gallery, -1 if there is none
   *
   * @returns {number}
   */
  getPrev() {
    if (this.__current === 0) {
      return this.options.continuous ? this.__gallery.length - 1 : -1;
    }
    return this.__current - 1;
  }

  /**
   * Returns true if there is a previous item in the gallery.
   */
  hasPrev() {
    return this.getPrev() >= 0;
  }

  /**
   * Show the previous item in the gallery
   */
  prev() {
    this.show(this.getPrev());
  }

  /**
   * Intialize the shadow box
   *
   * <div id="shadowbox">
   *   <div id="sb-overlay"></div>
   *   <div id="sb-wrapper">
   *     <div id="sb-body">
   *       <div id="sb-content"></div>
   *       <div id="sb-cover"></div>
   *     </div>
   *     <div id="sb-close"></div>
   *     <div id="sb-next"></div>
   *     <div id="sb-prev"></div>
   *   </div>
   * </div>
   *
   * @private
   */
  __initialize() {
    if (!initialized) {
      initialized = true;
      // Create the shadowbox DOM
      const $container = dom('div', {id: 'shadowbox'});
      const $overlay = dom('div', {id: 'sb-overlay'});
      const $wrapper = dom('div', {id: 'sb-wrapper'});
      const $body = dom('div', {id: 'sb-body'});
      const $content = dom('div', {id: 'sb-content'});
      const $cover = dom('div', {id: 'sb-cover'});
      const $close = dom('div', {id: 'sb-close'});
      const $next = dom('div', {id: 'sb-next'});
      const $prev = dom('div', {id: 'sb-prev'});
      // Save commonly used elements
      this.constructor.__$elements = {
        $container, $overlay, $wrapper, $body, $content, $cover,
        $close, $next, $prev
      }
      // Append #shadowbox to the DOM.
      dom(document.body, [
        dom($container, [
          $overlay,
          dom($wrapper, [
            dom($body, [$content, $cover]),
            $close,
            $next,
            $prev
          ])
        ])
      ]);
      if (!supportsFixedPosition) {
        // Use an absolutely positioned container in browsers that don't
        // support fixed positioning.
        setStyle($container, 'position', 'absolute');
      }
    }
  }

  /**
   * Sets the size of the container element to the size of the window.
   *
   * @private
   */
  __setContainerSize() {
    const {$container} = this.constructor.__$elements;
    setStyle($container, 'width', `${root.clientWidth}px`);
    setStyle($container, 'height', `${root.clientHeight}px`);
    if (this.__player) {
      var size = this.__getWrapperSize();
      this.__setWrapperSize(size[0], size[1]);
    }
  }

  /**
   * Sets the position of the container element to the top left corner of
   * the window. Necessary when using absolute positioning instead of fixed.
   *
   * @private
   */
  __setContainerPosition() {
    const {$container} = this.constructor.__$elements;
    setStyle($container, 'left', `${root.scrollLeft}px`);
    setStyle($container, 'top', `${root.scrollTop}px`);
  }

  /**
   * Toggles the visibility of elements that are troublesome for overlays
   *
   * @private
   */
  __toggleTroubleElements(on) {
    if (on) {
      this.constructor.__visibilityCache.forEach((i, el) => {
        setStyle(el[0], 'visibility', el[1] || '');
      });
    } else {
      this.constructor.__visibilityCache.length = 0;
      this.constructor.__troubleElements.forEach((i, tagName) => {
        each(document.getElementsByTagName(tagName), (j, el)  => {
          this.constructor.__visibilityCache.push([el, getStyle(el, 'visibility')]);
          setStyle(el, 'visibility', 'hidden');
        });
      });
    }
  }

  /**
   * Gets the size that should be used for the wrapper element. Should be
   * called when Shadowbox is open and has a player that is ready.
   *
   * @private
   */
  __getWrapperSize() {
    const {$overlay} = this.constructor.__$elements;
    const margin = Math.max(this.options.margin, 20); // Minimum 20px margin.
    const size = this.__constrainSize(
      this.__player.width, this.__player.height,
      $overlay.offsetWidth, $overlay.offsetHeight,
      margin
    );
    return size;
  }

  /**
   * Sets the size and position of the wrapper
   *
   * @private
   */
  __setWrapperSize(width, height) {
    const {$wrapper} = this.constructor.__$elements;
    setStyle($wrapper, 'width', `${width}px`);
    setStyle($wrapper, 'marginLeft', `${-width/2}px`);
    setStyle($wrapper, 'height', `${height}px`);
    setStyle($wrapper, 'marginTop', `${-height/2}px`);
  }

  /**
   * Scales the given width and height to be within the bounds of the given
   * maximum width and height, allowing for margin. Returns an array of the
   * constrained [width, height].
   *
   * @private
   */
  __constrainSize(width, height, maxWidth, maxHeight, extra) {
    const originalWidth = width;
    const originalHeight = height;
    // Constrain height/width to max.
    const extraWidth = 2 * extra;
    if (width + extraWidth > maxWidth) {
      width = maxWidth - extraWidth;
    }
    const extraHeight = 2 * extra;
    if (height + extraHeight > maxHeight) {
      height = maxHeight - extraHeight;
    }
    // Calculate the change in height/width.
    const changeWidth = (originalWidth - width) / originalWidth;
    const changeHeight = (originalHeight - height) / originalHeight;
    // Adjust height/width if oversized.
    if (changeWidth > 0 || changeHeight > 0) {
      // Preserve original aspect ratio according to greatest change.
      if (changeWidth > changeHeight) {
        height = round((originalHeight / originalWidth) * width);
      } else if (changeHeight > changeWidth) {
        width = round((originalWidth / originalHeight) * height);
      }
    }
    return [width, height];
  }

  /**
   * Toggles window resize/scroll handlers on/off
   *
   * @private
   */
  __toggleWindowHandlers(on) {
    let fn;
    if (on) {
      fn = addEvent;
    } else {
      fn = removeEvent;
      removeTimeout(this, '__windowResizeTimer');
      removeTimeout(this, '__windowScrollTimer');
    }
    fn(window, 'resize', this.__handleWindowResize);
    if (!supportsFixedPosition) {
      fn(window, 'scroll', this.__handleWindowScroll);
    }
  }

  /**
   * Updates the size of the container when the window size changes
   *
   * @private
   */
  __handleWindowResize() {
    removeTimeout(this, '__windowResizeTimer');
    this.__windowResizeTimer = setTimeout(() => {
      this.__windowResizeTimer = null;
      this.__setContainerSize();
    }, 10);
  }

  /**
   * Updates the position of the container when the window scrolls
   *
   * @private
   */
  __handleWindowScroll() {
    removeTimeout(this, '__windowScrollTimer');
    this.__windowScrollTimer = setTimeout(() => {
      this.__windowScrollTimer = null;
      this.__setContainerPosition();
    }, 10);
  }

  /**
   * Toggles document mouse move handler on/off
   *
   * @private
   */
  __toggleMouseHandlers(on) {
    if (supportsTouch) {
      this.__toggleControls(on);
      return;
    }
    let fn;
    if (on) {
      fn = addEvent;
    } else {
      fn = removeEvent;
      removeTimeout(this, '__mouseMoveTimer');
    }
    fn(document, 'mousemove', this.__handleMouseMove);
  }

  /**
   * Shows clickable controls when the mouse moves
   *
   * @private
   */
  __handleMouseMove(e) {
    // Ignore consecutive mousemove events from the same location.
    if (this.__lastX === e.clientX && this.__lastY === e.clientY) {
      return;
    }

    this.__lastX = e.clientX;
    this.__lastY = e.clientY;

    if (this.__mouseMoveTimer) {
      removeTimeout(this, '__mouseMoveTimer')
    } else {
      this.__toggleControls(1);
    }

    this.__mouseMoveTimer = setTimeout(() => {
      this.__mouseMoveTimer = null;
      this.__toggleControls(0);
    }, 1500);
  }

  /**
   * Toggles document key events on/off
   *
   * @private
   */
  __toggleKeyHandlers(on) {
    (on ? addEvent : removeEvent)(document, 'keydown', this.__handleKey);
  }

  /**
   * Listen for prev/next/hide keys
   *
   * @private
   */
  __handleKey(e) {
    if (!this.options.enableKeys) return;
    // Don't handle events with modifier keys.
    if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey) {
      return;
    }
    let handler;
    switch (e.keyCode) {
    case 81: // q
    case 88: // x
    case 27: // esc
      handler = this.close;
      break;
    case 37: // left
      handler = this.prev;
      break;
    case 39: // right
      handler = this.next;
      break;
    case 32: // space
      if (this.__player && typeof isFunction(this.__player.togglePlay)) {
        this.__player.togglePlay();
      }
      break;
    }
    if (handler) {
      e.preventDefault();
      handler();
    }
  }

  /**
   * Toggles visibility of clickable controls on and off
   *
   * @private
   */
  __toggleControls(on) {
    const {$container} = this.constructor.__$elements;
    let name = '';
    if (on) {
      name += 'active';
      if (this.hasNext()) name += ' has-next';
      if (this.hasPrev()) name += ' has-prev';
    }
    $container.className = name;
  }

  /**
   * Handle closing from the $close / $overlay element
   *
   * @private
   */
  __handleClose(e) {
    e.preventDefault();
    this.close();
  }

  /**
   * Handle the click on the $next element
   *
   * @private
   */
  __handleNext(e) {
    e.preventDefault();
    this.next();
  }

  /**
   * Handle the click on the $prev element
   *
   * @private
   */
  __handlePrev(e) {
    e.preventDefault();
    this.prev();
  }

  /**
   * Called once the shadowbox is shown
   *
   * @private
   */
  __showAfter() {
    const {
      $overlay, $cover, $close, $next, $prev
    } = this.constructor.__$elements;
    setStyle($cover, 'display', 'none');
    // Add ui events
    addEvent($overlay, 'click', this.__handleClose);
    addEvent($close, 'click', this.__handleClose);
    addEvent($next, 'click', this.__handleNext);
    addEvent($prev, 'click', this.__handlePrev);
    // Add resize/scroll/mouse key handlers
    this.__toggleWindowHandlers(1);
    this.__toggleMouseHandlers(1);
    this.__toggleKeyHandlers(1);
    // Delegate
    if (isFunction(this.options.onDone)) {
      this.options.onDone(this.__player);
    }
  }

}

/**
 * Register the default players
 */
Shadowbox.register(Photo, [
  'gif', 'jpg', 'jpeg', 'png', 'bmp'
]);

/**
 * Listen for links[rel="shadowbox"] to be clicked
 */ 
addEvent(document, 'click', function(e) {
  let {target} = e;
  // Only handle element nodes
  if (target.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const matcher = /^(?:shadow|light)box(?:\[(\w+)\])?$/i;
  const links = [];
  let index = 0;
  let match;
  // Find an ancestor node with rel="shadowbox" attribute.
  while (target) {
    // Try to match the rel attribute
    match = (target.rel || '').match(matcher);
    // Found a match
    if (match) {
      // Look for other anchor elements in the document that also have
      // rel="shadowbox" attribute with the same gallery.
      if (match[1]) {
        const galleryMatcher = new RegExp(`^(shadow|light)box\\[${match[1]}\\]$`, 'i');
        // Select all the anchors
        each(document.getElementsByTagName('a'), (i, link) => {
          
          if (link.rel && galleryMatcher.test(link.rel)) {
            // The link that was clicked — use this as the startIndex
            if (link === target) {
              index = links.length;
            }
            // Save the link
            links.push(link);
          }
        });
      } else {
        links.push(target);
      }
      break;
    }
    target = target.parentNode;
  }
  if (links.length > 0) {
    const box = new Shadowbox(links, {
      startIndex: index
    });
    // Make sure the shadowbox can be opened
    if (box.open()) {
      // Prevent the browser from following the link.
      e.preventDefault();
    }
  }
});

module.exports = Shadowbox;
