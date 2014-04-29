/**
 * This file is part of Shadowbox <http://shadowbox-js.com/>
 */

(function (global) {

  var shadowbox = global.shadowbox;

  if (!shadowbox)
    throw new Error('You must load shadowbox.js before shadowbox-flash.js');

  var forEach = shadowbox.forEach,
      mergeProperties = shadowbox.mergeProperties,
      makeDom = shadowbox.makeDom,
      removeElement = shadowbox.removeElement,
      removeChildren = shadowbox.removeChildren;

  // Detect Flash support.
  var supportsFlash = false;
  if (navigator.plugins && navigator.plugins.length) {
    forEach(navigator.plugins, function (plugin) {
      if (plugin.name === "Shockwave Flash") {
        supportsFlash = true;
        return false; // Exit the loop.
      }
    });
  } else {
    try {
      var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      supportsFlash = true;
    } catch (error) {}
  }

  shadowbox.supportsFlash = supportsFlash;

  var userAgent = navigator.userAgent.toLowerCase();
  var isExplorer = /msie/.test(userAgent);

  shadowbox.makeSwf = function (url, properties, params) {
    var object;
    if (isExplorer) {
      // Need to use innerHTML here for IE.
      var div = makeDom("div");
      div.innerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="movie" value="' + url + '"></object>';
      object = div.firstChild;
    } else {
      object = makeDom("object", {
        type: "application/x-shockwave-flash",
        data: url
      });
    }

    var children = [];
    if (params) {
      for (var paramName in params) {
        if (params.hasOwnProperty(paramName))
          children.push(makeDom('param', { name: paramName, value: params[paramName] }));
      }
    }

    makeDom(object, properties, children);

    return object;
  };

  shadowbox.FlashPlayer = FlashPlayer;

  /**
   * A player that is capable of displaying Flash content.
   */
  function FlashPlayer(object, id) {
    this.url = object.url;
    this.width = parseInt(object.width, 10) || 300;
    this.height = parseInt(object.height, 10) || 300;
    this.params = object.flashParams || {};

    if (object.flashVars) {
      var flashVars = [];

      for (var varName in object.flashVars)
        flashVars.push(varName + '=' + object.flashVars[varName]);

      this.params.flashvars = flashVars.join('&');
    }

    this.id = id;
  }

  mergeProperties(FlashPlayer.prototype, {

    /**
     * Returns true if this player is supported on this browser.
     */
    isSupported: function () {
      return supportsFlash;
    },

    /**
     * Inserts this object as the only child of the given DOM element.
     */
    injectInto: function (element) {
      if (supportsFlash) {
        var params = mergeProperties({}, this.params);
        var properties = {
          id: this.id,
          width: this.width,
          height: this.height
        };

        this.element = shadowbox.makeSwf(this.url, properties, params);

        removeChildren(element);

        element.appendChild(this.element);
      }
    },

    /**
     * Removes this object from the DOM.
     */
    remove: function () {
      if (this.element) {
        removeElement(this.element);
        delete this.element;
      }
    }

  });

  // Register the flash player for the .swf extension.
  shadowbox.registerPlayer(shadowbox.FlashPlayer, 'swf');

}(this));
