import { CardGameEvents, GameStatus } from "../../../shared/constants.js";
import { getRoom } from "../../lobbyManager.js";
import {
  initGameState, startNextRound, submitCard,
  selectWinner, getStateForPlayer,
} from "./gameLogic.js";

export const gameId = "cards";

export function register(io, broadcastState) {
  io.on("connection", (socket) => {

    socket.on(CardGameEvents.UPLOAD_CARDS, ({ roomCode, cards }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room) throw new Error("Room not found");
        if (room.gameId !== gameId) throw new Error("Wrong game type");
        if (room.hostId !== socket.id) throw new Error("Only the host can upload cards");
        if (room.status !== GameStatus.LOBBY) throw new Error("Can only upload cards in the lobby");
        if (!cards?.blackCards?.length || !cards?.whiteCards?.length) throw new Error("Invalid card data");
        room._customCards = cards;
        cb({ ok: true });
        broadcastState(room);
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on(CardGameEvents.START_GAME, ({ roomCode }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room) throw new Error("Room not found");
        if (room.gameId !== gameId) throw new Error("Wrong game type");
        if (room.hostId !== socket.id) throw new Error("Only the host can start");
        const minPlayers = 3;
        if (room.players.filter((p) => p.connected).length < minPlayers) {
          throw new Error(`Need at least ${minPlayers} players`);
        }

        room.status = GameStatus.PLAYING;
        room.gameState = initGameState(room);
        const round = startNextRound(room);
        if (!round) throw new Error("Not enough cards");
        broadcastState(room);
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on(CardGameEvents.SUBMIT_CARD, ({ roomCode, cardIndex }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room || room.gameId !== gameId) throw new Error("Invalid room");
        const { allSubmitted } = submitCard(room, socket.id, cardIndex);
        if (allSubmitted) room.gameState.currentRound.revealed = true;
        broadcastState(room);
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on(CardGameEvents.SELECT_WINNER, ({ roomCode, winnerId }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room || room.gameId !== gameId) throw new Error("Invalid room");
        selectWinner(room, socket.id, winnerId);
        broadcastState(room);
        if (room.status !== GameStatus.FINISHED) {
          setTimeout(() => {
            const r = getRoom(roomCode);
            if (r && r.status === GameStatus.PLAYING) {
              startNextRound(r);
              broadcastState(r);
            }
          }, 4000);
        }
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });
  });
}

export { getStateForPlayer };
