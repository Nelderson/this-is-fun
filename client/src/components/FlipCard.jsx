import { useState, useEffect } from "react";

export default function FlipCard({
  card,
  playerName,
  isWinner,
  canPick,
  showName,
  delay = 0,
  onClick,
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="card-flip-container"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`card-flip-inner ${flipped ? "flipped" : ""}`}
        style={{ minHeight: "120px" }}
      >
        {/* Back of card (face down) */}
        <div className="card-front bg-surface border-2 border-gray-600 rounded-xl p-4 flex items-center justify-center">
          <span className="text-gray-500 text-lg font-bold tracking-widest">?</span>
        </div>

        {/* Front of card (revealed) */}
        <div
          onClick={canPick ? onClick : undefined}
          className={`card-back bg-white_card text-gray-900 p-4 rounded-xl font-medium shadow transition relative
            ${canPick ? "hover:ring-2 hover:ring-accent cursor-pointer" : "cursor-default"}
            ${isWinner ? "ring-2 ring-accent winner-pulse" : ""}
          `}
        >
          <span>{card}</span>
          {showName && playerName && (
            <span className="block text-xs text-gray-500 mt-2">
              — {playerName}
              {isWinner && " 🏆"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}