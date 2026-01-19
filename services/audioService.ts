
class AudioService {
  private audioContext: AudioContext | null = null;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  public playSuccess() {
    this.init();
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      this.audioContext?.resume();
    }
    if (!this.audioContext) return;

    this.vibrate(50);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  public playError() {
    this.init();
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      this.audioContext?.resume();
    }
    if (!this.audioContext) return;

    // اهتزاز قوي ومكثف
    this.vibrate([300, 100, 300, 100, 300]);

    // نغمة Siren حادة
    const playTone = (freq: number, start: number) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq / 2, start + 0.4);
      gain.gain.setValueAtTime(0.5, start);
      gain.gain.linearRampToValueAtTime(0.01, start + 0.4);
      osc.connect(gain);
      gain.connect(this.audioContext!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    };

    playTone(440, this.audioContext.currentTime);
    playTone(440, this.audioContext.currentTime + 0.2);
    playTone(440, this.audioContext.currentTime + 0.4);
  }
}

export const audioService = new AudioService();
