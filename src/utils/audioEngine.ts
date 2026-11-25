import { WeatherId } from '../types/weather';

// Cheerful park marimba melody in C major (MIDI-like note frequencies in Hz)
const MELODY_NOTES: Array<{ freq: number; bass?: number; dur: number }> = [
  { freq: 523.25, bass: 130.81, dur: 0.25 }, // C5 + C3
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 783.99, dur: 0.25 }, // G5
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 880.0, bass: 174.61, dur: 0.35 }, // A5 + F3
  { freq: 783.99, dur: 0.35 }, // G5
  { freq: 659.25, dur: 0.3 }, // E5
  { freq: 0, dur: 0.2 },

  { freq: 587.33, bass: 196.0, dur: 0.25 }, // D5 + G3
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 698.46, dur: 0.25 }, // F5
  { freq: 587.33, dur: 0.25 }, // D5
  { freq: 659.25, bass: 130.81, dur: 0.45 }, // E5 + C3
  { freq: 523.25, dur: 0.35 }, // C5
  { freq: 0, dur: 0.2 },

  { freq: 783.99, bass: 130.81, dur: 0.25 }, // G5 + C3
  { freq: 880.0, dur: 0.25 }, // A5
  { freq: 783.99, dur: 0.25 }, // G5
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 698.46, bass: 174.61, dur: 0.25 }, // F5 + F3
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 587.33, dur: 0.3 }, // D5
  { freq: 0, dur: 0.15 },

  { freq: 523.25, bass: 196.0, dur: 0.25 }, // C5 + G3
  { freq: 587.33, dur: 0.25 }, // D5
  { freq: 659.25, dur: 0.25 }, // E5
  { freq: 783.99, dur: 0.25 }, // G5
  { freq: 523.25, bass: 130.81, dur: 0.65 }, // C5 + C3
  { freq: 0, dur: 0.35 },
];

class WeatherAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private fxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private stepIndex = 0;
  private loopTimer: number | null = null;
  private volume = 0.35;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.volume * 0.32;
      this.musicGain.connect(this.ctx.destination);

      this.fxGain = this.ctx.createGain();
      this.fxGain.gain.value = 0.45;
      this.fxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.volume * 0.32, this.ctx.currentTime, 0.05);
    }
  }

  public startMusic() {
    if (this.isMusicPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.scheduleNextNote();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private scheduleNextNote() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    const note = MELODY_NOTES[this.stepIndex];
    const now = this.ctx.currentTime;

    if (note.freq > 0) {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.24, now + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.2, note.dur * 1.35));

      osc.connect(noteGain);
      noteGain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + note.dur * 1.45);
    }

    if (note.bass) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(note.bass, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.6);
    }

    this.stepIndex = (this.stepIndex + 1) % MELODY_NOTES.length;
    this.loopTimer = window.setTimeout(() => {
      this.scheduleNextNote();
    }, note.dur * 1000);
  }

  public playDescentSound(weather: WeatherId) {
    const ctx = this.ensureContext();
    if (!ctx || !this.fxGain) return;
    const now = ctx.currentTime;

    if (weather === 'sunny') {
      // Warm bright harp glissando
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(this.fxGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } else if (weather === 'rainy') {
      // Soft raindrop plinks
      [880, 740, 987.77, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + idx * 0.09 + 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.09 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(this.fxGain!);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.24);
      });
    } else if (weather === 'snowy') {
      // Delicate crystal celesta chimes
      [1318.5, 1567.98, 1760.0, 2093.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.55);
        osc.connect(gain);
        gain.connect(this.fxGain!);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.6);
      });
    } else if (weather === 'windy') {
      // Gentle filtered airy breeze sweep
      const bufferSize = ctx.sampleRate * 0.75;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(920, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(380, now + 0.75);
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.fxGain);
      noise.start(now);
      noise.stop(now + 0.78);
    } else {
      // Cloudy: soft warm gentle chord
      [392.0, 493.88, 587.33].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.06 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);
        osc.connect(gain);
        gain.connect(this.fxGain!);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.65);
      });
    }
  }

  public playSuccessFanfare() {
    const ctx = this.ensureContext();
    if (!ctx || !this.fxGain) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === 3 ? 0.55 : 0.25));
      osc.connect(gain);
      gain.connect(this.fxGain!);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  public playTryAgain() {
    const ctx = this.ensureContext();
    if (!ctx || !this.fxGain) return;
    const now = ctx.currentTime;
    [349.23, 293.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.13;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(this.fxGain!);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }
}

export const weatherAudio = new WeatherAudioEngine();

export function speakEnglishPhrase(
  text: string,
  rate = 0.85,
  onDone?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.08;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith('en-US') && /samantha|google|aria|jenny|natural/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onend = () => {
      onDone?.();
    };
    utterance.onerror = () => {
      onDone?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onDone?.();
    return false;
  }
}
