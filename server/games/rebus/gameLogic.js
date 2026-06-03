import { GameStatus, REBUS_ROUND_TIME, REBUS_TOTAL_ROUNDS } from "../../../shared/constants.js";
import { shuffle, defaultPuzzles } from "./puzzles.js";

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(the|a|an|its|it's)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(str) {
  return normalize(str).split(" ").filter(Boolean);
}

// Calculate match score: fraction of answer words present in the guess
// Returns 0-1 where 1 = perfect match
function scoreAnswer(guess, correctAnswer, alternates) {
  const allAnswers = [correctAnswer, ...(alternates || [])];

  let bestScore = 0;

  for (const answer of allAnswers) {
    const answerWords = getWords(answer);
    const guessWords = getWords(guess);

    if (answerWords.length === 0) continue;

    // Exact match after normalization
    if (normalize(guess) === normalize(answer)) return 1.0;

    // Count how many answer words appear in the guess
    let matched = 0;
    for (const aw of answerWords) {
      if (guessWords.some((gw) => gw === aw)) {
        matched++;
      }
    }

    const score = matched / answerWords.length;
    if (score > bestScore) bestScore = score;
  }

  return bestScore;
}

export function initGameState(room) {
  const count = Math.min(REBUS_TOTAL_ROUNDS, defaultPuzzles.length);
  const puzzles = shuffle([...defaultPuzzles]).slice(0, count);
  const state = {
    puzzles,
    currentRoundIndex: -1,
    currentRound: null,
    scores: {},
    totalRounds: puzzles.length,
    roundTime: REBUS_ROUND_TIME,
    // Ready-up state between rounds
    readyPhase: false,
    readyPlayers: [],
    readyTimeRemaining: 0,
  };

  for (const p of room.players) {
    state.scores[p.id] = 0;
  }

  return state;
}

export function startNextRound(room) {
  const gs = room.gameState;
  gs.currentRoundIndex++;
  gs.readyPhase = false;
  gs.readyPlayers = [];
  gs.readyTimeRemaining = 0;

  if (gs.currentRoundIndex >= gs.totalRounds) {
    room.status = GameStatus.FINISHED;
    return null;
  }

  const puzzle = gs.puzzles[gs.currentRoundIndex];
  gs.currentRound = {
    display: puzzle.display,
    answer: puzzle.answer,
    alternates: puzzle.alternates || [],
    isImage: puzzle.isImage || false,
    submissions: [],
    timeRemaining: gs.roundTime,
    startedAt: Date.now(),
    revealed: false,
  };

  return gs.currentRound;
}

export function enterReadyPhase(room, readyTime) {
  const gs = room.gameState;
  gs.readyPhase = true;
  gs.readyPlayers = [];
  gs.readyTimeRemaining = readyTime;
  gs.readyStartedAt = Date.now();
}

export function markReady(room, playerId) {
  const gs = room.gameState;
  if (!gs.readyPhase) throw new Error("Not in ready phase");
  if (gs.readyPlayers.includes(playerId)) throw new Error("Already ready");
  gs.readyPlayers.push(playerId);

  const connectedCount = room.players.filter((p) => p.connected).length;
  return { allReady: gs.readyPlayers.length >= connectedCount };
}

export function submitAnswer(room, playerId, answer) {
  const gs = room.gameState;
  const round = gs.currentRound;
  if (!round || round.revealed) throw new Error("No active round");
  if (round.submissions.find((s) => s.playerId === playerId)) {
    throw new Error("Already answered");
  }

  const matchScore = scoreAnswer(answer, round.answer, round.alternates);
  const exact = matchScore === 1.0;
  const partial = matchScore > 0 && matchScore < 1.0;

  const elapsed = (Date.now() - round.startedAt) / 1000;
  const timeRemaining = Math.max(0, Math.round(gs.roundTime - elapsed));
  const playerCount = room.players.filter((p) => p.connected).length;
  const rawPoints = playerCount * timeRemaining;
  const points = Math.round(rawPoints * matchScore);

  if (points > 0) {
    gs.scores[playerId] = (gs.scores[playerId] || 0) + points;
  }

  round.submissions.push({
    playerId,
    answer,
    correct: exact,
    partial,
    matchScore: Math.round(matchScore * 100),
    points,
    timeRemaining,
  });

  const allAnswered = round.submissions.length >=
    room.players.filter((p) => p.connected).length;

  return { correct: exact, partial, matchScore: Math.round(matchScore * 100), points, allAnswered };
}

export function revealRound(room) {
  const gs = room.gameState;
  if (gs.currentRound) {
    gs.currentRound.revealed = true;
  }
}

export function getStateForPlayer(room, playerId) {
  const gs = room.gameState;
  const round = gs.currentRound;

  return {
    scores: gs.scores,
    totalRounds: gs.totalRounds,
    currentRoundIndex: gs.currentRoundIndex,
    roundTime: gs.roundTime,
    readyPhase: gs.readyPhase,
    readyPlayers: gs.readyPlayers,
    readyTimeRemaining: gs.readyTimeRemaining,
    currentRound: round
      ? {
          display: round.display,
          isImage: round.isImage,
          timeRemaining: round.timeRemaining,
          revealed: round.revealed,
          answer: round.revealed ? round.answer : null,
          mySubmission: round.submissions.find((s) => s.playerId === playerId) || null,
          submissions: round.revealed
            ? round.submissions.map((s) => ({
                playerId: s.playerId,
                playerName: room.players.find((p) => p.id === s.playerId)?.name || "Unknown",
                answer: s.answer,
                correct: s.correct,
                partial: s.partial,
                matchScore: s.matchScore,
                points: s.points,
                timeRemaining: s.timeRemaining,
              }))
            : round.submissions.map((s) => ({
                playerId: s.playerId,
                playerName: room.players.find((p) => p.id === s.playerId)?.name || "Unknown",
                answered: true,
              })),
          submittedCount: round.submissions.length,
          totalPlayers: room.players.filter((p) => p.connected).length,
        }
      : null,
  };
}
