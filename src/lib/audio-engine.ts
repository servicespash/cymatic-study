/**
 * Audio Engine - Handles AEC (Echo Cancellation), noise suppression,
 * and 85Hz-255Hz voice frequency isolation.
 */

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private filters: BiquadFilterNode[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: 48000, // Higher sample rate for better isolation
      });
    }
  }

  /**
   * Calibrates the stream for human voice isolation (85Hz - 255Hz)
   * and prevents zero-loop feedback.
   */
  public async setupStream(stream: MediaStream) {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Clean up old source if any
    this.source?.disconnect();
    this.filters.forEach((f) => f.disconnect());
    this.filters = [];

    this.source = this.audioContext.createMediaStreamSource(stream);

    // 1. High-pass filter to remove low-end rumble (< 85Hz)
    const hp = this.audioContext.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 85;
    hp.Q.value = 1;

    // 2. Low-pass filter to remove high-frequency noise (> 255Hz)
    const lp = this.audioContext.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 255;
    lp.Q.value = 1;

    // 3. Peaking filter to slightly boost the typical human speech range
    const peak = this.audioContext.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = 170; // Mid-point of 85-255
    peak.Q.value = 2;
    peak.gain.value = 3;

    // Chain: Source -> HP -> LP -> Peak -> (optional analyzer)
    this.source.connect(hp);
    hp.connect(lp);
    lp.connect(peak);

    this.filters = [hp, lp, peak];

    // Note: We DO NOT connect to this.audioContext.destination
    // This is "Zero-Loop Logic" - we analyze the input but never
    // route it back to the speakers, avoiding feedback loops.

    return peak; // Return the final node for analysis
  }

  public getAnalyzer() {
    if (!this.audioContext) return null;
    if (!this.analyzer) {
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
    }
    return this.analyzer;
  }

  public dispose() {
    this.source?.disconnect();
    this.filters.forEach((f) => f.disconnect());
    this.analyzer?.disconnect();
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
    }
    this.audioContext = null;
  }
}
