// Web Audio API Procedural Sound Synthesizer for KartRider Web
// Completely self-contained, robust against suspended contexts & scheduling errors

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;

    this.driftGain = null;
    this.driftFilter = null;

    // BGM Audio System (Candy Coated Drift)
    this.bgm = null;
    this.bgmVolume = 0.38;
    this.isBgmPlaying = false;
  }

  async init() {
    try {
      this.initBGM();
      this.playBGM();

      if (this.initialized && this.ctx) {
        if (this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
        return;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.setupEngine();
      this.setupDrift();
      this.initialized = true;
    } catch (e) {
      console.warn('SoundSystem init error:', e);
    }
  }

  setupEngine() {
    try {
      if (!this.ctx) return;
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      const now = this.ctx.currentTime || 0;
      this.engineOsc1.frequency.setValueAtTime(55, now);
      this.engineOsc2.frequency.setValueAtTime(110, now);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(350, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    } catch (e) {
      console.warn('Engine sound setup error:', e);
    }
  }

  setupDrift() {
    try {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      this.driftFilter = this.ctx.createBiquadFilter();
      this.driftFilter.type = 'bandpass';
      const now = this.ctx.currentTime || 0;
      this.driftFilter.frequency.setValueAtTime(1400, now);
      this.driftFilter.Q.setValueAtTime(3.5, now);

      this.driftGain = this.ctx.createGain();
      this.driftGain.gain.setValueAtTime(0.0001, now);

      noise.connect(this.driftFilter);
      this.driftFilter.connect(this.driftGain);
      this.driftGain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Drift sound setup error:', e);
    }
  }

  updateEngine(speedRatio, isAccelerating) {
    try {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const baseFreq = 50 + speedRatio * 160 + (isAccelerating ? 25 : 0);
      const now = this.ctx.currentTime || 0;

      if (this.engineOsc1 && this.engineOsc2 && this.engineFilter && this.engineGain) {
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
        this.engineFilter.frequency.setTargetAtTime(300 + speedRatio * 800, now, 0.05);

        const targetGain = 0.06 + speedRatio * 0.12 + (isAccelerating ? 0.04 : 0);
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
      }
    } catch (e) {}
  }

  setDriftVolume(volume) {
    try {
      if (!this.initialized || !this.ctx || this.isMuted || !this.driftGain) return;
      const now = this.ctx.currentTime || 0;
      const clamped = Math.max(0, Math.min(1, volume));
      this.driftGain.gain.setTargetAtTime(clamped * 0.22, now, 0.04);
    } catch (e) {}
  }

  playCountdown(isGo) {
    try {
      if (!this.ctx || this.isMuted) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime || 0;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = isGo ? 880 : 440;
      const dur = isGo ? 0.6 : 0.28;

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setTargetAtTime(0.0001, now + 0.02, dur * 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {
      console.warn('playCountdown sound error:', e);
    }
  }

  playBooster() {
    try {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime || 0;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setTargetAtTime(750, now, 0.2);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setTargetAtTime(0.001, now + 0.1, 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {}
  }

  playBoosterEarned() {
    try {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime || 0;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.setTargetAtTime(0.001, now + i * 0.05 + 0.02, 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.25);
      });
    } catch (e) {}
  }

  playDashPad() {
    try {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime || 0;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setTargetAtTime(900, now, 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setTargetAtTime(0.001, now + 0.05, 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playFinishFanfare() {
    try {
      if (!this.ctx || this.isMuted) return;

      // Duck BGM during fanfare so victory brass stands out cleanly
      if (this.bgm && !this.isMuted) {
        this.bgm.volume = this.bgmVolume * 0.35;
        setTimeout(() => {
          if (this.bgm && !this.isMuted) {
            this.bgm.volume = this.bgmVolume;
          }
        }, 1600);
      }

      const now = this.ctx.currentTime || 0;
      const notes = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.5, d: 0.45 },
      ];
      let time = now;
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.setTargetAtTime(0.001, time + 0.02, n.d * 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + n.d);
        time += n.d;
      });
    } catch (e) {}
  }

  // BGM Background Music Management
  initBGM() {
    if (this.bgm) return;
    const existing = document.getElementById('bgm-audio');
    if (existing) {
      this.bgm = existing;
    } else {
      this.bgm = new Audio('Candy_Coated_Drift%20(mp3cut.net).mp3');
      document.body.appendChild(this.bgm);
    }

    this.bgm.loop = true;
    this.bgm.volume = this.bgmVolume;
    this.bgm.preload = 'auto';

    // Robust loop safeguard: restart seamlessly if ended triggers
    this.bgm.addEventListener('ended', () => {
      if (!this.isMuted) {
        this.bgm.currentTime = 0;
        this.bgm.play().catch(() => {});
      }
    });
  }

  playBGM() {
    if (this.isMuted) return;
    this.initBGM();
    if (!this.bgm) return;

    if (this.bgm.paused) {
      const p = this.bgm.play();
      if (p !== undefined) {
        p.then(() => {
          this.isBgmPlaying = true;
        }).catch((err) => {
          // Expected on browser startup before first gesture
          console.log('BGM waiting for user interaction to start playback');
        });
      }
    } else {
      this.isBgmPlaying = true;
    }
  }

  pauseBGM() {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
      this.isBgmPlaying = false;
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.isBgmPlaying = false;
    }
  }

  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.muted = this.isMuted;
      if (!this.isMuted && this.bgm.paused) {
        this.playBGM();
      }
    }
    if (this.isMuted) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.driftGain && this.ctx) {
        this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }
}

window.soundSystem = new SoundSystem();
