import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";
import ResultScreen from "./components/ResultScreen";
import {
  TOTAL_LEVELS,
  getLevelWords,
  getQuickPlayWords,
  levelMeta,
  starsFor,
  isPerfect,
} from "./data/levels";
import { TIERS, type WordEntry } from "./data/words";
import type { GameStats } from "./utils/game";
import {
  loadProgress,
  recordResult,
  resetProgress,
  saveProgress,
  type LevelResult,
  type Progress,
} from "./utils/progress";

type Screen = "home" | "levels" | "game" | "result";

interface ActiveGame {
  words: WordEntry[];
  title: string;
  subtitle: string;
  /** null for quick play */
  level: number | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [gameId, setGameId] = useState(0);
  const [outcome, setOutcome] = useState<
    (GameStats & { result: LevelResult; previousBest: number }) | null
  >(null);

  const startLevel = (level: number) => {
    const meta = levelMeta(level);
    setGame({
      words: getLevelWords(level),
      title: `Level ${meta.label}`,
      subtitle: `${meta.chapter.name} · ${TIERS[meta.chapter.tiers[0]].label}`,
      level,
    });
    setGameId((id) => id + 1);
    setScreen("game");
  };

  const startQuickPlay = () => {
    setGame({
      words: getQuickPlayWords(8, progress.unlocked),
      title: "Quick play",
      subtitle: "Random mix from your unlocked chapters",
      level: null,
    });
    setGameId((id) => id + 1);
    setScreen("game");
  };

  const finishGame = (stats: GameStats) => {
    if (!game) return;

    if (game.level === null) {
      setOutcome({
        ...stats,
        result: { stars: starsFor(stats), score: stats.score, isNewBest: false },
        previousBest: 0,
      });
      setScreen("result");
      return;
    }

    const stars = starsFor(stats);
    const previousBest = progress.best[game.level] ?? 0;
    const { progress: next, result } = recordResult(progress, game.level, stats.score, stars);
    setProgress(next);
    saveProgress(next);
    setOutcome({ ...stats, result, previousBest });
    setScreen("result");
  };

  const handleReset = () => {
    setProgress(resetProgress());
  };

  const finishedLevel = game?.level ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-indigo-50 font-sans text-slate-900">
      {screen === "home" && (
        <HomeScreen
          progress={progress}
          onPlay={() => startLevel(Math.min(TOTAL_LEVELS, progress.unlocked))}
          onLevels={() => setScreen("levels")}
          onQuickPlay={startQuickPlay}
          onReset={handleReset}
        />
      )}

      {screen === "levels" && (
        <LevelSelect
          progress={progress}
          onSelect={startLevel}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "game" && game && (
        <GameScreen
          key={gameId}
          words={game.words}
          title={game.title}
          subtitle={game.subtitle}
          onFinish={finishGame}
          onQuit={() => setScreen(finishedLevel ? "levels" : "home")}
        />
      )}

      {screen === "result" && game && outcome && (
        <ResultScreen
          stats={outcome}
          stars={outcome.result.stars}
          title={game.title}
          subtitle={game.subtitle}
          previousBest={outcome.previousBest}
          hasNextLevel={finishedLevel !== null && finishedLevel < TOTAL_LEVELS}
          perfect={isPerfect(outcome)}
          onNext={() => startLevel(Math.min(TOTAL_LEVELS, (finishedLevel ?? 1) + 1))}
          onReplay={() => (finishedLevel ? startLevel(finishedLevel) : startQuickPlay())}
          onLevels={() => setScreen("levels")}
        />
      )}
    </div>
  );
}
