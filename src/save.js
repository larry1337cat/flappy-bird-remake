import { CONFIG } from "./config.js";

const DEFAULT_SAVE = {
  bestByMode: { EASY: 0, NORMAL: 0, HARD: 0, EXTREME: 0 },
  mode: "NORMAL",
  lang: "vi",
  muted: false,
};

function resolveBestByMode(parsed) {
  if (parsed && parsed.bestByMode && typeof parsed.bestByMode === "object") {
    return parsed.bestByMode;
  }
  const legacyBest = typeof (parsed && parsed.best) === "number" ? parsed.best : 0;
  return { EASY: 0, NORMAL: legacyBest, HARD: 0, EXTREME: 0 };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    const bestByMode = { ...DEFAULT_SAVE.bestByMode, ...resolveBestByMode(parsed) };
    return { ...structuredClone(DEFAULT_SAVE), ...parsed, bestByMode };
  } catch (e) {
    console.warn("Save data loi, dung mac dinh:", e);
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Khong the ghi save:", e);
  }
}
