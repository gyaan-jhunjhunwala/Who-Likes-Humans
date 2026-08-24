'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '../../../stores/gameStore';
import { LobbyView } from '../../../components/lobby/LobbyView';
import { TableArea } from '../../../components/game/TableArea';
import { CardHand } from '../../../components/cards/CardHand';
import { Scoreboard } from '../../../components/game/Scoreboard';
import { RoundSummaryModal } from '../../../components/game/RoundSummaryModal';
import { GameOverModal } from '../../../components/game/GameOverModal';
import { InGameChat } from '../../../components/chat/InGameChat';
import { Sparkles, ArrowLeft, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params?.code as string)?.toUpperCase();

  const {
    roomState,
    joinRoom,
    initSocket,
    playerName,
    setPlayerName,
    isConnected,
    leaveRoom,
  } = useGameStore();

  const [inputName, setInputName] = useState(playerName || '');
  const [hasPromptedJoin, setHasPromptedJoin] = useState(false);

  useEffect(() => {
    initSocket();
  }, []);

  // Auto-join if player name is already available and not already in this room
  useEffect(() => {
    if (isConnected && roomCode && playerName && !hasPromptedJoin) {
      if (!roomState || roomState.roomCode !== roomCode) {
        joinRoom(roomCode, playerName);
        setHasPromptedJoin(true);
      }
    }
  }, [isConnected, roomCode, playerName, hasPromptedJoin, roomState]);

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    setPlayerName(inputName.trim());
    joinRoom(roomCode, inputName.trim());
    setHasPromptedJoin(true);
  };

  // If no player name exists yet, show quick join prompt
  if (!playerName && (!roomState || roomState.roomCode !== roomCode)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Join Room {roomCode}</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Enter your nickname to join the game table.
            </p>
          </div>

          <form onSubmit={handleManualJoin} className="space-y-4">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Your Nickname..."
              maxLength={18}
              required
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputName.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
            >
              Enter Game Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state while connecting to room
  if (!roomState || roomState.roomCode !== roomCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold text-neutral-400 tracking-wide">
          Connecting to room {roomCode}...
        </p>
      </div>
    );
  }

  // Render Lobby or Active Game
  const isLobby = roomState.status === 'LOBBY';

  return (
    <div className="flex-1 flex flex-col justify-between w-full relative">
      {/* Active Game / Lobby View */}
      {isLobby ? (
        <div className="flex-1 pb-16">
          <LobbyView />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Game Stage */}
            <div className="lg:col-span-9 w-full">
              <TableArea />
            </div>

            {/* Sidebar: Scoreboard */}
            <div className="lg:col-span-3 w-full">
              <Scoreboard />
            </div>
          </div>

          {/* Sticky Player Hand Tray */}
          <div className="sticky bottom-0 z-30 w-full">
            <CardHand />
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <RoundSummaryModal />
      <GameOverModal />
      <InGameChat />
    </div>
  );
}
