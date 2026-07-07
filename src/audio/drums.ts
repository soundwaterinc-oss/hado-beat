// drums.ts — synthesized drum voices (no samples). Each trigger builds short-lived
// nodes scheduled at an absolute AudioContext time for tight, sample-accurate groove.
import type { ParamState } from "../core/params";

export type Lane = "kick" | "snare" | "clap" | "hat" | "ohat" | "tom" | "rim" | "perc";
export const LANES: Lane[] = ["kick", "snare", "clap", "hat", "ohat", "tom", "rim", "perc"];

const LEVEL_PARAM: Record<Lane, keyof ParamState> = {
  kick: "kickLevel", snare: "snareLevel", clap: "clapLevel", hat: "hatLevel",
  ohat: "ohatLevel", tom: "tomLevel", rim: "rimLevel", perc: "percLevel",
};

export class DrumKit {
  private noise: AudioBuffer;
  constructor(private ctx: AudioContext, private out: GainNode) {
    this.noise = this.makeNoise(1);
  }

  private makeNoise(sec: number): AudioBuffer {
    const len = Math.floor(this.ctx.sampleRate * sec);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private noiseSrc(time: number, dur: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.start(time);
    s.stop(time + dur + 0.02);
    return s;
  }

  private env(g: GainNode, time: number, peak: number, decay: number, attack = 0.001): void {
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(peak, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  }

  trigger(lane: Lane, time: number, vel: number, p: ParamState): void {
    const lvl = (p[LEVEL_PARAM[lane]] as number) * vel;
    if (lvl <= 0.001) return;
    switch (lane) {
      case "kick": return this.kick(time, lvl, p);
      case "snare": return this.snare(time, lvl, p);
      case "clap": return this.clap(time, lvl);
      case "hat": return this.hat(time, lvl, p, 0.045);
      case "ohat": return this.hat(time, lvl, p, 0.3);
      case "tom": return this.tom(time, lvl);
      case "rim": return this.rim(time, lvl);
      case "perc": return this.perc(time, lvl);
    }
  }

  private kick(time: number, lvl: number, p: ParamState): void {
    const ctx = this.ctx;
    const tune = p.kickTune as number;
    const decay = p.kickDecay as number;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(tune * 3.2, time);
    osc.frequency.exponentialRampToValueAtTime(tune, time + 0.06);
    const g = ctx.createGain();
    this.env(g, time, lvl, decay, 0.001);
    osc.connect(g); g.connect(this.out);
    osc.start(time); osc.stop(time + decay + 0.05);
    // attack click
    const click = this.noiseSrc(time, 0.01);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
    const cg = ctx.createGain(); this.env(cg, time, lvl * 0.4, 0.01);
    click.connect(hp); hp.connect(cg); cg.connect(this.out);
  }

  private snare(time: number, lvl: number, p: ParamState): void {
    const ctx = this.ctx;
    const tone = ctx.createOscillator();
    tone.type = "triangle"; tone.frequency.value = p.snareTune as number;
    const tg = ctx.createGain(); this.env(tg, time, lvl * 0.5, 0.14);
    tone.connect(tg); tg.connect(this.out);
    tone.start(time); tone.stop(time + 0.2);
    const nz = this.noiseSrc(time, 0.2);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
    const ng = ctx.createGain(); this.env(ng, time, lvl, 0.18);
    nz.connect(bp); bp.connect(ng); ng.connect(this.out);
  }

  private clap(time: number, lvl: number): void {
    const ctx = this.ctx;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1250; bp.Q.value = 1.1;
    const g = ctx.createGain(); g.connect(this.out);
    bp.connect(g);
    // three staggered bursts + a tail
    [0, 0.011, 0.022].forEach((off, i) => {
      const nz = this.noiseSrc(time + off, 0.03);
      const eg = ctx.createGain(); this.env(eg, time + off, lvl * (1 - i * 0.15), 0.02);
      nz.connect(eg); eg.connect(bp);
    });
    const tail = this.noiseSrc(time + 0.03, 0.12);
    const tg = ctx.createGain(); this.env(tg, time + 0.03, lvl * 0.5, 0.1);
    tail.connect(tg); tg.connect(bp);
    g.gain.value = 1;
  }

  private hat(time: number, lvl: number, p: ParamState, decay: number): void {
    const ctx = this.ctx;
    const nz = this.noiseSrc(time, decay);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = p.hatTone as number;
    const g = ctx.createGain(); this.env(g, time, lvl * 0.6, decay, 0.0005);
    nz.connect(hp); hp.connect(g); g.connect(this.out);
  }

  private tom(time: number, lvl: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.25);
    const g = ctx.createGain(); this.env(g, time, lvl, 0.3);
    osc.connect(g); g.connect(this.out);
    osc.start(time); osc.stop(time + 0.35);
  }

  private rim(time: number, lvl: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator(); osc.type = "square"; osc.frequency.value = 440;
    const og = ctx.createGain(); this.env(og, time, lvl * 0.5, 0.02);
    osc.connect(og); og.connect(this.out); osc.start(time); osc.stop(time + 0.05);
    const nz = this.noiseSrc(time, 0.03);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1700; bp.Q.value = 3;
    const ng = ctx.createGain(); this.env(ng, time, lvl, 0.025);
    nz.connect(bp); bp.connect(ng); ng.connect(this.out);
  }

  private perc(time: number, lvl: number): void {
    const ctx = this.ctx;
    const car = ctx.createOscillator(); car.type = "square";
    car.frequency.setValueAtTime(520, time);
    car.frequency.exponentialRampToValueAtTime(300, time + 0.1);
    const mod = ctx.createOscillator(); mod.frequency.value = 780;
    const mg = ctx.createGain(); mg.gain.value = 300;
    mod.connect(mg); mg.connect(car.frequency);
    const g = ctx.createGain(); this.env(g, time, lvl * 0.6, 0.12);
    car.connect(g); g.connect(this.out);
    car.start(time); car.stop(time + 0.16); mod.start(time); mod.stop(time + 0.16);
  }
}
