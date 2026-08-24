'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { OFFICIAL_DECKS } from '../../../../shared/decks';
import {
  Users,
  Copy,
  Check,
  Play,
  Settings,
  ShieldAlert,
  Layers,
  Clock,
  Sparkles,
  UserX,
} from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { roomState, playerId, startGame, updateSettings, kickPlayer } = useGameStore();
  const [copied, setCopied] = useState(false);

  if (!roomState) return null;

  const isHost = roomState.hostId === playerId;
  const connectedPlayers = roomState.players.filter((p) => p.isConnected);
  const canStart = isHost && connectedPlayers.length >= 2;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/room/${roomState.roomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleDeck = (deckId: string) => {
    if (!isHost) return;
    const currentDecks = roomState.settings.deckIds || ['base'];
    let updatedDecks: string[];

    if (currentDecks.includes(deckId)) {
      // Don't allow unselecting all decks
      if (currentDecks.length === 1) return;
      updatedDecks = currentDecks.filter((id) => id !== deckId);
    } else {
      updatedDecks = [...currentDecks, deckId];
    }

    updateSettings({ deckIds: updatedDecks });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in">
      {/* Top Banner: Room Code & Quick Share */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Private Room Code
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Ready to Play
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest">
              {roomState.roomCode}
            </h1>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition-all shadow-md active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Share Invite
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Share this 6-character room code or link with your friends to join your match.
          </p>
        </div>

        {/* Start Game Button (Host) */}
        {isHost ? (
          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl transition-all ${
                canStart
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transform hover:scale-105 active:scale-95 shadow-indigo-500/30 cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              {canStart ? 'START GAME' : 'NEED 2+ PLAYERS'}
            </button>
            {!canStart && (
              <span className="text-[11px] text-amber-400/90 font-medium">
                Waiting for at least 1 more player to join...
              </span>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900/80 border border-neutral-800 px-6 py-4 rounded-2xl text-center">
            <span className="text-xs uppercase font-extrabold text-neutral-400 block mb-1">
              Host Controls Match
            </span>
            <span className="text-sm font-bold text-indigo-300 animate-pulse">
              Waiting for host to start the game...
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Players & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Player Slots */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
                Connected Players ({connectedPlayers.length}/{roomState.settings.maxPlayers})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomState.players.map((player) => {
              const isCurrent = player.id === playerId;
              const isRoomHost = player.id === roomState.hostId;

              return (
                <div
                  key={player.id}
                  className={`glass-panel p-4 rounded-2xl flex items-center justify-between border transition-all ${
                    isCurrent
                      ? 'border-indigo-500/50 bg-indigo-950/20'
                      : 'border-white/5 bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm uppercase shadow-md">
                      {player.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-neutral-100 truncate">
                          {player.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        {isRoomHost ? '👑 Room Host' : 'Player'}
                      </span>
                    </div>
                  </div>

                  {/* Kick Action (Host only, cannot kick self) */}
                  {isHost && !isRoomHost && (
                    <button
                      onClick={() => kickPlayer(player.id)}
                      title="Kick Player"
                      className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-all"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Match Configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
              Match Settings
            </h3>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-6">
            {/* Score Limit Selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-neutral-400 block mb-2">
                Score to Win (Awesome Points)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 7, 10, 15].map((limit) => (
                  <button
                    key={limit}
                    disabled={!isHost}
                    onClick={() => updateSettings({ scoreLimit: limit })}
                    className={`py-2.5 rounded-xl font-mono font-black text-sm transition-all ${
                      roomState.settings.scoreLimit === limit
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                    } ${!isHost && 'cursor-default'}`}
                  >
                    {limit} pts
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Durations */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-neutral-400 block mb-2">
                Selection Timer
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((seconds) => (
                  <button
                    key={seconds}
                    disabled={!isHost}
                    onClick={() => updateSettings({ selectionTimeout: seconds })}
                    className={`py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                      roomState.settings.selectionTimeout === seconds
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                    } ${!isHost && 'cursor-default'}`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            {/* Deck Selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-neutral-400 block mb-2">
                Active Card Packs
              </label>
              <div className="space-y-2">
                {Object.entries(OFFICIAL_DECKS).map(([deckId, deck]) => {
                  const isActive = roomState.settings.deckIds?.includes(deckId);
                  return (
                    <div
                      key={deckId}
                      onClick={() => handleToggleDeck(deckId)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all select-none ${
                        isActive
                          ? 'bg-neutral-900/90 border-indigo-500/80 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-500 opacity-60'
                      } ${isHost ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black border ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-neutral-700 bg-neutral-900 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-100">{deck.name}</p>
                          <p className="text-[10px] text-neutral-400">{deck.description}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-neutral-400">
                        {deck.blackCards.length + deck.whiteCards.length} cards
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
