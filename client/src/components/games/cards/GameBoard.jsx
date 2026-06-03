import { useGame } from "../../../context/GameContext.jsx";
import FlipCard from "./FlipCard.jsx";

export default function CardsGameBoard() {
  const { lobbyState, gameData, emit, socket } = useGame();
  const round = gameData?.currentRound;
  if (!round) return <p className="text-gray-400">Waiting for next round...</p>;

  const isSelector = round.selectorId === socket.id;
  const selectorName = lobbyState.players.find((p) => p.id === round.selectorId)?.name;
  const hasSubmitted = !!round.mySubmission;
  const winnerName = round.winnerId
    ? lobbyState.players.find((p) => p.id === round.winnerId)?.name
    : null;

  const submittedCount = round.submissions?.length || 0;
  const expectedCount = lobbyState.players.filter(
    (p) => p.connected && p.id !== round.selectorId
  ).length;

  const submitCard = (cardIndex) =>
    emit("cards:submit-card", { roomCode: lobbyState.roomCode, cardIndex });
  const selectWinner = (winnerId) =>
    emit("cards:select-winner", { roomCode: lobbyState.roomCode, winnerId });

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {lobbyState.players
          .filter((p) => p.connected)
          .map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                p.id === round.selectorId ? "bg-accent text-white" : "bg-surface text-gray-300"
              }`}
            >
              {p.name}: {gameData.scores[p.id] || 0}
            </div>
          ))}
      </div>

      <div className="bg-black_card text-white p-6 rounded-xl text-xl font-semibold text-center shadow-lg border border-gray-700">
        {round.blackCard}
      </div>

      <p className="text-center text-gray-400 text-sm">
        {isSelector ? "You are the selector this round" : `${selectorName} is selecting`}
      </p>

      {round.winnerId && (
        <div className="text-center py-3 bg-accent/20 rounded-lg border border-accent/40 card-reveal">
          <p className="text-accent font-bold text-lg">{winnerName} wins this round!</p>
          <p className="text-gray-400 text-sm mt-1">Next round starting soon...</p>
        </div>
      )}

      {isSelector && !round.allSubmitted && submittedCount > 0 && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">
            Cards coming in ({submittedCount} of {expectedCount})...
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {round.submissions.map((_, i) => (
              <div
                key={i}
                className="card-reveal bg-surface border-2 border-gray-600 rounded-xl p-4 flex items-center justify-center"
                style={{ animationDelay: `${i * 100}ms`, minHeight: "120px" }}
              >
                <span className="text-gray-500 text-lg font-bold tracking-widest">?</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {round.submissions.map((sub, i) => (
              <FlipCard
                key={i}
                card={sub.card}
                playerName={sub.playerName}
                isWinner={round.winnerId && sub.playerId === round.winnerId}
                canPick={isSelector && !round.winnerId}
                showName={!!round.winnerId}
                delay={i * 200}
                onClick={() => selectWinner(sub.playerId)}
              />
            ))}
          </div>
        </div>
      )}

      {!round.allSubmitted && (!isSelector || submittedCount === 0) && (
        <div className="text-center flex items-center justify-center gap-2">
          <span className="text-gray-500">{submittedCount} of {expectedCount} cards in</span>
          <span className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-accent rounded-full counter-dot"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </span>
        </div>
      )}

      {!isSelector && !round.winnerId && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">
            {hasSubmitted ? "Your card is in. Waiting on others..." : "Pick a card to play:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameData.myHand.map((card, i) => (
              <button
                key={i}
                disabled={hasSubmitted}
                onClick={() => submitCard(i)}
                className={`hand-card bg-white_card text-gray-900 p-4 rounded-xl text-left font-medium shadow ${
                  hasSubmitted ? "opacity-50 cursor-not-allowed" : "hover:ring-2 hover:ring-accent"
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
