import { Server, Socket } from 'socket.io';
import {
  Player,
  RoomSettings,
  PublicRoomState,
} from '../../../shared/types';
import { InternalRoomState, IGameStore } from '../storage/Store';
import { GameEngine } from './GameEngine';

export class RoomManager {
  private socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();

  constructor(private store: IGameStore, private engine: GameEngine) {}

  /**
   * Generate clean 6-character room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new room
   */
  public async createRoom(
    hostPlayer: Omit<Player, 'isHost' | 'score' | 'isConnected' | 'hasSubmitted'>,
    customSettings?: Partial<RoomSettings>
  ): Promise<{ roomCode: string; room: InternalRoomState }> {
    let roomCode = this.generateRoomCode();
    let existing = await this.store.getRoom(roomCode);
    while (existing) {
      roomCode = this.generateRoomCode();
      existing = await this.store.getRoom(roomCode);
    }

    const defaultSettings: RoomSettings = {
      maxPlayers: 10,
      scoreLimit: 7,
      selectionTimeout: 60,
      judgingTimeout: 45,
      deckIds: ['base', 'geek', 'absurd'],
      isPrivate: false,
      ...customSettings,
    };

    const host: Player = {
      ...hostPlayer,
      isHost: true,
      score: 0,
      isConnected: true,
      hasSubmitted: false,
    };

    const { whiteCards, blackCards } = this.engine.initializeDecks(defaultSettings.deckIds);

    const room: InternalRoomState = {
      roomCode,
      status: 'LOBBY',
      hostId: host.id,
      czarId: null,
      roundNumber: 0,
      settings: defaultSettings,
      players: [host],
      blackCard: null,
      submissionsCount: 0,
      anonymousSubmissions: [],
      lastWinner: null,
      timer: { deadline: null, duration: 0 },
      drawPileWhite: whiteCards,
      drawPileBlack: blackCards,
      discardPileWhite: [],
      discardPileBlack: [],
      hands: {},
      rawSubmissions: {},
      submissionLookup: {},
    };

    await this.store.setRoom(roomCode, room);
    this.socketToPlayer.set(host.socketId, { roomCode, playerId: host.id });

    return { roomCode, room };
  }

  /**
   * Join an existing room
   */
  public async joinRoom(
    roomCode: string,
    playerData: Omit<Player, 'isHost' | 'score' | 'isConnected' | 'hasSubmitted'>
  ): Promise<{ success: boolean; error?: string; room?: InternalRoomState }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'Room code not found' };
    }

    if (room.players.length >= room.settings.maxPlayers) {
      return { success: false, error: 'Room is already full' };
    }

    // Check if player is rejoining
    const existingIndex = room.players.findIndex((p: Player) => p.id === playerData.id);
    if (existingIndex !== -1) {
      room.players[existingIndex].socketId = playerData.socketId;
      room.players[existingIndex].isConnected = true;
      room.players[existingIndex].name = playerData.name;
    } else {
      const newPlayer: Player = {
        ...playerData,
        isHost: room.players.length === 0,
        score: 0,
        isConnected: true,
        hasSubmitted: false,
      };
      room.players.push(newPlayer);
    }

    await this.store.setRoom(roomCode, room);
    this.socketToPlayer.set(playerData.socketId, { roomCode, playerId: playerData.id });

    return { success: true, room };
  }

  /**
   * Update Room Settings (Host only)
   */
  public async updateSettings(
    roomCode: string,
    hostPlayerId: string,
    settings: Partial<RoomSettings>,
    io: Server
  ): Promise<{ success: boolean; error?: string }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only host can change settings' };
    if (room.status !== 'LOBBY') return { success: false, error: 'Settings can only be changed in lobby' };

    room.settings = { ...room.settings, ...settings };
    if (settings.deckIds) {
      const fresh = this.engine.initializeDecks(room.settings.deckIds);
      room.drawPileWhite = fresh.whiteCards;
      room.drawPileBlack = fresh.blackCards;
    }

    await this.store.setRoom(roomCode, room);
    this.engine.broadcastRoomSync(room, io);

    return { success: true };
  }

  /**
   * Start the game (Host only)
   */
  public async startGame(
    roomCode: string,
    hostPlayerId: string,
    io: Server
  ): Promise<{ success: boolean; error?: string }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the host can start the game' };
    if (room.players.filter((p: Player) => p.isConnected).length < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    // Reset scores
    for (const player of room.players) {
      player.score = 0;
    }

    await this.engine.startNextRound(roomCode, io);
    return { success: true };
  }

  /**
   * Kick player (Host only)
   */
  public async kickPlayer(
    roomCode: string,
    hostPlayerId: string,
    targetPlayerId: string,
    io: Server
  ): Promise<{ success: boolean; error?: string }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the host can kick players' };
    if (targetPlayerId === hostPlayerId) return { success: false, error: 'Cannot kick yourself' };

    const target = room.players.find((p: Player) => p.id === targetPlayerId);
    room.players = room.players.filter((p: Player) => p.id !== targetPlayerId);
    delete room.hands[targetPlayerId];
    delete room.rawSubmissions[targetPlayerId];

    await this.store.setRoom(roomCode, room);

    if (target?.socketId) {
      io.to(target.socketId).emit('error:action_rejected', {
        code: 'KICKED',
        message: 'You have been kicked by the host',
      });
      io.sockets.sockets.get(target.socketId)?.leave(roomCode);
    }

    this.engine.broadcastRoomSync(room, io);
    return { success: true };
  }

  /**
   * Handle Socket Disconnection
   */
  public async handleDisconnect(socketId: string, io: Server): Promise<void> {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return;

    this.socketToPlayer.delete(socketId);
    const { roomCode, playerId } = mapping;

    const room = await this.store.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p: Player) => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }

    // Check if any players left connected
    const activePlayers = room.players.filter((p: Player) => p.isConnected);
    if (activePlayers.length === 0) {
      setTimeout(async () => {
        const check = await this.store.getRoom(roomCode);
        if (check && check.players.filter((p: Player) => p.isConnected).length === 0) {
          await this.store.deleteRoom(roomCode);
          console.log(`[Room] Cleaned up inactive room ${roomCode}`);
        }
      }, 300000);
      return;
    }

    // If host disconnected, reassign host to first active player
    if (room.hostId === playerId) {
      room.hostId = activePlayers[0].id;
      const newHost = room.players.find((p: Player) => p.id === room.hostId);
      if (newHost) newHost.isHost = true;
    }

    // If Czar disconnected mid-round, pick next Czar and restart round
    if (room.czarId === playerId && room.status !== 'LOBBY' && room.status !== 'GAME_OVER') {
      console.log(`[Game] Card Czar disconnected in ${roomCode}, advancing to next Czar.`);
      await this.engine.startNextRound(roomCode, io);
      return;
    }

    await this.store.setRoom(roomCode, room);
    this.engine.broadcastRoomSync(room, io);
  }

  public getPlayerMapping(socketId: string) {
    return this.socketToPlayer.get(socketId);
  }
}
