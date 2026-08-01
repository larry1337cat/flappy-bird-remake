import { MODES } from "./config.js";

export const LANG = {
  VI: "vi",
  EN: "en",
};

const STRINGS = {
  [LANG.VI]: {
    modeLabels: {
      [MODES.EASY]: "DỄ",
      [MODES.NORMAL]: "THƯỜNG",
      [MODES.HARD]: "KHÓ",
      [MODES.EXTREME]: "SIÊU KHÓ",
    },
    medalLabels: {
      bronze: "Đồng",
      silver: "Bạc",
      gold: "Vàng",
      platinum: "Bạch Kim",
    },
    chooseDifficulty: "CHỌN ĐỘ KHÓ",
    tapToStartLine1: "Chạm hoặc nhấn Space",
    tapToStartLine2: "để bắt đầu",
    best: "Kỷ lục",
    difficulty: "Độ khó",
    newBest: "KỶ LỤC MỚI!",
    tapToRestart: "Chạm để chơi lại",
    wind: "GIÓ",
    fog: "SƯƠNG MÙ",
    otherLangLabel: "EN",
    updateAvailable: "Đã có bản cập nhật mới",
    reloadNow: "Tải lại",
    settings: "CÀI ĐẶT",
    sound: "ÂM THANH",
    soundOn: "BẬT",
    soundOff: "TẮT",
    birdSkin: "MÀU CHIM",
  },
  [LANG.EN]: {
    modeLabels: {
      [MODES.EASY]: "EASY",
      [MODES.NORMAL]: "NORMAL",
      [MODES.HARD]: "HARD",
      [MODES.EXTREME]: "EXTREME",
    },
    medalLabels: {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      platinum: "Platinum",
    },
    chooseDifficulty: "CHOOSE DIFFICULTY",
    tapToStartLine1: "Tap or press Space",
    tapToStartLine2: "to start",
    best: "Best",
    difficulty: "Difficulty",
    newBest: "NEW BEST!",
    tapToRestart: "Tap to restart",
    wind: "WIND",
    fog: "FOG",
    otherLangLabel: "VI",
    updateAvailable: "A new update is available",
    reloadNow: "Reload",
    settings: "SETTINGS",
    sound: "SOUND",
    soundOn: "ON",
    soundOff: "OFF",
    birdSkin: "BIRD SKIN",
  },
};

export function resolveLang(lang) {
  return STRINGS[lang] ? lang : LANG.VI;
}

export function t(lang) {
  return STRINGS[resolveLang(lang)];
}

export function otherLang(lang) {
  return resolveLang(lang) === LANG.VI ? LANG.EN : LANG.VI;
}
