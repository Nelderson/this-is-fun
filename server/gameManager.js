import { GameStatus, HAND_SIZE, DEFAULT_TARGET_SCORE, MIN_PLAYERS } from "../shared/constants.js";
import { shuffle, defaultBlackCards, defaultWhiteCards } from "./deck.js";

const games = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return games.has(code) ? generateRoomCode() : code;
}

export function createGame(hostId, hostName) {
  const code = generateRoomCode();
  const game = {
    roomCode: code,
    hostId,
    status: GameStatus.LOBBY,
    players: [{ id: hostId, name: hostName, connected: true }],
    scores: { [hostId]: 0 },
    blackCards: [],
    whiteCards: [],
    hands: {},
    currentRound: null,
    selectorIndex: -1,
    targetScore: DEFAULT_TARGET_SCORE,
    customCards: null,
  };
  games.set(code, game);
  return game;
}

export function joinGame(roomCode, playerId, playerName) {
  const game = games.get(roomCode);
  if (!game) throw new Error("Room not found");
  if (game.status !== GameStatus.LOBBY) throw new Error("Game already in progress");

  const existing = game.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = playerName;
  } else {
    game.players.push({ id: playerId, name: playerName, connected: true });
    game.scores[playerId] = 0;
  }
  return game;
}

export function disconnectPlayer(playerId) {
  for (const [, game] of games) {
    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      const connected = game.players.filter((p) => p.connected);
      if (connected.length === 0) {
        games.delete(game.roomCode);
      }
      return game;
    }
  }
  return null;
}

export function startGame(roomCode, requesterId) {
  const game = games.get(roomCode);
  if (!game) throw new Error("Room not found");
  if (game.hostId !== requesterId) throw new Error("Only the host can start the game");
  if (game.players.filter((p) => p.connected).length < MIN_PLAYERS) {
    throw new Error(`Need at least ${MIN_PLAYERS} players`);
  }

  const blacks = game.customCards?.blackCards ?? [...defaultBlackCards];
  const whites = game.customCards?.whiteCards ?? [...defaultWhiteCards];
  game.blackCards = shuffle(blacks);
  game.whiteCards = shuffle(whites);
  game.status = GameStatus.PLAYING;
  game.selectorIndex = -1;

  // Deal hands
  for (const p of game.players) {
    game.hands[p.id] = game.whiteCards.splice(0, HAND_SIZE);
  }

  return game;
}

export function startNextRound(game) {
  if (game.blackCards.length === 0) {
    game.status = GameStatus.FINISHED;
    return null;
  }

  const connected = game.players.filter((p) => p.connected);
  game.selectorIndex = (game.selectorIndex + 1) % connected.length;
  const selector = connected[game.selectorIndex];
  const blackCard = game.blackCards.pop();

  game.currentRound = {
    selectorId: selector.id,
    blackCard,
    submissions: [],
    winnerId: null,
    revealed: false,
  };

  return game.currentRound;
}

export function submitCard(roomCode, playerId, cardIndex) {
  const game = games.get(roomCode);
  if (!game || !game.currentRound) throw new Error("No active round");
  if (playerId === game.currentRound.selectorId) throw new Error("Selector cannot submit");
  if (game.currentRound.submissions.find((s) => s.playerId === playerId)) {
    throw new Error("Already submitted");
  }

  const hand = game.hands[playerId];
  if (cardIndex < 0 || cardIndex >= hand.length) throw new Error("Invalid card index");

  const [card] = hand.splice(cardIndex, 1);
  // Replenish hand
  if (game.whiteCards.length > 0) {
    hand.push(game.whiteCards.pop());
  }

  game.currentRound.submissions.push({ playerId, card });

  const expectedCount = game.players.filter(
    (p) => p.connected && p.id !== game.currentRound.selectorId
  ).length;

  return {
    game,
    allSubmitted: game.currentRound.submissions.length >= expectedCount,
  };
}

export function selectWinner(roomCode, requesterId, winnerPlayerId) {
  const game = games.get(roomCode);
  if (!game || !game.currentRound) throw new Error("No active round");
  if (requesterId !== game.currentRound.selectorId) throw new Error("Only selector can pick");

  const sub = game.currentRound.submissions.find((s) => s.playerId === winnerPlayerId);
  if (!sub) throw new Error("Invalid winner");

  game.currentRound.winnerId = winnerPlayerId;
  game.scores[winnerPlayerId] = (game.scores[winnerPlayerId] || 0) + 1;

  if (game.scores[winnerPlayerId] >= game.targetScore) {
    game.status = GameStatus.FINISHED;
  }

  return game;
}

export function getGame(roomCode) {
  return games.get(roomCode) || null;
}

// Build a sanitized state for a specific player (hide other hands)
export function getStateForPlayer(game, playerId) {
  return {
    roomCode: game.roomCode,
    hostId: game.hostId,
    status: game.status,
    players: game.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
    })),
    scores: game.scores,
    targetScore: game.targetScore,
    myHand: game.hands[playerId] || [],
    currentRound: game.currentRound
      ? {
          selectorId: game.currentRound.selectorId,
          blackCard: game.currentRound.blackCard,
          mySubmission: game.currentRound.submissions.find((s) => s.playerId === playerId)?.card || null,
          submissions: game.currentRound.revealed
            ? game.currentRound.submissions.map((s) => ({
                playerId: s.playerId,
                playerName: game.players.find((p) => p.id === s.playerId)?.name || "Unknown",
                card: s.card,
              }))
            : game.currentRound.submissions.map(() => ({ card: "???" })),
          allSubmitted:
            game.currentRound.submissions.length >=
            game.players.filter((p) => p.connected && p.id !== game.currentRound.selectorId).length,
          winnerId: game.currentRound.winnerId,
        }
      : null,
  };
}