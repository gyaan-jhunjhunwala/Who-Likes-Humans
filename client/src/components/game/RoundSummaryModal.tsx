'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { BlackCard } from '../cards/BlackCard';
import { WhiteCard } from '../cards/WhiteCard';

export const RoundSummaryModal: React.FC = () => {
  const { roomState, remainingTimer } = useGameStore();

  useEffect(() => {
    if (roomState?.status === 'ROUND_SUMMARY') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#f59e0b', '#ec4899', '#10b981'],
      });
    }
  }, [roomState?.status]);

  if (!roomState || roomState.status !== 'ROUND_SUMMARY' || !roomState.lastWinner) {
    return null;
  }

  const { playerName, winningCards, blackCard } = roomState.lastWinner;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
          <Trophy className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Round Winner: <span className="text-amber-400">{playerName}</span>!
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Awarded 1 Awesome Point for the funniest answer.
        </p>

        {/* Winning Cards Combo Showcase */}
        <div className="my-6 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="transform scale-90 sm:scale-100">
            <BlackCard card={blackCard} />
          </div>
          <div className="flex flex-col gap-2 transform scale-90 sm:scale-100">
            {winningCards.map((card) => (
              <WhiteCard key={card.id} card={card} isSmall />
            ))}
          </div>
        </div>

        {/* Countdown Footer */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <span>Next round starts in</span>
          <span className="text-indigo-400 font-mono text-sm font-black">
            {remainingTimer}s
          </span>
          <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
