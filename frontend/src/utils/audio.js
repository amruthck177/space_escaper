class SynthAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = 0.5;
    this.noiseBuffer = null;
    
    // Music variables
    this.musicInterval = null;
    this.musicBeatCount = 0;
    this.tempoFactor = 1.0; // 1.0 = base speed, gets faster with difficulty
    this.isPlayingMusic = false;
    this.droneOscillator = null;
    this.droneGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      // Generate white noise buffer
      const bufferSize = 2 * this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.error('Web Audio API not supported in this browser', e);
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  playLaser() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playExplosion(type = 'normal') {
    this.init();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const gainNode = this.ctx.createGain();

    let duration = 0.3;
    let startFreq = 800;
    let endFreq = 50;
    let startGain = 0.5;

    if (type === 'small') {
      duration = 0.2;
      startFreq = 1200;
      startGain = 0.3;
    } else if (type === 'boss') {
      duration = 0.8;
      startFreq = 400;
      startGain = 0.8;
    }

    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    gainNode.gain.setValueAtTime(startGain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseNode.start(t);
    noiseNode.stop(t + duration + 0.05);

    // Add a low-frequency rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(10, t + duration);
    oscGain.gain.setValueAtTime(startGain * 0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  playPickup() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(554.37, t + 0.08); // C#
    osc.frequency.setValueAtTime(659.25, t + 0.16); // E
    osc.frequency.setValueAtTime(880, t + 0.24); // A

    gainNode.gain.setValueAtTime(0.25, t);
    gainNode.gain.setValueAtTime(0.25, t + 0.24);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  playShieldBreak() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.linearRampToValueAtTime(150, t + 0.3);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(554.37, t); // C#5 detuned
    osc2.frequency.linearRampToValueAtTime(100, t + 0.3);

    gainNode.gain.setValueAtTime(0.4, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  playBoost() {
    this.init();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, t);

    const gainNode = this.ctx.createGain();

    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.35);

    gainNode.gain.setValueAtTime(0.01, t);
    gainNode.gain.linearRampToValueAtTime(0.35, t + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseNode.start(t);
    noiseNode.stop(t + 0.45);
  }

  playGameOver() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.8);

    gainNode.gain.setValueAtTime(0.4, t);
    gainNode.gain.linearRampToValueAtTime(0.3, t + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.0);
  }

  setTempo(tempoFactor) {
    this.tempoFactor = Math.max(0.5, Math.min(2.5, tempoFactor));
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    // Start a low deep drone oscillator
    const t = this.ctx.currentTime;
    this.droneOscillator = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();

    this.droneOscillator.type = 'sawtooth';
    this.droneOscillator.frequency.setValueAtTime(55, t); // A1 low drone

    // Filter to make the drone smooth
    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(110, t);

    this.droneGain.gain.setValueAtTime(0.12, t);

    this.droneOscillator.connect(droneFilter);
    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOscillator.start(t);

    this.musicBeatCount = 0;
    
    // Rhythmic beat loop
    const playBeat = () => {
      if (!this.isPlayingMusic || !this.ctx || this.isMuted) return;
      
      const time = this.ctx.currentTime;
      const beatType = this.musicBeatCount % 8;

      // 1. Kick Drum on beats 0 and 4
      if (beatType === 0 || beatType === 4) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, time);
        kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

        kickGain.gain.setValueAtTime(0.35, time);
        kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(time);
        kickOsc.stop(time + 0.13);
      }

      // 2. Subtle synth hat on offbeats (2, 6) or ticks on everything
      if (beatType === 2 || beatType === 6 || (beatType % 2 !== 0 && Math.random() > 0.4)) {
        if (this.noiseBuffer) {
          const hatNode = this.ctx.createBufferSource();
          hatNode.buffer = this.noiseBuffer;
          
          const hatFilter = this.ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(8000, time);
          
          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(beatType === 2 || beatType === 6 ? 0.05 : 0.02, time);
          hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
          
          hatNode.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(this.masterGain);
          
          hatNode.start(time);
          hatNode.stop(time + 0.05);
        }
      }

      // 3. Ambient note sweep occasionally (e.g. beat 7)
      if (beatType === 7 && Math.random() > 0.5) {
        const sweepOsc = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        
        sweepOsc.type = 'triangle';
        const frequencies = [220, 277.18, 329.63, 440]; // A major arpeggio notes
        const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
        
        sweepOsc.frequency.setValueAtTime(freq, time);
        sweepOsc.frequency.exponentialRampToValueAtTime(freq * 2, time + 0.4);

        sweepGain.gain.setValueAtTime(0.03, time);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        sweepOsc.connect(sweepGain);
        sweepGain.connect(this.masterGain);
        sweepOsc.start(time);
        sweepOsc.stop(time + 0.41);
      }

      this.musicBeatCount++;
      
      // Schedule next beat based on tempoFactor
      // 120 BPM base is 0.5 seconds per beat.
      const intervalDuration = (400 / this.tempoFactor); 
      this.musicInterval = setTimeout(playBeat, intervalDuration);
    };

    playBeat();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.droneOscillator) {
      try {
        this.droneOscillator.stop();
      } catch (e) {}
      this.droneOscillator = null;
    }
    if (this.droneGain) {
      this.droneGain = null;
    }
  }
}

export const audio = new SynthAudioEngine();
export default audio;
