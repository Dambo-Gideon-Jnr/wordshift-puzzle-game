import type { WordEntry } from "../data/words";

export const ROUNDS_PER_GAME = 10;
export const HINT_COST = 20;

export interface GameStats {
  score: number;
  solved: number;
  total: number;
  bestStreak: number;
  wrongAttempts: number;
  hintsUsed: number;
}

/** Fisher–Yates shuffle that returns a new array. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Shuffles letters so the result differs from the original word when possible. */
export function scrambleWord(word: string): string[] {
  const letters = word.split("");
  let result = shuffle(letters);
  for (let attempt = 0; attempt < 10 && result.join("") === word; attempt++) {
    result = shuffle(letters);
  }
  return result;
}

export function pickWords(pool: WordEntry[], count: number): WordEntry[] {
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Points for a solved word:
 * base 100 + up to 60 for speed + 10 per streak step (max 5 steps) − hint costs.
 */
export function calculatePoints(
  elapsedSeconds: number,
  streakSteps: number,
  hints: number
): number {
  const base = 100;
  const timeBonus = Math.max(0, 60 - elapsedSeconds);
  const streakBonus = streakSteps * 10;
  const hintPenalty = hints * HINT_COST;
  return Math.max(10, base + timeBonus + streakBonus - hintPenalty);
}

/** Reads text aloud using the browser's speech synthesis, if available. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}
