import React, { useState } from 'react';
import { sound } from '../game/audio';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'WELCOME TO BALATROJACK',
      badge: 'Step 1 of 5 · Core Rules',
      icon: '🃏',
      content: (
        <div className="space-y-3 text-left">
          <p className="text-sm text-slate-200 leading-relaxed">
            Blackjack meets Balatro! Your goal is to beat the dealer by building a hand value as close to <strong>21</strong> as possible without going over (busting).
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-balatro pt-2">
            <div className="p-2 rounded-lg bg-black/50 border border-white/10">
              <span className="text-amber-400 font-bold block text-sm">2 to 10</span>
              <span className="text-slate-400 text-[10px]">Face Value (2 - 10 pts)</span>
            </div>
            <div className="p-2 rounded-lg bg-black/50 border border-white/10">
              <span className="text-amber-400 font-bold block text-sm">J, Q, K</span>
              <span className="text-slate-400 text-[10px]">Counts as 10 pts</span>
            </div>
            <div className="p-2 rounded-lg bg-black/50 border border-white/10">
              <span className="text-emerald-400 font-bold block text-sm">Ace (A)</span>
              <span className="text-slate-400 text-[10px]">Flexible: 1 or 11 pts</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            A starting 2-card 21 (Ace + 10-value) is a <strong>Natural Blackjack</strong>, paying out 3:2!
          </p>
        </div>
      ),
    },
    {
      title: 'THE BALATRO SCORING TWIST',
      badge: 'Step 2 of 5 · Chips × Mult',
      icon: '💥',
      content: (
        <div className="space-y-3 text-left">
          <p className="text-sm text-slate-200 leading-relaxed">
            In Balatrojack, every completed hand scores points using the iconic formula:
          </p>
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/40 text-center font-balatro text-lg md:text-xl font-black">
            <span className="text-blue-400">CHIPS</span>
            <span className="text-amber-400 mx-2">×</span>
            <span className="text-red-500">MULT</span>
            <span className="text-white mx-2">=</span>
            <span className="text-amber-300">TOTAL SCORE</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong>Base Chips:</strong> Higher hand totals grant more chips (Natural 21 = +150 Chips, 20 = +80 Chips).</li>
            <li><strong>Base Mult:</strong> Win = ×2 Mult, Natural Blackjack = ×4 Mult!</li>
            <li><strong>Jokers:</strong> Passive items that trigger bonuses (e.g. +8 Mult on pairs, +4 Mult on Spades, x1.5 Mult per King).</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'CARD ENHANCEMENTS & EDITIONS',
      badge: 'Step 3 of 5 · Special Cards',
      icon: '✨',
      content: (
        <div className="space-y-2.5 text-left">
          <p className="text-xs text-slate-300">
            Cards can be enhanced with distinct Balatro properties:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-balatro">
            <div className="p-2 rounded bg-blue-950/40 border border-blue-500/40">
              <span className="text-blue-300 font-bold block">Bonus Card</span>
              <span className="text-[10px] text-slate-400">+30 Chips when scored</span>
            </div>
            <div className="p-2 rounded bg-red-950/40 border border-red-500/40">
              <span className="text-red-300 font-bold block">Mult Card</span>
              <span className="text-[10px] text-slate-400">+4 Mult when scored</span>
            </div>
            <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/40">
              <span className="text-cyan-300 font-bold block">Glass Card</span>
              <span className="text-[10px] text-slate-400">x2.0 Mult (1 in 4 chance to shatter!)</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-600">
              <span className="text-slate-300 font-bold block">Steel Card</span>
              <span className="text-[10px] text-slate-400">x1.5 Mult passive in hand</span>
            </div>
            <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40">
              <span className="text-amber-300 font-bold block">Gold Card</span>
              <span className="text-[10px] text-slate-400">+$3 Cash bonus at round end</span>
            </div>
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-emerald-300 font-bold block">Lucky Card</span>
              <span className="text-[10px] text-slate-400">1/5 for +20 Mult, 1/15 for +$20!</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Cards can also have glowing <strong>Foil (+50 Chips)</strong>, <strong>Holographic (+10 Mult)</strong>, or <strong>Polychrome (x1.5 Mult)</strong> editions.
          </p>
        </div>
      ),
    },
    {
      title: 'TAROT CONSUMABLES',
      badge: 'Step 4 of 5 · Mystical Magic',
      icon: '🔮',
      content: (
        <div className="space-y-3 text-left">
          <p className="text-sm text-slate-200 leading-relaxed">
            You can hold up to 3 Tarot cards in your consumable slots. When dealt a hand:
          </p>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-balatro">
            <li><strong>Click on cards</strong> in your hand or the dealer upcard to select them (they float with a gold border).</li>
            <li>Check the requirement on the Tarot card (e.g. <em>Pick 2 cards</em> for The Magician).</li>
            <li>Press <strong>USE</strong> to consume the Tarot card with a fire animation and enhance the selected cards!</li>
          </ol>
          <p className="text-xs text-amber-300 font-balatro">
            Example: Use <em>The Magician</em> on your 10 and Ace to turn them into Lucky Cards!
          </p>
        </div>
      ),
    },
    {
      title: 'EXPLORE THE 4 GAME MODES',
      badge: 'Step 5 of 5 · Game Modes',
      icon: '🎯',
      content: (
        <div className="space-y-2.5 text-left text-xs font-balatro">
          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40">
            <span className="font-bold text-emerald-300 block">1. Classic Normal Blackjack</span>
            <span className="text-[10px] text-slate-400">Traditional casino rules, standard bankroll, zero Jokers or Tarot—pure blackjack.</span>
          </div>
          <div className="p-2 rounded bg-red-950/40 border border-red-500/40">
            <span className="font-bold text-red-300 block">2. For Fun (Sandbox Rogue-Lite)</span>
            <span className="text-[10px] text-slate-400">Tarot booster packs, Jokers, and the floating Sandbox Tool to spawn items freely.</span>
          </div>
          <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40">
            <span className="font-bold text-amber-300 block">3. Sandbox Lab (The Workshop)</span>
            <span className="text-[10px] text-slate-400">Custom shoe builder (10-heavy, all aces), house rule toggles, and instant 1,000-hand Monte Carlo simulations.</span>
          </div>
          <div className="p-2 rounded bg-blue-950/40 border border-blue-500/40">
            <span className="font-bold text-blue-300 block">4. Learning Mode (Strategy Academy)</span>
            <span className="text-[10px] text-slate-400">Live card counts, bust probabilities, click-to-learn strategy lessons, and complete basic strategy matrix.</span>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    sound.playChip();
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sound.playChip();
    if (step > 0) setStep((s) => s - 1);
  };

  const handleComplete = () => {
    sound.playChip();
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_tutorial_seen', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col justify-between min-h-[480px]">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-balatro uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {current.badge}
            </span>
            <button
              onClick={handleComplete}
              className="text-xs text-slate-400 hover:text-white font-balatro cursor-pointer"
            >
              Skip Tutorial ✕
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{current.icon}</span>
            <h2 className="font-balatro font-black text-xl md:text-2xl text-white tracking-tight">
              {current.title}
            </h2>
          </div>

          {/* Step Body */}
          <div className="my-3 min-h-[260px] flex items-center">
            {current.content}
          </div>
        </div>

        {/* Step Indicator and Controls */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === step ? 'bg-amber-400 w-6' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-balatro font-bold text-slate-300 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="py-2 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-balatro font-black uppercase tracking-wider shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              {step === steps.length - 1 ? "Let's Play!" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
