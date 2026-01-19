class AudioService {
  private audioContext: AudioContext | null = null;

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  public playSuccess() {
    this.init();
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
    if (!this.audioContext) return;

    // اهتزاز قوي ومكثف للخطأ
    this.vibrate([400, 100, 400, 100, 400]);

    const playTone = (freq: number, start: number) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      osc.type = 'sawtooth'; // صوت حاد ومزعج
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq / 1.5, start + 0.5);
      
      gain.gain.setValueAtTime(0.6, start);
      gain.gain.linearRampToValueAtTime(0.01, start + 0.5);
      
      osc.connect(gain);
      gain.connect(this.audioContext!.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    };

    // نغمتين متتاليتين عاليتين
    playTone(520, this.audioContext.currentTime);
    playTone(520, this.audioContext.currentTime + 0.25);
  }
}

export const audioService = new AudioService();
