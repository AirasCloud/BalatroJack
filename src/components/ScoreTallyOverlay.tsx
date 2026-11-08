import React, { useEffect, useState } from 'react';
import { BlackjackHand } from '../game/types';
import { sound } from '../game/audio';

interface ScoreTallyOverlayProps {
  hand: BlackjackHand;
  onNextHand: () => void;
}

export const ScoreTallyOverlay: React.FC<ScoreTallyOverlayProps> = ({
  hand,
  onNextHand,
}) => {
  const breakdown = hand.scoreBreakdown;
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    // Play sounds sequentially for authentic Balatro feel
    sound.playChip();

    const t1 = setTimeout(() => {
      setStep(1);
      sound.playTallyDing(1);
    }, 250);

    const t2 = setTimeout(() => {
      setStep(2);
      sound.playTallyDing(3);
    }, 550);

    const t3 = setTimeout(() => {
      setStep(3);
      if (hand.result === 'blackjack' || hand.result === 'win') {
        sound.playTallyDing(5);
        if (hand.result === 'blackjack') {
          sound.playBlackjackFanfare();
        }
      }
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hand]);

  const resultTitle = {
    blackjack: 'NATURAL BLACKJACK!',
    win: 'ROUND WON!',
    push: 'PUSH / TIE',
    lose: 'DEALER WINS',
    surrender: 'SURRENDERED',
    pending: 'ROUND OVER',
  }[hand.result];

  const resultColor = {
    blackjack: 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]',
    win: 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]',
    push: 'text-slate-300',
    lose: 'text-rose-500',
    surrender: 'text-slate-400',
    pending: 'text-slate-200',
  }[hand.result];

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md rounded-2xl border-4 border-amber-500 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status Title */}
        <h2 className={`font-balatro font-black text-3xl md:text-4xl uppercase tracking-tight mb-4 ${resultColor}`}>
          {resultTitle}
        </h2>

        {/* Special notices */}
        {breakdown?.luckyTriggered && (
          <div className="mb-2 py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-balatro text-xs font-bold inline-block animate-bounce">
            🍀 Lucky Card Triggered! (+20 Mult)
          </div>
        )}
        {breakdown?.glassShattered && (
          <div className="mb-2 py-1 px-3 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400 font-balatro text-xs font-bold inline-block">
            💥 Glass Card Shattered!
          </div>
        )}

        {/* Balatro Score Board */}
        {breakdown && (
          <div className="my-5 p-4 rounded-xl bg-black/60 border-2 border-white/10 flex items-center justify-around gap-2 shadow-inner">
            {/* Chips Box */}
            <div className={`transition-all duration-300 ${step >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
              <span className="text-[10px] font-balatro uppercase text-blue-400 block font-bold">
                Chips
              </span>
              <div className="font-balatro font-black text-2xl md:text-3xl text-blue-400">
                {breakdown.totalChips}
              </div>
              <span className="text-[9px] text-slate-400 font-balatro">
                ({breakdown.baseChips} + {breakdown.bonusChips})
              </span>
            </div>

            {/* Multiply Sign */}
            <div className={`font-balatro font-black text-2xl text-amber-400 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-20'}`}>
              ×
            </div>

            {/* Mult Box */}
            <div className={`transition-all duration-300 ${step >= 2 ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
              <span className="text-[10px] font-balatro uppercase text-red-500 block font-bold">
                Mult
              </span>
              <div className="font-balatro font-black text-2xl md:text-3xl text-red-500">
                {breakdown.totalMult}
              </div>
              <span className="text-[9px] text-slate-400 font-balatro">
                ({breakdown.baseMult + breakdown.bonusMult} × {breakdown.xMult})
              </span>
            </div>

            {/* Equals Sign */}
            <div className={`font-balatro font-black text-2xl text-amber-400 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-20'}`}>
              =
            </div>

            {/* Total Points */}
            <div className={`transition-all duration-300 ${step >= 3 ? 'scale-105 opacity-100' : 'scale-90 opacity-40'}`}>
              <span className="text-[10px] font-balatro uppercase text-amber-300 block font-bold">
                Score
              </span>
              <div className="font-balatro font-black text-2xl md:text-3xl text-amber-400">
                {breakdown.finalScore.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Payout Details */}
        <div className="flex items-center justify-center gap-4 text-sm font-balatro text-slate-300 mb-6">
          <span>Bet: <strong className="text-white">${hand.bet}</strong></span>
          <span className="text-slate-600">·</span>
          <span>
            Payout:{' '}
            <strong className={hand.payoutCash >= hand.bet ? 'text-emerald-400' : 'text-rose-400'}>
              {hand.payoutCash >= 0 ? `+$${hand.payoutCash}` : `-$${Math.abs(hand.payoutCash)}`}
            </strong>
          </span>
        </div>

        {/* Continue Action */}
        <button
          onClick={onNextHand}
          className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-balatro font-black text-base uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          Next Hand (Space)
        </button>
      </div>
    </div>
  );
};
