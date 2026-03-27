import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  createGame, joinGame, disconnectPlayer, startGame,
  startNextRound, submitCard, selectWinner, getGame, getStateForPlayer,
} from "./gameManager.js";
import { SocketEvents } from "../shared/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Serve built React client in production
const clientPath = join(__dirname, "../client/dist");
app.use(express.static(clientPath));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

function broadcastGameState(game) {
  for (const p of game.players) {
    const sock = io.sockets.sockets.get(p.id);
    if (sock) sock.emit(SocketEvents.GAME_STATE, getStateForPlayer(game, p.id));
  }
}

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on(SocketEvents.CREATE_ROOM, ({ playerName }, cb) => {
    try {
      const game = createGame(socket.id, playerName);
      socket.join(game.roomCode);
      cb({ ok: true, roomCode: game.roomCode });
      broadcastGameState(game);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on(SocketEvents.JOIN_ROOM, ({ roomCode, playerName }, cb) => {
    try {
      const code = roomCode.toUpperCase().trim();
      const game = joinGame(code, socket.id, playerName);
      socket.join(code);
      cb({ ok: true });
      broadcastGameState(game);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on("upload-cards", ({ roomCode, cards }, cb) => {
    try {
      const game = getGame(roomCode);
      if (!game) throw new Error("Room not found");
      if (game.hostId !== socket.id) throw new Error("Only the host can upload cards");
      if (game.status !== "lobby") throw new Error("Can only upload cards in the lobby");
      if (!cards?.blackCards?.length || !cards?.whiteCards?.length) {
        throw new Error("Invalid card data");
      }
      game.customCards = cards;
      cb({ ok: true });
      broadcastGameState(game);
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on(SocketEvents.START_GAME, ({ roomCode }, cb) => {
    try {
      const game = startGame(roomCode, socket.id);
      const round = startNextRound(game);
      if (!round) throw new Error("Not enough cards");
      broadcastGameState(game);
      cb({ ok: true });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on(SocketEvents.SUBMIT_CARD, ({ roomCode, cardIndex }, cb) => {
    try {
      const { game, allSubmitted } = submitCard(roomCode, socket.id, cardIndex);
      if (allSubmitted) {
        game.currentRound.revealed = true;
      }
      broadcastGameState(game);
      cb({ ok: true });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on(SocketEvents.SELECT_WINNER, ({ roomCode, winnerId }, cb) => {
    try {
      const game = selectWinner(roomCode, socket.id, winnerId);
      broadcastGameState(game);
      if (game.status !== "finished") {
        setTimeout(() => {
          const g = getGame(roomCode);
          if (g && g.status === "playing") {
            startNextRound(g);
            broadcastGameState(g);
          }
        }, 4000);
      }
      cb({ ok: true });
    } catch (e) {
      cb({ ok: false, error: e.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    const game = disconnectPlayer(socket.id);
    if (game) broadcastGameState(game);
  });
});

// SPA fallback — serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(join(clientPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));