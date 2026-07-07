// bass.ts — monophonic acid-ish bass: saw → resonant lowpass → amp env, with glide.
// Pitch follows the lowest spectral eigenmode, scale-quantised.
import type { ParamState } from "../core/params";
import { scaleQuantize } from "./scales";

export class Bass {
  private osc: OscillatorNode;
  private filter: BiquadFilterNode;
  private amp: GainNode;
  private lastFreq = 55;

  constructor(ctx: AudioContext, out: GainNode) {
    this.osc = ctx.createOscillator();
    this.osc.type = "sawtooth";
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.amp = ctx.createGain();
    this.amp.gain.value = 0;
    this.osc.connect(this.filter);
    this.filter.connect(this.amp);
    this.amp.connect(out);
    this.osc.frequency.value = this.lastFreq;
    this.osc.start();
  }

  // baseFreq = lowest eigenmode. time = absolute schedule time.
  note(baseFreq: number, time: number, vel: number, p: ParamState): number {
    const octave = Math.pow(2, p.bassOct as number);
    let f = scaleQuantize(baseFreq, p.scaleQuantize as string, p.transpose as number) * octave;
    f = Math.min(500, Math.max(25, f));
    const glide = p.bassGlide as number;
    this.osc.frequency.setTargetAtTime(f, time, Math.max(0.001, glide * 0.3));
    this.lastFreq = f;

    const cutoff = p.bassCutoff as number;
    this.filter.Q.setValueAtTime(p.bassReso as number, time);
    // filter env: open then close for that plucky bass motion
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(cutoff * 2.5, time);
    this.filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff), time + 0.18);

    const decay = p.bassDecay as number;
    const g = (p.bassLevel as number) * vel;
    this.amp.gain.cancelScheduledValues(time);
    this.amp.gain.setValueAtTime(this.amp.gain.value, time);
    this.amp.gain.linearRampToValueAtTime(g, time + 0.005);
    this.amp.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    return f;
  }
}
