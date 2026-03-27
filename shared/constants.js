export const GameStatus = {
    LOBBY: "lobby",
    PLAYING: "playing",
    FINISHED: "finished",
  };
  
  export const SocketEvents = {
    // Client -> Server
    CREATE_ROOM: "create-room",
    JOIN_ROOM: "join-room",
    START_GAME: "start-game",
    SUBMIT_CARD: "submit-card",
    SELECT_WINNER: "select-winner",
  
    // Server -> Client
    GAME_STATE: "game-state",
    ROUND_START: "round-start",
    ROUND_RESULT: "round-result",
    ERROR: "error",
    PLAYER_JOINED: "player-joined",
    PLAYER_LEFT: "player-left",
  };
  
  export const MIN_PLAYERS = 3;
  export const HAND_SIZE = 7;
  export const DEFAULT_TARGET_SCORE = 5;