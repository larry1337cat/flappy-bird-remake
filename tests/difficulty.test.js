import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDifficulty } from "../src/difficulty.js";
import { CONFIG, MODES } from "../src/config.js";

test("easy mode ignores score entirely", () => {
  const low = computeDifficulty(MODES.EASY, 0);
  const high = computeDifficulty(MODES.EASY, 999);
  assert.deepEqual(low, high);
  assert.equal(low.oscAmplitude, 0);
  assert.equal(low.oscSpeedMult, 0);
  assert.equal(low.speed, CONFIG.PIPE_SPEED);
  assert.equal(low.gap, CONFIG.PIPE_GAP);
});

test("normal mode at score 0 matches base config", () => {
  const d = computeDifficulty(MODES.NORMAL, 0);
  assert.equal(d.speed, CONFIG.PIPE_SPEED);
  assert.equal(d.interval, CONFIG.PIPE_ADD_INTERVAL);
  assert.equal(d.gap, CONFIG.PIPE_GAP);
  assert.equal(d.oscAmplitude, CONFIG.PIPE_OSCILLATE_AMPLITUDE);
  assert.equal(d.oscSpeedMult, 1);
});

test("normal mode ramps up with score", () => {
  const early = computeDifficulty(MODES.NORMAL, 2);
  const later = computeDifficulty(MODES.NORMAL, 10);
  assert.ok(later.speed > early.speed);
  assert.ok(later.interval < early.interval);
  assert.ok(later.gap < early.gap);
  assert.ok(later.oscAmplitude > early.oscAmplitude);
  assert.ok(later.oscSpeedMult > early.oscSpeedMult);
});

test("hard mode shares the same ramp as normal", () => {
  const normal = computeDifficulty(MODES.NORMAL, 7);
  const hard = computeDifficulty(MODES.HARD, 7);
  assert.deepEqual(normal, hard);
});

test("values clamp at configured maximums for very high scores", () => {
  const d = computeDifficulty(MODES.NORMAL, 100000);
  const D = CONFIG.DIFFICULTY;
  assert.equal(d.speed, D.SPEED_MAX);
  assert.equal(d.interval, D.INTERVAL_MIN);
  assert.equal(d.gap, D.GAP_MIN);
  assert.equal(d.oscAmplitude, D.OSC_AMPLITUDE_MAX);
  assert.equal(d.oscSpeedMult, D.OSC_SPEED_MULT_MAX);
});
