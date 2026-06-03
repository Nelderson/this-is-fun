import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { LobbyEvents } from "../shared/constants.js";
import {
  createRoom, joinRoom, disconnectPlayer, getRoom, getLobbyState,
} from "./lobbyManager.js";

// --- Game plugins ---
import * as cardsGame from "./games/cards/index.js";
import * as rebusGame from "./games/rebus/index.js";

const gamePlugins = {
  [cardsGame.gameId]: cardsGame,
  [rebusGame.gameId]: rebusGame,
};

// --- Express setup ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const clientPath = join(__dirname, "../client/dist");
app.use(express.static(clientPath));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- Broadcast helper ---
function broadcastState(room) {
  const lobby = getLobbyState(room);
  const plugin = gamePlugins[room.gameId];

  for (const p of room.players) {
    const sock = io.sockets.sockets.get(p.id);
    if (!sock) continue;

    const payload = { ...lobby };
    if (room.gameState && plugin?.getStateForPlayer) {
      payload.game = plugin.getStateForPlayer(room, p.id);
    }
    sock.emit(LobbyEvents.GAME_STATE, payload);
  }
}

// --- Shared lobby events ---
io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on(LobbyEvents.CREATE_ROOM, ({ playerName, gameId }, cb) => {
    try {
      if (!gamePlugins[gameId]) throw new Error("Unknown game");
      const room = createRoom(socket.id, playerName, gameId);
      socket.join(room.roomCode);
      cb({ ok: true, roomCode: room.roomCode });
      broadcastState(room);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on(LobbyEvents.JOIN_ROOM, ({ roomCode, playerName }, cb) => {
    try {
      const code = roomCode.toUpperCase().trim();
      const room = joinRoom(code, socket.id, playerName);
      socket.join(code);
      cb({ ok: true, gameId: room.gameId });
      broadcastState(room);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    const room = disconnectPlayer(socket.id);
    if (room) broadcastState(room);
  });
});

// --- Register game plugins ---
for (const plugin of Object.values(gamePlugins)) {
  plugin.register(io, broadcastState);
}

// --- SPA fallback ---
app.get("*", (req, res) => {
  res.sendFile(join(clientPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));
