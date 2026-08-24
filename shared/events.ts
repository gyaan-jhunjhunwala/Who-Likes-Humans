import {
  BlackCard,
  WhiteCard,
  Player,
  PublicRoomState,
  RoomSettings,
  AnonymousSubmission,
  RevealedSubmission,
  ChatMessage,
} from './types';

// Client-to-Server Event Payloads
export interface CreateRoomPayload {
  playerName: string;
  isGuest?: boolean;
  avatarUrl?: string;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  isGuest?: boolean;
  avatarUrl?: string;
}

export interface UpdateSettingsPayload {
  roomCode: string;
  settings: Partial<RoomSettings>;
}

export interface SubmitCardsPayload {
  roomCode: string;
  cardIds: string[];
}

export interface RevealCardPayload {
  roomCode: string;
  submissionIndex: number;
}

export interface SelectWinnerPayload {
  roomCode: string;
  submissionId: string;
}

export interface SendChatPayload {
  roomCode: string;
  message: string;
}

// Server-to-Client Event Payloads
export interface SessionInitPayload {
  playerId: string;
  token?: string;
}

export interface HandSyncPayload {
  cards: WhiteCard[];
}

export interface RoundStartedPayload {
  roundNumber: number;
  czarId: string;
  blackCard: BlackCard;
  deadline: number;
  duration: number;
}

export interface JudgingStartedPayload {
  submissions: AnonymousSubmission[];
  deadline: number;
  duration: number;
}

export interface RoundEndedPayload {
  winnerId: string;
  playerName: string;
  winningCards: WhiteCard[];
  blackCard: BlackCard;
  scores: Record<string, number>;
}

export interface GameEndedPayload {
  winnerId: string;
  winnerName: string;
  leaderboard: { playerId: string; name: string; score: number }[];
}

export interface ActionErrorPayload {
  code: string;
  message: string;
}
