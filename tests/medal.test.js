import { test } from "node:test";
import assert from "node:assert/strict";
import { medalForScore, CONFIG } from "../src/config.js";

test("below bronze threshold gives no medal", () => {
  assert.equal(medalForScore(0), null);
  assert.equal(medalForScore(CONFIG.MEDAL_THRESHOLDS.bronze - 1), null);
});

test("exact thresholds award the matching tier", () => {
  const T = CONFIG.MEDAL_THRESHOLDS;
  assert.equal(medalForScore(T.bronze), "bronze");
  assert.equal(medalForScore(T.silver), "silver");
  assert.equal(medalForScore(T.gold), "gold");
  assert.equal(medalForScore(T.platinum), "platinum");
});

test("one below each threshold falls to the tier below", () => {
  const T = CONFIG.MEDAL_THRESHOLDS;
  assert.equal(medalForScore(T.silver - 1), "bronze");
  assert.equal(medalForScore(T.gold - 1), "silver");
  assert.equal(medalForScore(T.platinum - 1), "gold");
});

test("scores far beyond platinum stay platinum", () => {
  assert.equal(medalForScore(CONFIG.MEDAL_THRESHOLDS.platinum + 500), "platinum");
});
