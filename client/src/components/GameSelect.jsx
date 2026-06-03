import { useState } from "react";
import { GAMES } from "../../../shared/constants.js";
import { useGame } from "../context/GameContext.jsx";

export default function GameSelect() {
  const { createRoom, joinRoom } = useGame();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleCreate = async () => {
    if (!name.trim() || !selectedGame) return;
    await createRoom(name.trim(), selectedGame);
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return;
    await joinRoom(code.trim(), name.trim());
  };

  if (mode === "join") {
    return (
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Join a Game</h2>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="w-full px-4 py-3 rounded-lg bg-surface text-white placeholder-gray-500 border border-gray-700 focus:border-accent focus:outline-none"
        />
        <input
          type="text"
          placeholder="Room code (e.g. ABCX)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={4}
          className="w-full px-4 py-3 rounded-lg bg-surface text-white placeholder-gray-500 border border-gray-700 focus:border-accent focus:outline-none text-center text-2xl tracking-widest"
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || code.length < 4}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
        >
          Join Room
        </button>
        <button onClick={() => setMode(null)} className="w-full text-sm text-gray-500 hover:text-gray-300">
          Back
        </button>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">
          {selectedGame ? "Enter Your Name" : "Pick a Game"}
        </h2>

        {!selectedGame && (
          <div className="space-y-3">
            {GAMES.map((game) => (
              <button
                key={game.id}
                disabled={!game.enabled}
                onClick={() => setSelectedGame(game.id)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  game.enabled
                    ? "bg-surface border-gray-700 hover:border-accent cursor-pointer"
                    : "bg-surface/50 border-gray-800 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{game.name}</span>
                  {!game.enabled && (
                    <span className="text-xs text-gray-500 bg-bg px-2 py-0.5 rounded">Coming Soon</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{game.description}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {game.minPlayers}–{game.maxPlayers} players
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedGame && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg bg-surface text-white placeholder-gray-500 border border-gray-700 focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
            >
              Create Room
            </button>
            <button onClick={() => setSelectedGame(null)} className="w-full text-sm text-gray-500 hover:text-gray-300">
              Pick a different game
            </button>
          </div>
        )}

        <button onClick={() => { setMode(null); setSelectedGame(null); }} className="w-full text-sm text-gray-500 hover:text-gray-300">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <p className="text-gray-400 text-center text-sm">
        Party games for breaking the ice
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => setMode("create")}
          className="flex-1 py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition"
        >
          Create Game
        </button>
        <button
          onClick={() => setMode("join")}
          className="flex-1 py-3 rounded-lg bg-surface hover:bg-surface/80 border border-gray-600 font-semibold transition"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}
