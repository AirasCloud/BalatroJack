import React, { useState } from 'react';
import { Card } from '../game/types';

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delayMs?: number;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  onClick,
  selectable = false,
  selected = false,
  size = 'md',
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -12,
      y: (x / (rect.width / 2)) * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Size dimensions
  const sizeClasses = {
    sm: 'w-16 h-24 text-xs',
    md: 'w-24 h-36 text-sm',
    lg: 'w-32 h-48 text-base',
  }[size];

  // Suit symbols and colors
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  }[card.suit];

  const suitColorClass = isRed ? 'text-rose-600' : 'text-slate-950';

  // Card Back
  if (card.isHidden) {
    return (
      <div
        className={`${sizeClasses} relative rounded-lg border-2 border-amber-600 bg-amber-950 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-200`}
        style={{
          transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-1 rounded border border-amber-500/40 bg-gradient-to-br from-amber-900 via-amber-950 to-red-950 flex flex-col items-center justify-center p-2">
          <div className="w-9 h-9 rounded-full border-2 border-amber-400/60 bg-amber-900/60 flex items-center justify-center text-amber-300 text-sm font-black font-balatro shadow-inner">
            BJ
          </div>
          <div className="text-[9px] text-amber-400 font-balatro font-bold mt-1.5 uppercase tracking-wider">
            Hidden
          </div>
        </div>
      </div>
    );
  }

  // Broken Glass Card
  if (card.isBroken) {
    return (
      <div
        className={`${sizeClasses} relative rounded-lg border-2 border-dashed border-red-500/50 bg-black/60 shadow-inner flex flex-col items-center justify-center p-2 opacity-50 text-center`}
      >
        <span className="text-xl">💥</span>
        <span className="text-[10px] text-red-400 font-bold uppercase mt-1">Shattered</span>
      </div>
    );
  }

  // Edition classes
  let editionClass = '';
  let editionBadge: string | null = null;
  if (card.edition === 'foil') {
    editionClass = 'card-foil';
    editionBadge = 'Foil +50c';
  } else if (card.edition === 'holo') {
    editionClass = 'card-holo';
    editionBadge = 'Holo +10m';
  } else if (card.edition === 'polychrome') {
    editionClass = 'card-polychrome';
    editionBadge = 'Poly x1.5';
  }

  // Enhancement styles
  let enhancementBadge: { text: string; bg: string; textCol: string } | null = null;
  let surfaceBg = 'bg-white';
  let borderCol = 'border-slate-400';

  if (card.enhancement === 'bonus') {
    surfaceBg = 'bg-blue-50';
    borderCol = 'border-blue-500';
    enhancementBadge = { text: '+30 Chips', bg: 'bg-blue-600', textCol: 'text-white' };
  } else if (card.enhancement === 'mult') {
    surfaceBg = 'bg-red-50';
    borderCol = 'border-red-500';
    enhancementBadge = { text: '+4 Mult', bg: 'bg-red-600', textCol: 'text-white' };
  } else if (card.enhancement === 'wild') {
    surfaceBg = 'bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50';
    borderCol = 'border-purple-500';
    enhancementBadge = { text: 'Wild', bg: 'bg-purple-600', textCol: 'text-white' };
  } else if (card.enhancement === 'glass') {
    surfaceBg = 'bg-cyan-100';
    borderCol = 'border-cyan-400';
    enhancementBadge = { text: 'x2 Mult', bg: 'bg-cyan-700', textCol: 'text-white' };
  } else if (card.enhancement === 'steel') {
    surfaceBg = 'bg-slate-300';
    borderCol = 'border-slate-600';
    enhancementBadge = { text: 'x1.5 Steel', bg: 'bg-slate-800', textCol: 'text-white' };
  } else if (card.enhancement === 'gold') {
    surfaceBg = 'bg-amber-100';
    borderCol = 'border-amber-500';
    enhancementBadge = { text: '+$3 Gold', bg: 'bg-amber-600', textCol: 'text-slate-950 font-bold' };
  } else if (card.enhancement === 'lucky') {
    surfaceBg = 'bg-emerald-50';
    borderCol = 'border-emerald-500';
    enhancementBadge = { text: 'Lucky', bg: 'bg-emerald-600', textCol: 'text-white' };
  }

  return (
    <div
      onClick={selectable && onClick ? onClick : undefined}
      className={`
        ${sizeClasses}
        relative select-none rounded-lg border-2 ${borderCol} ${surfaceBg}
        shadow-xl flex flex-col justify-between p-1.5 transition-all duration-200
        ${selectable ? 'cursor-pointer hover:shadow-2xl' : ''}
        ${selected ? '-translate-y-4 ring-4 ring-amber-400 border-amber-400' : 'hover:-translate-y-1'}
      `}
      style={{
        transform: selected
          ? 'translateY(-16px) scale(1.05)'
          : `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Edition Shimmer Overlay */}
      {editionClass && (
        <div className={`absolute inset-0 rounded-md pointer-events-none ${editionClass} opacity-70`} />
      )}

      {/* Top Left Rank and Suit */}
      <div className="flex flex-col items-center leading-none z-10 w-fit">
        <span className={`font-black font-balatro ${suitColorClass} text-sm md:text-base`}>
          {card.rank}
        </span>
        <span className={`${suitColorClass} text-xs md:text-sm`}>
          {suitSymbol}
        </span>
      </div>

      {/* Center Art / Big Suit Symbol */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className={`${suitColorClass} text-2xl md:text-3xl opacity-85`}>
          {suitSymbol}
        </span>

        {/* Enhancement text pill inside card */}
        {enhancementBadge && (
          <div
            className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-balatro uppercase shadow-sm ${enhancementBadge.bg} ${enhancementBadge.textCol}`}
          >
            {enhancementBadge.text}
          </div>
        )}

        {/* Edition text badge */}
        {editionBadge && (
          <div className="mt-0.5 px-1 py-0.2 rounded text-[8px] font-black font-balatro uppercase bg-slate-900/80 text-amber-300">
            {editionBadge}
          </div>
        )}
      </div>

      {/* Bottom Right Rank and Suit (Inverted) */}
      <div className="flex flex-col items-center leading-none z-10 self-end rotate-180 w-fit">
        <span className={`font-black font-balatro ${suitColorClass} text-sm md:text-base`}>
          {card.rank}
        </span>
        <span className={`${suitColorClass} text-xs md:text-sm`}>
          {suitSymbol}
        </span>
      </div>

      {/* Selected Indicator Checkmark */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black shadow-md z-20">
          ✓
        </div>
      )}
    </div>
  );
};
