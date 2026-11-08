import React, { useEffect, useState } from 'react';
import { JazzTrack, JAZZ_PLAYLIST, sound } from '../game/audio';

interface VolumeControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VolumeControlModal: React.FC<VolumeControlModalProps> = ({ isOpen, onClose }) => {
  const [vols, setVols] = useState(sound.getVolumes());
  const [currentTrack, setCurrentTrack] = useState<JazzTrack>(sound.getCurrentTrack());

  useEffect(() => {
    const unsubscribe = sound.onTrackChange((track) => {
      setCurrentTrack(track);
      setVols(sound.getVolumes());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setMasterVolume(val);
    setVols(sound.getVolumes());
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setSfxVolume(val);
    setVols(sound.getVolumes());
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setMusicVolume(val);
    setVols(sound.getVolumes());
  };

  const handleToggleMute = () => {
    sound.toggleMute();
    setVols(sound.getVolumes());
  };

  const handleTogglePlay = () => {
    sound.toggleMusic();
    setVols(sound.getVolumes());
  };

  const handleNextTrack = () => {
    sound.nextTrack();
    setVols(sound.getVolumes());
  };

  const handlePrevTrack = () => {
    sound.prevTrack();
    setVols(sound.getVolumes());
  };

  const handleSelectTrack = (index: number) => {
    sound.playTrack(index);
    if (!vols.isMusicPlaying) {
      sound.startMusic();
    }
    setVols(sound.getVolumes());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-2xl border-2 border-indigo-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-5 shadow-[0_0_50px_rgba(30,27,75,0.8)] relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🎷</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-balatro font-black text-lg text-white">
                  Jazz Lounge Jukebox
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-balatro font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Royalty-Free Playlist
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official big band recordings by The U.S. Air Force Band (Airmen of Note) & Generative Lounge Rhodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-balatro text-sm cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Active Now-Playing Jukebox Display */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-950 border border-indigo-500/50 mb-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-balatro uppercase tracking-widest text-indigo-400 font-bold">
                Now Playing:
              </span>
              {vols.isMusicPlaying ? (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s] h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s] h-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s] h-3.5" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s] h-2.5" />
                </div>
              ) : (
                <span className="text-[10px] font-balatro font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  PAUSED
                </span>
              )}
            </div>
            <span className="text-xs font-balatro text-amber-300 font-bold">
              {currentTrack.duration}
            </span>
          </div>

          <div className="mb-3">
            <h4 className="font-balatro font-black text-lg md:text-xl text-white tracking-tight leading-tight">
              {currentTrack.title}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-300 font-balatro mt-1">
              <span>{currentTrack.artist}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{currentTrack.genre}</span>
            </div>
          </div>

          {/* Player Transport Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevTrack}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-balatro font-bold text-xs transition-transform active:scale-95 cursor-pointer"
                title="Previous Track"
              >
                ⏮ Prev
              </button>
              <button
                onClick={handleTogglePlay}
                className={`py-2 px-5 rounded-lg font-balatro font-black text-xs uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shadow-lg ${
                  vols.isMusicPlaying
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {vols.isMusicPlaying ? '⏸ Pause' : '▶ Play Music'}
              </button>
              <button
                onClick={handleNextTrack}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-balatro font-bold text-xs transition-transform active:scale-95 cursor-pointer"
                title="Next Track"
              >
                Next ⏭
              </button>
            </div>

            <div className="text-[11px] font-balatro text-slate-400">
              Track {vols.currentTrackIndex + 1} of {JAZZ_PLAYLIST.length}
            </div>
          </div>
        </div>

        {/* Playlist Drawer */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-balatro font-bold uppercase text-slate-300 tracking-wider">
              Jazz Playlist ({JAZZ_PLAYLIST.length} Tracks)
            </span>
            <span className="text-[10px] font-balatro text-slate-400">
              Click any song to play
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {JAZZ_PLAYLIST.map((track, idx) => {
              const isSelected = idx === vols.currentTrackIndex;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(idx)}
                  className={`w-full p-2.5 rounded-lg text-left font-balatro transition-all flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className={`w-5 text-center text-xs font-black shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                      {isSelected && vols.isMusicPlaying ? '▶' : `#${idx + 1}`}
                    </span>
                    <div className="truncate">
                      <span className={`font-bold text-xs block truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {track.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {track.artist} · {track.genre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {track.isProcedural && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        Procedural
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {track.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Sliders Grid */}
        <div className="space-y-3 font-balatro text-xs bg-black/40 p-3.5 rounded-xl border border-white/10 mb-4">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between items-center mb-1 text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>🎚️</span> Master Volume
              </span>
              <span className="text-amber-400 font-bold">{Math.round(vols.master * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vols.master}
              onChange={handleMasterChange}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between items-center mb-1 text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>🎷</span> Jazz Music Volume
              </span>
              <span className="text-indigo-400 font-bold">{Math.round(vols.music * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vols.music}
              onChange={handleMusicChange}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between items-center mb-1 text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔔</span> Sound Effects (SFX)
              </span>
              <span className="text-emerald-400 font-bold">{Math.round(vols.sfx * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vols.sfx}
              onChange={handleSfxChange}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions & SFX Test Buttons */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleToggleMute}
            className={`py-1.5 px-3 rounded-lg text-xs font-balatro font-bold border transition-colors cursor-pointer ${
              vols.isMuted
                ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {vols.isMuted ? '🔇 Unmute All' : '🔊 Mute All'}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-balatro text-slate-500 mr-1">Test SFX:</span>
            <button
              onClick={() => sound.playChip()}
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-balatro text-slate-300 cursor-pointer"
            >
              Chip
            </button>
            <button
              onClick={() => sound.playCardDeal()}
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-balatro text-slate-300 cursor-pointer"
            >
              Deal
            </button>
            <button
              onClick={() => sound.playBlackjackFanfare()}
              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-balatro text-amber-300 cursor-pointer"
            >
              Fanfare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
