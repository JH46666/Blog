function throttle(fn, delay) {
  let lastTime = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
