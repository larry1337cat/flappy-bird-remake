export const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  SAVE_KEY: "flappybird_save_v2",

  SKY_W: 359,
  SKY_H: 142,
  SKY_SPEED: 0.5,

  LAND_W: 437,
  LAND_H: 146,
  LAND_SPEED: 2.4,

  BIRD_W: 44,
  BIRD_H: 31,
  BIRD_START_X: 70,
  GRAVITY: 0.32,
  FLAP_VELOCITY: -6.4,
  MAX_FALL_SPEED: 8,
  ROTATE_UP_DEG: -20,
  ROTATE_DOWN_DEG: 90,
  WING_FLIP_MS: 90,
  BIRD_FRAMES: ["bird1", "bird2", "bird3", "bird2"],

  PIPE_W: 65,
  PIPE_H: 344,
  PIPE_SPEED: 2.4,
  PIPE_ADD_INTERVAL: 1600,
  PIPE_GAP: 150,
  PIPE_GAP_MIN_Y: 160,
  PIPE_GAP_MAX_Y: 320,
  PIPE_OSCILLATE_AMPLITUDE: 28,
  PIPE_OSCILLATE_SPEED_MIN: 0.0009,
  PIPE_OSCILLATE_SPEED_MAX: 0.0017,

  DIFFICULTY: {
    SPEED_MAX: 4.2,
    SPEED_PER_SCORE: 0.05,
    INTERVAL_MIN: 1000,
    INTERVAL_PER_SCORE: 15,
    GAP_MIN: 126,
    GAP_PER_SCORE: 0.9,
    OSC_AMPLITUDE_MAX: 46,
    OSC_AMPLITUDE_PER_SCORE: 0.6,
    OSC_SPEED_MULT_MAX: 1.9,
    OSC_SPEED_MULT_PER_SCORE: 0.025,
  },

  WIND: {
    GUST_INTERVAL_MIN: 2400,
    GUST_INTERVAL_MAX: 4200,
    GUST_DURATION_MIN: 900,
    GUST_DURATION_MAX: 1900,
    WARNING_MS: 300,
    FORCE_MIN: 0.016,
    FORCE_MAX: 0.05,
    MAX_VX: 2.6,
    DRIFT_MARGIN: 26,
    PARTICLE_COUNT: 3,
  },

  NARROW_PIPE: {
    SCORE_THRESHOLD: 4,
    COOLDOWN_SCORE: 3,
    CHANCE: 0.3,
    GAP_MULT: 0.66,
  },

  EXTREME: {
    SPEED_START: 3.8,
    SPEED_MAX: 5.8,
    SPEED_PER_SCORE: 0.08,
    INTERVAL_START: 1100,
    INTERVAL_MIN: 700,
    INTERVAL_PER_SCORE: 12,
    GAP_START: 138,
    GAP_MIN: 116,
    GAP_PER_SCORE: 0.75,
    OSC_AMPLITUDE_START: 34,
    OSC_AMPLITUDE_MAX: 55,
    OSC_AMPLITUDE_PER_SCORE: 0.7,
    OSC_SPEED_MULT_START: 1.4,
    OSC_SPEED_MULT_MAX: 2.2,
    OSC_SPEED_MULT_PER_SCORE: 0.03,
    QUAKE_INTERVAL_MIN: 2200,
    QUAKE_INTERVAL_MAX: 3800,
    QUAKE_DURATION: 900,
    QUAKE_MAGNITUDE: 9,
    GUST_INTERVAL_MIN: 1300,
    GUST_INTERVAL_MAX: 2400,
  },

  SINGLE_PIPE: {
    START_FRACTION: 0.3,
    END_FRACTION: 0.6,
    RATE: 0.7,
  },

  PIPE_VARIANTS: {
    NORMAL: "NORMAL",
    STAIRCASE: "STAIRCASE",
    ZIGZAG: "ZIGZAG",
    SINGLE: "SINGLE",
  },

  MEDAL_THRESHOLDS: {
    bronze: 10,
    silver: 20,
    gold: 30,
    platinum: 40,
  },

  MEDAL_PALETTE: {
    bronze: { hi: "#f0b27a", lo: "#8a4a1e", ring: "#6b3714" },
    silver: { hi: "#f4f6f8", lo: "#9aa3ab", ring: "#6f767c" },
    gold: { hi: "#fff3b0", lo: "#e0a815", ring: "#a97a0b" },
    platinum: { hi: "#eafbff", lo: "#8fd8e8", ring: "#4a9aab" },
  },

  SCOREBOARD_W: 236,
  SCOREBOARD_H: 280,

  RESTART_DELAY: 500,

  SOURCE_REPO_URL: "https://github.com/larry1337cat/my-dsc-bot",
  SOURCE_AUTHOR: "larry1337cat",
};

CONFIG.GROUND_Y = CONFIG.HEIGHT - CONFIG.LAND_H;

export const MODES = {
  EASY: "EASY",
  NORMAL: "NORMAL",
  HARD: "HARD",
  EXTREME: "EXTREME",
};

export function medalForScore(score) {
  const T = CONFIG.MEDAL_THRESHOLDS;
  if (score >= T.platinum) return "platinum";
  if (score >= T.gold) return "gold";
  if (score >= T.silver) return "silver";
  if (score >= T.bronze) return "bronze";
  return null;
}

export const IMAGE_MANIFEST = {
  sky: "images/sky.png",
  land: "images/land.png",
  pipeUp: "images/pipe_up.png",
  pipeDown: "images/pipe_down.png",
  bird1: "images/bird1.png",
  bird2: "images/bird2.png",
  bird3: "images/bird3.png",
  scoreboard: "images/scoreboard.png",
};
