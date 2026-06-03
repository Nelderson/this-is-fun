import { useGame } from "../context/GameContext.jsx";
import { GAMES } from "../../../shared/constants.js";
import CardImport from "./games/cards/CardImport.jsx";

const gameLobbyExtras = {
  cards: CardImport,
};

export default function Lobby() {
  const { lobbyState, emit, socket } = useGame();
  const isHost = lobbyState.hostId === socket.id;
  const playerCount = lobbyState.players.filter((p) => p.connected).length;
  const gameMeta = GAMES.find((g) => g.id === lobbyState.gameId);
  const minPlayers = gameMeta?.minPlayers || 3;

  const startEvent = `${lobbyState.gameId}:start-game`;

  const LobbyExtra = gameLobbyExtras[lobbyState.gameId];

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <p className="text-gray-500 text-xs mb-1">{gameMeta?.name || lobbyState.gameId}</p>
        <p className="text-gray-400 text-sm mb-1">Room Code</p>
        <p className="text-5xl font-bold tracking-widest text-accent">
          {lobbyState.roomCode}
        </p>
        <p className="text-gray-500 text-xs mt-2">Share this code with friends</p>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-3">
          Players ({playerCount})
        </p>
        <div className="space-y-2">
          {lobbyState.players
            .filter((p) => p.connected)
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 bg-bg rounded"
              >
                <span>{p.name}</span>
                {p.id === lobbyState.hostId && (
                  <span className="text-xs text-accent font-semibold">HOST</span>
                )}
              </div>
            ))}
        </div>
      </div>

      {isHost && LobbyExtra && <LobbyExtra />}

      {isHost ? (
        <button
          onClick={() => emit(startEvent, { roomCode: lobbyState.roomCode })}
          disabled={playerCount < minPlayers}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
        >
          {playerCount < minPlayers
            ? `Need ${minPlayers - playerCount} more player${minPlayers - playerCount > 1 ? "s" : ""}`
            : "Start Game"}
        </button>
      ) : (
        <p className="text-center text-gray-400">Waiting for host to start...</p>
      )}
    </div>
  );
}
