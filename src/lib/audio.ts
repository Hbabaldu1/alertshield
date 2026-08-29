// Web Audio API & Speech Synthesis Engine for Cashier Alerts

class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a crisp, high-pitch dual chime (like POS terminal / soundbox)
  public playChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Note 1 (High tone)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2 (Success high note)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.15); // A6
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);

      // Cash register ding resonance
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2637, now + 0.25); // E7
      gain3.gain.setValueAtTime(0.3, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked by user gesture:', e);
    }
  }

  // Voice announcement: "Alert received! ₦15,000 confirmed from Chidi Okonkwo via GTBank"
  public speakAlert(amount: number, senderName?: string, senderBank?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // First play chime
    this.playChime();

    setTimeout(() => {
      try {
        const formattedAmount = amount.toLocaleString();
        const text = `Alert confirmed! Payment of ${formattedAmount} Naira received ${
          senderName ? `from ${senderName}` : ''
        } ${senderBank ? `via ${senderBank}` : ''}. Safe to release goods!`;

        window.speechSynthesis.cancel(); // Cancel prior queued utterances
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05; // Lively pace
        utterance.pitch = 1.1;

        // Try to pick a natural English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US') || v.lang.includes('en-NG'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
      }
    }, 400);
  }
}

export const soundEngine = new SoundEngine();
