import { CONFIG, MODES } from "./config.js";

export function computeDifficulty(mode, score) {
  if (mode === MODES.EASY) {
    return {
      speed: CONFIG.PIPE_SPEED,
      interval: CONFIG.PIPE_ADD_INTERVAL,
      gap: CONFIG.PIPE_GAP,
      oscAmplitude: 0,
      oscSpeedMult: 0,
    };
  }

  if (mode === MODES.EXTREME) {
    const X = CONFIG.EXTREME;
    return {
      speed: Math.min(X.SPEED_MAX, X.SPEED_START + score * X.SPEED_PER_SCORE),
      interval: Math.max(X.INTERVAL_MIN, X.INTERVAL_START - score * X.INTERVAL_PER_SCORE),
      gap: Math.max(X.GAP_MIN, X.GAP_START - score * X.GAP_PER_SCORE),
      oscAmplitude: Math.min(X.OSC_AMPLITUDE_MAX, X.OSC_AMPLITUDE_START + score * X.OSC_AMPLITUDE_PER_SCORE),
      oscSpeedMult: Math.min(X.OSC_SPEED_MULT_MAX, X.OSC_SPEED_MULT_START + score * X.OSC_SPEED_MULT_PER_SCORE),
    };
  }

  const D = CONFIG.DIFFICULTY;
  return {
    speed: Math.min(D.SPEED_MAX, CONFIG.PIPE_SPEED + score * D.SPEED_PER_SCORE),
    interval: Math.max(D.INTERVAL_MIN, CONFIG.PIPE_ADD_INTERVAL - score * D.INTERVAL_PER_SCORE),
    gap: Math.max(D.GAP_MIN, CONFIG.PIPE_GAP - score * D.GAP_PER_SCORE),
    oscAmplitude: Math.min(D.OSC_AMPLITUDE_MAX, CONFIG.PIPE_OSCILLATE_AMPLITUDE + score * D.OSC_AMPLITUDE_PER_SCORE),
    oscSpeedMult: Math.min(D.OSC_SPEED_MULT_MAX, 1 + score * D.OSC_SPEED_MULT_PER_SCORE),
  };
}
