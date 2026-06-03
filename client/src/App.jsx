import { useGame } from "./context/GameContext.jsx";
import GameSelect from "./components/GameSelect.jsx";
import Lobby from "./components/Lobby.jsx";

// Game-specific components
import CardsGameBoard from "./components/games/cards/GameBoard.jsx";
import CardsGameOver from "./components/games/cards/GameOver.jsx";
import RebusGameBoard from "./components/games/rebus/GameBoard.jsx";
import RebusGameOver from "./components/games/rebus/GameOver.jsx";

const gameComponents = {
  cards: { playing: CardsGameBoard, finished: CardsGameOver },
  rebus: { playing: RebusGameBoard, finished: RebusGameOver },
};

export default function App() {
  const { lobbyState, error, connected, clearError } = useGame();

  const gameId = lobbyState?.gameId;
  const status = lobbyState?.status;
  const components = gameId ? gameComponents[gameId] : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <button
        onClick={() => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank")}
        className="absolute top-4 right-4 px-3 py-1.5 text-xs bg-surface text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded transition"
      >
        HR Request
      </button>
      <h1 className="text-4xl font-bold text-accent mb-2">Icebreakers</h1>

      {!connected && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded mb-4">
          Connecting to server...
        </div>
      )}

      {error && (
        <div
          className="bg-red-900/50 text-red-200 px-4 py-2 rounded mb-4 cursor-pointer"
          onClick={clearError}
        >
          {error} <span className="text-xs ml-2">(click to dismiss)</span>
        </div>
      )}

      {!lobbyState && <GameSelect />}
      {status === "lobby" && <Lobby />}
      {status === "playing" && components?.playing && <components.playing />}
      {status === "finished" && components?.finished && <components.finished />}
    </div>
  );
}
