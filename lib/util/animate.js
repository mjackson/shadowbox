/**
 * Animates from one numeric value to another over the given duration,
 * calling the given callback for each frame with the eased value. Return
 * false from the callback at any time to cancel the animation.
 */
function animate(from, to, duration, ease, callback) {
  const delta = to - from;

  if (delta === 0 || duration === 0) {
    callback(to);
    return; // Don't animate!
  }

  // Convert duration to milliseconds.
  duration = (duration || 0.35) * 1000;

  const begin = new Date().getTime();
  const end = begin + duration;
  let time, timer;

  timer = setInterval(() => {
    time = new Date().getTime();
    if (time >= end) {
      clearInterval(timer);
      timer = null;
      callback(to);
    } else if (callback(from + ease((time - begin) / duration) * delta) === false) {
      clearInterval(timer);
      timer = null;
    }
  }, 10); // 10 ms interval is minimum on WebKit.
}

module.exports = animate;
