// engine.ts — AudioContext graph for the beat machine.
//   drums ─┐
//          ├─► masterSum ─► drive ─► masterFilter ─► limiter ─► analyser ─► out
//   synth ─► duck ─┘   (kick pumps duck = sidechain)   plus FX sends → masterSum
import type { HadoFeatures } from "../core/features";
import type { ParamState } from "../core/params";
import { FxChain } from "./fx";
import { DrumKit } from "./drums";
import { Bass } from "./bass";
import { Pad } from "./pad";
import { Analyser } from "./analyser";

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024, curve = new Float32Array(n), k = amount * 40;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly drums: DrumKit;
  readonly bass: Bass;
  readonly pad: Pad;
  readonly analyser: Analyser;
  private fx: FxChain;
  private masterSum: GainNode;
  private master: GainNode;
  private drive: WaveShaperNode;
  private masterFilter: BiquadFilterNode;
  private limiter: DynamicsCompressorNode;
  private drumBus: GainNode;
  private synthBus: GainNode;
  private duck: GainNode;
  private sendDrum: GainNode;
  private sendSynth: GainNode;
  started = false;

  constructor() {
    this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: "interactive" });
    const ctx = this.ctx;
    this.fx = new FxChain(ctx);
    this.analyser = new Analyser(ctx);

    this.drumBus = ctx.createGain();
    this.synthBus = ctx.createGain();
    this.duck = ctx.createGain(); this.duck.gain.value = 1;
    this.sendDrum = ctx.createGain();
    this.sendSynth = ctx.createGain();
    this.masterSum = ctx.createGain();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;

    this.drive = ctx.createWaveShaper();
    this.drive.curve = driveCurve(0.15); this.drive.oversample = "2x";
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = "lowpass"; this.masterFilter.frequency.value = 16000;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.ratio.value = 20; this.limiter.threshold.value = -3;
    this.limiter.attack.value = 0.002; this.limiter.release.value = 0.12;

    // routing
    this.drumBus.connect(this.masterSum);
    this.synthBus.connect(this.duck);
    this.duck.connect(this.masterSum);
    this.drumBus.connect(this.sendDrum); this.sendDrum.connect(this.fx.input);
    this.duck.connect(this.sendSynth); this.sendSynth.connect(this.fx.input);
    this.fx.output.connect(this.masterSum);

    this.masterSum.connect(this.drive);
    this.drive.connect(this.masterFilter);
    this.masterFilter.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(this.analyser.input);
    this.analyser.input.connect(ctx.destination);

    this.drums = new DrumKit(ctx, this.drumBus);
    this.bass = new Bass(ctx, this.synthBus);
    this.pad = new Pad(ctx, this.synthBus);
  }

  async resume(): Promise<void> {
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.started = true;
  }

  get now(): number { return this.ctx.currentTime; }

  // sidechain pump: called at each kick's scheduled time.
  pump(time: number, amount: number, decay: number): void {
    if (amount <= 0.001) return;
    const g = this.duck.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(1 - amount, time);
    g.linearRampToValueAtTime(1, time + Math.max(0.05, decay * 0.9));
  }

  // per-frame param + feature push (pad tracks modes; analysis flows back).
  update(features: HadoFeatures, p: ParamState, nowMs: number): void {
    if (!this.started) return;
    this.fx.update(p);
    this.drive.curve = driveCurve(p.drive as number);
    this.masterFilter.frequency.setTargetAtTime(p.masterCut as number, this.now, 0.05);
    this.sendDrum.gain.value = p.fxSendDrum as number;
    this.sendSynth.gain.value = p.fxSendSynth as number;
    this.pad.update(features.modes, p);
    this.analyser.update(nowMs);
    features.analysis = this.analyser.out;
  }
}
