/**
 * Web Audio API Sound Synthesizer, Streaming Royalty-Free Jazz Playlist & Generative Lounge Music
 */

export interface JazzTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  url?: string;
  isProcedural?: boolean;
}

export const JAZZ_PLAYLIST: JazzTrack[] = [
  {
    id: 'track-1',
    title: 'Blues for Mundy',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Airmen of Note Classics',
    genre: 'Big Band Blues & Walking Bass',
    duration: '4:38',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Blues_for_Mundy_-_Airmen_of_Note_-_United_States_Air_Force_Band.mp3',
  },
  {
    id: 'track-2',
    title: 'Convergence',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Modern Jazz Sessions',
    genre: 'Modern Cool Jazz & Horns',
    duration: '4:52',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Convergence_-_Airmen_of_Note_-_United_States_Air_Force_Band.mp3',
  },
  {
    id: 'track-3',
    title: 'Eagle Eyes',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Airmen of Note Classics',
    genre: 'Upbeat Bebop & Swing',
    duration: '5:38',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Eagle_Eyes_-_Airmen_of_Note_-_United_States_Air_Force_Band.mp3',
  },
  {
    id: 'track-4',
    title: 'Everyday Adventures',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Contemporary Big Band',
    genre: 'Smooth Fusion Jazz',
    duration: '4:15',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Everyday_Adventures_-_Airmen_of_Note_-_United_States_Air_Force_Band.mp3',
  },
  {
    id: 'track-5',
    title: 'Auld Lang Cha Cha Cha',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Latin Jazz Sessions',
    genre: 'Latin Big Band & Percussion',
    duration: '3:20',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Auld_Lang_Cha_Cha_Cha.ogg',
  },
  {
    id: 'track-6',
    title: 'Arirang Jazz Arrangement',
    artist: 'The Airmen of Note (U.S. Air Force Band)',
    album: 'Global Jazz Horizons',
    genre: 'Lyrical Ballad & Brass Quartet',
    duration: '5:10',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Arirang_-_Airmen_of_Note_-_United_States_Air_Force_Band.mp3',
  },
  {
    id: 'track-7',
    title: 'Midnight Lounge (Balatro Generative)',
    artist: 'Balatro Synth Quartet',
    album: 'Casino After Hours',
    genre: 'Lush Rhodes FM & Upright Bass',
    duration: 'Infinite Loop',
    isProcedural: true,
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private sfxVol: number = 0.8;
  private musicVol: number = 0.6;

  // Streaming audio player
  private audioEl: HTMLAudioElement | null = null;
  private currentTrackIndex: number = 0;
  private isMusicPlaying: boolean = false;
  private onTrackChangeCallbacks: Array<(track: JazzTrack) => void> = [];

  // Procedural Web Audio fallback / generative engine
  private proceduralTimerId: number | null = null;
  private jazzStep: number = 0;

  // Master Gain Nodes for Web Audio SFX and procedural music
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('balatro_sound_muted') === 'true';
      const mVol = localStorage.getItem('balatro_master_vol');
      const sVol = localStorage.getItem('balatro_sfx_vol');
      const bgmVol = localStorage.getItem('balatro_music_vol');
      const savedTrack = localStorage.getItem('balatro_jazz_track_idx');

      if (mVol !== null) this.masterVol = parseFloat(mVol);
      if (sVol !== null) this.sfxVol = parseFloat(sVol);
      if (bgmVol !== null) this.musicVol = parseFloat(bgmVol);
      if (savedTrack !== null) {
        const parsed = parseInt(savedTrack, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < JAZZ_PLAYLIST.length) {
          this.currentTrackIndex = parsed;
        }
      }

      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.preload = 'metadata';
      this.updateAudioElementVolume();

      // Automatically advance to next track on finish
      this.audioEl.addEventListener('ended', () => {
        this.nextTrack();
      });

      // Gracefully fall back to next track or procedural on streaming error
      this.audioEl.addEventListener('error', () => {
        const current = this.getCurrentTrack();
        if (current.url) {
          // If stream fails, switch to next track or procedural engine
          if (this.currentTrackIndex < JAZZ_PLAYLIST.length - 1) {
            this.nextTrack();
          } else {
            this.playTrack(JAZZ_PLAYLIST.length - 1); // Play procedural track
          }
        }
      });
    }
  }

  private updateAudioElementVolume() {
    if (this.audioEl) {
      const effectiveVolume = this.isMuted ? 0 : Math.max(0, Math.min(1, this.masterVol * this.musicVol));
      this.audioEl.volume = effectiveVolume;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ===================== VOLUME CONTROLS =====================
  public setMasterVolume(val: number) {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
    this.updateAudioElementVolume();
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_master_vol', String(this.masterVol));
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVol = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_sfx_vol', String(this.sfxVol));
    }
  }

  public setMusicVolume(val: number) {
    this.musicVol = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
    this.updateAudioElementVolume();
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_music_vol', String(this.musicVol));
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
    this.updateAudioElementVolume();
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolumes() {
    return {
      master: this.masterVol,
      sfx: this.sfxVol,
      music: this.musicVol,
      isMuted: this.isMuted,
      isMusicPlaying: this.isMusicPlaying,
      currentTrackIndex: this.currentTrackIndex,
    };
  }

  // ===================== JAZZ PLAYLIST & PLAYBACK =====================
  public getPlaylist(): JazzTrack[] {
    return JAZZ_PLAYLIST;
  }

  public getCurrentTrack(): JazzTrack {
    return JAZZ_PLAYLIST[this.currentTrackIndex] || JAZZ_PLAYLIST[0];
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public getMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public onTrackChange(cb: (track: JazzTrack) => void) {
    this.onTrackChangeCallbacks.push(cb);
    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyTrackChange() {
    const track = this.getCurrentTrack();
    this.onTrackChangeCallbacks.forEach((cb) => {
      try {
        cb(track);
      } catch {}
    });
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.pauseMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public startMusic() {
    this.initCtx();
    this.initAudioElement();
    this.isMusicPlaying = true;
    this.playCurrentTrackSource();
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopProceduralSynth();
  }

  public playTrack(index: number) {
    if (index < 0 || index >= JAZZ_PLAYLIST.length) return;
    this.currentTrackIndex = index;
    if (typeof window !== 'undefined') {
      localStorage.setItem('balatro_jazz_track_idx', String(index));
    }
    this.notifyTrackChange();

    if (this.isMusicPlaying) {
      this.playCurrentTrackSource();
    }
  }

  public nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % JAZZ_PLAYLIST.length;
    this.playTrack(nextIdx);
  }

  public prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + JAZZ_PLAYLIST.length) % JAZZ_PLAYLIST.length;
    this.playTrack(prevIdx);
  }

  private playCurrentTrackSource() {
    const track = this.getCurrentTrack();
    this.stopProceduralSynth();

    if (track.isProcedural || !track.url) {
      // Procedural synthetic jazz mode
      if (this.audioEl) {
        this.audioEl.pause();
      }
      this.startProceduralSynth();
    } else {
      // HTML5 streaming audio mode
      if (this.audioEl) {
        if (this.audioEl.src !== track.url) {
          this.audioEl.src = track.url;
          this.audioEl.currentTime = 0;
        }
        this.updateAudioElementVolume();
        const playPromise = this.audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If browser autoplay policy blocks audio or stream errors, fall back to procedural
            this.startProceduralSynth();
          });
        }
      }
    }
    this.notifyTrackChange();
  }

  // ===================== ENHANCED PROCEDURAL SYNTH ENGINE =====================
  // Rich jazz turnaround chords: Dm9 -> G13 -> Cmaj9 -> A7b13 / Bbm9
  private jazzChords = [
    // Dm9: D2, F3, A3, C4, E4
    { bass: 73.42, chord: [174.61, 220.00, 261.63, 329.63] },
    // G13: G2, F3, B3, E4
    { bass: 98.00, chord: [174.61, 246.94, 329.63, 392.00] },
    // Cmaj9: C2, E3, G3, B3, D4
    { bass: 65.41, chord: [164.81, 196.00, 246.94, 293.66] },
    // A7b13: A2, G3, C#4, F4
    { bass: 110.00, chord: [196.00, 277.18, 349.23, 440.00] },
  ];

  private startProceduralSynth() {
    this.initCtx();
    this.jazzStep = 0;
    this.scheduleNextJazzBeat();
  }

  private stopProceduralSynth() {
    if (this.proceduralTimerId !== null) {
      clearTimeout(this.proceduralTimerId);
      this.proceduralTimerId = null;
    }
  }

  private scheduleNextJazzBeat() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    const chordIdx = Math.floor(this.jazzStep / 4) % this.jazzChords.length;
    const beatInBar = this.jazzStep % 4; // 0, 1, 2, 3
    const chord = this.jazzChords[chordIdx];
    const now = this.ctx.currentTime;

    // 1. Upright Acoustic Walking Bass with warm low-pass and subtle slide
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    const bassFilter = this.ctx.createBiquadFilter();

    bassOsc.type = 'triangle';
    let bassFreq = chord.bass;
    if (beatInBar === 1) bassFreq *= 1.25; // 3rd
    else if (beatInBar === 2) bassFreq *= 1.5; // 5th
    else if (beatInBar === 3) bassFreq *= 1.125; // passing tone

    bassOsc.frequency.setValueAtTime(bassFreq, now);
    // Subtle finger slide on beat 3
    if (beatInBar === 3) {
      bassOsc.frequency.exponentialRampToValueAtTime(chord.bass * 1.05, now + 0.3);
    }

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(320, now);
    bassFilter.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    bassGain.gain.setValueAtTime(0.32, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassOsc.start(now);
    bassOsc.stop(now + 0.5);

    // 2. Lush FM Rhodes Electric Piano (Harmonic sine pair with tremolo)
    if (beatInBar === 0 || beatInBar === 2) {
      chord.chord.forEach((freq, i) => {
        if (!this.ctx || !this.musicGain) return;
        const carrier = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const g = this.ctx.createGain();

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(freq, now + i * 0.02);

        // Modulator at 2x frequency for bell/tine shimmer
        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * 2, now + i * 0.02);

        modGain.gain.setValueAtTime(freq * 0.4, now + i * 0.02);
        modGain.gain.exponentialRampToValueAtTime(1, now + i * 0.02 + 0.7);

        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        g.gain.setValueAtTime(0.07, now + i * 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 1.1);

        carrier.connect(g);
        g.connect(this.musicGain);

        carrier.start(now + i * 0.02);
        mod.start(now + i * 0.02);
        carrier.stop(now + i * 0.02 + 1.1);
        mod.stop(now + i * 0.02 + 1.1);
      });
    }

    // 3. Brushed Swing Ride Cymbal & Hi-Hat (organic noise envelope)
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.1), this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.22;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(6000, now);

    const noiseGain = this.ctx.createGain();
    const isSwingBeat = beatInBar === 1 || beatInBar === 3;
    noiseGain.gain.setValueAtTime(isSwingBeat ? 0.045 : 0.025, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noiseSource.start(now);

    this.jazzStep++;
    // Relaxed Lounge Tempo (~100 BPM -> ~600ms per beat)
    this.proceduralTimerId = window.setTimeout(() => {
      this.scheduleNextJazzBeat();
    }, 600);
  }

  // ===================== SFX SOUNDS =====================
  public playCardDeal() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  public playChip() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  public playTallyDing(noteIndex = 0) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const baseFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const freq = baseFreqs[noteIndex % baseFreqs.length] * (1 + Math.floor(noteIndex / baseFreqs.length) * 0.5);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playTarotConsume() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      whiteNoise.start(now);

      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        chimeGain.gain.setValueAtTime(0.08, now + idx * 0.06);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(chimeGain);
        chimeGain.connect(this.sfxGain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch {}
  }

  public playGlassBreak() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      [1200, 1850, 2400, 3100].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq + (Math.random() * 200 - 100), now + i * 0.02);

        gain.gain.setValueAtTime(0.15, now + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + i * 0.02);
        osc.stop(now + i * 0.02 + 0.12);
      });
    } catch {}
  }

  public playLuckyProc() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.25);
      });
    } catch {}
  }

  public playBlackjackFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const notes = [
        { f: 392.00, d: 0.1 },
        { f: 523.25, d: 0.1 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.25 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.4 },
      ];

      let t = this.ctx.currentTime;
      for (const note of notes) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + note.d);

        t += note.d * 0.85;
      }
    } catch {}
  }
}

export const sound = new SoundEngine();
