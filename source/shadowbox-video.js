/**
 * This file is part of Shadowbox <http://shadowbox-js.com/>
 */

(function (global) {

  var shadowbox = global.shadowbox;

  if (!shadowbox)
    throw new Error('You must load shadowbox.js before shadowbox-video.js');

  var mergeProperties = shadowbox.mergeProperties,
      removeElement = shadowbox.removeElement,
      removeChildren = shadowbox.removeChildren,
      addEvent = shadowbox.addEvent,
      makeDom = shadowbox.makeDom,
      makeSwf = shadowbox.makeSwf,
      supportsFlash = shadowbox.supportsFlash;

  // Detect video support, adapted from Modernizr.
  var supportsH264 = false,
      supportsOgg = false,
      supportsWebm = false;

  var video = makeDom("video");
  var canPlay = video.canPlayType && function (type) {
    var able = video.canPlayType(type);
    return able != "" && able != "no";
  };

  if (canPlay) {
    var mp4 = 'video/mp4; codecs="avc1.42E01E';
    supportsH264 = canPlay(mp4 + '"') || canPlay(mp4 + ', mp4a.40.2"');
    supportsOgg = canPlay('video/ogg; codecs="theora"');
    supportsWebm = canPlay('video/webm; codecs="vp8, vorbis"');
  }

  shadowbox.supportsH264 = supportsH264;
  shadowbox.supportsOgg = supportsOgg;
  shadowbox.supportsWebm = supportsWebm;

  /**
   * The URL of the Flowplayer SWF to use for the Flash fallback.
   */
  shadowbox.flowplayerUrl = "http://releases.flowplayer.org/swf/flowplayer-3.2.7.swf";

  /**
   * A map of common video file extensions to the encodings they use.
   */
  shadowbox.videoEncodings = {
    mp4: "h264",
    m4v: "h264",
    ogg: "ogg",
    webm: "webm",
    flv: "flv"
  };

  var extRe = /\.(mp4|m4v|ogg|webm|flv)/i;

  /**
   * Tries to automatically detect the encoding of a video from the file
   * extension it uses.
   */
  shadowbox.detectVideoEncoding = function (url) {
    var match = url.match(extRe);

    if (match)
      return shadowbox.videoEncodings[match[1].toLowerCase()];

    return null;
  };

  shadowbox.VideoPlayer = VideoPlayer;

  /**
   * A player that displays video content using HTML5 <video> with a Flash fallback.
   */
  function VideoPlayer(object, id) {
    this.url = object.url;
    this.width = parseInt(object.width, 10) || 640;
    this.height = parseInt(object.height, 10) || Math.round(this.width * 0.75);
    this.posterUrl = object.posterUrl;
    this.id = id;

    if (object.encodings) {
      this.encodings = object.encodings;
    } else {
      this.encodings = {};
    }

    // Try to automatically detect the video encoding.
    var encoding = shadowbox.detectVideoEncoding(this.url);

    if (!encoding)
      throw new Error("Cannot detect video encoding from URL: " + this.url);

    this.encodings[encoding] = this.url;
  }

  mergeProperties(VideoPlayer.prototype, {

    _createVideo: function (url) {
      var properties = {
        id: this.id,
        src: url,
        preload: "auto",
        autoplay: "autoplay",
        // controls: "controls",
        width: this.width,
        height: this.height
      };

      if (this.posterUrl)
        properties.poster = this.posterUrl;

      this.element = makeDom("video", properties);

      // Working with an HTML5 <video> element.
      mergeProperties(this, videoMethods);
    },

    _createSwf: function (url) {
      var clipProps = [
        '"url":"' + url + '"',
        '"scaling":"fit"',
        '"autoBuffering":true',
        '"autoPlay":true'
      ];

      var clip = "{" + clipProps.join(",") + "}";

      var playlistItems = [];

      if (this.posterUrl)
        playlistItems.push('"' + this.posterUrl + '"');

      playlistItems.push(clip);

      var playlist = "[" + playlistItems.join(",") + "]";

      var configProps = [
        '"playerId":"' + this.id + '"',
        '"clip":{}',
        '"playlist":' + playlist,
        // '"debug":true',

        // Hide Flowplayer's controls, see http://flowplayer.org/forum/2/20734.
        '"play":null',
        '"plugins":{"controls":null}'
      ];

      var config = "{" + configProps.join(",") + "}";
      var apiId = this.id + "_api";

      this.element = makeSwf(shadowbox.flowplayerUrl, {
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
      mergeProperties(this, flashMethods);
    },

    /**
     * Returns true if this player is supported on this browser.
     */
    isSupported: function () {
      return (supportsH264 && this.encodings.h264) ||
             (supportsFlash && (this.encodings.flv || this.encodings.h264)) ||
             (supportsOgg && this.encodings.ogg) ||
             (supportsWebm && this.encodings.webm);
    },

    /**
     * Inserts this object as the only child of the given DOM element.
     */
    injectInto: function (element) {
      if (supportsH264 && this.encodings.h264) {
        this._createVideo(this.encodings.h264);
      } else if (supportsFlash && (this.encodings.flv || this.encodings.h264)) {
        this._createSwf(this.encodings.flv || this.encodings.h264);
      } else if (supportsOgg && this.encodings.ogg) {
        this._createVideo(this.encodings.ogg);
      } else if (supportsWebm && this.encodings.webm) {
        this._createVideo(this.encodings.webm);
      }

      if (!this.element)
        return;

      removeChildren(element);

      // Append the <video>/<object> to the DOM.
      makeDom(element, this.element);

      // The Shadowbox video controls markup:
      //
      // <div id="sb-controls">
      //   <div id="sb-rewind"></div>
      //   <div id="sb-play"></div>
      //   <div id="sb-volume"></div>
      // </div>

      var controls = makeDom("div", { id: "sb-controls" });
      var rewind = makeDom("div", { id: "sb-rewind" });
      var play = makeDom("div", { id: "sb-play" });
      var volume = makeDom("div", { id: "sb-volume" });

      // Append #sb-controls to the DOM.
      makeDom(element, [
        makeDom(controls, [ rewind, play, volume ])
      ]);

      this._controls = controls;

      var self = this;

      addEvent(rewind, "click", function (event) {
        event.stopPropagation();
        self.rewind(30);
      });

      addEvent(play, "click", function (event) {
        event.stopPropagation();
        self.togglePlay();
      });

      addEvent(volume, "click", function (event) {
        event.stopPropagation();
        self.toggleMute();
      });

      this._init();
    },

    /**
     * Removes this object from the DOM.
     */
    remove: function () {
      if (this.element) {
        removeElement(this.element);
        delete this.element;
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

    toggleMute: function () {
      if (this.isMuted()) {
        this.unmute();
      } else {
        this.mute();
      }
    },

    seek: function (time) {
      this._seek(Math.max(Math.min(time, this.length()), 0));
    },

    rewind: function (amount) {
      this.seek(this.time() - amount);
    }

  });

  // Methods for controlling an HTML5 <video> element.
  var videoMethods = {

    _init: function () {
      var self = this;

      addEvent(this.element, "click", function (event) {
        event.stopPropagation();
        self.togglePlay();
      });

      addEvent(this.element, "ended", function () {
        self.pause();
        self.seek(0);
      });

      addEvent(this.element, "play", function () {
        self.showPlaying();
      });

      addEvent(this.element, "pause", function () {
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
      return this.element.duration;
    },

    _time: function () {
      return this.element.currentTime;
    },

    _seek: function (time) {
      this.element.currentTime = time;
    },

    _isPaused: function () {
      return this.element.paused;
    },

    _play: function () {
      return this.element.play();
    },

    _pause: function () {
      return this.element.pause();
    },

    _isMuted: function () {
      return !!this.element.muted;
    },

    _mute: function () {
      this.element.muted = true;
    },

    _unmute: function () {
      this.element.muted = false;
    }

  };

  // Methods for controlling a Flowplayer <object> element.
  var flashMethods = {

    _init: shadowbox.K,

    _length: function () {
      var status = this.element.fp_getStatus();
      return status.bufferEnd;
    },

    _time: function () {
      return this.element.fp_getTime();
    },

    _seek: function (time) {
      this.element.fp_seek(Math.round(time));
    },

    _isPaused: function () {
      return this.element.fp_isPaused();
    },

    _play: function () {
      return this.element.fp_play();
    },

    _pause: function () {
      return this.element.fp_pause();
    },

    _isMuted: function () {
      return this.element.fp_isMuted();
    },

    // The calls to fp_mute, fp_unmute, and fp_setVolume log an error
    // that is uncatchable. However, they still work. :/

    _mute: function () {
      this.element.fp_logging("suppress");
      this.element.fp_mute();
      this.element.fp_logging("error");
    },

    _unmute: function () {
      this.element.fp_logging("suppress");
      this.element.fp_unmute();
      this.element.fp_logging("error");
    },

    _setVolume: function (level) {
      this.element.fp_logging("suppress");
      this.element.fp_setVolume(level);
      this.element.fp_logging("error");
    }

  };

  function addClass(element, className) {
    if (element.className) {
      element.className = element.className + " " + className;
    } else {
      element.className = className;
    }
  }

  function removeClass(element, className) {
    var classRe = new RegExp("\\s*" + className + "\\s*", "g");
    element.className = (element.className || "").replace(classRe, " ");
  }

  // Register the video player for common video extensions.
  shadowbox.registerPlayer(shadowbox.VideoPlayer, [ "mp4", "m4v", "ogg", "webm", "flv" ]);

  // Need to hijack flowplayer.fireEvent because it is the interface that
  // the Flash player uses to send events to the JavaScript.

  function fireEvent(id, name) {
    var player = shadowbox.getPlayer();

    if (player && player.id == id) {
      if (name === "onStart") {
        player._setVolume(100); // Adjust volume to match <video> players.
      } else if (name === "onPause") {
        player.showPaused();
      } else if (name === "onResume") {
        player.showPlaying();
      } else if (name === "onFinish") {
        player.pause();
        player.seek(0);
      }

      return true;
    }
  }

  if (global.flowplayer) {
    var _fireEvent = global.flowplayer.fireEvent;
    global.flowplayer.fireEvent = function () {
      return fireEvent.apply(this, arguments) || _fireEvent.apply(this, arguments);
    };
  } else {
    global.flowplayer = {
      fireEvent: fireEvent
    };
  }

}(this));
