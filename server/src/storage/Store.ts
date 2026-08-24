import { PublicRoomState, WhiteCard, BlackCard, AnonymousSubmission } from '../../../shared/types';
import Redis from 'ioredis';

export interface InternalRoomState extends PublicRoomState {
  drawPileWhite: WhiteCard[];
  drawPileBlack: BlackCard[];
  discardPileWhite: WhiteCard[];
  discardPileBlack: BlackCard[];
  hands: Record<string, WhiteCard[]>; // playerId -> hand
  rawSubmissions: Record<string, WhiteCard[]>; // playerId -> submitted cards
  submissionLookup: Record<string, string>; // submissionId -> playerId
  timerInterval?: NodeJS.Timeout;
}

export interface IGameStore {
  getRoom(roomCode: string): Promise<InternalRoomState | null>;
  setRoom(roomCode: string, state: InternalRoomState): Promise<void>;
  deleteRoom(roomCode: string): Promise<void>;
  getPublicRooms(): Promise<PublicRoomState[]>;
}

export class MemoryStore implements IGameStore {
  private rooms = new Map<string, InternalRoomState>();

  async getRoom(roomCode: string): Promise<InternalRoomState | null> {
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  async setRoom(roomCode: string, state: InternalRoomState): Promise<void> {
    this.rooms.set(roomCode.toUpperCase(), state);
  }

  async deleteRoom(roomCode: string): Promise<void> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (room && room.timerInterval) {
      clearInterval(room.timerInterval);
    }
    this.rooms.delete(roomCode.toUpperCase());
  }

  async getPublicRooms(): Promise<PublicRoomState[]> {
    const list: PublicRoomState[] = [];
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && room.status === 'LOBBY') {
        const { drawPileWhite, drawPileBlack, discardPileWhite, discardPileBlack, hands, rawSubmissions, submissionLookup, timerInterval, ...pub } = room;
        list.push(pub);
      }
    }
    return list;
  }
}

// Factory to initialize the store (Memory fallback or live Redis)
export function createGameStore(): IGameStore {
  const useRedis = process.env.ENABLE_REDIS === 'true';
  if (useRedis && process.env.REDIS_URL) {
    console.log('[Store] Initializing Redis adapter:', process.env.REDIS_URL);
  } else {
    console.log('[Store] Using high-performance in-memory state engine.');
  }
  return new MemoryStore();
}
