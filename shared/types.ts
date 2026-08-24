export type GameStatus = 'LOBBY' | 'SELECTING' | 'JUDGING' | 'ROUND_SUMMARY' | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number;
  scoreLimit: number;
  selectionTimeout: number; // in seconds
  judgingTimeout: number;   // in seconds
  deckIds: string[];
  isPrivate: boolean;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  isGuest: boolean;
  score: number;
  isConnected: boolean;
  hasSubmitted: boolean;
}

export interface BlackCard {
  id: string;
  text: string;
  pick: number;
  pack?: string;
}

export interface WhiteCard {
  id: string;
  text: string;
  pack?: string;
}

export interface AnonymousSubmission {
  submissionId: string;
  cards: WhiteCard[];
  isRevealed: boolean;
}

export interface RevealedSubmission extends AnonymousSubmission {
  playerId: string;
  playerName: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface PublicRoomState {
  roomCode: string;
  status: GameStatus;
  hostId: string;
  czarId: string | null;
  roundNumber: number;
  settings: RoomSettings;
  players: Player[];
  blackCard: BlackCard | null;
  submissionsCount: number;
  anonymousSubmissions: AnonymousSubmission[];
  lastWinner: {
    playerId: string;
    playerName: string;
    winningCards: WhiteCard[];
    blackCard: BlackCard;
  } | null;
  timer: {
    deadline: number | null;
    duration: number;
  };
}

export interface CustomDeck {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  blackCards: { text: string; pick: number }[];
  whiteCards: { text: string }[];
  isOfficial?: boolean;
}
