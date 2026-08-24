'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../stores/gameStore';
import { BlackCard } from '../components/cards/BlackCard';
import { WhiteCard } from '../components/cards/WhiteCard';
import {
  Sparkles,
  Play,
  Users,
  Lock,
  ArrowRight,
  Shield,
  Zap,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { playerName, setPlayerName, createRoom, joinRoom, roomState, initSocket } = useGameStore();

  const [inputName, setInputName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    initSocket();
    if (playerName) {
      setInputName(playerName);
    }
  }, []);

  // When room is created or joined, navigate to the room page
  useEffect(() => {
    if (roomState?.roomCode) {
      router.push(`/room/${roomState.roomCode}`);
    }
  }, [roomState?.roomCode, router]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    setIsCreating(true);
    setPlayerName(inputName.trim());
    createRoom(inputName.trim());
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !joinCode.trim()) return;

    setIsJoining(true);
    setPlayerName(inputName.trim());
    joinRoom(joinCode.trim().toUpperCase(), inputName.trim());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-6xl mx-auto w-full relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Hero Headline */}
      <div className="text-center space-y-4 max-w-3xl my-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Real-Time Multiplayer
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          A Party Game for <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-500">
            Horrible People.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto font-medium">
          Play the hilarious fill-in-the-blank card game online with your friends. Rotating Card Czar, secret submissions, animated reveals, and custom card packs.
        </p>
      </div>

      {/* Main Interactive Form Card */}
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl relative z-10 shadow-2xl space-y-6">
        {/* Name Input */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-neutral-300 block mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="e.g. MasterOfMemes"
            maxLength={18}
            className="w-full bg-neutral-900/90 border border-neutral-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
          />
        </div>

        {/* Action 1: Create Room */}
        <button
          onClick={handleCreateRoom}
          disabled={!inputName.trim() || isCreating}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/25 transform active:scale-95 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          {isCreating ? 'Creating Room...' : 'Create Private Room'}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-neutral-800 w-full" />
          <span className="bg-surface px-3 text-[10px] uppercase font-black tracking-widest text-neutral-500 absolute">
            OR JOIN EXISTING
          </span>
        </div>

        {/* Action 2: Join with Code */}
        <form onSubmit={handleJoinRoom} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER 6-CHAR CODE"
              maxLength={6}
              className="flex-1 bg-neutral-900/90 border border-neutral-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl px-4 py-3 text-sm font-mono font-bold tracking-widest text-white placeholder-neutral-500 uppercase focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputName.trim() || !joinCode.trim() || isJoining}
              className="px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider border border-neutral-700 transition-all flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Live Visual Card Showcase */}
      <div className="mt-16 w-full flex flex-col md:flex-row items-center justify-center gap-6 opacity-90 hover:opacity-100 transition-opacity">
        <div className="transform -rotate-2 hover:rotate-0 transition-transform">
          <BlackCard
            card={{
              id: 'demo-b',
              text: 'Why can\'t I sleep at night?',
              pick: 1,
              pack: 'demo',
            }}
          />
        </div>
        <div className="transform rotate-2 hover:rotate-0 transition-transform">
          <WhiteCard
            card={{
              id: 'demo-w',
              text: 'Overpriced avocado toast and existential dread.',
              pack: 'demo',
            }}
            isSelected
          />
        </div>
      </div>

      {/* Features Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-20 pt-10 border-t border-white/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Sub-50ms Real-Time Sync</h4>
            <p className="text-xs text-neutral-400 mt-0.5">Instant card submissions & state updates via WebSocket.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Anti-Cheat Cryptography</h4>
            <p className="text-xs text-neutral-400 mt-0.5">Author identities are hidden & randomized server-side.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-rose-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Multiple Card Packs</h4>
            <p className="text-xs text-neutral-400 mt-0.5">Classic, Geek & Dev, Absurd, and Custom Player Decks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
