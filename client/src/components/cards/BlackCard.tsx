'use client';

import React from 'react';
import { BlackCard as BlackCardType } from '../../../../shared/types';
import { Sparkles } from 'lucide-react';

interface BlackCardProps {
  card: BlackCardType | null;
  className?: string;
  isCzar?: boolean;
}

export const BlackCard: React.FC<BlackCardProps> = ({ card, className = '', isCzar = false }) => {
  if (!card) {
    return (
      <div className={`w-56 h-80 rounded-2xl bg-neutral-900/80 border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center p-6 text-neutral-500 shadow-xl ${className}`}>
        <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
        <span className="text-sm font-medium">Waiting for Black Card...</span>
      </div>
    );
  }

  // Format text to make underscores stand out as clean blank underlines
  const formattedText = card.text.split('_').map((part, index, array) => (
    <React.Fragment key={index}>
      {part}
      {index < array.length - 1 && (
        <span className="inline-block border-b-2 border-indigo-400 min-w-[70px] mx-1.5 opacity-90 text-indigo-400 font-bold">
          _____
        </span>
      )}
    </React.Fragment>
  ));

  return (
    <div
      className={`relative w-60 h-84 sm:w-64 sm:h-92 rounded-2xl bg-neutral-950 text-white p-6 flex flex-col justify-between shadow-2xl border border-neutral-800 transition-all duration-300 transform hover:scale-[1.02] ${className}`}
      style={{
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-neutral-400 bg-neutral-900/90 px-2.5 py-1 rounded-full border border-neutral-800">
          {card.pack ? `${card.pack.toUpperCase()} PACK` : 'BLACK CARD'}
        </span>
        {isCzar && (
          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            👑 You are Czar
          </span>
        )}
      </div>

      {/* Main Prompt Text */}
      <div className="my-auto py-3">
        <p className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight text-neutral-100">
          {formattedText}
        </p>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs font-semibold text-neutral-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] tracking-wide font-black">CARDS AGAINST HUMANITY</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-700/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-neutral-200">
          PICK {card.pick}
        </div>
      </div>
    </div>
  );
};
