'use client';

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Crown, Trophy, User } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const { roomState, playerId } = useGameStore();

  if (!roomState) return null;

  // Sort players by score descending
  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full glass-panel rounded-2xl p-4 shadow-xl border border-white/5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300">
            Scoreboard
          </h4>
        </div>
        <span className="text-[11px] font-bold text-neutral-400">
          Target: {roomState.settings.scoreLimit} pts
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === playerId;
          const isCzar = player.id === roomState.czarId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                isCurrentPlayer
                  ? 'bg-indigo-950/60 border border-indigo-500/40 text-white font-bold'
                  : 'bg-neutral-900/60 border border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-5 text-center font-mono font-bold text-neutral-500 text-[11px]">
                  #{index + 1}
                </span>
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-black text-xs uppercase">
                    {player.name.charAt(0)}
                  </div>
                  {isCzar && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1.5 drop-shadow-md" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{player.name}</span>
                    {isCurrentPlayer && (
                      <span className="text-[9px] text-indigo-400 uppercase font-extrabold">(You)</span>
                    )}
                  </div>
                  {!player.isConnected && (
                    <span className="text-[9px] text-rose-400 block font-medium">Disconnected</span>
                  )}
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono font-black text-amber-400">
                <span>{player.score}</span>
                <span className="text-[10px] text-neutral-500">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
