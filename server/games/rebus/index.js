import { RebusGameEvents, GameStatus, REBUS_ROUND_TIME, REBUS_READY_TIME } from "../../../shared/constants.js";
import { getRoom } from "../../lobbyManager.js";
import {
  initGameState, startNextRound, submitAnswer,
  revealRound, enterReadyPhase, markReady, getStateForPlayer,
} from "./gameLogic.js";

export const gameId = "rebus";

const roomTimers = new Map();

function clearRoomTimer(roomCode) {
  const t = roomTimers.get(roomCode);
  if (t) {
    clearInterval(t.interval);
    clearTimeout(t.timeout);
    roomTimers.delete(roomCode);
  }
}

function startReadyTimer(room, io, broadcastState) {
  const roomCode = room.roomCode;
  clearRoomTimer(roomCode);

  enterReadyPhase(room, REBUS_READY_TIME);
  broadcastState(room);

  const interval = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || !r.gameState?.readyPhase) {
      clearRoomTimer(roomCode);
      return;
    }
    const elapsed = (Date.now() - r.gameState.readyStartedAt) / 1000;
    r.gameState.readyTimeRemaining = Math.max(0, Math.round(REBUS_READY_TIME - elapsed));
    broadcastState(r);
  }, 1000);

  const timeout = setTimeout(() => {
    clearInterval(interval);
    roomTimers.delete(roomCode);
    const r = getRoom(roomCode);
    if (!r || r.status !== GameStatus.PLAYING) return;
    advanceToNextRound(r, io, broadcastState);
  }, REBUS_READY_TIME * 1000);

  roomTimers.set(roomCode, { interval, timeout });
}

function advanceToNextRound(room, io, broadcastState) {
  clearRoomTimer(room.roomCode);
  const nextRound = startNextRound(room);
  if (nextRound) {
    broadcastState(room);
    startRoundTimer(room, io, broadcastState);
  } else {
    broadcastState(room);
  }
}

function startRoundTimer(room, io, broadcastState) {
  const roomCode = room.roomCode;
  clearRoomTimer(roomCode);

  const interval = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || !r.gameState?.currentRound || r.gameState.currentRound.revealed) {
      clearRoomTimer(roomCode);
      return;
    }
    const elapsed = (Date.now() - r.gameState.currentRound.startedAt) / 1000;
    r.gameState.currentRound.timeRemaining = Math.max(0, Math.round(REBUS_ROUND_TIME - elapsed));
    broadcastState(r);
  }, 1000);

  const timeout = setTimeout(() => {
    clearInterval(interval);
    roomTimers.delete(roomCode);
    const r = getRoom(roomCode);
    if (!r || !r.gameState?.currentRound) return;
    revealRound(r);
    broadcastState(r);

    // Enter ready phase instead of auto-advancing
    if (r.status !== GameStatus.FINISHED) {
      setTimeout(() => {
        const r2 = getRoom(roomCode);
        if (!r2 || r2.status !== GameStatus.PLAYING) return;
        startReadyTimer(r2, io, broadcastState);
      }, 3000);
    }
  }, REBUS_ROUND_TIME * 1000);

  roomTimers.set(roomCode, { interval, timeout });
}

export function register(io, broadcastState) {
  io.on("connection", (socket) => {

    socket.on(RebusGameEvents.START_GAME, ({ roomCode }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room) throw new Error("Room not found");
        if (room.gameId !== gameId) throw new Error("Wrong game type");
        if (room.hostId !== socket.id) throw new Error("Only the host can start");
        const minPlayers = 2;
        if (room.players.filter((p) => p.connected).length < minPlayers) {
          throw new Error(`Need at least ${minPlayers} players`);
        }

        room.status = GameStatus.PLAYING;
        room.gameState = initGameState(room);
        const round = startNextRound(room);
        if (!round) throw new Error("No puzzles available");
        broadcastState(room);
        startRoundTimer(room, io, broadcastState);
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on(RebusGameEvents.SUBMIT_ANSWER, ({ roomCode, answer }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room || room.gameId !== gameId) throw new Error("Invalid room");
        const result = submitAnswer(room, socket.id, answer);

        if (result.allAnswered) {
          clearRoomTimer(roomCode);
          revealRound(room);
          broadcastState(room);

          if (room.status !== GameStatus.FINISHED) {
            setTimeout(() => {
              const r = getRoom(roomCode);
              if (!r || r.status !== GameStatus.PLAYING) return;
              startReadyTimer(r, io, broadcastState);
            }, 3000);
          }
        } else {
          broadcastState(room);
        }

        cb({ ok: true, correct: result.correct, partial: result.partial, matchScore: result.matchScore, points: result.points });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on(RebusGameEvents.READY_UP, ({ roomCode }, cb) => {
      try {
        const room = getRoom(roomCode);
        if (!room || room.gameId !== gameId) throw new Error("Invalid room");
        const { allReady } = markReady(room, socket.id);

        if (allReady) {
          advanceToNextRound(room, io, broadcastState);
        } else {
          broadcastState(room);
        }

        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });
  });
}

export { getStateForPlayer };
