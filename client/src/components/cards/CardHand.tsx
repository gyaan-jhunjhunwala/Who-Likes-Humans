'use client';

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { WhiteCard } from './WhiteCard';
import { Send, CheckCircle2, Crown, Sparkles } from 'lucide-react';

export const CardHand: React.FC = () => {
  const {
    myHand,
    roomState,
    playerId,
    selectedCardIds,
    toggleCardSelection,
    submitSelectedCards,
  } = useGameStore();

  if (!roomState) return null;

  const isCzar = roomState.czarId === playerId;
  const isSelectingPhase = roomState.status === 'SELECTING';
  const myPlayer = roomState.players.find((p) => p.id === playerId);
  const hasSubmitted = myPlayer?.hasSubmitted || false;
  const requiredPicks = roomState.blackCard?.pick || 1;
  const canSubmit =
    isSelectingPhase &&
    !isCzar &&
    !hasSubmitted &&
    selectedCardIds.length === requiredPicks;

  // Render Czar message during selection
  if (isCzar) {
    return (
      <div className="w-full bg-surface/90 border-t border-white/10 p-6 rounded-t-3xl backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 animate-bounce-short">
          <Crown className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-amber-400">You are the Card Czar!</h3>
        <p className="text-sm text-neutral-400 max-w-md mt-1">
          Other players are choosing their funniest cards. You will judge and pick the winner in the next phase!
        </p>
      </div>
    );
  }

  // Render Already Submitted view
  if (hasSubmitted && isSelectingPhase) {
    return (
      <div className="w-full bg-surface/90 border-t border-white/10 p-6 rounded-t-3xl backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-emerald-400">Answer Locked In!</h3>
        <p className="text-sm text-neutral-400 max-w-md mt-1">
          Waiting for all players to finish submitting their cards...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface/95 border-t border-white/10 p-4 sm:p-6 rounded-t-3xl backdrop-blur-2xl shadow-2xl transition-all">
      {/* Hand Action Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Your Hand ({myHand.length} Cards)
          </span>
          {isSelectingPhase && (
            <span className="text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-3 py-1 rounded-full font-bold">
              Selected {selectedCardIds.length} of {requiredPicks}
            </span>
          )}
        </div>

        {/* Submit Button */}
        {isSelectingPhase && (
          <button
            onClick={submitSelectedCards}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm tracking-wide transition-all duration-200 shadow-lg ${
              canSubmit
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transform hover:scale-105 active:scale-95 shadow-indigo-500/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
            }`}
          >
            <Send className="w-4 h-4" />
            {canSubmit ? 'SUBMIT ANSWER' : `PICK ${requiredPicks - selectedCardIds.length} MORE`}
          </button>
        )}
      </div>

      {/* Cards Horizontal Scrolling Container */}
      <div className="max-w-7xl mx-auto overflow-x-auto pb-4 pt-2 flex gap-4 px-2 no-scrollbar">
        {myHand.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          const order = isSelected ? selectedCardIds.indexOf(card.id) + 1 : undefined;

          return (
            <div key={card.id} className="flex-shrink-0">
              <WhiteCard
                card={card}
                isSelected={isSelected}
                selectionOrder={order}
                disabled={!isSelectingPhase || hasSubmitted}
                onClick={() => toggleCardSelection(card.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
