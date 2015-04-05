const root = document.documentElement;
const getComputedStyle = document.defaultView && document.defaultView.getComputedStyle;

const animate = require('./animate');

const {
  noop
} = require('./index');

const OPACITY_RE = /opacity=([^)]*)/i;

/**
 * True if the browser supports opacity.
 */
function __supportsOpacity() {
  return 'opacity' in root.style && typeof root.style.opacity === 'string';
}

/**
 * Detect support for fixed positioning.
 */
function __supportsFixedPosition() {
  let support = false;
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.margin = 0;
  div.style.top = '20px';
  root.appendChild(div, root.firstChild);
  support = (div.offsetTop == 20);
  root.removeChild(div);
  return support;
}

/**
 * True if the browser is on a touch-based device.
 */
function __supportsTouch() {
  return 'createTouch' in document;
}

/**
 * Multipurpose utility function for creating DOM elements, assigning
 * attributes, and appending child nodes.
 */
function dom(element, attrs, children) {
  if (typeof element == "string") {
    element = document.createElement(element);
  }

  if (Array.isArray(attrs)) {
    children = attrs;
    attrs = null;
  } else if (attrs && attrs.nodeType) {
    children = [attrs];
    attrs = null;
  }

  if (attrs) {
    for (var attr in attrs) {
      // element.setAttribute(attr, attrs[attr]);
      element[attr] = attrs[attr];
    }
  }

  if (Array.isArray(children)) {
    for (var i = 0, len = children.length; i < len; ++i) {
      element.appendChild(children[i]);
    }
  }

  return element;
}

/**
 * Removes the given element from the DOM.
 */
function remove(element) {
  return element.parentNode.removeChild(element);
}

/**
 * Removes all child nodes from the given element.
 */
function empty(element) {
  var child = element.firstChild;

  while (child) {
    remove(child);
    child = element.firstChild;
  }
}

/**
 * Animates the style of an element from its current value to another over
 * the given duration. Calls the given callback when complete.
 */
function animateStyle(element, style, to, duration, ease, callback) {
  callback = callback || noop;
  const from = parseFloat(getStyle(element, style)) || 0;
  let setter;
  
  if (style === 'opacity') {
    setter = function(value) {
      setStyle(element, style, value);
      if (value === to) {
        callback();
      }
    }
  } else {
    // Assume pixel values for all styles besides opacity.
    setter = (value) => {
      setStyle(element, style, Math.round(value) + 'px');
      if (value === to) {
        callback();
      }
    }
  }

  animate(from, to, duration, ease, setter);
}

/**
 * Gets the current value of the given style on the given element. The style
 * name should be camel-cased.
 *
 * Note: This function is not safe for retrieving float or non-pixel values
 * in Internet Explorer.
 */
function getStyle(element, style) {
  var value = "";

  if (!__supportsOpacity && style == "opacity" && element.currentStyle) {
    if (OPACITY_RE.test(element.currentStyle.filter || "")) {
      value = (parseFloat(RegExp.$1) / 100) + "";
    }

    return value == "" ? "1" : value;
  }

  if (getComputedStyle) {
    var computedStyle = getComputedStyle(element, null);

    if (computedStyle) {
      value = computedStyle[style];
    }

    if (style == "opacity" && value == "") {
      value = "1";
    }
  } else {
    value = element.currentStyle[style];
  }

  return value;
}

/**
 * Sets the style on the given element to the given value. The style name
 * should be camel-cased.
 *
 * Note: This function is not safe for setting float values.
 */
function setStyle(element, style, value) {
  var s = element.style;

  if (style == "opacity") {
    if (value == 1) {
      value = "";
    } else {
      value = (value < 0.00001 ? 0 : value);
    }

    if (!__supportsOpacity) {
      s.zoom = 1; // Trigger hasLayout.

      if (value == 1) {
        if (typeof s.filter == "string" && (/alpha/i).test(s.filter)) {
          s.filter = s.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
        }
      } else {
        s.filter = (s.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
          " alpha(opacity=" + (value * 100) + ")";
      }

      return;
    }
  }

  s[style] = value;
}

// Event handling functions modified from originals by Dean Edwards.
// http://dean.edwards.name/my/events.js

/**
 * Adds an event handler to the given element. The handler will be called
 * in the context of the element with the event object as its only argument.
 */
function addEvent(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    if (element.nodeType === 3 || element.nodeType === 8) {
      return;
    }

    if (element.setInterval && (element !== window && !element.frameElement)) {
      element = window;
    }

    if (!handler.__guid) {
      handler.__guid = guid++;
    }

    if (!element.events) {
      element.events = {};
    }

    var handlers = element.events[type];
    if (!handlers) {
      handlers = element.events[type] = {};
      if (element["on" + type]) {
        handlers[0] = element["on" + type];
      }
    }

    handlers[handler.__guid] = handler;

    element["on" + type] = handleEvent;
  }
}

function handleEvent(e) {
  e = e || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);

  var handlers = this.events[e.type], result = true;
  for (var id in handlers) {
    if (handlers[id].call(this, e) === false) {
      result = false;
    }
  }

  return result;
}

function preventDefault() {
  this.returnValue = false;
}

function stopPropagation() {
  this.cancelBubble = true;
}

function fixEvent(e) {
  e.preventDefault = preventDefault;
  e.stopPropagation = stopPropagation;
  e.target = e.srcElement;
  e.keyCode = e.which;
  return e;
}

/**
 * Removes an event handler from the given element.
 */
function removeEvent(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else {
    if (element.events && element.events[type] && handler.__guid) {
      delete element.events[type][handler.__guid];
    }
  }
}

module.exports = {
  __supportsOpacity,
  __supportsFixedPosition,
  __supportsTouch,

  supportsOpacity: __supportsOpacity(),
  supportsFixedPosition: __supportsFixedPosition(),
  supportsTouch: __supportsTouch(),

  getComputedStyle,

  dom,
  remove,
  empty,
  
  animateStyle,
  getStyle,
  setStyle,

  addEvent,
  handleEvent,
  preventDefault,
  stopPropagation,
  fixEvent,
  removeEvent
};
