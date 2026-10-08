import { TOTAL_LEVELS } from "../data/levels";

export interface Progress {
  /** highest level the player may enter */
  unlocked: number;
  /** stars earned per level */
  stars: Record<number, number>;
  /** best score per level */
  best: Record<number, number>;
}

export interface LevelResult {
  stars: number;
  score: number;
  isNewBest: boolean;
}

const STORAGE_KEY = "wordshift-progress-v2";

const EMPTY: Progress = { unlocked: 1, stars: {}, best: {} };

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlocked: Math.min(TOTAL_LEVELS, Math.max(1, parsed.unlocked ?? 1)),
      stars: parsed.stars ?? {},
      best: parsed.best ?? {},
    };
  } catch {
    return EMPTY;
  }
}

export function saveProgress(progress: Progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable — progress simply won't persist.
  }
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
}

export function levelsCleared(progress: Progress): number {
  return Object.keys(progress.stars).filter((k) => (progress.stars[Number(k)] ?? 0) > 0)
    .length;
}

export function recordResult(
  progress: Progress,
  level: number,
  score: number,
  stars: number
): { progress: Progress; result: LevelResult } {
  const prevBest = progress.best[level] ?? 0;
  const prevStars = progress.stars[level] ?? 0;
  const next: Progress = {
    unlocked: Math.max(
      progress.unlocked,
      stars > 0 ? Math.min(TOTAL_LEVELS, level + 1) : level
    ),
    stars: { ...progress.stars, [level]: Math.max(prevStars, stars) },
    best: { ...progress.best, [level]: Math.max(prevBest, score) },
  };
  return {
    progress: next,
    result: { stars, score, isNewBest: score > prevBest },
  };
}

export function resetProgress(): Progress {
  saveProgress(EMPTY);
  return EMPTY;
}
