import { Server, Socket } from 'socket.io';
import { GameEngine } from '../game/GameEngine';
import { RoomManager } from '../game/RoomManager';
import { IGameStore } from '../storage/Store';
import { Player } from '../../../shared/types';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  UpdateSettingsPayload,
  SubmitCardsPayload,
  RevealCardPayload,
  SelectWinnerPayload,
  SendChatPayload,
} from '../../../shared/events';
import crypto from 'crypto';

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  store: IGameStore,
  roomManager: RoomManager,
  gameEngine: GameEngine
) {
  // Session Init
  const tempPlayerId = (socket.handshake.query.playerId as string) || crypto.randomUUID();
  socket.emit('session:init', { playerId: tempPlayerId });

  // 1. Create Room
  socket.on('room:create', async (payload: CreateRoomPayload) => {
    try {
      const { playerName, isGuest = true, avatarUrl, settings } = payload;
      const { roomCode, room } = await roomManager.createRoom(
        {
          id: tempPlayerId,
          socketId: socket.id,
          name: playerName || 'Host',
          isGuest,
          avatarUrl,
        },
        settings
      );

      socket.join(roomCode);
      gameEngine.broadcastRoomSync(room, io);
    } catch (err: any) {
      socket.emit('error:action_rejected', { code: 'CREATE_ERROR', message: err.message });
    }
  });

  // 2. Join Room
  socket.on('room:join', async (payload: JoinRoomPayload) => {
    try {
      const { roomCode, playerName, isGuest = true, avatarUrl } = payload;
      const cleanCode = roomCode?.trim().toUpperCase();

      const result = await roomManager.joinRoom(cleanCode, {
        id: tempPlayerId,
        socketId: socket.id,
        name: playerName || 'Player',
        isGuest,
        avatarUrl,
      });

      if (!result.success || !result.room) {
        return socket.emit('error:action_rejected', {
          code: 'JOIN_FAILED',
          message: result.error || 'Failed to join room',
        });
      }

      socket.join(cleanCode);
      gameEngine.broadcastRoomSync(result.room, io);

      // Send player's current hand if game is in progress
      const playerHand = result.room.hands[tempPlayerId] || [];
      socket.emit('game:hand_sync', { cards: playerHand });
    } catch (err: any) {
      socket.emit('error:action_rejected', { code: 'JOIN_ERROR', message: err.message });
    }
  });

  // 3. Update Settings (Lobby)
  socket.on('room:update_settings', async (payload: UpdateSettingsPayload) => {
    const { roomCode, settings } = payload;
    const result = await roomManager.updateSettings(roomCode, tempPlayerId, settings, io);
    if (!result.success) {
      socket.emit('error:action_rejected', { code: 'SETTINGS_ERROR', message: result.error });
    }
  });

  // 4. Kick Player
  socket.on('room:kick_player', async ({ roomCode, targetPlayerId }) => {
    const result = await roomManager.kickPlayer(roomCode, tempPlayerId, targetPlayerId, io);
    if (!result.success) {
      socket.emit('error:action_rejected', { code: 'KICK_ERROR', message: result.error });
    }
  });

  // 5. Start Game
  socket.on('game:start', async ({ roomCode }) => {
    const result = await roomManager.startGame(roomCode, tempPlayerId, io);
    if (!result.success) {
      socket.emit('error:action_rejected', { code: 'START_ERROR', message: result.error });
    }
  });

  // 6. Submit Cards
  socket.on('card:submit', async (payload: SubmitCardsPayload) => {
    const { roomCode, cardIds } = payload;
    const result = await gameEngine.submitCards(roomCode, tempPlayerId, cardIds, io);
    if (!result.success) {
      socket.emit('error:action_rejected', { code: 'SUBMIT_ERROR', message: result.error });
    }
  });

  // 7. Czar: Reveal Card
  socket.on('card:reveal', async (payload: RevealCardPayload) => {
    const { roomCode, submissionIndex } = payload;
    await gameEngine.revealCard(roomCode, submissionIndex, io);
  });

  // 8. Czar: Select Winner
  socket.on('card:select_winner', async (payload: SelectWinnerPayload) => {
    const { roomCode, submissionId } = payload;
    const result = await gameEngine.selectWinningCard(roomCode, submissionId, io);
    if (!result.success) {
      socket.emit('error:action_rejected', { code: 'WINNER_ERROR', message: result.error });
    }
  });

  // 9. Skip / Force Next Round
  socket.on('game:next_round', async ({ roomCode }) => {
    const room = await store.getRoom(roomCode);
    if (room && (room.hostId === tempPlayerId || room.czarId === tempPlayerId)) {
      await gameEngine.startNextRound(roomCode, io);
    }
  });

  // 10. Chat Message
  socket.on('chat:send', async (payload: SendChatPayload) => {
    const { roomCode, message } = payload;
    if (!message || !message.trim()) return;

    const room = await store.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p: Player) => p.id === tempPlayerId);
    const chatMsg = {
      id: crypto.randomUUID(),
      playerId: tempPlayerId,
      playerName: player?.name || 'Guest',
      message: message.trim().slice(0, 300),
      timestamp: Date.now(),
    };

    io.to(roomCode).emit('chat:message', chatMsg);
  });

  // 11. Disconnect
  socket.on('disconnect', async () => {
    await roomManager.handleDisconnect(socket.id, io);
  });
}
