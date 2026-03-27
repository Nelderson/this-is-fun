import { useState, useRef } from "react";
import { useGame } from "../context/GameContext.jsx";

export default function CardImport() {
  const { socket, gameState } = useGame();
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [deckInfo, setDeckInfo] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!Array.isArray(data.blackCards) || !Array.isArray(data.whiteCards)) {
        throw new Error('JSON must have "blackCards" and "whiteCards" arrays');
      }
      if (data.blackCards.length < 5) {
        throw new Error("Need at least 5 black cards");
      }
      if (data.whiteCards.length < 20) {
        throw new Error("Need at least 20 white cards");
      }

      // Check that all entries are strings
      const badBlack = data.blackCards.find((c) => typeof c !== "string");
      const badWhite = data.whiteCards.find((c) => typeof c !== "string");
      if (badBlack || badWhite) {
        throw new Error("All cards must be strings");
      }

      // Send to server
      socket.emit("upload-cards", {
        roomCode: gameState.roomCode,
        cards: { blackCards: data.blackCards, whiteCards: data.whiteCards },
      }, (res) => {
        if (res.ok) {
          setDeckInfo({ black: data.blackCards.length, white: data.whiteCards.length });
          setStatus({ type: "success", msg: "Custom deck loaded!" });
        } else {
          setStatus({ type: "error", msg: res.error });
        }
      });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-surface rounded-lg p-4 space-y-3">
      <p className="text-sm text-gray-400">Custom Deck (optional)</p>

      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-600 hover:border-accent cursor-pointer transition text-sm text-gray-300 hover:text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Upload JSON deck file</span>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {status && (
        <p className={`text-xs ${status.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {status.msg}
        </p>
      )}

      {deckInfo && (
        <p className="text-xs text-gray-500">
          {deckInfo.black} black cards, {deckInfo.white} white cards
        </p>
      )}

      <details className="text-xs text-gray-600">
        <summary className="cursor-pointer hover:text-gray-400 transition">
          JSON format
        </summary>
        <pre className="mt-2 bg-bg p-2 rounded text-gray-500 overflow-x-auto">
{`{
  "blackCards": [
    "Why is _ always so fun?",
    "_ + _ = disaster"
  ],
  "whiteCards": [
    "A rubber duck",
    "Existential dread",
    "Free WiFi"
  ]
}`}
        </pre>
      </details>
    </div>
  );
}