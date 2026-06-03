import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const GameContext = createContext(null);

const isDev = import.meta.env.DEV;
const socket = io(isDev ? "http://localhost:3001" : undefined, { autoConnect: true });

export function GameProvider({ children }) {
  const [lobbyState, setLobbyState] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("game-state", (state) => {
      const { game, ...lobby } = state;
      setLobbyState(lobby);
      setGameData(game || null);
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

  const createRoom = (playerName, gameId) => emit("create-room", { playerName, gameId });
  const joinRoom = (roomCode, playerName) => emit("join-room", { roomCode, playerName });

  const resetState = () => {
    setLobbyState(null);
    setGameData(null);
    setError(null);
  };

  return (
    <GameContext.Provider
      value={{
        socket, lobbyState, gameData, error, connected,
        createRoom, joinRoom, emit, resetState,
        clearError: () => setError(null),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
