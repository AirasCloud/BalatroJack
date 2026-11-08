import React, { useState } from 'react';
import { TarotCard } from '../game/types';
import { sound } from '../game/audio';

interface TarotCardViewProps {
  tarot: TarotCard;
  onUse: (tarot: TarotCard) => void;
  onSell?: (tarot: TarotCard) => void;
  canUse: boolean;
  selectedCardCount: number;
}

export const TarotCardView: React.FC<TarotCardViewProps> = ({
  tarot,
  onUse,
  onSell,
  canUse,
  selectedCardCount,
}) => {
  const [isBurning, setIsBurning] = useState(false);

  const handleUse = () => {
    if (!canUse || isBurning) return;
    sound.playTarotConsume();
    setIsBurning(true);
    setTimeout(() => {
      onUse(tarot);
      setIsBurning(false);
    }, 600);
  };

  const targetsNeeded = tarot.maxTargets;
  const satisfiesTargets = targetsNeeded === 0 || selectedCardCount === targetsNeeded;

  return (
    <div
      className={`
        w-28 md:w-32 rounded-lg border-2 border-amber-500/80 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950
        p-2 flex flex-col justify-between shadow-2xl relative select-none shrink-0 transition-transform hover:-translate-y-1
        ${isBurning ? 'tarot-burn-anim pointer-events-none' : ''}
      `}
      style={{
        boxShadow: `0 8px 24px -4px ${tarot.badgeColor}40`,
      }}
    >
      {/* Header with Roman Numeral and Name */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-balatro font-bold text-amber-400">
          <span>TAROT</span>
          <span className="text-amber-300 px-1 rounded bg-amber-950/60 border border-amber-500/30">
            {tarot.romanNumeral}
          </span>
        </div>

        <h4 className="font-balatro font-black text-xs text-white uppercase tracking-tight mt-1 line-clamp-1" title={tarot.name}>
          {tarot.name}
        </h4>
      </div>

      {/* Center Art Symbol */}
      <div className="my-1.5 py-2 px-1 rounded border border-white/10 bg-black/40 flex flex-col items-center justify-center text-center">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner mb-1"
          style={{ backgroundColor: tarot.badgeColor }}
        >
          {tarot.romanNumeral}
        </div>
        <p className="text-[10px] text-slate-300 leading-snug line-clamp-3">
          {tarot.description}
        </p>
      </div>

      {/* Target prompt if needed */}
      {targetsNeeded > 0 && (
        <div className="text-[9px] text-amber-300/90 text-center font-balatro mb-1">
          {selectedCardCount === targetsNeeded ? (
            <span className="text-emerald-400 font-bold">✓ {targetsNeeded} Selected</span>
          ) : (
            <span>Pick {targetsNeeded} card{targetsNeeded > 1 ? 's' : ''} ({selectedCardCount}/{targetsNeeded})</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-1">
        <button
          onClick={handleUse}
          disabled={!canUse || !satisfiesTargets}
          className={`
            flex-1 py-1 px-1 rounded text-[11px] font-balatro font-black uppercase transition-all
            ${
              canUse && satisfiesTargets
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }
          `}
        >
          Use
        </button>
        {onSell && (
          <button
            onClick={() => onSell(tarot)}
            title="Sell for $1"
            className="py-1 px-1.5 rounded text-[10px] font-balatro bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30"
          >
            $1
          </button>
        )}
      </div>
    </div>
  );
};
