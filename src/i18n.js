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
    },
    modeDescriptions: {
      [MODES.EASY]: "Tốc độ & khe ống cố định",
      [MODES.NORMAL]: "Ống di chuyển, khó dần theo điểm",
      [MODES.HARD]: "+ Gió giật ngang & ống hẹp bất ngờ",
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
    otherLangLabel: "EN",
  },
  [LANG.EN]: {
    modeLabels: {
      [MODES.EASY]: "EASY",
      [MODES.NORMAL]: "NORMAL",
      [MODES.HARD]: "HARD",
    },
    modeDescriptions: {
      [MODES.EASY]: "Fixed speed & gap",
      [MODES.NORMAL]: "Moving pipes, ramps up with score",
      [MODES.HARD]: "+ Side gusts & surprise narrow pipes",
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
    otherLangLabel: "VI",
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
