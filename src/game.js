import { CONFIG, MODES, medalForScore } from "./config.js";
import { resolveLang, t as tr, otherLang } from "./i18n.js";
import { computeDifficulty } from "./difficulty.js";
import { haptics } from "./haptics.js";
import { images } from "./assetLoader.js";
import { Input } from "./input.js";
import { loadSave, writeSave } from "./save.js";
import { Bird, PipePool, randomGapTop } from "./entities.js";
import { drawText, drawTextOutlined, drawStar, drawRoundedPanel } from "./ui.js";
import { sound } from "./sound.js";

const V = CONFIG.PIPE_VARIANTS;

const STATE = {
  MENU: "MENU",
  READY: "READY",
  PLAYING: "PLAYING",
  DYING: "DYING",
  GAMEOVER: "GAMEOVER",
};

const WIND_PHASE = {
  REST: "REST",
  WARNING: "WARNING",
  GUST: "GUST",
};

export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
    this.input = new Input(canvas);
    this.save = loadSave();
    this.mode = MODES[this.save.mode] ? this.save.mode : MODES.NORMAL;
    this.lang = resolveLang(this.save.lang);
    sound.setMuted(this.save.muted === true);
    this.menuButtons = this._buildMenuButtons();
    this.changeModeRect = { x: CONFIG.WIDTH / 2 - 100, y: CONFIG.HEIGHT / 2 + 70, w: 200, h: 40 };
    this.langToggleRect = { x: CONFIG.WIDTH - 74, y: 16, w: 58, h: 34 };
    this.muteRect = { x: 16, y: 16, w: 40, h: 40 };
    this.githubRect = { x: CONFIG.WIDTH / 2 - 66, y: 16, w: 132, h: 34 };
    this.medalGradients = new Map();
    this.pressFx = null;
    this.lastTime = performance.now();
    this.skyScrollX = 0;
    this.landScrollX = 0;
    this.pipePool = new PipePool();
    this.pipes = [];
    this._reset();
    this.state = STATE.MENU;
  }

  _buildMenuButtons() {
    const w = 240;
    const h = 54;
    const gap = 12;
    const modes = [MODES.EASY, MODES.NORMAL, MODES.HARD, MODES.EXTREME];
    const totalH = modes.length * h + (modes.length - 1) * gap;
    const startY = CONFIG.HEIGHT / 2 - totalH / 2 + 30;
    const x = CONFIG.WIDTH / 2 - w / 2;
    return modes.map((mode, i) => ({
      mode,
      x,
      y: startY + i * (h + gap),
      w,
      h,
    }));
  }

  _reset() {
    this.bird = new Bird(CONFIG.BIRD_START_X, CONFIG.HEIGHT / 2 - CONFIG.BIRD_H / 2);
    this.pipes.forEach((p) => this.pipePool.release(p));
    this.pipes.length = 0;
    this.pipeTimer = 0;
    this.score = 0;
    this.gameOverTimer = 0;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.popups = [];
    this.medal = null;
    this.isNewBest = false;
    this.lastNarrowScore = -CONFIG.NARROW_PIPE.COOLDOWN_SCORE;
    this.windPhase = WIND_PHASE.REST;
    this.windDirection = 1;
    this.windForce = 0;
    const [gustMin, gustMax] = this._gustIntervalRange();
    this.windTimer = gustMin + Math.random() * (gustMax - gustMin);
    this.windParticleTimer = 0;
    this.windParticles = [];
    this.quakeTimer = CONFIG.EXTREME.QUAKE_INTERVAL_MIN + Math.random() * (CONFIG.EXTREME.QUAKE_INTERVAL_MAX - CONFIG.EXTREME.QUAKE_INTERVAL_MIN);
    this.quakeActive = false;
    this.quakeTime = 0;
    this.fogTimer = CONFIG.EXTREME.FOG_INTERVAL_MIN + Math.random() * (CONFIG.EXTREME.FOG_INTERVAL_MAX - CONFIG.EXTREME.FOG_INTERVAL_MIN);
    this.fogActive = false;
    this.fogTime = 0;
    this.stormTimer = CONFIG.EXTREME.STORM_INTERVAL_MIN + Math.random() * (CONFIG.EXTREME.STORM_INTERVAL_MAX - CONFIG.EXTREME.STORM_INTERVAL_MIN);
    this.stormActive = false;
    this.stormTime = 0;
    this.rainParticles = [];
    this.rainParticleTimer = 0;
    this.lightningTimer = 0;
    this.lightningFlash = 0;
    this.lastVariant = V.NORMAL;
    this.lastSingleSide = "bottom";
    this.variantBag = [];
    this.playTime = 0;
    this.doorSpawned = false;
    this.lastDoorScore = -CONFIG.EXTREME.DOOR_SCORE_COOLDOWN;
    this.lastCloseScore = -CONFIG.EXTREME.CLOSE_SCORE_COOLDOWN;
  }

  _gustIntervalRange() {
    if (this.mode === MODES.EXTREME) return [CONFIG.EXTREME.GUST_INTERVAL_MIN, CONFIG.EXTREME.GUST_INTERVAL_MAX];
    return [CONFIG.WIND.GUST_INTERVAL_MIN, CONFIG.WIND.GUST_INTERVAL_MAX];
  }

  loop = (now) => {
    const dt = Math.min(50, now - this.lastTime);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    switch (this.state) {
      case STATE.MENU:
        this._updateMenu(dt);
        break;
      case STATE.READY:
        this._updateReady(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.DYING:
        this._updateDying(dt);
        break;
      case STATE.GAMEOVER:
        this._updateGameover(dt);
        break;
    }
    this._updatePopups(dt);
  }

  _difficulty() {
    return computeDifficulty(this.mode, this.score);
  }

  _canSpawnNarrow() {
    const N = CONFIG.NARROW_PIPE;
    if (this.mode !== MODES.HARD && this.mode !== MODES.EXTREME) return false;
    if (this.score < N.SCORE_THRESHOLD) return false;
    if (this.score - this.lastNarrowScore < N.COOLDOWN_SCORE) return false;
    return Math.random() < N.CHANCE;
  }

  _pickExtremeVariant() {
    if (this.variantBag.length === 0) {
      const bag = [V.NORMAL, V.STAIRCASE, V.ZIGZAG, V.SINGLE];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag[0] === this.lastVariant) [bag[0], bag[1]] = [bag[1], bag[0]];
      this.variantBag = bag;
    }
    const chosen = this.variantBag.shift();
    this.lastVariant = chosen;
    return chosen;
  }

  _spawnPipe(d) {
    if (this.mode === MODES.EXTREME) {
      this._spawnExtremePipe(d);
      return;
    }
    let gap = d.gap;
    let narrow = false;
    if (this._canSpawnNarrow()) {
      gap = Math.max(60, gap * CONFIG.NARROW_PIPE.GAP_MULT);
      narrow = true;
      this.lastNarrowScore = this.score;
    }
    const gapTop = randomGapTop(d.oscAmplitude);
    const pipe = this.pipePool.acquire(gapTop, gap, d.oscAmplitude, d.oscSpeedMult, V.NORMAL, { narrow });
    this.pipes.push(pipe);
  }

  _spawnExtremePipe(d) {
    if (this._canSpawnDoor()) {
      this.doorSpawned = true;
      this.lastDoorScore = this.score;
      this._spawnDoorPipe(d);
      return;
    }

    if (this._canSpawnClose()) {
      this.lastCloseScore = this.score;
      this._spawnClosePipe(d);
      return;
    }

    const variant = this._pickExtremeVariant();

    if (variant === V.STAIRCASE) {
      const minOverlap = 45;
      const maxStep = Math.max(15, d.gap - minOverlap);
      const stepAmt = Math.min(30 + Math.random() * 30, maxStep);
      const stepDir = Math.random() < 0.5 ? 1 : -1;
      const spacing = CONFIG.PIPE_W + 38;

      const gapTop1 = randomGapTop(d.oscAmplitude);
      const phase1 = Math.random() * Math.PI * 2;

      const gapTop2 = Math.min(
        Math.max(CONFIG.PIPE_GAP_MIN_Y + d.oscAmplitude, gapTop1 + stepDir * stepAmt),
        CONFIG.PIPE_GAP_MAX_Y - d.oscAmplitude
      );
      const phase2 = phase1 + Math.PI * 0.5 * stepDir;

      const p1 = this.pipePool.acquire(gapTop1, d.gap, d.oscAmplitude, d.oscSpeedMult, V.STAIRCASE, { phase: phase1 });
      p1.x = CONFIG.WIDTH;
      this.pipes.push(p1);

      const p2 = this.pipePool.acquire(gapTop2, d.gap, d.oscAmplitude, d.oscSpeedMult, V.STAIRCASE, { phase: phase2 });
      p2.x = CONFIG.WIDTH + spacing;
      this.pipes.push(p2);
      return;
    }

    if (variant === V.SINGLE) {
      this._spawnSinglePipe();
      return;
    }

    let gap = d.gap;
    let narrow = false;
    if (variant === V.NORMAL && this._canSpawnNarrow()) {
      gap = Math.max(60, gap * CONFIG.NARROW_PIPE.GAP_MULT);
      narrow = true;
      this.lastNarrowScore = this.score;
    }
    const gapTop = randomGapTop(d.oscAmplitude);
    const pipe = this.pipePool.acquire(gapTop, gap, d.oscAmplitude, d.oscSpeedMult, variant, { narrow });
    this.pipes.push(pipe);
  }

  _canSpawnDoor() {
    const X = CONFIG.EXTREME;
    if (!this.doorSpawned) return this.playTime <= X.DOOR_WINDOW_MS;
    if (this.score - this.lastDoorScore < X.DOOR_SCORE_COOLDOWN) return false;
    return Math.random() < X.DOOR_CHANCE;
  }

  _canSpawnClose() {
    const X = CONFIG.EXTREME;
    if (this.playTime <= X.DOOR_WINDOW_MS) return false;
    if (this.score - this.lastCloseScore < X.CLOSE_SCORE_COOLDOWN) return false;
    return Math.random() < X.CLOSE_CHANCE;
  }

  _spawnDoorPipe(d) {
    const gapTop = randomGapTop(0);
    const centerY = gapTop + d.gap / 2;
    const pipe = this.pipePool.acquire(centerY, 0, 0, 0, V.DOOR, { targetGap: d.gap, openTime: 0 });
    this.pipes.push(pipe);
  }

  _spawnClosePipe(d) {
    const X = CONFIG.EXTREME;
    const gapTop = randomGapTop(0);
    const centerY = gapTop + d.gap / 2;
    const ratio = X.CLOSE_MIN_RATIO_MIN + Math.random() * (X.CLOSE_MIN_RATIO_MAX - X.CLOSE_MIN_RATIO_MIN);
    const minGap = d.gap * ratio;
    const pipe = this.pipePool.acquire(centerY, d.gap, 0, 0, V.CLOSE, { targetGap: d.gap, minGap, closeTime: 0 });
    this.pipes.push(pipe);
  }

  _spawnSinglePipe() {
    const side = this.lastSingleSide === "top" ? "bottom" : "top";
    this.lastSingleSide = side;
    const pipe = this.pipePool.acquire(0, 0, 0, 0, V.SINGLE, { side });
    this.pipes.push(pipe);
  }

  _updateWind(dt) {
    const W = CONFIG.WIND;
    this.windTimer -= dt;

    if (this.windPhase === WIND_PHASE.GUST) {
      this.bird.applyWind(this.windForce, dt);
      this._spawnWindParticles(dt);
    }

    if (this.windTimer > 0) return;

    if (this.windPhase === WIND_PHASE.REST) {
      this.windPhase = WIND_PHASE.WARNING;
      this.windDirection = Math.random() < 0.5 ? -1 : 1;
      this.windForce = (W.FORCE_MIN + Math.random() * (W.FORCE_MAX - W.FORCE_MIN)) * this.windDirection;
      this.windTimer = W.WARNING_MS;
    } else if (this.windPhase === WIND_PHASE.WARNING) {
      this.windPhase = WIND_PHASE.GUST;
      this.windTimer = W.GUST_DURATION_MIN + Math.random() * (W.GUST_DURATION_MAX - W.GUST_DURATION_MIN);
      haptics.gust();
    } else {
      this.windPhase = WIND_PHASE.REST;
      const [gustMin, gustMax] = this._gustIntervalRange();
      this.windTimer = gustMin + Math.random() * (gustMax - gustMin);
    }
  }

  _spawnWindParticles(dt) {
    this.windParticleTimer -= dt;
    if (this.windParticleTimer > 0) return;
    this.windParticleTimer = 90;
    for (let i = 0; i < CONFIG.WIND.PARTICLE_COUNT; i++) {
      this.windParticles.push({
        x: this.windDirection > 0 ? -10 : CONFIG.WIDTH + 10,
        y: 20 + Math.random() * (CONFIG.HEIGHT * 0.7),
        len: 14 + Math.random() * 18,
        speed: (3 + Math.random() * 2) * this.windDirection,
      });
    }
  }

  _updateWindParticles(dt) {
    const t = dt / 16.67;
    for (let i = this.windParticles.length - 1; i >= 0; i--) {
      const p = this.windParticles[i];
      p.x += p.speed * t;
      if (p.x < -40 || p.x > CONFIG.WIDTH + 40) this.windParticles.splice(i, 1);
    }
  }

  _updateQuake(dt) {
    const X = CONFIG.EXTREME;
    if (this.quakeActive) {
      this.quakeTime -= dt;
      if (this.quakeTime <= 0) {
        this.quakeActive = false;
        this.quakeTimer = X.QUAKE_INTERVAL_MIN + Math.random() * (X.QUAKE_INTERVAL_MAX - X.QUAKE_INTERVAL_MIN);
      }
      return;
    }
    this.quakeTimer -= dt;
    if (this.quakeTimer <= 0) {
      this.quakeActive = true;
      this.quakeTime = X.QUAKE_DURATION;
      this.shakeTime = X.QUAKE_DURATION;
      this.shakeMagnitude = X.QUAKE_MAGNITUDE;
    }
  }

  _updateFog(dt) {
    const X = CONFIG.EXTREME;
    if (this.fogActive) {
      this.fogTime -= dt;
      if (this.fogTime <= 0) {
        this.fogActive = false;
        this.fogTimer = X.FOG_INTERVAL_MIN + Math.random() * (X.FOG_INTERVAL_MAX - X.FOG_INTERVAL_MIN);
      }
      return;
    }
    this.fogTimer -= dt;
    if (this.fogTimer <= 0) {
      this.fogActive = true;
      this.fogTime = X.FOG_DURATION;
    }
  }

  _updateStorm(dt) {
    const X = CONFIG.EXTREME;
    if (this.stormActive) {
      this.stormTime -= dt;
      if (this.stormTime <= 0) {
        this.stormActive = false;
        this.stormTimer = X.STORM_INTERVAL_MIN + Math.random() * (X.STORM_INTERVAL_MAX - X.STORM_INTERVAL_MIN);
      }
      return;
    }
    this.stormTimer -= dt;
    if (this.stormTimer <= 0) {
      this.stormActive = true;
      this.stormTime = X.STORM_DURATION;
      this.lightningTimer = 0;
      if (!this.quakeActive) this.quakeTimer = Math.min(this.quakeTimer, X.STORM_SYNC_MS);
      if (!this.fogActive) this.fogTimer = Math.min(this.fogTimer, X.STORM_SYNC_MS);
      if (this.windPhase === WIND_PHASE.REST) this.windTimer = Math.min(this.windTimer, X.STORM_SYNC_MS);
    }
  }

  _spawnRain(dt) {
    const X = CONFIG.EXTREME;
    this.rainParticleTimer -= dt;
    if (this.rainParticleTimer > 0) return;
    this.rainParticleTimer = X.RAIN_SPAWN_MS;
    for (let i = 0; i < X.RAIN_PARTICLE_COUNT; i++) {
      this.rainParticles.push({
        x: Math.random() * CONFIG.WIDTH,
        y: -10,
        len: 10 + Math.random() * 12,
        speed: 7 + Math.random() * 3,
        drift: (this.windDirection || 1) * (0.6 + Math.random() * 0.8),
      });
    }
  }

  _updateRain(dt) {
    const t = dt / 16.67;
    if (this.stormActive) this._spawnRain(dt);
    for (let i = this.rainParticles.length - 1; i >= 0; i--) {
      const p = this.rainParticles[i];
      p.y += p.speed * t;
      p.x += p.drift * t;
      if (p.y > CONFIG.HEIGHT) this.rainParticles.splice(i, 1);
    }
  }

  _updateLightning(dt) {
    const X = CONFIG.EXTREME;
    if (this.lightningFlash > 0) this.lightningFlash = Math.max(0, this.lightningFlash - dt);
    if (!this.stormActive) return;
    this.lightningTimer -= dt;
    if (this.lightningTimer > 0) return;
    this.lightningTimer = X.LIGHTNING_MIN_MS + Math.random() * (X.LIGHTNING_MAX_MS - X.LIGHTNING_MIN_MS);
    if (Math.random() < X.LIGHTNING_CHANCE) this.lightningFlash = X.LIGHTNING_FLASH_MS;
  }

  _scrollBackdrop(dt) {
    const t = dt / 16.67;
    this.skyScrollX = (this.skyScrollX + CONFIG.SKY_SPEED * t) % CONFIG.SKY_W;
    this.landScrollX = (this.landScrollX + CONFIG.LAND_SPEED * t) % CONFIG.LAND_W;
  }

  _hitButton(rect, p) {
    return !!p && p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
  }

  _consumeMuteTap() {
    if (!this.input.flapQueued) return false;
    if (!this._hitButton(this.muteRect, this.input.pointer)) return false;
    this.input.consumeFlap();
    this._toggleMute();
    return true;
  }

  _toggleMute() {
    sound.unlock();
    const muted = sound.toggleMute();
    this.save.muted = muted;
    writeSave(this.save);
    this.pressFx = { rect: this.muteRect, time: this.lastTime };
  }

  _updateMenu(dt) {
    this._scrollBackdrop(dt);
    this.bird.updateAnim(dt);
    if (this._consumeMuteTap()) return;
    if (this.input.consumeFlap()) {
      const p = this.input.pointer;

      if (this._hitButton(this.langToggleRect, p)) {
        sound.unlock();
        this.pressFx = { rect: this.langToggleRect, time: this.lastTime };
        this.lang = otherLang(this.lang);
        this.save.lang = this.lang;
        writeSave(this.save);
        return;
      }

      if (this._hitButton(this.githubRect, p)) {
        this.pressFx = { rect: this.githubRect, time: this.lastTime };
        window.open(CONFIG.SOURCE_REPO_URL, "_blank", "noopener,noreferrer");
        return;
      }

      const hit = this.menuButtons.find((b) => this._hitButton(b, p));
      if (hit) {
        sound.unlock();
        this.pressFx = { rect: hit, time: this.lastTime };
        this.mode = hit.mode;
        this.save.mode = hit.mode;
        writeSave(this.save);
        this.state = STATE.READY;
      }
    }
  }

  _updateReady(dt) {
    this._scrollBackdrop(dt);
    this.bird.updateAnim(dt);
    if (this._consumeMuteTap()) return;
    if (this.input.consumeFlap()) {
      if (this._hitButton(this.changeModeRect, this.input.pointer)) {
        this.pressFx = { rect: this.changeModeRect, time: this.lastTime };
        this.state = STATE.MENU;
        return;
      }
      sound.unlock();
      sound.flap();
      this.state = STATE.PLAYING;
      this.bird.flap();
      this._spawnPipe(this._difficulty());
      this.pipeTimer = 0;
    }
  }

  _updatePlaying(dt) {
    this._scrollBackdrop(dt);
    this.playTime += dt;

    if (this._consumeMuteTap()) return;
    if (this.input.consumeFlap()) {
      this.bird.flap();
      sound.flap();
    }
    this.bird.updatePhysics(dt);
    this.bird.updateAnim(dt);

    if (this.mode === MODES.HARD || this.mode === MODES.EXTREME) this._updateWind(dt);
    if (this.mode === MODES.EXTREME) {
      this._updateQuake(dt);
      this._updateFog(dt);
      this._updateStorm(dt);
      this._updateLightning(dt);
    }
    this.bird.updateDrift(dt);
    this._updateWindParticles(dt);
    this._updateRain(dt);

    const d = this._difficulty();

    this.pipeTimer += dt;
    if (this.pipeTimer >= d.interval) {
      this.pipeTimer = 0;
      this._spawnPipe(d);
    }

    let hitPipe = false;
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.update(dt, d.speed);

      if (!p.visible) {
        this.pipePool.release(p);
        this.pipes.splice(i, 1);
        continue;
      }

      if (p.x + CONFIG.PIPE_W < this.bird.x && !p.scored) {
        p.scored = true;
        this.score++;
        sound.score();
        this._spawnPopup("+1", this.bird.x, this.bird.y);
      }

      if (!hitPipe && p.collidesWith(this.bird)) hitPipe = true;
    }

    const hitGround = this.bird.y + this.bird.h >= CONFIG.GROUND_Y;
    if (hitGround) {
      this.bird.y = CONFIG.GROUND_Y - this.bird.h;
      this._triggerShake();
      sound.hit();
      haptics.hit();
      this._enterGameOver();
    } else if (hitPipe) {
      this._triggerShake();
      sound.hit();
      haptics.hit();
      this.state = STATE.DYING;
    }
  }

  _updateDying(dt) {
    this.bird.updatePhysics(dt);
    if (this.bird.y + this.bird.h >= CONFIG.GROUND_Y) {
      this.bird.y = CONFIG.GROUND_Y - this.bird.h;
      this._enterGameOver();
    }
  }

  _enterGameOver() {
    const prevBest = this.save.bestByMode[this.mode];
    this.isNewBest = this.score > prevBest;
    if (this.isNewBest) {
      this.save.bestByMode[this.mode] = this.score;
      writeSave(this.save);
      if (this.score > 0) haptics.newBest();
    }
    this.medal = medalForScore(this.score);
    this.state = STATE.GAMEOVER;
    this.gameOverTimer = 0;
  }

  _updateGameover(dt) {
    this.gameOverTimer += dt;
    if (this._consumeMuteTap()) return;
    if (this.gameOverTimer >= CONFIG.RESTART_DELAY && this.input.consumeFlap()) {
      this._reset();
      this.state = STATE.READY;
    }
  }

  _triggerShake() {
    this.shakeTime = 220;
    this.shakeMagnitude = 6;
  }

  _spawnPopup(text, x, y) {
    this.popups.push({ text, x, y, life: 550, maxLife: 550, vy: -0.045 });
  }

  _updatePopups(dt) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakeTime > 0) {
      const dx = (Math.random() * 2 - 1) * this.shakeMagnitude;
      const dy = (Math.random() * 2 - 1) * this.shakeMagnitude;
      ctx.translate(dx, dy);
    }
    this._drawScene();
    ctx.restore();
    this._drawLightningFlash(ctx);
    if (this.state === STATE.MENU) this._drawMenu();
    if (this.state === STATE.READY) this._drawReady();
    if (this.state === STATE.GAMEOVER) this._drawGameover();
    this._drawMuteButton();
  }

  _drawLightningFlash(ctx) {
    if (this.lightningFlash <= 0) return;
    const alpha = (this.lightningFlash / CONFIG.EXTREME.LIGHTNING_FLASH_MS) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.restore();
  }

  _drawDim(alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.restore();
  }

  _pressScale(rect) {
    if (!this.pressFx || this.pressFx.rect !== rect) return 1;
    const elapsed = this.lastTime - this.pressFx.time;
    if (elapsed < 0 || elapsed > 140) return 1;
    const t = elapsed / 140;
    return 1 - Math.sin(t * Math.PI) * 0.06;
  }

  _drawButton(rect, label, active) {
    const ctx = this.ctx;
    const scale = this._pressScale(rect);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    drawRoundedPanel(
      ctx,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      12,
      active ? "rgba(255,224,102,0.92)" : "rgba(0,0,0,0.4)",
      active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
      active ? 3 : 2
    );

    drawText(ctx, label, cx, cy, { size: 18, color: active ? "#3a2a00" : "#fff" });

    if (active) {
      drawText(ctx, "✓", rect.x + rect.w - 18, rect.y + 16, { size: 16, color: "#3a2a00" });
    }

    ctx.restore();
  }

  _drawLangToggle() {
    const ctx = this.ctx;
    const rect = this.langToggleRect;
    const scale = this._pressScale(rect);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    drawRoundedPanel(ctx, rect.x, rect.y, rect.w, rect.h, 8, "rgba(0,0,0,0.4)", "rgba(255,255,255,0.7)", 2);
    drawText(ctx, tr(this.lang).otherLangLabel, cx, cy, { size: 13, color: "#fff" });
    ctx.restore();
  }

  _drawExternalLinkIcon(cx, cy, s) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.2);
    ctx.lineTo(-s, s);
    ctx.lineTo(s * 0.2, s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s);
    ctx.lineTo(s, -s);
    ctx.lineTo(s, s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.3);
    ctx.lineTo(s * 0.7, -s * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  _drawGithubBadge() {
    const ctx = this.ctx;
    const rect = this.githubRect;
    const scale = this._pressScale(rect);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    drawRoundedPanel(ctx, rect.x, rect.y, rect.w, rect.h, 8, "rgba(0,0,0,0.4)", "rgba(255,255,255,0.7)", 2);
    this._drawExternalLinkIcon(rect.x + 20, cy, 7);
    drawText(ctx, CONFIG.SOURCE_AUTHOR, rect.x + 36, cy, { size: 13, color: "#fff", align: "left" });
    ctx.restore();
  }

  _drawMuteButton() {
    const ctx = this.ctx;
    const rect = this.muteRect;
    const scale = this._pressScale(rect);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    drawRoundedPanel(ctx, rect.x, rect.y, rect.w, rect.h, 8, "rgba(0,0,0,0.4)", "rgba(255,255,255,0.7)", 2);
    this._drawSpeakerIcon(cx, cy, sound.muted);
    ctx.restore();
  }

  _drawSpeakerIcon(cx, cy, muted) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(-3, -4);
    ctx.lineTo(4, -10);
    ctx.lineTo(4, 10);
    ctx.lineTo(-3, 4);
    ctx.lineTo(-9, 4);
    ctx.closePath();
    ctx.fill();

    if (muted) {
      ctx.beginPath();
      ctx.moveTo(7, -6);
      ctx.lineTo(14, 6);
      ctx.moveTo(14, -6);
      ctx.lineTo(7, 6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(3, 0, 6, -0.75, 0.75);
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(3, 0, 10, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawMenu() {
    const ctx = this.ctx;
    const strings = tr(this.lang);
    this._drawDim(0.45);
    drawTextOutlined(ctx, strings.chooseDifficulty, CONFIG.WIDTH / 2, this.menuButtons[0].y - 40, { size: 22 });
    this.menuButtons.forEach((b) => this._drawButton(b, strings.modeLabels[b.mode], this.mode === b.mode));
    this._drawLangToggle();
    this._drawGithubBadge();
  }

  _drawTiled(img, w, h, scrollX, y) {
    const ctx = this.ctx;
    let x = -(scrollX % w);
    if (x > 0) x -= w;
    for (; x < CONFIG.WIDTH; x += w) {
      ctx.drawImage(img, x, y, w, h);
    }
  }

  _drawScene() {
    const ctx = this.ctx;
    ctx.fillStyle = "#4ec0ca";
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    if (images.sky) this._drawTiled(images.sky, CONFIG.SKY_W, CONFIG.SKY_H, this.skyScrollX, CONFIG.HEIGHT - CONFIG.LAND_H - CONFIG.SKY_H);

    this.pipes.forEach((p) => p.draw(ctx));

    if (images.land) this._drawTiled(images.land, CONFIG.LAND_W, CONFIG.LAND_H, this.landScrollX, CONFIG.GROUND_Y);
    else {
      ctx.fillStyle = "#ded895";
      ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.WIDTH, CONFIG.LAND_H);
    }

    this._drawFog(ctx);
    this._drawRain(ctx);

    this.bird.draw(ctx);
    this._drawPopups(ctx);
    this._drawWind(ctx);
    this._drawFogIndicator(ctx);

    if (this.state === STATE.PLAYING || this.state === STATE.DYING) {
      drawTextOutlined(ctx, String(this.score), CONFIG.WIDTH / 2, 60, { size: 40 });
    }
  }

  _drawFog(ctx) {
    if (this.mode !== MODES.EXTREME || !this.fogActive) return;
    const X = CONFIG.EXTREME;
    const progress = 1 - this.fogTime / X.FOG_DURATION;
    const alpha = Math.sin(progress * Math.PI) * X.FOG_MAX_ALPHA;
    ctx.save();
    ctx.fillStyle = `rgba(225,235,240,${alpha})`;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.restore();
  }

  _drawRain(ctx) {
    if (this.rainParticles.length === 0) return;
    ctx.save();
    ctx.strokeStyle = "rgba(180,210,255,0.5)";
    ctx.lineWidth = 2;
    this.rainParticles.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.drift * 2, p.y - p.len);
      ctx.stroke();
    });
    ctx.restore();
  }

  _drawFogIndicator(ctx) {
    if (this.mode !== MODES.EXTREME || !this.fogActive) return;
    const X = CONFIG.EXTREME;
    const progress = 1 - this.fogTime / X.FOG_DURATION;
    const alpha = Math.sin(progress * Math.PI);
    const x = CONFIG.WIDTH - 50;
    const y = 66;

    ctx.save();
    ctx.globalAlpha = 0.85 * alpha;
    ctx.strokeStyle = "#ffe066";
    ctx.lineWidth = 3;
    ctx.translate(x, y);
    [-10, 0, 10].forEach((dy) => {
      ctx.beginPath();
      ctx.moveTo(-26, dy);
      ctx.lineTo(26, dy);
      ctx.stroke();
    });
    ctx.restore();

    drawTextOutlined(ctx, tr(this.lang).fog, x, y + 24, { size: 13, color: "#ffe066" });
  }

  _drawWind(ctx) {
    if (this.mode !== MODES.HARD && this.mode !== MODES.EXTREME) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    this.windParticles.forEach((p) => {
      const dir = p.speed >= 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len * dir, p.y);
      ctx.stroke();
    });
    ctx.restore();

    if (this.windPhase === WIND_PHASE.REST) return;

    const isWarning = this.windPhase === WIND_PHASE.WARNING;
    const mag = Math.min(1, Math.abs(this.windForce) / CONFIG.WIND.FORCE_MAX);
    const arrowX = CONFIG.WIDTH - 50;
    const arrowY = 26;
    const len = 18 + mag * 22;
    const warnAlpha = isWarning ? 0.25 + 0.55 * (1 - Math.max(0, this.windTimer) / CONFIG.WIND.WARNING_MS) : 0.85;

    ctx.save();
    ctx.globalAlpha = warnAlpha;
    ctx.fillStyle = isWarning ? "rgba(255,224,102,0.15)" : "#ffe066";
    ctx.strokeStyle = isWarning ? "#ffe066" : "#000";
    ctx.lineWidth = isWarning ? 2 : 3;
    ctx.translate(arrowX, arrowY);
    ctx.scale(this.windDirection, 1);
    ctx.beginPath();
    ctx.moveTo(-len, -6);
    ctx.lineTo(len - 10, -6);
    ctx.lineTo(len - 10, -14);
    ctx.lineTo(len + 6, 0);
    ctx.lineTo(len - 10, 14);
    ctx.lineTo(len - 10, 6);
    ctx.lineTo(-len, 6);
    ctx.closePath();
    if (!isWarning) ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawTextOutlined(ctx, tr(this.lang).wind, arrowX, arrowY + 24, { size: 13, color: "#ffe066" });
  }

  _drawPopups(ctx) {
    this.popups.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawTextOutlined(ctx, p.text, p.x, p.y, { size: 18, color: "#ffe066" });
      ctx.restore();
    });
  }

  _drawReady() {
    const ctx = this.ctx;
    const strings = tr(this.lang);
    drawTextOutlined(ctx, strings.tapToStartLine1, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 20, { size: 20 });
    drawTextOutlined(ctx, strings.tapToStartLine2, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 10, { size: 20 });
    const best = this.save.bestByMode[this.mode];
    if (best > 0) {
      drawTextOutlined(ctx, `${strings.best}: ${best}`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 44, { size: 16 });
    }
    this._drawButton(this.changeModeRect, `${strings.difficulty}: ${strings.modeLabels[this.mode]}`, false);
  }

  _getMedalGradient(tier, r) {
    let grad = this.medalGradients.get(tier);
    if (grad) return grad;
    const palette = CONFIG.MEDAL_PALETTE[tier];
    grad = this.ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, palette.hi);
    grad.addColorStop(1, palette.lo);
    this.medalGradients.set(tier, grad);
    return grad;
  }

  _drawMedal(ctx, cx, cy, r, tier) {
    const palette = CONFIG.MEDAL_PALETTE[tier];
    ctx.save();
    ctx.translate(cx, cy);

    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = this._getMedalGradient(tier, r);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.ring;
    ctx.stroke();

    ctx.fillStyle = palette.ring;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.fill();

    drawStar(ctx, 0, 0, r * 0.36, r * 0.16, 5, palette.hi);
    ctx.restore();

    drawText(ctx, tr(this.lang).medalLabels[tier], cx, cy + r + 16, { size: 13, color: "#5b4632" });
  }

  _drawGameover() {
    const ctx = this.ctx;
    this._drawDim(0.35);

    const boardX = CONFIG.WIDTH / 2 - CONFIG.SCOREBOARD_W / 2;
    const boardY = CONFIG.HEIGHT / 2 - CONFIG.SCOREBOARD_H / 2;
    const boardCx = boardX + CONFIG.SCOREBOARD_W / 2;
    const boardCy = boardY + CONFIG.SCOREBOARD_H / 2;

    const t = Math.min(1, this.gameOverTimer / 260);
    const ease = 1 - Math.pow(1 - t, 3);
    const scale = 0.85 + 0.15 * ease;

    ctx.save();
    ctx.globalAlpha = ease;
    ctx.translate(boardCx, boardCy);
    ctx.scale(scale, scale);
    ctx.translate(-boardCx, -boardCy);

    if (images.scoreboard) {
      ctx.drawImage(images.scoreboard, boardX, boardY, CONFIG.SCOREBOARD_W, CONFIG.SCOREBOARD_H);
    }

    if (this.medal) {
      this._drawMedal(ctx, boardX + CONFIG.SCOREBOARD_W * 0.27, boardY + CONFIG.SCOREBOARD_H * 0.47, CONFIG.SCOREBOARD_W * 0.15, this.medal);
    }

    const valueX = boardX + CONFIG.SCOREBOARD_W * 0.814;
    drawText(ctx, String(this.score), valueX, boardY + CONFIG.SCOREBOARD_H * 0.407, { size: 20, color: "#5b4632" });
    drawText(ctx, String(this.save.bestByMode[this.mode]), valueX, boardY + CONFIG.SCOREBOARD_H * 0.575, { size: 20, color: "#5b4632" });

    if (this.isNewBest && this.score > 0) {
      drawTextOutlined(ctx, tr(this.lang).newBest, boardCx, boardY - 20, { size: 18, color: "#ffe066" });
    }
    ctx.restore();

    drawText(ctx, tr(this.lang).tapToRestart, CONFIG.WIDTH / 2, boardY + CONFIG.SCOREBOARD_H + 34, { size: 16, color: "#fff" });
  }
}
