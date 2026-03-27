import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  createGame, joinGame, disconnectPlayer, startGame,
  startNextRound, submitCard, selectWinner, getGame, getStateForPlayer,
} from "./gameManager.js";
import { SocketEvents } from "../shared/constants.js";

const app = express();
app.use(cors());
app.use(express.json());

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
      // Auto-advance to next round after a delay
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));