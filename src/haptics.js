class Haptics {
  constructor() {
    this.supported = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }

  _fire(pattern) {
    if (!this.supported) return;
    navigator.vibrate(pattern);
  }

  hit() {
    this._fire([35, 30, 45]);
  }

  gust() {
    this._fire(12);
  }

  newBest() {
    this._fire([15, 40, 15, 40, 15]);
  }
}

export const haptics = new Haptics();
