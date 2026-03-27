import { useGame } from "../context/GameContext.jsx";
import CardImport from "./CardImport.jsx";

export default function Lobby() {
  const { gameState, startGame, socket } = useGame();
  const isHost = gameState.hostId === socket.id;
  const playerCount = gameState.players.filter((p) => p.connected).length;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">Room Code</p>
        <p className="text-5xl font-bold tracking-widest text-accent">
          {gameState.roomCode}
        </p>
        <p className="text-gray-500 text-xs mt-2">Share this code with friends</p>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-3">
          Players ({playerCount})
        </p>
        <div className="space-y-2">
          {gameState.players
            .filter((p) => p.connected)
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 bg-bg rounded"
              >
                <span>{p.name}</span>
                {p.id === gameState.hostId && (
                  <span className="text-xs text-accent font-semibold">HOST</span>
                )}
              </div>
            ))}
        </div>
      </div>

      {isHost && <CardImport />}

      {isHost ? (
        <button
          onClick={() => startGame(gameState.roomCode)}
          disabled={playerCount < 3}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
        >
          {playerCount < 3
            ? `Need ${3 - playerCount} more player${3 - playerCount > 1 ? "s" : ""}`
            : "Start Game"}
        </button>
      ) : (
        <p className="text-center text-gray-400">Waiting for host to start...</p>
      )}
    </div>
  );
}