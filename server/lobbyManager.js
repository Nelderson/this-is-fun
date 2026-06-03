import { GameStatus } from "../shared/constants.js";

const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateRoomCode() : code;
}

export function createRoom(hostId, hostName, gameId) {
  const code = generateRoomCode();
  const room = {
    roomCode: code,
    gameId,
    hostId,
    status: GameStatus.LOBBY,
    players: [{ id: hostId, name: hostName, connected: true }],
    gameState: null,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(roomCode, playerId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error("Room not found");
  if (room.status !== GameStatus.LOBBY) throw new Error("Game already in progress");

  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = playerName;
  } else {
    room.players.push({ id: playerId, name: playerName, connected: true });
  }
  return room;
}

export function disconnectPlayer(playerId) {
  for (const [code, room] of rooms) {
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      const connected = room.players.filter((p) => p.connected);
      if (connected.length === 0) {
        rooms.delete(code);
        return null;
      }
      return room;
    }
  }
  return null;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

export function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

export function getLobbyState(room) {
  return {
    roomCode: room.roomCode,
    gameId: room.gameId,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
    })),
  };
}

export function findRoomByPlayer(playerId) {
  for (const [, room] of rooms) {
    if (room.players.find((p) => p.id === playerId)) return room;
  }
  return null;
}
