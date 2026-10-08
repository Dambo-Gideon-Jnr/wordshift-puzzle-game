import type { GameStats } from "../utils/game";

interface ResultScreenProps {
  stats: GameStats;
  stars: number;
  title: string;
  subtitle: string;
  previousBest: number;
  hasNextLevel: boolean;
  perfect: boolean;
  onNext: () => void;
  onReplay: () => void;
  onLevels: () => void;
}

function StarDisplay({ stars, perfect }: { stars: number; perfect: boolean }) {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`text-5xl transition-transform ${
            i < stars ? "scale-110 text-amber-400" : "text-slate-200"
          } ${i === 1 ? "-translate-y-2 text-6xl" : ""}`}
          style={{ animation: i < stars ? `pop 0.35s ease-out ${0.15 * i}s both` : undefined }}
        >
          {i < stars ? "★" : "☆"}
        </span>
      ))}
      {perfect && (
        <span className="sr-only">Flawless run</span>
      )}
    </div>
  );
}

export default function ResultScreen({
  stats,
  stars,
  title,
  subtitle,
  previousBest,
  hasNextLevel,
  perfect,
  onNext,
  onReplay,
  onLevels,
}: ResultScreenProps) {
  const passed = stars > 0;
  const heading = perfect
    ? "Flawless shift!"
    : stars === 3
      ? "Three stars!"
      : passed
        ? "Level cleared"
        : "Almost there";

  const emoji = perfect ? "🏆" : stars === 3 ? "🌟" : passed ? "🎉" : "💪";

  const cards = [
    { label: "Words", value: `${stats.solved}/${stats.total}` },
    { label: "Best streak", value: `🔥 ${stats.bestStreak}` },
    { label: "Hints", value: `💡 ${stats.hintsUsed}` },
    { label: "Wrong tries", value: `✖ ${stats.wrongAttempts}` },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg animate-float-in space-y-6 rounded-3xl bg-white p-7 text-center shadow-xl ring-1 ring-slate-200 sm:p-8">
        <div className="text-5xl">{emoji}</div>

        <div>
          <h2 className="text-3xl font-black text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {title} · {subtitle}
          </p>
        </div>

        <StarDisplay stars={stars} perfect={perfect} />

        {!passed && (
          <p className="text-sm text-slate-500">
            Solve at least half the words to earn a star and unlock the next level.
          </p>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 p-6 text-amber-950 shadow-inner">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70">
            Score
          </div>
          <div className="text-5xl font-black">{stats.score}</div>
          {stats.score > 0 && stats.score > previousBest ? (
            <div className="mt-3 inline-block rounded-full bg-white/80 px-3 py-1 text-sm font-bold">
              🌟 New best for this level
            </div>
          ) : previousBest > 0 ? (
            <div className="mt-3 text-sm font-semibold">Best here: {previousBest}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-base font-bold text-slate-800">{c.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {passed && hasNextLevel && (
            <button
              type="button"
              onClick={onNext}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:brightness-105"
            >
              Next level →
            </button>
          )}
          <button
            type="button"
            onClick={onReplay}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-200 transition hover:brightness-110"
          >
            ↻ Replay
          </button>
          <button
            type="button"
            onClick={onLevels}
            className="flex-1 rounded-2xl bg-white py-3 font-bold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
          >
            🗺 Levels
          </button>
        </div>
      </div>
    </div>
  );
}
