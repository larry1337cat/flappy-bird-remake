class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.muted = false;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _ensureCtx() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      this.enabled = false;
      return null;
    }
    this.ctx = new Ctx();
    return this.ctx;
  }

  unlock() {
    const ctx = this._ensureCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  _tone(freq, duration, type, peakGain) {
    if (!this.enabled || this.muted) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  flap() {
    this._tone(520, 0.09, "square", 0.15);
  }

  score() {
    this._tone(784, 0.08, "square", 0.14);
    if (!this.enabled || this.muted) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    setTimeout(() => this._tone(988, 0.1, "square", 0.14), 60);
  }

  hit() {
    this._tone(120, 0.25, "sawtooth", 0.2);
  }
}

export const sound = new SoundEngine();
