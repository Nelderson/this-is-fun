import { GameStatus, HAND_SIZE, DEFAULT_TARGET_SCORE } from "../../../shared/constants.js";
import { shuffle, defaultBlackCards, defaultWhiteCards } from "./deck.js";

export function initGameState(room) {
  const blacks = room._customCards?.blackCards ?? [...defaultBlackCards];
  const whites = room._customCards?.whiteCards ?? [...defaultWhiteCards];

  const state = {
    blackCards: shuffle(blacks),
    whiteCards: shuffle(whites),
    hands: {},
    scores: {},
    currentRound: null,
    selectorIndex: -1,
    targetScore: DEFAULT_TARGET_SCORE,
  };

  for (const p of room.players) {
    state.scores[p.id] = 0;
    state.hands[p.id] = state.whiteCards.splice(0, HAND_SIZE);
  }

  return state;
}

export function startNextRound(room) {
  const gs = room.gameState;
  if (gs.blackCards.length === 0) {
    room.status = GameStatus.FINISHED;
    return null;
  }

  const connected = room.players.filter((p) => p.connected);
  gs.selectorIndex = (gs.selectorIndex + 1) % connected.length;
  const selector = connected[gs.selectorIndex];
  const blackCard = gs.blackCards.pop();

  gs.currentRound = {
    selectorId: selector.id,
    blackCard,
    submissions: [],
    winnerId: null,
    revealed: false,
  };

  return gs.currentRound;
}

export function submitCard(room, playerId, cardIndex) {
  const gs = room.gameState;
  const round = gs.currentRound;
  if (!round) throw new Error("No active round");
  if (playerId === round.selectorId) throw new Error("Selector cannot submit");
  if (round.submissions.find((s) => s.playerId === playerId)) throw new Error("Already submitted");

  const hand = gs.hands[playerId];
  if (cardIndex < 0 || cardIndex >= hand.length) throw new Error("Invalid card index");

  const [card] = hand.splice(cardIndex, 1);
  if (gs.whiteCards.length > 0) hand.push(gs.whiteCards.pop());

  round.submissions.push({ playerId, card });

  const expectedCount = room.players.filter(
    (p) => p.connected && p.id !== round.selectorId
  ).length;

  return { allSubmitted: round.submissions.length >= expectedCount };
}

export function selectWinner(room, requesterId, winnerPlayerId) {
  const gs = room.gameState;
  const round = gs.currentRound;
  if (!round) throw new Error("No active round");
  if (requesterId !== round.selectorId) throw new Error("Only selector can pick");

  const sub = round.submissions.find((s) => s.playerId === winnerPlayerId);
  if (!sub) throw new Error("Invalid winner");

  round.winnerId = winnerPlayerId;
  gs.scores[winnerPlayerId] = (gs.scores[winnerPlayerId] || 0) + 1;

  if (gs.scores[winnerPlayerId] >= gs.targetScore) {
    room.status = GameStatus.FINISHED;
  }
}

export function getStateForPlayer(room, playerId) {
  const gs = room.gameState;
  return {
    scores: gs.scores,
    targetScore: gs.targetScore,
    myHand: gs.hands[playerId] || [],
    currentRound: gs.currentRound
      ? {
          selectorId: gs.currentRound.selectorId,
          blackCard: gs.currentRound.blackCard,
          mySubmission: gs.currentRound.submissions.find((s) => s.playerId === playerId)?.card || null,
          submissions: gs.currentRound.revealed
            ? gs.currentRound.submissions.map((s) => ({
                playerId: s.playerId,
                playerName: room.players.find((p) => p.id === s.playerId)?.name || "Unknown",
                card: s.card,
              }))
            : gs.currentRound.submissions.map(() => ({ card: "???" })),
          allSubmitted:
            gs.currentRound.submissions.length >=
            room.players.filter((p) => p.connected && p.id !== gs.currentRound.selectorId).length,
          winnerId: gs.currentRound.winnerId,
        }
      : null,
  };
}
