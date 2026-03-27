import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const GameContext = createContext(null);

// In production, socket.io connects to the same origin (server serves both the app and websockets).
// In dev, connect directly to the local server.
const isDev = import.meta.env.DEV;
const socket = io(isDev ? "http://localhost:3001" : undefined, { autoConnect: true });

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("game-state", (state) => {
      setGameState(state);
      setError(null);
    });
    socket.on("error", (msg) => setError(msg));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("game-state");
      socket.off("error");
    };
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      socket.emit(event, data, (response) => {
        if (!response.ok) setError(response.error);
        else setError(null);
        resolve(response);
      });
    });
  }, []);

  const createRoom = (playerName) => emit("create-room", { playerName });
  const joinRoom = (roomCode, playerName) => emit("join-room", { roomCode, playerName });
  const startGame = (roomCode) => emit("start-game", { roomCode });
  const submitCard = (roomCode, cardIndex) => emit("submit-card", { roomCode, cardIndex });
  const selectWinner = (roomCode, winnerId) => emit("select-winner", { roomCode, winnerId });

  return (
    <GameContext.Provider
      value={{
        socket, gameState, error, connected,
        createRoom, joinRoom, startGame, submitCard, selectWinner,
        clearError: () => setError(null),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);