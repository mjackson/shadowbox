/**
 * This file is part of Shadowbox
 * http://shadowbox-js.com/
 * Copyright 2007-2011 Michael Jackson
 */

(function (global, shadowbox) {

  var forEach = shadowbox.forEach;
  var mergeProperties = shadowbox.mergeProperties;
  var makeDom = shadowbox.makeDom;
  var removeElement = shadowbox.removeElement;
  var removeChildren = shadowbox.removeChildren;

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

  shadowbox.FlashPlayer = FlashPlayer;
  function FlashPlayer(object, id) {
    this.url = object.url;
    this.width = parseInt(object.width, 10) || 300;
    this.height = parseInt(object.height, 10) || 300;
    this.params = object.flashParams || {};

    if (object.flashVars) {
      var flashVars = [];
      for (var varName in object.flashVars) {
        flashVars.push(varName + '=' + object.flashVars[varName]);
      }

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
        this.element = makeSwf(this.url, {
          id: this.id,
          width: this.width,
          height: this.height
        }, mergeProperties({}, this.params));

        removeChildren(element);

        makeDom(element, this.element);
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

  var isExplorer = /*@cc_on!@*/false;

  shadowbox.makeSwf = makeSwf;
  function makeSwf(url, properties, params) {
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
        children.push(makeDom('param', { name: paramName, value: params[paramName] }));
      }
    }

    makeDom(object, properties, children);

    return object;
  }

  // Register the flash player for the .swf extension.
  shadowbox.registerPlayer(shadowbox.FlashPlayer, 'swf');

}(this, this.shadowbox));
