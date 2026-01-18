
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
    if (!this.audioContext) return;

    // اهتزاز خفيف للنجاح
    this.vibrate(50);

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine'; // صوت ناعم
    osc.frequency.setValueAtTime(660, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.4);
  }

  public playError() {
    this.init();
    if (!this.audioContext) return;

    // اهتزاز قوي ومتكرر للخطأ
    this.vibrate([200, 100, 200]);

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth'; // صوت حاد ومنبه
    osc.frequency.setValueAtTime(120, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.audioContext.currentTime + 0.6);

    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.6);
  }
}

export const audioService = new AudioService();
