import { Server } from 'socket.io';
import { OFFICIAL_DECKS } from '../../../shared/decks';
import {
  BlackCard,
  WhiteCard,
  Player,
  AnonymousSubmission,
  PublicRoomState,
  GameStatus,
} from '../../../shared/types';
import { InternalRoomState, IGameStore } from '../storage/Store';
import crypto from 'crypto';

export class GameEngine {
  constructor(private store: IGameStore) {}

  /**
   * Helper to cryptographically shuffle an array in place
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Initialize and shuffle draw piles for a room using selected deck IDs
   */
  public initializeDecks(deckIds: string[]): { whiteCards: WhiteCard[]; blackCards: BlackCard[] } {
    let whitePool: WhiteCard[] = [];
    let blackPool: BlackCard[] = [];

    const activeDeckIds = deckIds.length > 0 ? deckIds : ['base'];

    for (const deckId of activeDeckIds) {
      const deck = OFFICIAL_DECKS[deckId] || OFFICIAL_DECKS['base'];
      whitePool.push(...deck.whiteCards);
      blackPool.push(...deck.blackCards);
    }

    return {
      whiteCards: this.shuffle([...whitePool]),
      blackCards: this.shuffle([...blackPool]),
    };
  }

  /**
   * Deals cards to a player up to 10 cards
   */
  public replenishHand(room: InternalRoomState, playerId: string): WhiteCard[] {
    const currentHand = room.hands[playerId] || [];
    const needed = 10 - currentHand.length;

    if (needed <= 0) return currentHand;

    const drawn: WhiteCard[] = [];
    for (let i = 0; i < needed; i++) {
      if (room.drawPileWhite.length === 0) {
        if (room.discardPileWhite.length === 0) {
          const fresh = this.initializeDecks(room.settings.deckIds);
          room.drawPileWhite = fresh.whiteCards;
        } else {
          room.drawPileWhite = this.shuffle([...room.discardPileWhite]);
          room.discardPileWhite = [];
        }
      }
      const card = room.drawPileWhite.pop();
      if (card) drawn.push(card);
    }

    const newHand = [...currentHand, ...drawn];
    room.hands[playerId] = newHand;
    return newHand;
  }

  /**
   * Start a new round
   */
  public async startNextRound(roomCode: string, io: Server): Promise<void> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = undefined;
    }

    // Determine next Czar among connected players
    const connectedPlayers = room.players.filter((p: Player) => p.isConnected);
    if (connectedPlayers.length < 2) {
      room.status = 'LOBBY';
      await this.store.setRoom(roomCode, room);
      this.broadcastRoomSync(room, io);
      return;
    }

    let nextCzarIndex = 0;
    if (room.czarId) {
      const currentCzarIndex = connectedPlayers.findIndex((p: Player) => p.id === room.czarId);
      if (currentCzarIndex !== -1) {
        nextCzarIndex = (currentCzarIndex + 1) % connectedPlayers.length;
      }
    }
    const nextCzar = connectedPlayers[nextCzarIndex];
    room.czarId = nextCzar.id;
    room.roundNumber += 1;
    room.status = 'SELECTING';

    // Draw Black Card
    if (room.drawPileBlack.length === 0) {
      if (room.discardPileBlack.length === 0) {
        const fresh = this.initializeDecks(room.settings.deckIds);
        room.drawPileBlack = fresh.blackCards;
      } else {
        room.drawPileBlack = this.shuffle([...room.discardPileBlack]);
        room.discardPileBlack = [];
      }
    }
    room.blackCard = room.drawPileBlack.pop() || null;

    // Reset round states
    room.rawSubmissions = {};
    room.submissionLookup = {};
    room.anonymousSubmissions = [];
    room.submissionsCount = 0;

    for (const player of room.players) {
      player.hasSubmitted = false;
      const hand = this.replenishHand(room, player.id);
      if (player.socketId) {
        io.to(player.socketId).emit('game:hand_sync', { cards: hand });
      }
    }

    // Setup timer
    const duration = room.settings.selectionTimeout || 60;
    const deadline = Date.now() + duration * 1000;
    room.timer = { deadline, duration };

    await this.store.setRoom(roomCode, room);
    this.broadcastRoomSync(room, io);

    // Start tick countdown
    this.startRoundTimer(roomCode, deadline, async () => {
      await this.startJudgingPhase(roomCode, io);
    }, io);
  }

  /**
   * Submit cards for a player
   */
  public async submitCards(
    roomCode: string,
    playerId: string,
    cardIds: string[],
    io: Server
  ): Promise<{ success: boolean; error?: string }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.status !== 'SELECTING') {
      return { success: false, error: 'Game is not in card selection phase' };
    }

    if (room.czarId === playerId) {
      return { success: false, error: 'Card Czar does not play cards' };
    }

    if (room.rawSubmissions[playerId]) {
      return { success: false, error: 'You have already submitted cards for this round' };
    }

    if (!room.blackCard || cardIds.length !== room.blackCard.pick) {
      return {
        success: false,
        error: `Please select exactly ${room.blackCard?.pick || 1} card(s)`,
      };
    }

    const playerHand = room.hands[playerId] || [];
    const submittedCards: WhiteCard[] = [];

    for (const cardId of cardIds) {
      const found = playerHand.find((c: WhiteCard) => c.id === cardId);
      if (!found) {
        return { success: false, error: 'Selected card is not in your hand' };
      }
      submittedCards.push(found);
    }

    // Remove submitted cards from hand
    room.hands[playerId] = playerHand.filter((c: WhiteCard) => !cardIds.includes(c.id));
    room.rawSubmissions[playerId] = submittedCards;

    const player = room.players.find((p: Player) => p.id === playerId);
    if (player) {
      player.hasSubmitted = true;
    }
    room.submissionsCount = Object.keys(room.rawSubmissions).length;

    await this.store.setRoom(roomCode, room);

    // Privately sync updated hand
    if (player?.socketId) {
      io.to(player.socketId).emit('game:hand_sync', { cards: room.hands[playerId] });
    }

    this.broadcastRoomSync(room, io);

    // Check if all non-Czar players have submitted
    const activeNonCzars = room.players.filter((p: Player) => p.isConnected && p.id !== room.czarId);
    if (room.submissionsCount >= activeNonCzars.length) {
      await this.startJudgingPhase(roomCode, io);
    }

    return { success: true };
  }

  /**
   * Transition to Judging phase
   */
  public async startJudgingPhase(roomCode: string, io: Server): Promise<void> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = undefined;
    }

    room.status = 'JUDGING';
    room.anonymousSubmissions = [];
    room.submissionLookup = {};

    for (const [playerId, cards] of Object.entries(room.rawSubmissions)) {
      const submissionId = crypto.randomUUID();
      room.submissionLookup[submissionId] = playerId;
      room.anonymousSubmissions.push({
        submissionId,
        cards,
        isRevealed: false,
      });
    }

    // Cryptographically shuffle for the Czar
    this.shuffle(room.anonymousSubmissions);

    const duration = room.settings.judgingTimeout || 45;
    const deadline = Date.now() + duration * 1000;
    room.timer = { deadline, duration };

    await this.store.setRoom(roomCode, room);
    this.broadcastRoomSync(room, io);

    this.startRoundTimer(roomCode, deadline, async () => {
      if (room.anonymousSubmissions.length > 0) {
        const randomSub = room.anonymousSubmissions[0];
        await this.selectWinningCard(roomCode, randomSub.submissionId, io);
      } else {
        await this.startNextRound(roomCode, io);
      }
    }, io);
  }

  /**
   * Reveal an individual card submission by index
   */
  public async revealCard(roomCode: string, submissionIndex: number, io: Server): Promise<void> {
    const room = await this.store.getRoom(roomCode);
    if (!room || room.status !== 'JUDGING') return;

    if (submissionIndex >= 0 && submissionIndex < room.anonymousSubmissions.length) {
      room.anonymousSubmissions[submissionIndex].isRevealed = true;
      await this.store.setRoom(roomCode, room);
      this.broadcastRoomSync(room, io);
    }
  }

  /**
   * Czar selects the winning card submission
   */
  public async selectWinningCard(
    roomCode: string,
    submissionId: string,
    io: Server
  ): Promise<{ success: boolean; error?: string }> {
    const room = await this.store.getRoom(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.status !== 'JUDGING') {
      return { success: false, error: 'Not currently in judging phase' };
    }

    const winnerId = room.submissionLookup[submissionId];
    const winningSub = room.anonymousSubmissions.find((s: AnonymousSubmission) => s.submissionId === submissionId);

    if (!winnerId || !winningSub || !room.blackCard) {
      return { success: false, error: 'Invalid winning submission' };
    }

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = undefined;
    }

    const winnerPlayer = room.players.find((p: Player) => p.id === winnerId);
    if (winnerPlayer) {
      winnerPlayer.score += 1;
    }

    // Record last winner
    room.lastWinner = {
      playerId: winnerId,
      playerName: winnerPlayer?.name || 'Unknown Player',
      winningCards: winningSub.cards,
      blackCard: room.blackCard,
    };

    // Move used cards to discard piles
    if (room.blackCard) {
      room.discardPileBlack.push(room.blackCard);
    }
    for (const sub of room.anonymousSubmissions) {
      room.discardPileWhite.push(...sub.cards);
    }

    // Check if score limit reached
    const scoreLimit = room.settings.scoreLimit || 5;
    if (winnerPlayer && winnerPlayer.score >= scoreLimit) {
      room.status = 'GAME_OVER';
      room.timer = { deadline: null, duration: 0 };
      await this.store.setRoom(roomCode, room);
      this.broadcastRoomSync(room, io);

      const leaderboard = [...room.players]
        .sort((a: Player, b: Player) => b.score - a.score)
        .map((p: Player) => ({ playerId: p.id, name: p.name, score: p.score }));

      io.to(roomCode).emit('game:ended', {
        winnerId: winnerPlayer.id,
        winnerName: winnerPlayer.name,
        leaderboard,
      });
      return { success: true };
    }

    // Otherwise show round summary and prepare next round
    room.status = 'ROUND_SUMMARY';
    const summaryDuration = 6;
    const deadline = Date.now() + summaryDuration * 1000;
    room.timer = { deadline, duration: summaryDuration };

    await this.store.setRoom(roomCode, room);
    this.broadcastRoomSync(room, io);

    io.to(roomCode).emit('game:round_ended', {
      winnerId,
      playerName: winnerPlayer?.name || 'Anonymous',
      winningCards: winningSub.cards,
      blackCard: room.blackCard,
      scores: room.players.reduce((acc: Record<string, number>, p: Player) => ({ ...acc, [p.id]: p.score }), {}),
    });

    this.startRoundTimer(roomCode, deadline, async () => {
      await this.startNextRound(roomCode, io);
    }, io);

    return { success: true };
  }

  /**
   * Helper to start an authoritative countdown timer
   */
  private startRoundTimer(
    roomCode: string,
    deadline: number,
    onExpire: () => Promise<void>,
    io: Server
  ): void {
    const interval = setInterval(async () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      io.to(roomCode).emit('timer:tick', { remainingSeconds: remaining });

      if (remaining <= 0) {
        clearInterval(interval);
        const room = await this.store.getRoom(roomCode);
        if (room && room.timerInterval === interval) {
          room.timerInterval = undefined;
          await this.store.setRoom(roomCode, room);
        }
        await onExpire();
      }
    }, 1000);

    this.store.getRoom(roomCode).then((room) => {
      if (room) {
        room.timerInterval = interval;
        this.store.setRoom(roomCode, room);
      }
    });
  }

  /**
   * Broadcast public state to the room
   */
  public broadcastRoomSync(room: InternalRoomState, io: Server): void {
    const {
      drawPileWhite,
      drawPileBlack,
      discardPileWhite,
      discardPileBlack,
      hands,
      rawSubmissions,
      submissionLookup,
      timerInterval,
      ...publicState
    } = room;

    io.to(room.roomCode).emit('room:state_sync', publicState);
  }
}
