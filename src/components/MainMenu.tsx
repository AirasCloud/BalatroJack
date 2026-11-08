import React from 'react';
import { GameMode } from '../game/types';
import { sound } from '../game/audio';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onOpenTutorial: () => void;
  onOpenVolume: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSelectMode,
  soundMuted,
  onToggleSound,
  crtEnabled,
  onToggleCrt,
  onOpenTutorial,
  onOpenVolume,
}) => {
  const handleSelect = (mode: GameMode) => {
    sound.playChip();
    onSelectMode(mode);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-6xl mx-auto text-center select-none">
      {/* Balatro Title Lockup */}
      <div className="mb-6 animate-pulse">
        <div className="inline-block px-3 py-1 rounded bg-red-600/90 text-white font-balatro text-xs font-black uppercase tracking-widest mb-2 border border-red-400 shadow-lg">
          Blackjack Edition
        </div>
        <h1 className="font-balatro font-black text-5xl md:text-7xl text-amber-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tight">
          BALATRO<span className="text-white">JACK</span>
        </h1>
        <p className="text-slate-300 font-balatro text-sm md:text-base mt-2 max-w-2xl mx-auto">
          The roguelike Blackjack simulator with Tarot enchantments, Jokers, normal casino rules, live odds calculation, and smooth jazz lounge.
        </p>
      </div>

      {/* Mode Select Grid - 4 Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
        {/* Mode 1: Classic Normal Blackjack */}
        <div className="group relative rounded-xl border-2 border-emerald-500/60 bg-gradient-to-b from-slate-900/95 to-emerald-950/80 p-5 flex flex-col justify-between text-left shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">♠️</span>
              <span className="text-[10px] font-balatro uppercase px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold">
                Classic
              </span>
            </div>
            <h2 className="font-balatro font-black text-xl text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Normal Blackjack
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional Vegas casino rules. Standard 3:2 payouts, dealer stands on 17, no Jokers or Tarot magic—pure skill, authentic felt experience.
            </p>
          </div>
          <button
            onClick={() => handleSelect('classic')}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Play Normal
          </button>
        </div>

        {/* Mode 2: For Fun (Sandbox Rogue-Lite) */}
        <div className="group relative rounded-xl border-2 border-red-500/60 bg-gradient-to-b from-slate-900/95 to-red-950/80 p-5 flex flex-col justify-between text-left shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-red-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🃏</span>
              <span className="text-[10px] font-balatro uppercase px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30 font-bold">
                Sandbox Play
              </span>
            </div>
            <h2 className="font-balatro font-black text-xl text-white mb-2 group-hover:text-amber-300 transition-colors">
              For Fun
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard rogue-lite blackjack with high-stakes bets, Tarot booster packs, Jokers, and a built-in Sandbox tool to spawn items and tweak rules at will.
            </p>
          </div>
          <button
            data-start="true"
            onClick={() => handleSelect('fun')}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Play For Fun
          </button>
        </div>

        {/* Mode 3: Sandbox (Deck Laboratory) */}
        <div className="group relative rounded-xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900/95 to-amber-950/80 p-5 flex flex-col justify-between text-left shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-amber-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🔬</span>
              <span className="text-[10px] font-balatro uppercase px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold">
                The Workshop
              </span>
            </div>
            <h2 className="font-balatro font-black text-xl text-white mb-2 group-hover:text-amber-300 transition-colors">
              Sandbox Lab
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Craft custom decks (all Aces, 10-heavy, pre-enhanced cards), test house rules, and execute 1,000-hand Monte Carlo simulations to analyze win rates.
            </p>
          </div>
          <button
            onClick={() => handleSelect('sandbox')}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Open Laboratory
          </button>
        </div>

        {/* Mode 4: Learning (Strategy & Odds Academy) */}
        <div className="group relative rounded-xl border-2 border-blue-500/60 bg-gradient-to-b from-slate-900/95 to-blue-950/80 p-5 flex flex-col justify-between text-left shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-blue-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🎓</span>
              <span className="text-[10px] font-balatro uppercase px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold">
                Guided Mastery
              </span>
            </div>
            <h2 className="font-balatro font-black text-xl text-white mb-2 group-hover:text-blue-300 transition-colors">
              Learning Mode
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Guided Basic Strategy Advisor with live odds calculation: exact bust %, cards left in deck, card point values, click-to-learn lessons, and Hi-Lo tracker.
            </p>
          </div>
          <button
            onClick={() => handleSelect('learning')}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-balatro font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            Start Learning
          </button>
        </div>
      </div>

      {/* Control Strip & Footnotes */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-balatro text-slate-400">
        <button
          onClick={onOpenTutorial}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <span>📖 How to Play Tutorial</span>
        </button>

        <button
          onClick={onOpenVolume}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <span>🎷 Jazz Lounge & Volume</span>
        </button>

        <button
          onClick={onToggleSound}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 hover:border-white/30 text-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{soundMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON'}</span>
        </button>

        <button
          onClick={onToggleCrt}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 hover:border-white/30 text-slate-300 flex items-center gap-1.5 cursor-pointer"
        >
          <span>{crtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF'}</span>
        </button>

        <div className="text-slate-400 hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">Space</kbd> to Quick Start
        </div>
      </div>
    </div>
  );
};
