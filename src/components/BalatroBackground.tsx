import React from 'react';

interface BalatroBackgroundProps {
  palette?: 'classic' | 'crimson' | 'emerald' | 'void';
}

export const BalatroBackground: React.FC<BalatroBackgroundProps> = ({ palette = 'classic' }) => {
  // Pure CSS animated multi-layer plasma swirl:
  // Runs 100% on GPU/Compositor, zero CPU thread blocking, instant rendering in headless environments!
  const themeGradients = {
    classic: {
      base: 'from-[#0e1630] via-[#1a2350] to-[#2a1330]',
      blob1: 'bg-gradient-to-r from-blue-700/50 via-teal-500/40 to-indigo-600/50',
      blob2: 'bg-gradient-to-tr from-amber-600/40 via-red-600/40 to-purple-700/40',
      blob3: 'bg-gradient-to-br from-cyan-600/35 via-rose-600/35 to-blue-900/40',
    },
    crimson: {
      base: 'from-[#2a0e16] via-[#3a1520] to-[#1a0810]',
      blob1: 'bg-gradient-to-r from-red-700/50 via-rose-500/40 to-orange-600/50',
      blob2: 'bg-gradient-to-tr from-amber-600/40 via-red-800/40 to-pink-700/40',
      blob3: 'bg-gradient-to-br from-rose-600/35 via-red-900/45 to-purple-950/40',
    },
    emerald: {
      base: 'from-[#0a1e16] via-[#102b20] to-[#081510]',
      blob1: 'bg-gradient-to-r from-emerald-700/50 via-teal-500/40 to-green-600/50',
      blob2: 'bg-gradient-to-tr from-lime-600/40 via-emerald-800/40 to-cyan-700/40',
      blob3: 'bg-gradient-to-br from-teal-600/35 via-green-900/45 to-emerald-950/40',
    },
    void: {
      base: 'from-[#101020] via-[#181830] to-[#0a0a15]',
      blob1: 'bg-gradient-to-r from-indigo-700/50 via-purple-500/40 to-blue-600/50',
      blob2: 'bg-gradient-to-tr from-violet-600/40 via-fuchsia-800/40 to-indigo-700/40',
      blob3: 'bg-gradient-to-br from-indigo-600/35 via-slate-900/45 to-purple-950/40',
    },
  }[palette];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeGradients.base}`} />

      {/* Rotating and pulsating swirling vortex layers */}
      <div
        className={`absolute -top-1/4 -left-1/4 w-[150%] h-[150%] rounded-[45%] opacity-70 mix-blend-screen blur-3xl filter ${themeGradients.blob1} animate-[spin_24s_linear_infinite]`}
      />
      <div
        className={`absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] rounded-[42%] opacity-60 mix-blend-screen blur-3xl filter ${themeGradients.blob2} animate-[spin_32s_linear_infinite_reverse]`}
      />
      <div
        className={`absolute top-1/6 left-1/6 w-[120%] h-[120%] rounded-[48%] opacity-50 mix-blend-screen blur-2xl filter ${themeGradients.blob3} animate-[pulse_8s_ease-in-out_infinite]`}
      />

      {/* Balatro halftone noise & vignette */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
};
