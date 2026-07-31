import { images } from "./assetLoader.js";
import { CONFIG } from "./config.js";

const V = CONFIG.PIPE_VARIANTS;

export class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.BIRD_W;
    this.h = CONFIG.BIRD_H;
    this.vy = 0;
    this.vx = 0;
    this.baseX = x;
    this.rotation = 0;
    this.frameIndex = 0;
    this.animTimer = 0;
  }

  flap() {
    this.vy = CONFIG.FLAP_VELOCITY;
  }

  applyWind(force, dt) {
    const t = dt / 16.67;
    this.vx = Math.max(-CONFIG.WIND.MAX_VX, Math.min(CONFIG.WIND.MAX_VX, this.vx + force * t));
  }

  updateDrift(dt) {
    const t = dt / 16.67;
    this.x += this.vx * t;
    this.vx *= 0.985;
    const min = this.baseX - CONFIG.WIND.DRIFT_MARGIN;
    const max = this.baseX + CONFIG.WIND.DRIFT_MARGIN;
    if (this.x < min) {
      this.x = min;
      this.vx = Math.abs(this.vx) * 0.3;
    } else if (this.x > max) {
      this.x = max;
      this.vx = -Math.abs(this.vx) * 0.3;
    }
  }

  updatePhysics(dt) {
    const t = dt / 16.67;
    this.vy = Math.min(CONFIG.MAX_FALL_SPEED, this.vy + CONFIG.GRAVITY * t);
    this.y += this.vy * t;

    if (this.y < 0) {
      this.y = 0;
      if (this.vy < 0) this.vy = 0;
    }

    const fallRatio = Math.max(0, this.vy / CONFIG.MAX_FALL_SPEED);
    const target = this.vy < 0 ? CONFIG.ROTATE_UP_DEG : fallRatio * CONFIG.ROTATE_DOWN_DEG;
    this.rotation += (target - this.rotation) * Math.min(1, 0.2 * t);
  }

  updateAnim(dt) {
    this.animTimer += dt;
    if (this.animTimer >= CONFIG.WING_FLIP_MS) {
      this.animTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % CONFIG.BIRD_FRAMES.length;
    }
  }

  get imgKey() {
    return CONFIG.BIRD_FRAMES[this.frameIndex];
  }

  draw(ctx) {
    const img = images[this.imgKey];
    if (!img) return;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }
}

export class Pipe {
  constructor(gapTop, gap, oscAmplitude, oscSpeedMult, variant, variantData) {
    this.reset(gapTop, gap, oscAmplitude, oscSpeedMult, variant, variantData);
  }

  reset(gapTop, gap, oscAmplitude, oscSpeedMult, variant = V.NORMAL, variantData = {}) {
    this.x = CONFIG.WIDTH;
    this.baseGapTop = gapTop;
    this.gap = gap;
    this.gapTop = gapTop;
    this.gapBottom = gapTop + gap;
    this.scored = false;
    this.variant = variant;
    this.variantData = variantData;

    this.oscillateAmplitude = oscAmplitude;
    this.oscillatePhase = variantData.phase ?? (Math.random() * Math.PI * 2);

    const baseSpeed =
      CONFIG.PIPE_OSCILLATE_SPEED_MIN +
      Math.random() * (CONFIG.PIPE_OSCILLATE_SPEED_MAX - CONFIG.PIPE_OSCILLATE_SPEED_MIN);

    if (variant === V.ZIGZAG) {
      this.oscillateSpeed = Math.min(baseSpeed * oscSpeedMult * 2.0, 0.0024);
    } else {
      this.oscillateSpeed = baseSpeed * oscSpeedMult;
    }

    return this;
  }

  get topY() {
    return this.gapTop - CONFIG.PIPE_H;
  }

  get visible() {
    return this.x > -CONFIG.PIPE_W && this.x < CONFIG.WIDTH;
  }

  get narrow() {
    return this.variant === V.NORMAL && !!this.variantData.narrow;
  }

  update(dt, speed) {
    this.x -= speed * (dt / 16.67);

    this.oscillatePhase += this.oscillateSpeed * dt;
    const offset = Math.sin(this.oscillatePhase) * this.oscillateAmplitude;

    if (this.variant === V.SINGLE) {
      const S = CONFIG.SINGLE_PIPE;
      const t = Math.max(0, Math.min(1, ((CONFIG.WIDTH - this.x) / CONFIG.WIDTH) * S.RATE));
      const startLen = CONFIG.GROUND_Y * S.START_FRACTION;
      const endLen = CONFIG.GROUND_Y * S.END_FRACTION;
      const len = startLen + t * (endLen - startLen);
      if (this.variantData.side === "top") {
        this.gapTop = len;
        this.gapBottom = Infinity;
      } else {
        this.gapTop = -Infinity;
        this.gapBottom = CONFIG.GROUND_Y - len;
      }
      return;
    }

    if (this.variant === V.DOOR) {
      const X = CONFIG.EXTREME;
      this.variantData.openTime = (this.variantData.openTime || 0) + dt;
      const t = Math.min(1, this.variantData.openTime / X.DOOR_OPEN_MS);
      const currentGap = t * this.variantData.targetGap;
      this.gapTop = this.baseGapTop - currentGap / 2;
      this.gapBottom = this.baseGapTop + currentGap / 2;
      return;
    }

    this.gapTop = this.baseGapTop + offset;
    this.gapBottom = this.gapTop + this.gap;
  }

  collidesWith(bird) {
    const withinX = bird.x + bird.w > this.x && bird.x < this.x + CONFIG.PIPE_W;
    if (!withinX) return false;
    return bird.y < this.gapTop || bird.y + bird.h > this.gapBottom;
  }

  draw(ctx) {
    this._drawPipeImages(ctx);

    if (this.narrow) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 90, 40, 0.85)";
      ctx.fillRect(this.x, this.gapTop - 4, CONFIG.PIPE_W, 4);
      ctx.fillRect(this.x, this.gapBottom, CONFIG.PIPE_W, 4);
      ctx.restore();
    }

    if (this.variant === V.ZIGZAG) {
      ctx.save();
      ctx.fillStyle = "rgba(180, 80, 255, 0.75)";
      ctx.fillRect(this.x, this.gapTop - 4, CONFIG.PIPE_W, 4);
      ctx.fillRect(this.x, this.gapBottom, CONFIG.PIPE_W, 4);
      ctx.restore();
    }

    if (this.variant === V.STAIRCASE) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
      ctx.fillRect(this.x, this.gapTop - 4, CONFIG.PIPE_W, 4);
      ctx.fillRect(this.x, this.gapBottom, CONFIG.PIPE_W, 4);
      ctx.restore();
    }
  }

  _drawPipeImages(ctx) {
    const down = images.pipeDown;
    const up = images.pipeUp;

    if (this.variant === V.SINGLE) {
      if (this.variantData.side === "top") {
        if (down) ctx.drawImage(down, this.x, this.topY, CONFIG.PIPE_W, CONFIG.PIPE_H);
      } else if (up) {
        ctx.drawImage(up, this.x, this.gapBottom, CONFIG.PIPE_W, CONFIG.PIPE_H);
      }
      return;
    }

    if (down) ctx.drawImage(down, this.x, this.topY, CONFIG.PIPE_W, CONFIG.PIPE_H);
    if (up) ctx.drawImage(up, this.x, this.gapBottom, CONFIG.PIPE_W, CONFIG.PIPE_H);
  }
}

export class PipePool {
  constructor() {
    this.free = [];
  }

  acquire(gapTop, gap, oscAmplitude, oscSpeedMult, variant = V.NORMAL, variantData = {}) {
    const pipe = this.free.pop();
    if (pipe) return pipe.reset(gapTop, gap, oscAmplitude, oscSpeedMult, variant, variantData);
    return new Pipe(gapTop, gap, oscAmplitude, oscSpeedMult, variant, variantData);
  }

  release(pipe) {
    this.free.push(pipe);
  }
}

export function randomGapTop(amplitude) {
  const min = CONFIG.PIPE_GAP_MIN_Y + amplitude;
  const max = CONFIG.PIPE_GAP_MAX_Y - amplitude;
  if (min >= max) return (CONFIG.PIPE_GAP_MIN_Y + CONFIG.PIPE_GAP_MAX_Y) / 2;
  return min + Math.random() * (max - min);
}
