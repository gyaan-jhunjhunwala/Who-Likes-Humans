import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  PublicRoomState,
  WhiteCard,
  BlackCard,
  ChatMessage,
  RoomSettings,
} from '../../../shared/types';
import { sound } from '../hooks/useSound';

interface GameStore {
  socket: Socket | null;
  isConnected: boolean;
  playerId: string | null;
  playerName: string;
  roomState: PublicRoomState | null;
  myHand: WhiteCard[];
  selectedCardIds: string[];
  chatMessages: ChatMessage[];
  errorMessage: string | null;
  remainingTimer: number;

  // Actions
  setPlayerName: (name: string) => void;
  initSocket: (customPlayerId?: string) => void;
  createRoom: (playerName: string, settings?: Partial<RoomSettings>) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  leaveRoom: () => void;
  toggleCardSelection: (cardId: string) => void;
  submitSelectedCards: () => void;
  revealCard: (index: number) => void;
  selectWinner: (submissionId: string) => void;
  startGame: () => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  kickPlayer: (targetPlayerId: string) => void;
  sendChat: (message: string) => void;
  dismissError: () => void;
}

const getServerUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!envUrl) return 'http://localhost:4000';
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) return envUrl;
  return `https://${envUrl}`;
};

const SERVER_URL = getServerUrl();

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  isConnected: false,
  playerId: null,
  playerName: typeof window !== 'undefined' ? localStorage.getItem('cah_player_name') || '' : '',
  roomState: null,
  myHand: [],
  selectedCardIds: [],
  chatMessages: [],
  errorMessage: null,
  remainingTimer: 0,

  setPlayerName: (name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cah_player_name', name);
    }
    set({ playerName: name });
  },

  initSocket: (customPlayerId?: string) => {
    const existing = get().socket;
    if (existing && existing.connected) return;

    let savedId = customPlayerId;
    if (!savedId && typeof window !== 'undefined') {
      savedId = localStorage.getItem('cah_player_id') || undefined;
    }

    const socket = io(SERVER_URL, {
      query: savedId ? { playerId: savedId } : {},
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to CAH Server');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from CAH Server');
      set({ isConnected: false });
    });

    socket.on('session:init', ({ playerId }) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cah_player_id', playerId);
      }
      set({ playerId });
    });

    socket.on('room:state_sync', (roomState: PublicRoomState) => {
      const prevStatus = get().roomState?.status;
      set({ roomState });

      // Reset selected cards when moving out of selection phase
      if (roomState.status !== 'SELECTING') {
        set({ selectedCardIds: [] });
      }

      if (roomState.status === 'ROUND_SUMMARY' && prevStatus !== 'ROUND_SUMMARY') {
        sound.playWin();
      }
    });

    socket.on('game:hand_sync', ({ cards }: { cards: WhiteCard[] }) => {
      set({ myHand: cards });
    });

    socket.on('timer:tick', ({ remainingSeconds }: { remainingSeconds: number }) => {
      set({ remainingTimer: remainingSeconds });
      if (remainingSeconds <= 5 && remainingSeconds > 0) {
        sound.playTick();
      }
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      set((state) => ({ chatMessages: [...state.chatMessages, msg].slice(-50) }));
    });

    socket.on('error:action_rejected', ({ message }: { message: string }) => {
      set({ errorMessage: message });
    });

    set({ socket });
  },

  createRoom: (name: string, settings?: Partial<RoomSettings>) => {
    const { socket, initSocket } = get();
    if (!socket) {
      initSocket();
    }
    const activeSocket = get().socket;
    if (activeSocket) {
      activeSocket.emit('room:create', {
        playerName: name,
        isGuest: true,
        settings,
      });
    }
  },

  joinRoom: (roomCode: string, name: string) => {
    const { socket, initSocket } = get();
    if (!socket) {
      initSocket();
    }
    const activeSocket = get().socket;
    if (activeSocket) {
      activeSocket.emit('room:join', {
        roomCode,
        playerName: name,
        isGuest: true,
      });
    }
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ roomState: null, myHand: [], selectedCardIds: [], chatMessages: [] });
      get().initSocket();
    }
  },

  toggleCardSelection: (cardId: string) => {
    const { selectedCardIds, roomState, playerId } = get();
    if (!roomState || !roomState.blackCard) return;
    if (roomState.czarId === playerId) return; // Czar cannot pick

    sound.playCardSelect();
    const maxPick = roomState.blackCard.pick || 1;

    if (selectedCardIds.includes(cardId)) {
      set({ selectedCardIds: selectedCardIds.filter((id) => id !== cardId) });
    } else {
      if (selectedCardIds.length < maxPick) {
        set({ selectedCardIds: [...selectedCardIds, cardId] });
      } else if (maxPick === 1) {
        set({ selectedCardIds: [cardId] });
      }
    }
  },

  submitSelectedCards: () => {
    const { socket, roomState, selectedCardIds } = get();
    if (!socket || !roomState) return;

    socket.emit('card:submit', {
      roomCode: roomState.roomCode,
      cardIds: selectedCardIds,
    });
    sound.playCardFlip();
  },

  revealCard: (index: number) => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('card:reveal', {
      roomCode: roomState.roomCode,
      submissionIndex: index,
    });
    sound.playCardFlip();
  },

  selectWinner: (submissionId: string) => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('card:select_winner', {
      roomCode: roomState.roomCode,
      submissionId,
    });
  },

  startGame: () => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('game:start', { roomCode: roomState.roomCode });
  },

  updateSettings: (settings: Partial<RoomSettings>) => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('room:update_settings', {
      roomCode: roomState.roomCode,
      settings,
    });
  },

  kickPlayer: (targetPlayerId: string) => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('room:kick_player', {
      roomCode: roomState.roomCode,
      targetPlayerId,
    });
  },

  sendChat: (message: string) => {
    const { socket, roomState } = get();
    if (!socket || !roomState) return;

    socket.emit('chat:send', {
      roomCode: roomState.roomCode,
      message,
    });
  },

  dismissError: () => set({ errorMessage: null }),
}));
