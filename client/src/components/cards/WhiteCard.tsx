'use client';

import React from 'react';
import { WhiteCard as WhiteCardType } from '../../../../shared/types';
import { Check } from 'lucide-react';

interface WhiteCardProps {
  card: WhiteCardType;
  isSelected?: boolean;
  selectionOrder?: number; // 1, 2, 3 for multi-card picks
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isSmall?: boolean;
}

export const WhiteCard: React.FC<WhiteCardProps> = ({
  card,
  isSelected = false,
  selectionOrder,
  onClick,
  disabled = false,
  className = '',
  isSmall = false,
}) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative rounded-2xl bg-white text-neutral-900 flex flex-col justify-between select-none transition-all duration-200 border text-left shadow-lg
        ${isSmall ? 'w-44 h-60 p-4 text-sm' : 'w-52 h-72 sm:w-56 sm:h-80 p-5 text-base'}
        ${
          isSelected
            ? 'border-indigo-600 ring-4 ring-indigo-500/40 -translate-y-3 scale-[1.03] shadow-2xl z-20'
            : disabled
            ? 'opacity-60 cursor-not-allowed border-neutral-300'
            : 'border-neutral-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer active:scale-95'
        }
        ${className}
      `}
    >
      {/* Top Header & Selection Badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
          {card.pack ? `${card.pack} pack` : 'White Card'}
        </span>
        {isSelected && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black shadow-md animate-scale">
            {selectionOrder !== undefined ? selectionOrder : <Check className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      {/* Card Content Text */}
      <div className="my-auto py-2">
        <p className="font-bold leading-relaxed text-neutral-800 break-words">
          {card.text}
        </p>
      </div>

      {/* Footer Branding */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] font-black text-neutral-400 tracking-wider">
        <span>CARDS AGAINST HUMANITY</span>
        {isSelected && <span className="text-indigo-600 font-extrabold uppercase">Selected</span>}
      </div>
    </div>
  );
};
