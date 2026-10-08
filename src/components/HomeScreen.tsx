import { CHAPTERS, TOTAL_LEVELS, maxStars } from "../data/levels";
import { totalWordCount } from "../data/words";
import { levelsCleared, totalStars, type Progress } from "../utils/progress";

const LOGO_TILT = [-6, 4, -3, 5, -4, 3, -5, 6, -2];

interface HomeScreenProps {
  progress: Progress;
  onPlay: () => void;
  onLevels: () => void;
  onQuickPlay: () => void;
  onReset: () => void;
}

function Logo() {
  const letters = [..."WORD", ..."SHIFT"];
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
      {letters.map((letter, i) => (
        <span
          key={i}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-black shadow-md sm:h-14 sm:w-14 sm:text-3xl ${
            i < 4 ? "bg-amber-300 text-amber-950" : "bg-indigo-600 text-white"
          }`}
          style={{ transform: `rotate(${LOGO_TILT[i]}deg)` }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

function Stars({ value, total }: { value: number; total: number }) {
  return (
    <span className="whitespace-nowrap">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < value ? "text-amber-400" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function HomeScreen({
  progress,
  onPlay,
  onLevels,
  onQuickPlay,
  onReset,
}: HomeScreenProps) {
  const stars = totalStars(progress);
  const cleared = levelsCleared(progress);
  const nextLevel = Math.min(TOTAL_LEVELS, progress.unlocked);
  const allDone = cleared >= TOTAL_LEVELS;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl animate-float-in space-y-7">
        <div className="space-y-4 text-center">
          <h1 className="sr-only">WordShift</h1>
          <Logo />
          <p className="text-lg text-slate-600">
            Unscramble the letters, spell the word, shift through {TOTAL_LEVELS} levels.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <span>
              {cleared}/{TOTAL_LEVELS} levels cleared
            </span>
            <Stars value={stars} total={maxStars()} />
          </div>

          <button
            type="button"
            onClick={onPlay}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-lg font-black text-white shadow-lg shadow-orange-200 transition hover:brightness-105 active:scale-[0.99]"
          >
            {allDone ? "Replay level " + nextLevel : "Play level " + nextLevel} →
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onLevels}
              className="rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-200 transition hover:brightness-110"
            >
              🗺 Level map
            </button>
            <button
              type="button"
              onClick={onQuickPlay}
              className="rounded-2xl bg-white py-3 font-bold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
            >
              ⚡ Quick play
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            {totalWordCount()}+ words · {CHAPTERS.length} chapters · stars unlock nothing but bragging rights
          </p>
        </div>

        <div className="rounded-3xl bg-white/70 p-6 ring-1 ring-slate-200 backdrop-blur">
          <h3 className="font-bold text-slate-900">How to play</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>🔤 Tap letter tiles, or type on your keyboard, to fill the slots.</li>
            <li>↩️ Tap a placed letter to take it back.</li>
            <li>⚡ Answer fast and keep your streak for bonus points.</li>
            <li>💡 A hint reveals one letter but costs points.</li>
            <li>🌟 3 stars means flawless: every word, no wrong tries, no hints.</li>
            <li>🔊 Hear the word spoken any time for a spelling assist.</li>
          </ul>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 text-xs font-semibold text-slate-400 underline hover:text-rose-500"
          >
            Reset all progress
          </button>
        </div>
      </div>
    </div>
  );
}
