class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingBGM: boolean = false;
  private bgmTimeout: any = null;

  constructor() {
    // Lazy initialization handled in user interaction
  }

  private init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15; // Master volume safe limit
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.error("Web Audio API not supported", e);
      }
    }
  }

  resume() {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startBGM() {
    if (this.isPlayingBGM) return;
    this.resume();
    this.isPlayingBGM = true;
    this.scheduleBGMLoop();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
  }

  private scheduleBGMLoop() {
    if (!this.isPlayingBGM || !this.ctx || !this.masterGain) return;

    // Simple procedural bassline: 120 BPM
    const time = this.ctx.currentTime;
    const step = 0.25; // 16th notes roughly
    
    // Play a sequence of 4 notes
    for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        // Base E1 (41.2Hz) with some octave jumping
        const note = i % 2 === 0 ? 41.20 : 82.41; 
        osc.frequency.value = note;

        // "Wub" filter envelope
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, time + i * step);
        filter.frequency.exponentialRampToValueAtTime(600, time + i * step + 0.1);
        filter.frequency.exponentialRampToValueAtTime(100, time + i * step + step);

        // Amplitude envelope
        gain.gain.setValueAtTime(0, time + i * step);
        gain.gain.linearRampToValueAtTime(0.4, time + i * step + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + i * step + step - 0.05);

        osc.start(time + i * step);
        osc.stop(time + i * step + step);
    }

    // Schedule next loop
    this.bgmTimeout = setTimeout(() => this.scheduleBGMLoop(), step * 4 * 1000);
  }

  playShoot(type: 'BLASTER' | 'SPREAD' | 'LASER') {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    if (type === 'LASER') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    } else if (type === 'SPREAD') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
    } else {
        // Blaster
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
    }
  }

  playExplosion() {
      if (!this.ctx || !this.masterGain) return;
      this.resume();
      
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start(t);
  }

  playPowerup() {
      if (!this.ctx || !this.masterGain) return;
      this.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.1);
      osc.frequency.linearRampToValueAtTime(1760, t + 0.2);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      
      osc.start(t);
      osc.stop(t + 0.3);
  }
}

export const audioService = new AudioService();