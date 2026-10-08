import { useEffect, useState } from "react";
import type { WordEntry } from "../data/words";
import {
  calculatePoints,
  HINT_COST,
  scrambleWord,
  shuffle,
  speak,
  type GameStats,
} from "../utils/game";

/** Tile ids index into `letters`. Slots hold tile ids (or null when empty). */
interface RoundState {
  letters: string[];
  order: number[];
  slots: Array<number | null>;
  locked: boolean[];
  hints: number;
}

type Status = "idle" | "correct" | "wrong";

interface GameScreenProps {
  words: WordEntry[];
  /** e.g. "Level 3-4" or "Quick play" */
  title: string;
  /** e.g. "Steady Climb · Medium" */
  subtitle: string;
  onFinish: (stats: GameStats) => void;
  onQuit: () => void;
}

function createRound(word: string): RoundState {
  const letters = scrambleWord(word);
  return {
    letters,
    order: shuffle(letters.map((_, i) => i)),
    slots: Array.from({ length: word.length }, () => null),
    locked: Array.from({ length: word.length }, () => false),
    hints: 0,
  };
}

/** Reveals the next incorrect position with its correct letter and locks it. */
function applyHint(r: RoundState, word: string): RoundState {
  const slots = [...r.slots];
  const locked = [...r.locked];

  let target = -1;
  for (let k = 0; k < word.length; k++) {
    if (locked[k]) continue;
    const id = slots[k];
    if (id === null || r.letters[id] !== word[k]) {
      target = k;
      break;
    }
  }
  if (target === -1) return r;

  const lockedIds = new Set<number>();
  slots.forEach((id, k) => {
    if (locked[k] && id !== null) lockedIds.add(id);
  });

  const candidates = r.letters
    .map((_, id) => id)
    .filter((id) => r.letters[id] === word[target] && !lockedIds.has(id));
  const tileId = candidates.find((id) => !slots.includes(id)) ?? candidates[0];
  if (tileId === undefined) return r;

  const current = slots.indexOf(tileId);
  if (current !== -1) slots[current] = null;
  slots[target] = tileId;
  locked[target] = true;

  return { ...r, slots, locked, hints: r.hints + 1 };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-1.5 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

const btnSecondary =
  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

export default function GameScreen({
  words,
  title,
  subtitle,
  onFinish,
  onQuit,
}: GameScreenProps) {
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState<RoundState>(() => createRound(words[0].word));
  const [status, setStatus] = useState<Status>("idle");
  const [roundStart, setRoundStart] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [streak, setStreak] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [stats, setStats] = useState<GameStats>(() => ({
    score: 0,
    solved: 0,
    total: words.length,
    bestStreak: 0,
    wrongAttempts: 0,
    hintsUsed: 0,
  }));

  const entry = words[index];
  const word = entry.word;
  const length = word.length;
  const isLastWord = index + 1 >= words.length;
  const filledCount = round.slots.filter((s) => s !== null).length;
  const trayIds = round.order.filter((id) => !round.slots.includes(id));
  const elapsed = Math.max(0, Math.floor((now - roundStart) / 1000));
  const progress = ((index + (status === "correct" ? 1 : 0)) / words.length) * 100;

  // Live timer for the current word (freezes once solved)
  useEffect(() => {
    if (status === "correct") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  // Clear a wrong answer after the shake so the player can retry
  useEffect(() => {
    if (status !== "wrong") return;
    const timer = window.setTimeout(() => {
      setRound((r) => ({
        ...r,
        slots: r.slots.map((s, i) => (r.locked[i] ? s : null)),
      }));
      setStatus("idle");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [status]);

  // Auto-check once every slot is filled
  useEffect(() => {
    if (status !== "idle" || round.slots.some((s) => s === null)) return;
    const attempt = round.slots.map((id) => round.letters[id as number]).join("");

    if (attempt === word) {
      const secondsTaken = Math.floor((Date.now() - roundStart) / 1000);
      const points = calculatePoints(secondsTaken, Math.min(streak, 5), round.hints);
      const newStreak = streak + 1;
      setLastPoints(points);
      setStreak(newStreak);
      setStats((s) => ({
        ...s,
        score: s.score + points,
        solved: s.solved + 1,
        bestStreak: Math.max(s.bestStreak, newStreak),
        hintsUsed: s.hintsUsed + round.hints,
      }));
      setStatus("correct");
      speak(word);
    } else {
      setStreak(0);
      setStats((s) => ({ ...s, wrongAttempts: s.wrongAttempts + 1 }));
      setStatus("wrong");
    }
  }, [status, round, word, roundStart, streak]);

  const placeLetter = (id: number) => {
    setRound((r) => {
      const i = r.slots.indexOf(null);
      if (i === -1) return r;
      const slots = [...r.slots];
      slots[i] = id;
      return { ...r, slots };
    });
  };

  const removeSlot = (i: number) => {
    setRound((r) => {
      if (r.locked[i] || r.slots[i] === null) return r;
      const slots = [...r.slots];
      slots[i] = null;
      return { ...r, slots };
    });
  };

  const removeLast = () => {
    setRound((r) => {
      for (let i = r.slots.length - 1; i >= 0; i--) {
        if (!r.locked[i] && r.slots[i] !== null) {
          const slots = [...r.slots];
          slots[i] = null;
          return { ...r, slots };
        }
      }
      return r;
    });
  };

  const clearAnswer = () => {
    setRound((r) => ({
      ...r,
      slots: r.slots.map((s, i) => (r.locked[i] ? s : null)),
    }));
  };

  const shuffleTray = () => setRound((r) => ({ ...r, order: shuffle(r.order) }));
  const useHint = () => setRound((r) => applyHint(r, word));

  const nextWord = () => {
    if (isLastWord) {
      onFinish(stats);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setRound(createRound(words[nextIndex].word));
    setRoundStart(Date.now());
    setNow(Date.now());
    setLastPoints(0);
    setStatus("idle");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (status === "correct" && e.key === "Enter") {
        e.preventDefault();
        nextWord();
        return;
      }
      if (status !== "idle") return;

      if (e.key === "Backspace") {
        e.preventDefault();
        removeLast();
        return;
      }
      if (e.key === "Escape") {
        clearAnswer();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const letter = e.key.toUpperCase();
        const id = round.order.find(
          (t) => round.letters[t] === letter && !round.slots.includes(t)
        );
        if (id !== undefined) placeLetter(id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const remaining = length - filledCount;
  const message =
    status === "correct"
      ? `Correct! +${lastPoints} points`
      : status === "wrong"
        ? "Not quite — letters reset, try again"
        : filledCount === 0
          ? "Tap the letters to spell the word"
          : `${remaining} letter${remaining === 1 ? "" : "s"} left`;

  const messageTone =
    status === "correct"
      ? "text-emerald-600"
      : status === "wrong"
        ? "text-rose-600"
        : "text-slate-500";

  // Longer words get narrower tiles so a 13-letter word still fits on a phone.
  const tileSize =
    length >= 12
      ? "h-10 w-8 text-lg sm:h-14 sm:w-12 sm:text-2xl"
      : length >= 9
        ? "h-11 w-9 text-xl sm:h-14 sm:w-12 sm:text-2xl"
        : length >= 7
          ? "h-11 w-10 text-xl sm:h-14 sm:w-14 sm:text-2xl"
          : "h-11 w-11 text-2xl sm:h-14 sm:w-14 sm:text-3xl";

  return (
    <div className="flex min-h-screen flex-col px-4 py-5 sm:py-8">
      <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onQuit}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800"
        >
          ✕ Exit
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Stat label="Word" value={`${index + 1}/${words.length}`} />
          <Stat label="Score" value={stats.score} />
          <Stat label="Streak" value={`🔥 ${streak}`} />
        </div>
      </header>

      <main className="mx-auto mt-6 w-full max-w-3xl flex-1 space-y-6">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="animate-float-in rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>
              {title} · {subtitle}
            </span>
            <span>⏱ {elapsed}s</span>
          </div>
          <p className="mt-3 text-xl font-medium text-slate-800 sm:text-2xl">
            “{entry.clue}”
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speak(word)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              🔊 Hear the word
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
              {length} letters
            </span>
          </div>
        </section>

        <section className={`space-y-4 ${status === "wrong" ? "animate-shake" : ""}`}>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {round.slots.map((id, i) => {
              const locked = round.locked[i];
              const filled = id !== null;
              const letter = filled ? round.letters[id] : "";

              let tone = "border-2 border-dashed border-slate-300 bg-white text-slate-300";
              if (filled) {
                tone = locked
                  ? "border-2 border-indigo-400 bg-indigo-100 text-indigo-800"
                  : "border-2 border-amber-400 bg-amber-100 text-amber-900";
              }
              if (status === "correct") {
                tone = "border-2 border-emerald-500 bg-emerald-100 text-emerald-700";
              } else if (status === "wrong" && filled && !locked) {
                tone = "border-2 border-rose-400 bg-rose-100 text-rose-700";
              }

              const interactive = filled && !locked && status === "idle";

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => removeSlot(i)}
                  disabled={!interactive}
                  title={interactive ? "Tap to remove" : undefined}
                  className={`flex items-center justify-center rounded-xl font-black transition ${tileSize} ${tone} ${
                    interactive ? "cursor-pointer hover:-translate-y-0.5" : ""
                  } ${filled ? "animate-pop" : ""}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          <p className={`min-h-6 text-center text-sm font-semibold ${messageTone}`}>
            {message}
          </p>
        </section>

        <section className="rounded-3xl bg-white/70 p-5 ring-1 ring-slate-200 backdrop-blur">
          <div className="flex min-h-14 flex-wrap justify-center gap-1.5 sm:gap-2">
            {trayIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => placeLetter(id)}
                disabled={status !== "idle"}
                className={`flex items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 font-black text-amber-950 shadow-md ring-1 ring-amber-500/40 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed ${tileSize}`}
              >
                {round.letters[id]}
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={shuffleTray}
            disabled={status !== "idle"}
            className={btnSecondary}
          >
            🔀 Shuffle
          </button>
          <button
            type="button"
            onClick={clearAnswer}
            disabled={status !== "idle" || filledCount === 0}
            className={btnSecondary}
          >
            ↺ Clear
          </button>
          <button
            type="button"
            onClick={useHint}
            disabled={status !== "idle"}
            className={btnSecondary}
          >
            💡 Hint <span className="text-rose-500">−{HINT_COST}</span>
          </button>
        </div>

        {status === "correct" && (
          <div className="flex animate-float-in justify-center">
            <button
              type="button"
              onClick={nextWord}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:brightness-110"
            >
              {isLastWord ? "Finish level 🏆" : "Next word →"}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Type letters to play · Backspace undo · Esc clear · Enter continue
        </p>
      </main>
    </div>
  );
}
