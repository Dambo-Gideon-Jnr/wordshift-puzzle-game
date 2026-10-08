import {
  CHAPTERS,
  LEVELS_PER_CHAPTER,
  TOTAL_LEVELS,
  chapterLevels,
  levelMeta,
  maxStars,
} from "../data/levels";
import { TIERS } from "../data/words";
import { totalStars, type Progress } from "../utils/progress";

interface LevelSelectProps {
  progress: Progress;
  onSelect: (level: number) => void;
  onBack: () => void;
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="text-[11px] leading-none tracking-tight">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < value ? "text-amber-400" : "text-slate-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function LevelSelect({ progress, onSelect, onBack }: LevelSelectProps) {
  const earned = totalStars(progress);

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
        >
          ← Home
        </button>
        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">
          ★ {earned} / {maxStars()}
        </div>
      </header>

      <div className="mt-4 space-y-5">
        {CHAPTERS.map((chapter) => {
          const levels = chapterLevels(chapter);
          const chapterStars = levels.reduce((s, l) => s + (progress.stars[l] ?? 0), 0);
          const chapterUnlocked = progress.unlocked >= levels[0];

          return (
            <section
              key={chapter.id}
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div
                className={`flex items-center justify-between bg-gradient-to-r ${
                  TIERS[chapter.tiers[chapter.tiers.length - 1]].bg
                } px-5 py-3 text-white shadow-sm`}
              >
                <div>
                  <h2 className="text-base font-black">
                    {chapter.emoji} Chapter {chapter.id} · {chapter.name}
                  </h2>
                  <p className="text-xs text-white/70">{chapter.subtitle}</p>
                </div>
                <div className="text-right text-xs font-semibold">
                  <div>
                    {chapterStars}/{LEVELS_PER_CHAPTER * 3} ★
                  </div>
                  <div className="text-white/60">{chapter.wordsPerLevel} words / level</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-6">
                {levels.map((level) => {
                  const stars = progress.stars[level] ?? 0;
                  const best = progress.best[level] ?? 0;
                  const locked = level > progress.unlocked;
                  const meta = levelMeta(level);

                  if (locked) {
                    return (
                      <div
                        key={level}
                        className="flex h-24 flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                        title="Earn a star on the previous level to unlock"
                      >
                        <span className="text-xl">🔒</span>
                        <span className="mt-1 text-xs font-bold">{meta.label}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onSelect(level)}
                      className={`flex h-24 flex-col items-center justify-center rounded-2xl border-2 transition ${
                        stars > 0
                          ? "border-emerald-200 bg-emerald-50 hover:-translate-y-0.5 hover:shadow-md"
                          : "border-amber-200 bg-amber-50 hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Level
                      </span>
                      <span className="text-2xl font-black leading-tight text-slate-900">
                        {meta.label}
                      </span>
                      <StarRow value={stars} />
                      <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {best > 0 ? `${best} pts` : `${meta.wordsPerLevel} words`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!chapterUnlocked && (
                <p className="px-5 pb-4 text-xs font-semibold text-slate-400">
                  Clear chapter {chapter.id - 1} to open this chapter.
                </p>
              )}
            </section>
          );
        })}

        <p className="pb-6 text-center text-xs text-slate-400">
          {TOTAL_LEVELS} levels in total · words get longer as you climb
        </p>
      </div>
    </div>
  );
}
