(function() {

  var Ap = Array.prototype;
  var slice = Ap.slice;
  var Fp = Function.prototype;

  if (!Fp.bind) {
    // PhantomJS doesn't support Function.prototype.bind natively, so
    // polyfill it whenever this module is required.
    Fp.bind = function(context) {
      var func = this;
      var args = slice.call(arguments, 1);

      function bound() {
        var invokedAsConstructor = func.prototype && (this instanceof func);
        return func.apply(
          // Ignore the context parameter when invoking the bound function
          // as a constructor. Note that this includes not only constructor
          // invocations using the new keyword but also calls to base class
          // constructors such as BaseClass.call(this, ...) or super(...).
          !invokedAsConstructor && context || this,
          args.concat(slice.call(arguments))
        );
      }

      // The bound function must share the .prototype of the unbound
      // function so that any object created by one constructor will count
      // as an instance of both constructors.
      bound.prototype = func.prototype;

      return bound;
    };
  }

})();

(function() {

  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                 || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

}());