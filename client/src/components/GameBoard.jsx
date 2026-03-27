import { useGame } from "../context/GameContext.jsx";

export default function GameBoard() {
  const { gameState, submitCard, selectWinner, socket } = useGame();
  const round = gameState.currentRound;
  if (!round) return <p className="text-gray-400">Waiting for next round...</p>;

  const isSelector = round.selectorId === socket.id;
  const selectorName = gameState.players.find((p) => p.id === round.selectorId)?.name;
  const hasSubmitted = !!round.mySubmission;
  const winnerName = round.winnerId
    ? gameState.players.find((p) => p.id === round.winnerId)?.name
    : null;

  const submittedCount = round.submissions?.length || 0;
  const expectedCount = gameState.players.filter(
    (p) => p.connected && p.id !== round.selectorId
  ).length;

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Scoreboard */}
      <div className="flex flex-wrap gap-3 justify-center">
        {gameState.players
          .filter((p) => p.connected)
          .map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1 rounded text-sm ${
                p.id === round.selectorId
                  ? "bg-accent text-white"
                  : "bg-surface text-gray-300"
              }`}
            >
              {p.name}: {gameState.scores[p.id] || 0}
            </div>
          ))}
      </div>

      {/* Black Card */}
      <div className="bg-black_card text-white p-6 rounded-xl text-xl font-semibold text-center shadow-lg border border-gray-700">
        {round.blackCard}
      </div>

      <p className="text-center text-gray-400 text-sm">
        {isSelector
          ? "You are the selector this round"
          : `${selectorName} is selecting`}
      </p>

      {/* Winner announcement */}
      {round.winnerId && (
        <div className="text-center py-3 bg-accent/20 rounded-lg border border-accent/40">
          <p className="text-accent font-bold text-lg">
            {winnerName} wins this round!
          </p>
          <p className="text-gray-400 text-sm mt-1">Next round starting soon...</p>
        </div>
      )}

      {/* All submissions revealed — visible to EVERYONE */}
      {round.allSubmitted && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">
            {round.winnerId
              ? "This round's submissions:"
              : isSelector
              ? "Pick the funniest card:"
              : `Waiting for ${selectorName} to pick a winner...`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {round.submissions.map((sub, i) => {
              const isWinner = round.winnerId && sub.playerId === round.winnerId;
              const canPick = isSelector && !round.winnerId;

              return (
                <button
                  key={i}
                  disabled={!canPick}
                  onClick={() => canPick && selectWinner(gameState.roomCode, sub.playerId)}
                  className={`bg-white_card text-gray-900 p-4 rounded-xl text-left font-medium shadow transition relative
                    ${canPick ? "hover:ring-2 hover:ring-accent hover:-translate-y-1 cursor-pointer" : "cursor-default"}
                    ${isWinner ? "ring-2 ring-accent" : ""}
                  `}
                >
                  <span>{sub.card}</span>
                  {round.winnerId && (
                    <span className="block text-xs text-gray-500 mt-2">
                      — {sub.playerName}
                      {isWinner && " 🏆"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Waiting state before all cards are in */}
      {!round.allSubmitted && (
        <div className="text-center">
          <p className="text-gray-500 animate-pulse">
            {submittedCount} of {expectedCount} cards submitted...
          </p>
        </div>
      )}

      {/* Player's hand (non-selector, before all submitted) */}
      {!isSelector && !round.winnerId && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">
            {hasSubmitted ? "Your card is in. Waiting on others..." : "Pick a card to play:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameState.myHand.map((card, i) => (
              <button
                key={i}
                disabled={hasSubmitted}
                onClick={() => submitCard(gameState.roomCode, i)}
                className={`bg-white_card text-gray-900 p-4 rounded-xl text-left font-medium shadow transition ${
                  hasSubmitted
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:ring-2 hover:ring-accent hover:-translate-y-1"
                } ${round.mySubmission === card ? "ring-2 ring-accent" : ""}`}
              >
                {card}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}