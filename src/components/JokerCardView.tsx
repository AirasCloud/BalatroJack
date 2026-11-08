import React from 'react';
import { Joker } from '../game/types';

interface JokerCardViewProps {
  joker: Joker;
  onSell?: (joker: Joker) => void;
}

export const JokerCardView: React.FC<JokerCardViewProps> = ({ joker, onSell }) => {
  const rarityColors = {
    common: 'border-blue-500/70 bg-blue-950/40 text-blue-300',
    uncommon: 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300',
    rare: 'border-rose-500/70 bg-rose-950/40 text-rose-300',
  }[joker.rarity];

  return (
    <div
      className={`
        w-28 md:w-32 rounded-lg border-2 ${rarityColors} bg-gradient-to-b from-slate-900 to-black
        p-2 flex flex-col justify-between shadow-xl relative select-none shrink-0 transition-transform hover:-translate-y-1
      `}
    >
      <div>
        <div className="flex items-center justify-between text-[10px] font-balatro font-bold uppercase">
          <span className="text-slate-400">JOKER</span>
          <span className="capitalize px-1 rounded bg-black/40 border border-white/10">
            {joker.rarity}
          </span>
        </div>

        <h4 className="font-balatro font-black text-xs text-white uppercase tracking-tight mt-1 line-clamp-1">
          {joker.name}
        </h4>
      </div>

      <div className="my-1.5 py-1.5 px-1 rounded bg-black/50 border border-white/10 text-center">
        <div className="text-xl mb-0.5">🃏</div>
        <p className="text-[10px] font-bold text-amber-300 font-balatro leading-tight">
          {joker.description}
        </p>
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/10">
        <span className="line-clamp-1">{joker.conditionDescription}</span>
        {onSell && (
          <button
            onClick={() => onSell(joker)}
            title="Sell for $2"
            className="ml-1 px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-balatro"
          >
            $2
          </button>
        )}
      </div>
    </div>
  );
};
