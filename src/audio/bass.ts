// bass.ts — the lead voice of HADŌ BEAT: a monophonic bass whose CHARACTER is a genre
// palette (jazz upright / dub sub / minimal pluck / dubstep wobble / noise drive). Pitch
// follows the lowest spectral eigenmode, scale-quantised.
import type { ParamState } from "../core/params";
import { scaleQuantize } from "./scales";

export const CHARACTERS = ["JAZZ", "DUB", "MINIMAL", "DUBSTEP", "NOISE"] as const;
export type Character = typeof CHARACTERS[number];

interface CC {
  wave: OscillatorType; sub: number; wobble: number; wobbleRate: number; drive: number;
  glideMul: number; decayMul: number; cutoffMul: number; resoAdd: number; octave: number; noise: number;
}
const CONFIGS: Record<Character, CC> = {
  JAZZ:    { wave: "triangle", sub: 0.2, wobble: 0,   wobbleRate: 3, drive: 0.0, glideMul: 1.6, decayMul: 1.5, cutoffMul: 0.7, resoAdd: -2, octave: 0,  noise: 0 },
  DUB:     { wave: "sine",     sub: 0.5, wobble: 0,   wobbleRate: 2, drive: 0.1, glideMul: 2.0, decayMul: 2.2, cutoffMul: 0.5, resoAdd: 0,  octave: -1, noise: 0 },
  MINIMAL: { wave: "square",   sub: 0.1, wobble: 0,   wobbleRate: 4, drive: 0.0, glideMul: 0.3, decayMul: 0.5, cutoffMul: 1.0, resoAdd: 3,  octave: 0,  noise: 0 },
  DUBSTEP: { wave: "sawtooth", sub: 0.6, wobble: 0.9, wobbleRate: 4, drive: 0.45, glideMul: 0.5, decayMul: 1.7, cutoffMul: 0.9, resoAdd: 7, octave: -1, noise: 0 },
  NOISE:   { wave: "sawtooth", sub: 0.2, wobble: 0.4, wobbleRate: 7, drive: 0.9, glideMul: 0.4, decayMul: 1.2, cutoffMul: 1.2, resoAdd: 9, octave: 0,  noise: 0.4 },
};

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024, c = new Float32Array(n), k = 1 + amount * 30;
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}

export class Bass {
  private osc: OscillatorNode;
  private sub: OscillatorNode;
  private subGain: GainNode;
  private noiseSrc: AudioBufferSourceNode;
  private noiseGain: GainNode;
  private shaper: WaveShaperNode;
  private filter: BiquadFilterNode;
  private amp: GainNode;
  private wobbleLfo: OscillatorNode;
  private wobbleGain: GainNode;
  private cc: CC = CONFIGS.DUB;

  constructor(ctx: AudioContext, out: GainNode) {
    this.osc = ctx.createOscillator(); this.osc.type = "sawtooth";
    this.sub = ctx.createOscillator(); this.sub.type = "sine";
    this.subGain = ctx.createGain(); this.subGain.gain.value = 0;
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseSrc = ctx.createBufferSource(); this.noiseSrc.buffer = nb; this.noiseSrc.loop = true;
    this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = 0;
    this.shaper = ctx.createWaveShaper(); this.shaper.curve = driveCurve(0.1);
    this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass";
    this.amp = ctx.createGain(); this.amp.gain.value = 0;
    this.wobbleLfo = ctx.createOscillator(); this.wobbleLfo.type = "sine"; this.wobbleLfo.frequency.value = 4;
    this.wobbleGain = ctx.createGain(); this.wobbleGain.gain.value = 0;

    this.osc.connect(this.shaper);
    this.sub.connect(this.subGain); this.subGain.connect(this.shaper);
    this.noiseSrc.connect(this.noiseGain); this.noiseGain.connect(this.shaper);
    this.shaper.connect(this.filter); this.filter.connect(this.amp); this.amp.connect(out);
    this.wobbleLfo.connect(this.wobbleGain); this.wobbleGain.connect(this.filter.frequency);
    this.osc.start(); this.sub.start(); this.noiseSrc.start(); this.wobbleLfo.start();
  }

  setCharacter(id: string): void {
    const cc = CONFIGS[(id as Character)] ?? CONFIGS.DUB;
    this.cc = cc;
    const t = 0.02;
    this.osc.type = cc.wave;
    this.subGain.gain.setTargetAtTime(cc.sub, this.osc.context.currentTime, t);
    this.noiseGain.gain.setTargetAtTime(cc.noise * 0.3, this.osc.context.currentTime, t);
    this.shaper.curve = driveCurve(cc.drive);
    this.wobbleLfo.frequency.setTargetAtTime(cc.wobbleRate, this.osc.context.currentTime, t);
  }

  note(baseFreq: number, time: number, vel: number, p: ParamState): number {
    const cc = this.cc;
    const octave = Math.pow(2, (p.bassOct as number) + cc.octave);
    let f = scaleQuantize(baseFreq, p.scaleQuantize as string, p.transpose as number) * octave;
    f = Math.min(500, Math.max(22, f));
    const glide = (p.bassGlide as number) * cc.glideMul;
    this.osc.frequency.setTargetAtTime(f, time, Math.max(0.001, glide * 0.3));
    this.sub.frequency.setTargetAtTime(f * 0.5, time, Math.max(0.001, glide * 0.3));

    const cutoff = (p.bassCutoff as number) * cc.cutoffMul;
    this.filter.Q.setValueAtTime(Math.max(0.2, (p.bassReso as number) + cc.resoAdd), time);
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setValueAtTime(cutoff * 2.4, time);
    this.filter.frequency.exponentialRampToValueAtTime(Math.max(70, cutoff), time + 0.18);
    // wobble depth scales with cutoff so it stays musical
    this.wobbleGain.gain.setTargetAtTime(cc.wobble * cutoff * 0.7, time, 0.02);

    const decay = (p.bassDecay as number) * cc.decayMul;
    const g = (p.bassLevel as number) * vel;
    this.amp.gain.cancelScheduledValues(time);
    this.amp.gain.setValueAtTime(this.amp.gain.value, time);
    this.amp.gain.linearRampToValueAtTime(g, time + 0.006);
    this.amp.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    return f;
  }
}
