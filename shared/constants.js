// --- Socket events shared by ALL games ---
export const LobbyEvents = {
  CREATE_ROOM: "create-room",
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  GAME_STATE: "game-state",
  LOBBY_STATE: "lobby-state",
  ERROR: "error",
};

// --- Card game specific events ---
export const CardGameEvents = {
  START_GAME: "cards:start-game",
  SUBMIT_CARD: "cards:submit-card",
  SELECT_WINNER: "cards:select-winner",
  UPLOAD_CARDS: "cards:upload-cards",
};

// --- Rebus game specific events ---
export const RebusGameEvents = {
  START_GAME: "rebus:start-game",
  SUBMIT_ANSWER: "rebus:submit-answer",
  READY_UP: "rebus:ready-up",
};

// --- Game statuses ---
export const GameStatus = {
  LOBBY: "lobby",
  PLAYING: "playing",
  FINISHED: "finished",
};

// --- Game registry ---
export const GAMES = [
  {
    id: "cards",
    name: "This Is Fun",
    description: "A Cards Against Humanity style party game. One player draws a prompt, everyone else plays their funniest response.",
    minPlayers: 3,
    maxPlayers: 20,
    enabled: true,
  },
  {
    id: "rebus",
    name: "Picture This",
    description: "Decode emoji rebus puzzles as fast as you can. More players and faster answers mean bigger points.",
    minPlayers: 2,
    maxPlayers: 30,
    enabled: true,
  },
  {
    id: "trivia",
    name: "Brain Freeze",
    description: "Quick-fire trivia rounds. First to buzz in with the right answer scores.",
    minPlayers: 2,
    maxPlayers: 30,
    enabled: false,
  },
  {
    id: "drawit",
    name: "Draw It Out",
    description: "One person draws, everyone else guesses. Like Pictionary but messier.",
    minPlayers: 3,
    maxPlayers: 16,
    enabled: false,
  },
];

export const HAND_SIZE = 7;
export const DEFAULT_TARGET_SCORE = 5;

export const REBUS_ROUND_TIME = 30;
export const REBUS_READY_TIME = 30;
export const REBUS_TOTAL_ROUNDS = 10;
