/**
 * Vox Gym - Tactile Audio & Haptic Feedback Engine
 * Provides synthetic sound effects via Web Audio API and vibration haptics.
 */

class AudioFeedbackEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.hapticsEnabled = true;
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /**
   * Short chime when Push-To-Talk is activated
   */
  playMicStart() {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Subtle descending tone when speech input stops
   */
  playMicEnd() {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Bright, satisfying double-tone confirmation chime upon set commit
   */
  playConfirmed() {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    // First note: C6 (1046.5 Hz)
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second note: E6 (1318.5 Hz)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1320, now + 0.08);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  }

  /**
   * Sound when rest timer completes
   */
  playRestDone() {
    if (!this.soundEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const t = now + i * 0.18;
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  /**
   * Tactile haptic feedback pattern
   * Specific to PRD requirement: navigator.vibrate([50])
   */
  vibrate(pattern = [50]) {
    if (!this.hapticsEnabled) return;
    try {
      if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Ignore vibration errors on restricted devices/browsers
    }
  }

  /**
   * Full confirmation response: 50ms haptic burst + chime
   */
  triggerCommitFeedback() {
    this.vibrate([50]);
    this.playConfirmed();
  }
}

export const audioFeedback = new AudioFeedbackEngine();
