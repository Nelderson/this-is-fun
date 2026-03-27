import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";

export default function Home() {
  const { createRoom, joinRoom } = useGame();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState(null); // "create" | "join"

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createRoom(name.trim());
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return;
    await joinRoom(code.trim(), name.trim());
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <p className="text-gray-400 text-center text-sm">
        A party game for horrible (and hilarious) people
      </p>

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        className="w-full px-4 py-3 rounded-lg bg-surface text-white placeholder-gray-500 border border-gray-700 focus:border-accent focus:outline-none"
      />

      {!mode && (
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
      )}

      {mode === "create" && (
        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 font-semibold transition disabled:opacity-40"
          >
            Create Room
          </button>
          <button onClick={() => setMode(null)} className="w-full text-sm text-gray-500 hover:text-gray-300">
            Back
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="space-y-3">
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
      )}
    </div>
  );
}