import { useState, useEffect, useRef } from "react";
import { useGame } from "../../../context/GameContext.jsx";

export default function RebusGameBoard() {
  const { lobbyState, gameData, emit, socket } = useGame();
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);
  const prevRoundRef = useRef(-1);

  const round = gameData?.currentRound;
  const roundIndex = gameData?.currentRoundIndex ?? -1;
  const readyPhase = gameData?.readyPhase;
  const readyPlayers = gameData?.readyPlayers || [];
  const readyTimeRemaining = gameData?.readyTimeRemaining ?? 0;
  const isReady = readyPlayers.includes(socket.id);
  const connectedPlayers = lobbyState.players.filter((p) => p.connected);

  useEffect(() => {
    if (roundIndex !== prevRoundRef.current) {
      prevRoundRef.current = roundIndex;
      setAnswer("");
      setFeedback(null);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [roundIndex]);

  if (!round && !readyPhase) return <p className="text-gray-400">Waiting for next round...</p>;

  // --- Ready phase screen ---
  if (readyPhase) {
    const readyPct = (readyTimeRemaining / 30) * 100;
    return (
      <div className="w-full max-w-2xl space-y-6">
        {/* Scoreboard */}
        <div className="flex flex-wrap gap-3 justify-center">
          {connectedPlayers
            .sort((a, b) => (gameData.scores[b.id] || 0) - (gameData.scores[a.id] || 0))
            .map((p) => (
              <div
                key={p.id}
                className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                  p.id === socket.id ? "bg-accent text-white" : "bg-surface text-gray-300"
                }`}
              >
                {p.name}: {gameData.scores[p.id] || 0}
              </div>
            ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">
            Round {roundIndex + 2} of {gameData.totalRounds}
          </p>

          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${readyPct}%` }}
            />
          </div>

          <p className="text-gray-500 text-sm">
            Next round in {readyTimeRemaining}s or when everyone is ready
          </p>

          {!isReady ? (
            <button
              onClick={() => emit("rebus:ready-up", { roomCode: lobbyState.roomCode })}
              className="px-8 py-4 rounded-xl bg-accent hover:bg-accent/80 font-bold text-lg transition transform hover:scale-105"
            >
              Ready for Next Round
            </button>
          ) : (
            <p className="text-accent font-semibold">You're ready!</p>
          )}

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {connectedPlayers.map((p) => (
              <span
                key={p.id}
                className={`text-xs px-2 py-1 rounded ${
                  readyPlayers.includes(p.id)
                    ? "bg-green-900/30 text-green-400"
                    : "bg-surface text-gray-500"
                }`}
              >
                {p.name} {readyPlayers.includes(p.id) ? "✓" : "..."}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Active round ---
  const hasSubmitted = !!round.mySubmission;
  const timerPct = (round.timeRemaining / gameData.roundTime) * 100;
  const timerColor = round.timeRemaining <= 5 ? "bg-red-500" : round.timeRemaining <= 10 ? "bg-yellow-500" : "bg-accent";

  const handleSubmit = async () => {
    if (!answer.trim() || hasSubmitted) return;
    const res = await emit("rebus:submit-answer", {
      roomCode: lobbyState.roomCode,
      answer: answer.trim(),
    });
    if (res.ok) {
      setFeedback({ correct: res.correct, partial: res.partial, matchScore: res.matchScore, points: res.points });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Scoreboard */}
      <div className="flex flex-wrap gap-3 justify-center">
        {connectedPlayers
          .sort((a, b) => (gameData.scores[b.id] || 0) - (gameData.scores[a.id] || 0))
          .map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                p.id === socket.id ? "bg-accent text-white" : "bg-surface text-gray-300"
              }`}
            >
              {p.name}: {gameData.scores[p.id] || 0}
            </div>
          ))}
      </div>

      <p className="text-center text-gray-500 text-xs">
        Round {roundIndex + 1} of {gameData.totalRounds}
      </p>

      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${timerColor} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${timerPct}%` }}
        />
      </div>
      <p className="text-center text-gray-400 text-sm">
        {round.timeRemaining}s remaining
      </p>

      {/* Puzzle display */}
      <div className="bg-white rounded-xl text-center shadow-lg border border-gray-700 overflow-hidden">
        {round.isImage ? (
          <img
            src={round.display}
            alt="Rebus puzzle"
            className="w-full max-h-96 object-contain mx-auto"
            draggable={false}
          />
        ) : (
          <p className="text-5xl leading-relaxed tracking-wide p-8">{round.display}</p>
        )}
      </div>

      {/* Answer input or results */}
      {!round.revealed ? (
        <div className="space-y-3">
          {feedback ? (
            <div className={`text-center py-3 rounded-lg border ${
              feedback.correct
                ? "bg-green-900/30 border-green-600/40 text-green-400"
                : feedback.partial
                ? "bg-yellow-900/30 border-yellow-600/40 text-yellow-400"
                : "bg-red-900/30 border-red-600/40 text-red-400"
            }`}>
              {feedback.correct ? (
                <p className="font-bold text-lg">Correct! +{feedback.points} points</p>
              ) : feedback.partial ? (
                <div>
                  <p className="font-bold text-lg">Close! {feedback.matchScore}% match</p>
                  <p className="text-sm mt-1">+{feedback.points} points (partial credit)</p>
                </div>
              ) : (
                <p className="font-bold text-lg">Wrong! Waiting for round to end...</p>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={hasSubmitted}
                maxLength={100}
                className="flex-1 px-4 py-3 rounded-lg bg-bg text-white placeholder-gray-500 border border-gray-700 focus:border-accent focus:outline-none text-lg"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || hasSubmitted}
                className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {round.submissions?.map((s, i) => (
              <span key={i} className="text-xs bg-surface px-2 py-1 rounded text-gray-400">
                {s.playerName} ✓
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Round results */
        <div className="space-y-4">
          <div className="text-center py-3 bg-accent/20 rounded-lg border border-accent/40">
            <p className="text-gray-400 text-sm">The answer was</p>
            <p className="text-accent font-bold text-2xl mt-1">{round.answer}</p>
          </div>

          <div className="bg-surface rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-400 mb-2">Results:</p>
            {round.submissions
              .sort((a, b) => b.points - a.points)
              .map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                    s.correct
                      ? "bg-green-900/20 text-green-300"
                      : s.partial
                      ? "bg-yellow-900/20 text-yellow-300"
                      : "bg-red-900/20 text-red-300"
                  }`}
                >
                  <div>
                    <span className="font-medium">{s.playerName}</span>
                    <span className="text-gray-500 ml-2">"{s.answer}"</span>
                    {s.correct && (
                      <span className="text-gray-500 ml-1">({s.timeRemaining}s left)</span>
                    )}
                    {s.partial && (
                      <span className="text-yellow-500 ml-1">({s.matchScore}% match, {s.timeRemaining}s left)</span>
                    )}
                  </div>
                  <span className="font-bold">
                    {s.points > 0 ? `+${s.points}` : "0"}
                  </span>
                </div>
              ))}
            {connectedPlayers
              .filter((p) => !round.submissions.find((s) => s.playerId === p.id))
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded text-sm bg-bg text-gray-500">
                  <span>{p.name} — no answer</span>
                  <span>0</span>
                </div>
              ))}
          </div>

          <p className="text-center text-gray-500 text-sm animate-pulse">
            Get ready for next round...
          </p>
        </div>
      )}
    </div>
  );
}
