'use client';

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { BlackCard } from '../cards/BlackCard';
import { WhiteCard } from '../cards/WhiteCard';
import { Crown, Eye, Trophy, Clock, Users, Sparkles } from 'lucide-react';

export const TableArea: React.FC = () => {
  const {
    roomState,
    playerId,
    remainingTimer,
    revealCard,
    selectWinner,
  } = useGameStore();

  if (!roomState) return null;

  const isCzar = roomState.czarId === playerId;
  const czarPlayer = roomState.players.find((p) => p.id === roomState.czarId);
  const activePlayers = roomState.players.filter((p) => p.isConnected);
  const nonCzarCount = activePlayers.filter((p) => p.id !== roomState.czarId).length;

  return (
    <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Status & Timer Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        {/* Round & Czar Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black">
            R{roomState.roundNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
                Card Czar
              </span>
              {isCzar && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  (You)
                </span>
              )}
            </div>
            <p className="text-base font-black text-white flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              {czarPlayer?.name || 'Assigned Czar'}
            </p>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold block">
            Phase
          </span>
          <span className="text-sm font-black text-indigo-300">
            {roomState.status === 'SELECTING'
              ? 'Players Choosing Cards'
              : roomState.status === 'JUDGING'
              ? 'Czar is Judging Answers'
              : 'Round Summary'}
          </span>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/80 px-4 py-2 rounded-xl text-white font-mono shadow-inner">
          <Clock className={`w-4 h-4 ${remainingTimer <= 10 ? 'text-rose-500 animate-bounce-short' : 'text-neutral-400'}`} />
          <span className={`text-base font-black ${remainingTimer <= 10 ? 'text-rose-400' : 'text-neutral-200'}`}>
            00:{remainingTimer < 10 ? `0${remainingTimer}` : remainingTimer}
          </span>
        </div>
      </div>

      {/* Main Table Layout (Black Card & Submissions Showcase) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center: Active Black Card */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <span className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Active Prompt
          </span>
          <BlackCard card={roomState.blackCard} isCzar={isCzar} />
        </div>

        {/* Right: Submissions Stage */}
        <div className="lg:col-span-8 flex flex-col items-center lg:items-start w-full">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              {roomState.status === 'SELECTING'
                ? `Submissions (${roomState.submissionsCount}/${nonCzarCount})`
                : `Anonymous Submissions (${roomState.anonymousSubmissions.length})`}
            </span>
            {roomState.status === 'JUDGING' && isCzar && (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-700/40 px-3 py-1 rounded-full animate-pulse">
                Click a card to reveal & pick your favorite!
              </span>
            )}
          </div>

          {/* Submissions Grid during SELECTING */}
          {roomState.status === 'SELECTING' && (
            <div className="w-full glass-panel rounded-3xl p-8 flex flex-wrap items-center justify-center gap-6 min-h-[340px]">
              {Array.from({ length: nonCzarCount }).map((_, index) => {
                const isSubmitted = index < roomState.submissionsCount;
                return (
                  <div
                    key={index}
                    className={`w-44 h-64 rounded-2xl border-2 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
                      isSubmitted
                        ? 'bg-neutral-900 border-indigo-500/80 shadow-lg shadow-indigo-500/20 transform -translate-y-2'
                        : 'bg-neutral-950/40 border-dashed border-neutral-800 opacity-60'
                    }`}
                  >
                    {isSubmitted ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                          ✓
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                          Submitted
                        </span>
                        <span className="text-[10px] text-neutral-400">Anonymous</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-600">
                          ?
                        </div>
                        <span className="text-xs font-semibold text-neutral-500">Choosing...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Submissions Grid during JUDGING */}
          {roomState.status === 'JUDGING' && (
            <div className="w-full glass-panel rounded-3xl p-6 flex flex-wrap items-center justify-center gap-6 min-h-[340px]">
              {roomState.anonymousSubmissions.length === 0 ? (
                <p className="text-neutral-500 text-sm">No submissions were received this round.</p>
              ) : (
                roomState.anonymousSubmissions.map((sub, index) => {
                  return (
                    <div
                      key={sub.submissionId}
                      className="flex flex-col items-center gap-3 group"
                    >
                      {sub.isRevealed ? (
                        /* Revealed White Card */
                        <div className="relative">
                          {sub.cards.map((c, cIdx) => (
                            <div key={c.id} className={cIdx > 0 ? 'mt-2' : ''}>
                              <WhiteCard card={c} isSmall />
                            </div>
                          ))}

                          {/* Czar Winner Selection Button */}
                          {isCzar && (
                            <button
                              onClick={() => selectWinner(sub.submissionId)}
                              className="mt-3 w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Trophy className="w-4 h-4" /> Pick Winner
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Unrevealed Card Back */
                        <div
                          onClick={isCzar ? () => revealCard(index) : undefined}
                          className={`w-44 h-60 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-700 p-5 flex flex-col justify-between select-none shadow-xl transition-all duration-300 ${
                            isCzar
                              ? 'cursor-pointer hover:border-amber-500 hover:scale-105 shadow-amber-500/10'
                              : 'opacity-90'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase">
                            <span>Submission #{index + 1}</span>
                            {isCzar && <Eye className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                          </div>
                          <div className="text-center my-auto">
                            <span className="text-2xl font-black text-neutral-700">CAH</span>
                            <p className="text-[11px] font-medium text-neutral-500 mt-1">
                              {isCzar ? 'Click to Flip' : 'Hidden Answer'}
                            </p>
                          </div>
                          <div className="text-[9px] font-mono text-neutral-600 text-center uppercase tracking-widest">
                            Anonymous
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
