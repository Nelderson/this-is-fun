import { useGame } from "../context/GameContext.jsx";

export default function GameOver() {
  const { gameState } = useGame();

  const sorted = Object.entries(gameState.scores)
    .map(([id, score]) => ({
      name: gameState.players.find((p) => p.id === id)?.name || "Unknown",
      score,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div>
        <p className="text-gray-400 text-sm">Game Over!</p>
        <p className="text-3xl font-bold text-accent mt-2">{winner.name} wins!</p>
        <p className="text-gray-500 mt-1">with {winner.score} points</p>
      </div>

      <div className="bg-surface rounded-lg p-4 space-y-2">
        {sorted.map((p, i) => (
          <div
            key={i}
            className={`flex justify-between px-3 py-2 rounded ${
              i === 0 ? "bg-accent/20 text-accent" : "bg-bg text-gray-300"
            }`}
          >
            <span>
              {i === 0 ? "🏆 " : ""}
              {p.name}
            </span>
            <span className="font-bold">{p.score}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition"
      >
        Play Again
      </button>
    </div>
  );
}