/**
 * Diwali Celebration Web Audio Synthesizer
 * 100% procedural sound effects - no external audio files required!
 * High fidelity rocket launches, explosive shell bursts, crackles, and festive chimes.
 */
class DiwaliSoundFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.hasUnlocked = false;

    // Load saved mute preference if available
    try {
      const saved = localStorage.getItem('diwali_sfx_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch (e) {
      this.isMuted = false;
    }
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.hasUnlocked = true;
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('diwali_sfx_muted', String(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.85, now + 0.05);
    }
    return this.isMuted;
  }

  setMuted(muted) {
    if (this.isMuted !== muted) {
      this.toggleMute();
    }
  }

  // Create a reusable buffer of white noise
  createNoiseBuffer(duration = 1.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Ascending rocket launch whistle and propulsion thump
   * @param {number} duration - Whistle flight duration in seconds (e.g. 1.0 - 1.4s)
   */
  playRocketLaunch(duration = 1.1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Launch thump / ignition pop
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(140, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.16);

    // 2. Rising whistle (shrieking rocket motor)
    const whistleOsc = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistleOsc.type = 'triangle';

    // Whistle frequency ramps up as rocket gains altitude
    const startFreq = 380 + Math.random() * 60;
    const endFreq = 1100 + Math.random() * 250;
    whistleOsc.frequency.setValueAtTime(startFreq, now);
    whistleOsc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Rocket whistle volume swells, then sharply drops right before explosion
    whistleGain.gain.setValueAtTime(0.02, now);
    whistleGain.gain.linearRampToValueAtTime(0.22, now + duration * 0.7);
    whistleGain.gain.linearRampToValueAtTime(0.32, now + duration * 0.95);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Add mild frequency vibrato for authentic rocket wobble
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(14, now);
    vibratoGain.gain.setValueAtTime(25, now);
    vibrato.connect(whistleOsc.frequency);
    vibrato.start(now);
    vibrato.stop(now + duration);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(this.masterGain);
    whistleOsc.start(now);
    whistleOsc.stop(now + duration + 0.05);

    // 3. Rocket jet fizz/hiss (filtered noise)
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(900, now);
      bandpass.frequency.linearRampToValueAtTime(2200, now + duration);
      bandpass.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, now);
      noiseGain.gain.linearRampToValueAtTime(0.18, now + duration * 0.9);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + duration + 0.05);
    }
  }

  /**
   * Shell burst explosion with deep sub-bass thump and sizzling crackles
   * @param {Object} options - { power, hasCrackle, pitch }
   */
  playExplosion(options = {}) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const power = options.power !== undefined ? options.power : 1.0;
    const hasCrackle = options.hasCrackle !== undefined ? options.hasCrackle : true;

    // 1. Deep Sub-bass Boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(110 * (options.pitch || 1.0), now);
    boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    boomGain.gain.setValueAtTime(0.7 * power, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.6);

    // 2. Shell burst impact noise (low-passed shockwave)
    const blastBuffer = this.createNoiseBuffer(1.4);
    if (blastBuffer) {
      const blastSource = this.ctx.createBufferSource();
      blastSource.buffer = blastBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.9);

      const blastGain = this.ctx.createGain();
      blastGain.gain.setValueAtTime(0.65 * power, now);
      blastGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      blastSource.connect(filter);
      filter.connect(blastGain);
      blastGain.connect(this.masterGain);
      blastSource.start(now);
      blastSource.stop(now + 1.2);
    }

    // 3. Sizzling sparkler crackles (scattered micro-pops)
    if (hasCrackle) {
      const crackleCount = Math.floor(10 + Math.random() * 8);
      for (let i = 0; i < crackleCount; i++) {
        const delay = 0.15 + Math.random() * 0.95;
        this.scheduleSingleCrackle(now + delay, power * 0.35);
      }
    }
  }

  scheduleSingleCrackle(time, volume = 0.25) {
    if (!this.ctx) return;
    const crackleOsc = this.ctx.createOscillator();
    const crackleGain = this.ctx.createGain();
    crackleOsc.type = 'sawtooth';
    crackleOsc.frequency.setValueAtTime(1800 + Math.random() * 2200, time);

    crackleGain.gain.setValueAtTime(volume * (0.5 + Math.random() * 0.5), time);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    crackleOsc.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackleOsc.start(time);
    crackleOsc.stop(time + 0.04);
  }

  /**
   * Continuous sparkling fountain / Anar sound effect
   */
  playFountainSound(duration = 2.5) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.linearRampToValueAtTime(3200, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(1100, now + duration);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.3, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + duration + 0.05);

    // Add intermittent crackles throughout the fountain
    const crackleCount = Math.floor(duration * 12);
    for (let i = 0; i < crackleCount; i++) {
      const delay = Math.random() * duration;
      this.scheduleSingleCrackle(now + delay, 0.18);
    }
  }

  /**
   * Whirring spinning Chakri sound effect
   */
  playChakriSound(duration = 3.2) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(2600, now + 0.8);
    filter.frequency.linearRampToValueAtTime(800, now + duration);
    filter.Q.setValueAtTime(3.5, now);

    const whirrOsc = this.ctx.createOscillator();
    const whirrGain = this.ctx.createGain();
    whirrOsc.type = 'sawtooth';
    whirrOsc.frequency.setValueAtTime(80, now);
    whirrOsc.frequency.linearRampToValueAtTime(240, now + 1.0);
    whirrOsc.frequency.linearRampToValueAtTime(60, now + duration);

    whirrGain.gain.setValueAtTime(0.01, now);
    whirrGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
    whirrGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whirrOsc.connect(whirrGain);
    whirrGain.connect(this.masterGain);
    whirrOsc.start(now);
    whirrOsc.stop(now + duration + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + duration + 0.05);
  }

  /**
   * Divine golden chime chord when Happy Diwali message reveals
   */
  playFestiveChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Auspicious pentatonic chime frequencies (C, E, G, B, D6)
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];

    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + noteDelay);

      // Bell-like shimmer overtone
      const overtone = this.ctx.createOscillator();
      const overtoneGain = this.ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2.76, now + noteDelay);

      gain.gain.setValueAtTime(0.001, now + noteDelay);
      gain.gain.linearRampToValueAtTime(0.18, now + noteDelay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + noteDelay + 2.2);

      overtoneGain.gain.setValueAtTime(0.04, now + noteDelay);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0005, now + noteDelay + 1.2);

      osc.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + noteDelay);
      overtone.start(now + noteDelay);
      osc.stop(now + noteDelay + 2.3);
      overtone.stop(now + noteDelay + 2.3);
    });
  }

  /**
   * Small UI click pop
   */
  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

// Global audio singleton
window.soundFX = new DiwaliSoundFX();
