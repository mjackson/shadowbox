/**
 * This file is part of Shadowbox
 * http://shadowbox-js.com/
 * Copyright 2007-2011 Michael Jackson
 */

(function (window, shadowbox, undefined) {

  var options = shadowbox.options,
      utils = shadowbox.utils,
      dom = utils.dom,
      swf = utils.swf,
      supportsFlash = utils.supportsFlash,
      supportsH264 = false,
      supportsOgg = false,
      supportsWebm = false;

  // The URL of the Flowplayer SWF, for flash fallback.
  shadowbox.flowplayer = "http://releases.flowplayer.org/swf/flowplayer-3.2.7.swf";

  // Detect video support, adapted from Modernizr.
  var video = dom("video"),
      canPlay = video.canPlayType && function (type) {
        var able = video.canPlayType(type);
        return able != "" && able != "no";
      };

  if (canPlay) {
    var mp4 = 'video/mp4; codecs="avc1.42E01E';
    supportsH264 = canPlay(mp4 + '"') || canPlay(mp4 + ', mp4a.40.2"');
    supportsOgg = canPlay('video/ogg; codecs="theora"');
    supportsWebm = canPlay('video/webm; codecs="vp8, vorbis"');
  }

  var extRe = /\.(mp4|m4v|ogg|webm|flv)/i;

  var encodingsMap = {
    "mp4": "h264",
    "m4v": "h264",
    "ogg": "ogg",
    "webm": "webm",
    "flv": "flv"
  };

  /**
   * Tries to automatically detect the encoding of a video from the file
   * extension it uses.
   */
  function detectEncoding(url) {
    var encoding;

    var match = url.match(extRe);
    if (match) {
      return encodingsMap[match[1].toLowerCase()];
    }

    return encoding;
  }

  function addClass(el, className) {
    if (el.className) {
      el.className = el.className + " " + className;
    } else {
      el.className = className;
    }
  }

  function removeClass(el, className) {
    var classRe = new RegExp("\\s*" + className + "\\s*", "g");
    el.className = (el.className || "").replace(classRe, " ");
  }

  function Video(obj, id) {
    this.url = obj.url;
    this.width = parseInt(obj.width, 10) || 640;
    this.height = parseInt(obj.height, 10) || 480;
    this.posterUrl = obj.posterUrl;
    this.id = id;

    if (obj.encodings) {
      this.encodings = obj.encodings;
    } else {
      this.encodings = {};
    }

    // Try to automatically detect the video encoding.
    var encoding = detectEncoding(this.url);
    if (encoding) {
      this.encodings[encoding] = this.url;
    } else {
      throw new Error("Cannot detect video encoding from URL: " + this.url);
    }
  }

  utils.apply(Video.prototype, {

    _createVideo: function (url) {
      var attrs = {
        id: this.id,
        src: url,
        preload: "auto",
        autoplay: "autoplay",
        // controls: "controls",
        width: this.width,
        height: this.height
      };

      if (this.posterUrl) {
        attrs.poster = this.posterUrl;
      }

      this._el = dom("video", attrs);

      // Working with an HTML5 <video> element.
      utils.apply(this, html5Methods);
    },

    _createSwf: function (url) {
      var clipProps = [];

      clipProps.push('"url":"' + url + '"');
      clipProps.push('"scaling":"fit"');
      clipProps.push('"autoBuffering":true')
      clipProps.push('"autoPlay":true');

      var clip = "{" + clipProps.join(",") + "}";

      var playlistItems = [];

      if (this.posterUrl) {
        playlistItems.push('"' + this.posterUrl + '"');
      }
      playlistItems.push(clip);

      var playlist = "[" + playlistItems.join(",") + "]";

      var configProps = [];

      configProps.push('"playerId":"' + this.id + '"');
      configProps.push('"clip":{}');
      configProps.push('"playlist":' + playlist);

      // Hide Flowplayer's controls, see http://flowplayer.org/forum/2/20734.
      configProps.push('"play":null,"plugins":{"controls":null}');

      // configProps.push('"debug":true');

      var config = "{" + configProps.join(",") + "}";
      var apiId = this.id + "_api";

      this._el = swf(shadowbox.flowplayer, {
        id: apiId,
        name: apiId,
        width: this.width,
        height: this.height
      }, {
        allowfullscreen: "true",
        allowscriptaccess: "always",
        quality: "high",
        bgcolor: "#000000",
        flashvars: "config=" + config
      });

      // Working with a Flowplayer <object> element.
      utils.apply(this, flashMethods);
    },

    /**
     * Returns true if this player is supported on this browser.
     */
    isSupported: function () {
      if (supportsH264 && this.encodings["h264"]) {
        return true;
      } else if (supportsFlash && (this.encodings["flv"] || this.encodings["h264"])) {
        return true;
      } else if (supportsOgg && this.encodings["ogg"]) {
        return true;
      } else if (supportsWebm && this.encodings["webm"]) {
        return true;
      }

      return false;
    },

    /**
     * Inserts this object as the only child of the given DOM element.
     * Returns the newly created element, false if none was created.
     */
    insert: function (element) {
      if (supportsH264 && this.encodings["h264"]) {
        this._createVideo(this.encodings["h264"]);
      } else if (supportsFlash && (this.encodings["flv"] || this.encodings["h264"])) {
        this._createSwf(this.encodings["flv"] || this.encodings["h264"]);
      } else if (supportsOgg && this.encodings["ogg"]) {
        this._createVideo(this.encodings["ogg"]);
      } else if (supportsWebm && this.encodings["webm"]) {
        this._createVideo(this.encodings["webm"]);
      }

      if (!this._el) {
        return false;
      }

      utils.empty(element);

      // Append the <video>/<object> to the DOM.
      dom(element, this._el);

      // The Shadowbox video controls markup:
      //
      // <div id="sb-controls">
      //   <div id="sb-rewind"></div>
      //   <div id="sb-play"></div>
      //   <div id="sb-volume"></div>
      // </div>

      var controls = dom("div", {id: "sb-controls"});
      var rewind = dom("div", {id: "sb-rewind"});
      var play = dom("div", {id: "sb-play"});
      var volume = dom("div", {id: "sb-volume"});

      // Append #sb-controls to the DOM.
      dom(element, [
        dom(controls, [rewind, play, volume])
      ]);

      this._controls = controls;

      var self = this;

      utils.addEvent(rewind, "click", utils.cancel(function () {
        self.seek(self.time() - 30);
      }));

      utils.addEvent(play, "click", utils.cancel(function () {
        self.togglePlay();
      }));

      utils.addEvent(volume, "click", utils.cancel(function () {
        if (self.isMuted()) {
          self.unmute();
        } else {
          self.mute();
        }
      }));

      if (this._init) {
        this._init();
      }

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
    },

    length: function () {
      return this._length();
    },

    time: function () {
      return this._time();
    },

    isPaused: function () {
      return this._isPaused();
    },

    play: function () {
      if (this.isPaused()) {
        this._play();
        this.showPlaying();
      }
    },

    showPlaying: function () {
      removeClass(this._controls, "paused");
    },

    pause: function () {
      if (!this.isPaused()) {
        this._pause();
        this.showPaused();
      }
    },

    showPaused: function () {
      addClass(this._controls, "paused");
    },

    togglePlay: function () {
      if (this.isPaused()) {
        this.play();
      } else {
        this.pause();
      }
    },

    isMuted: function () {
      return this._isMuted();
    },

    mute: function () {
      if (!this.isMuted()) {
        this._mute();
        this.showMuted();
      }
    },

    showMuted: function () {
      addClass(this._controls, "muted");
    },

    unmute: function () {
      if (this.isMuted()) {
        this._unmute();
        this.showUnmuted();
      }
    },

    showUnmuted: function () {
      removeClass(this._controls, "muted");
    },

    seek: function (time) {
      var to = Math.max(Math.min(time, this.length()), 0);
      this._seek(to);
    }

  });

  shadowbox.register(Video, ["mp4", "m4v", "ogg", "webm", "flv"]);

  // Methods for controlling an HTML5 <video> element.
  var html5Methods = {

    _init: function () {
      var self = this;

      utils.addEvent(this._el, "click", utils.cancel(function () {
        self.togglePlay();
      }));

      utils.addEvent(this._el, "ended", function () {
        self.pause();
        self.seek(0);
      });

      utils.addEvent(this._el, "play", function () {
        self.showPlaying();
      });

      utils.addEvent(this._el, "pause", function () {
        self.showPaused();
      });

      // This is to make sure the video starts playing, just in case
      // autoplay fails for some reason, which it seems to do randomly in
      // Safari and Chrome.
      setTimeout(function () {
        self.play();
      }, 500);
    },

    _length: function () {
      return this._el.duration;
    },

    _time: function () {
      return this._el.currentTime;
    },

    _seek: function (time) {
      this._el.currentTime = time;
    },

    _isPaused: function () {
      return this._el.paused;
    },

    _play: function () {
      return this._el.play();
    },

    _pause: function () {
      return this._el.pause();
    },

    _isMuted: function () {
      return !!this._el.muted;
    },

    _mute: function () {
      this._el.muted = true;
    },

    _unmute: function () {
      this._el.muted = false;
    }

  };

  // Methods for controlling a Flowplayer <object> element.
  var flashMethods = {

    _length: function () {
      var status = this._el.fp_getStatus();
      return status.bufferEnd;
    },

    _time: function () {
      return this._el.fp_getTime();
    },

    _seek: function (time) {
      this._el.fp_seek(Math.round(time));
    },

    _isPaused: function () {
      return this._el.fp_isPaused();
    },

    _play: function () {
      return this._el.fp_play();
    },

    _pause: function () {
      return this._el.fp_pause();
    },

    _isMuted: function () {
      return this._el.fp_isMuted();
    },

    // The calls to fp_mute, fp_unmute, and fp_setVolume log an error
    // that is uncatchable. However, they still work. :/

    _mute: function () {
      this._el.fp_logging("suppress");
      this._el.fp_mute();
      this._el.fp_logging("error");
    },

    _unmute: function () {
      this._el.fp_logging("suppress");
      this._el.fp_unmute();
      this._el.fp_logging("error");
    },

    _setVolume: function (level) {
      this._el.fp_logging("suppress");
      this._el.fp_setVolume(level);
      this._el.fp_logging("error");
    }

  };

  // Need to hijack flowplayer.fireEvent because it is the interface that
  // the Flash player uses to send events to the JavaScript.

  function fireEvent(id, name) {
    var player = shadowbox.getPlayer();

    if (player && player.id == id) {
      if (name == "onStart") {
        // Need to adjust volume to match <video> players.
        player._setVolume(100);
      } else if (name == "onPause") {
        player.showPaused();
      } else if (name == "onResume") {
        player.showPlaying();
      } else if (name == "onFinish") {
        player.pause();
        player.seek(0);
      }

      return true;
    }
  }

  if (window.flowplayer) {
    var _fireEvent = window.flowplayer.fireEvent;

    window.flowplayer.fireEvent = function () {
      var result = fireEvent.apply(this, arguments);

      if (result == null) {
        return _fireEvent.apply(this, arguments);
      }

      return result;
    };
  } else {
    window.flowplayer = {
      fireEvent: fireEvent
    };
  }

  // Expose.
  shadowbox.Video = Video;
  shadowbox.encodings = encodingsMap;
  utils.supportsH264 = supportsH264;
  utils.supportsOgg = supportsOgg;
  utils.supportsWebm = supportsWebm;

})(this, shadowbox);
