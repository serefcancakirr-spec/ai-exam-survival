// Stage 13: calm sounds made by the browser itself (Web Audio). Nothing is downloaded, so there is no copyright issue.
// The audio system is only created after the student taps a button (browsers block sound before that).
import type { FocusSound } from '@/pages/focus-model';

type AudioCtor = typeof AudioContext;

export class FocusSoundPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private volume = 0.5;
  playing: FocusSound | null = null;

  private context() {
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** 0–100 */
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value / 100));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
  }

  private noiseBuffer(ctx: AudioContext, kind: 'white' | 'brown') {
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (kind === 'white') data[i] = white * 0.35;
      else {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
    }
    return buffer;
  }

  play(kind: FocusSound) {
    const ctx = this.context();
    if (!ctx || !this.master) return;
    this.stop();
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx, kind === 'rain' ? 'white' : 'brown');
    source.loop = true;
    const gain = ctx.createGain();
    const chain: AudioNode[] = [];
    if (kind === 'rain') {
      const high = ctx.createBiquadFilter();
      high.type = 'highpass';
      high.frequency.value = 500;
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 5000;
      gain.gain.value = 0.55;
      chain.push(high, low);
    } else if (kind === 'noise') {
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 700;
      gain.gain.value = 0.9;
      chain.push(low);
    } else {
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 1100;
      chain.push(low);
      // waves: the loudness rises and falls slowly (about every 8 seconds)
      gain.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const depth = ctx.createGain();
      depth.gain.value = 0.42;
      lfo.connect(depth).connect(gain.gain);
      lfo.start();
      this.sources.push(lfo);
      this.nodes.push(depth);
    }
    let node: AudioNode = source;
    for (const next of chain) node = node.connect(next);
    node.connect(gain).connect(this.master);
    source.start();
    this.sources.push(source);
    this.nodes.push(...chain, gain);
    this.playing = kind;
  }

  stop() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
      s.disconnect();
    }
    for (const n of this.nodes) n.disconnect();
    this.sources = [];
    this.nodes = [];
    this.playing = null;
  }

  /** A short, soft two-note bell. */
  chime() {
    const ctx = this.context();
    if (!ctx) return;
    const out = ctx.createGain();
    out.gain.value = Math.max(0.25, this.volume);
    out.connect(ctx.destination);
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      const t = ctx.currentTime + i * 0.35;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(env).connect(out);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  dispose() {
    this.stop();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
