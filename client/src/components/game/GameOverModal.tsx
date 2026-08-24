'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export const GameOverModal: React.FC = () => {
  const { roomState, playerId, startGame, leaveRoom } = useGameStore();

  useEffect(() => {
    if (roomState?.status === 'GAME_OVER') {
      const end = Date.now() + 3 * 1000;
      const interval: any = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
        });
      }, 250);
    }
  }, [roomState?.status]);

  if (!roomState || roomState.status !== 'GAME_OVER') return null;

  const isHost = roomState.hostId === playerId;
  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
  const champion = sortedPlayers[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-10 max-w-xl w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Crown Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-xl animate-bounce-short">
          <Trophy className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-widest font-black text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60 mb-2">
          Victory Achieved
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-white">
          {champion?.name || 'Player'} Won!
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Reached the target score of {roomState.settings.scoreLimit} points first.
        </p>

        {/* Leaderboard Podium */}
        <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 my-6 space-y-2">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                idx === 0
                  ? 'bg-amber-950/40 border border-amber-600/40 text-amber-300 font-extrabold'
                  : 'bg-neutral-950/60 border border-neutral-800/80 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-black text-neutral-500">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span>{player.name}</span>
              </div>
              <span className="font-mono font-black">{player.score} pts</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {isHost ? (
            <button
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Start New Match
            </button>
          ) : (
            <p className="text-xs text-neutral-400 w-full text-center">
              Waiting for host to restart match...
            </p>
          )}

          <Link
            href="/"
            onClick={leaveRoom}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-700 transition-all"
          >
            <Home className="w-4 h-4" /> Lobby
          </Link>
        </div>
      </div>
    </div>
  );
};
