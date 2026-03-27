import { useGame } from "./context/GameContext.jsx";
import Home from "./components/Home.jsx";
import Lobby from "./components/Lobby.jsx";
import GameBoard from "./components/GameBoard.jsx";
import GameOver from "./components/GameOver.jsx";

export default function App() {
  const { gameState, error, connected, clearError } = useGame();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-accent mb-2">This Is Fun</h1>

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

      {!gameState && <Home />}
      {gameState?.status === "lobby" && <Lobby />}
      {gameState?.status === "playing" && <GameBoard />}
      {gameState?.status === "finished" && <GameOver />}
    </div>
  );
}