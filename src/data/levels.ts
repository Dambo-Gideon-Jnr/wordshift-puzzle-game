import { getTierPool, type TierId, type WordEntry } from "./words";

export const LEVELS_PER_CHAPTER = 100;

export interface Chapter {
  id: number;
  name: string;
  subtitle: string;
  emoji: string;
  tiers: TierId[];
  wordsPerLevel: number;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: "First Steps",
    subtitle: "Starter · 3–5 letters",
    emoji: "🌱",
    tiers: ["starter"],
    wordsPerLevel: 5,
  },
  {
    id: 2,
    name: "Growing Shift",
    subtitle: "Easy · 5–6 letters",
    emoji: "🌿",
    tiers: ["easy"],
    wordsPerLevel: 5,
  },
  {
    id: 3,
    name: "Steady Climb",
    subtitle: "Medium · 6–7 letters",
    emoji: "🌳",
    tiers: ["medium"],
    wordsPerLevel: 6,
  },
  {
    id: 4,
    name: "Fire Walk",
    subtitle: "Hard · 7–9 letters",
    emoji: "🔥",
    tiers: ["hard"],
    wordsPerLevel: 6,
  },
  {
    id: 5,
    name: "Crown Chase",
    subtitle: "Expert · 9–13 letters",
    emoji: "👑",
    tiers: ["expert"],
    wordsPerLevel: 7,
  },
  {
    id: 6,
    name: "Master Shift",
    subtitle: "Everything mixed · longest words",
    emoji: "🏆",
    tiers: ["medium", "hard", "expert"],
    wordsPerLevel: 8,
  },
  {
    id: 7,
    name: "Trailblazer",
    subtitle: "Starter + easy · longer routes",
    emoji: "🚀",
    tiers: ["starter", "easy"],
    wordsPerLevel: 8,
  },
  {
    id: 8,
    name: "Summit Run",
    subtitle: "Easy + medium · steady pressure",
    emoji: "🏔️",
    tiers: ["easy", "medium"],
    wordsPerLevel: 8,
  },
  {
    id: 9,
    name: "Storm Line",
    subtitle: "Medium + hard · rising difficulty",
    emoji: "⚡",
    tiers: ["medium", "hard"],
    wordsPerLevel: 8,
  },
  {
    id: 10,
    name: "Final Shift",
    subtitle: "Hard + expert · endgame challenge",
    emoji: "👑",
    tiers: ["hard", "expert"],
    wordsPerLevel: 9,
  },
];

export const TOTAL_LEVELS = CHAPTERS.length * LEVELS_PER_CHAPTER;

export interface LevelMeta {
  level: number;
  chapter: Chapter;
  wordsPerLevel: number;
  /** levels in this chapter are labelled like 1-3 */
  label: string;
}

export function chapterForLevel(level: number): Chapter {
  const i = Math.min(
    CHAPTERS.length - 1,
    Math.max(0, Math.floor((level - 1) / LEVELS_PER_CHAPTER))
  );
  return CHAPTERS[i];
}

export function levelLabel(level: number): string {
  const chapter = chapterForLevel(level);
  return `${chapter.id}-${((level - 1) % LEVELS_PER_CHAPTER) + 1}`;
}

export function levelMeta(level: number): LevelMeta {
  return {
    level,
    chapter: chapterForLevel(level),
    wordsPerLevel: chapterForLevel(level).wordsPerLevel,
    label: levelLabel(level),
  };
}

export function chapterLevels(chapter: Chapter): number[] {
  const start = (chapter.id - 1) * LEVELS_PER_CHAPTER + 1;
  return Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => start + i);
}

/* ---------------- deterministic word assignment ---------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the word list for a level. Words are assigned deterministically so
 * level 3 always contains the same five words, and words are spread so that
 * repeats inside a chapter are impossible while the pool is big enough.
 */
export function getLevelWords(level: number): WordEntry[] {
  const chapter = chapterForLevel(level);
  const slot = (level - 1) % LEVELS_PER_CHAPTER;

  // Words already handed out by earlier chapters, so the campaign stays fresh.
  const used = new Set<string>();
  for (let prev = 1; prev < chapter.id; prev++) {
    const c = CHAPTERS[prev - 1];
    const base = chapterLevels(c).length * c.wordsPerLevel;
    const pool = c.tiers.flatMap((t) => getTierPool(t));
    seededShuffle(pool, c.id * 7919).slice(0, base).forEach((w) => used.add(w.word));
  }

  let pool = chapter.tiers.flatMap((t) => getTierPool(t));
  const fresh = pool.filter((w) => !used.has(w.word));
  if (fresh.length >= chapter.wordsPerLevel * LEVELS_PER_CHAPTER) {
    pool = fresh;
  }

  const order = seededShuffle(pool, chapter.id * 7919 + slot * 131);
  const start = slot * chapter.wordsPerLevel;
  const words: WordEntry[] = [];
  for (let i = 0; i < chapter.wordsPerLevel; i++) {
    words.push(order[(start + i) % order.length]);
  }
  // Longest words last inside a level feels like a natural ramp.
  return words.sort((a, b) => a.word.length - b.word.length);
}

/** Random quick-play set drawn from every unlocked tier. */
export function getQuickPlayWords(count: number, maxLevel = 1): WordEntry[] {
  const chapters = CHAPTERS.filter((c) => c.id <= chapterForLevel(maxLevel).id);
  const pool = chapters.flatMap((c) => c.tiers.flatMap((t) => getTierPool(t)));
  return seededShuffle(pool, Date.now() % 100000).slice(0, count);
}

/* ---------------- stars ---------------- */

export function starsFor(stats: {
  solved: number;
  total: number;
  wrongAttempts: number;
  hintsUsed: number;
}): number {
  const { solved, total, wrongAttempts, hintsUsed } = stats;
  let stars: number;
  if (solved >= total) stars = 3;
  else if (solved >= Math.ceil(total * 0.8)) stars = 2;
  else if (solved >= Math.ceil(total * 0.5)) stars = 1;
  else stars = 0;

  if (stars === 3 && (wrongAttempts > 1 || hintsUsed > 1)) stars = 2;
  return stars;
}

export function isPerfect(stats: { solved: number; total: number; wrongAttempts: number; hintsUsed: number }) {
  return stats.solved === stats.total && stats.wrongAttempts === 0 && stats.hintsUsed === 0;
}

export function maxStars(): number {
  return TOTAL_LEVELS * 3;
}
