const AUDIO_SOURCES = {
  wing: ["audio/wing.ogg", "audio/wing.wav"],
  point: ["audio/point.ogg", "audio/point.wav"],
  hit: ["audio/hit.ogg", "audio/hit.wav"],
  die: ["audio/die.ogg", "audio/die.wav"],
  swoosh: ["audio/swoosh.ogg", "audio/swoosh.wav"],
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.muted = false;
    this.buffers = {};
    this.ready = this._loadAll();
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

  async _loadAll() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    await Promise.all(Object.entries(AUDIO_SOURCES).map(([key, srcs]) => this._loadOne(ctx, key, srcs)));
  }

  async _loadOne(ctx, key, srcs) {
    for (const src of srcs) {
      try {
        const res = await fetch("assets/" + src);
        const data = await res.arrayBuffer();
        this.buffers[key] = await ctx.decodeAudioData(data);
        return;
      } catch (err) {
        continue;
      }
    }
    console.warn("Khong tai duoc am thanh:", key);
  }

  _play(key) {
    if (!this.enabled || this.muted) return;
    const ctx = this._ensureCtx();
    const buffer = this.buffers[key];
    if (!ctx || !buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }

  flap() {
    this._play("wing");
  }

  score() {
    this._play("point");
  }

  hit() {
    this._play("hit");
  }

  die() {
    this._play("die");
  }

  swoosh() {
    this._play("swoosh");
  }
}

export const sound = new SoundEngine();
