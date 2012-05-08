/**
 * This file is part of Shadowbox
 * http://shadowbox-js.com/
 * Copyright 2007-2011 Michael Jackson
 */

(function (shadowbox, undefined) {

  var utils = shadowbox.utils,
      dom = utils.dom,
      supportsFlash = false;

  // Detect Flash support.
  if (navigator.plugins && navigator.plugins.length) {
    utils.each(navigator.plugins, function(i, plugin) {
      if (plugin.name === "Shockwave Flash") {
        supportsFlash = true;
        return false; // Exit the loop.
      }
    });
  } else {
    try {
      var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      supportsFlash = true;
    } catch(e) {}
  }

  function Flash(obj, id) {
    this.url = obj.url;
    this.width = parseInt(obj.width, 10) || 300;
    this.height = parseInt(obj.height, 10) || 300;
    this.params = obj.flashParams || {};
    this.vars = obj.flashVars || {};
    this.id = id;
  }

  utils.apply(Flash.prototype, {

    /**
     * Returns true if this player is supported on this browser.
     */
    isSupported: function () {
      return supportsFlash;
    },

    /**
     * Inserts this object as the only child of the given DOM element.
     * Returns the newly created element, false if none was created.
     */
    insert: function (element) {
      if (!supportsFlash) {
        return false;
      }

      var vars = [];
      for (var varName in this.vars) {
        vars.push(varName + "=" + this.vars[varName]);
      }

      this._el = swf(this.url, {
        id: this.id,
        width: this.width,
        height: this.height
      }, utils.apply({}, this.params, {flashvars: vars.join("&")}));

      utils.empty(element);
      dom(element, this._el);

      return this._el;
    },

    /**
     * Removes this object from the DOM.
     */
    remove: function () {
      if (this._el) {
        utils.remove(this._el);
        this._el = null;
      }
    }

  });

  shadowbox.register(Flash, "swf");

  var isIE = /*@cc_on!@*/false;

  function swf(url, attributes, params) {
    attributes = attributes || {};
    params = params || {};

    var obj;
    if (isIE) {
      // Need to use innerHTML here for IE.
      var div = dom("div");
      div.innerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="movie" value="' + url + '"></object>';
      obj = div.firstChild;
    } else {
      obj = dom("object", {
        type: "application/x-shockwave-flash",
        data: url
      });
    }

    var paramElements = [];
    for (var paramName in params) {
      paramElements.push(dom("param", {
        name: paramName,
        value: params[paramName]
      }));
    }

    // Set <object> attributes and append <param> elements.
    dom(obj, attributes, paramElements);

    return obj;
  }

  // Expose.
  shadowbox.Flash = Flash;
  utils.supportsFlash = supportsFlash;
  utils.swf = swf;

})(shadowbox);
