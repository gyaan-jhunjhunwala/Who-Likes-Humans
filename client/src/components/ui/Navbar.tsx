'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../stores/gameStore';
import { sound } from '../../hooks/useSound';
import { Volume2, VolumeX, Sparkles, Layers, Home, AlertCircle, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { roomState, errorMessage, dismissError, leaveRoom } = useGameStore();
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const toggleMute = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  return (
    <>
      <nav className="w-full border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={() => {
              if (roomState) leaveRoom();
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white via-neutral-200 to-neutral-400 text-black flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-all">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-white group-hover:text-indigo-300 transition-all">
                CARDS AGAINST HUMANITY
              </span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold -mt-1">
                MULTIPLAYER ONLINE
              </span>
            </div>
          </Link>

          {/* Navigation Links & Toggles */}
          <div className="flex items-center gap-3">
            <Link
              href="/decks"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Deck Library</span>
            </Link>

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/90 border-b border-rose-800/80 px-4 py-2.5 text-rose-200 text-xs font-bold flex items-center justify-between sticky top-16 z-40 animate-slide-up">
          <div className="flex items-center gap-2 max-w-6xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={dismissError} className="p-1 hover:bg-rose-900 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
