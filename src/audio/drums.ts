// drums.ts — synthesized drum voices (no samples). Each trigger builds short-lived
// nodes scheduled at an absolute AudioContext time for tight, sample-accurate groove.
import type { ParamState } from "../core/params";

export type Lane = "kick" | "snare" | "clap" | "hat" | "ohat" | "tom" | "rim" | "perc";
export const LANES: Lane[] = ["kick", "snare", "clap", "hat", "ohat", "tom", "rim", "perc"];

const LEVEL_PARAM: Record<Lane, keyof ParamState> = {
  kick: "kickLevel", snare: "snareLevel", clap: "clapLevel", hat: "hatLevel",
  ohat: "ohatLevel", tom: "tomLevel", rim: "rimLevel", perc: "percLevel",
};

interface DC { snareDecay: number; snareNoise: number; snareBP: number; hatTone: number; kickDecay: number; kickDrive: number }
const DRUM_CFG: Record<string, DC> = {
  JAZZ:    { snareDecay: 1.7, snareNoise: 1.3, snareBP: 0.8, hatTone: 1.2, kickDecay: 0.8, kickDrive: 0.12 },
  DUB:     { snareDecay: 1.3, snareNoise: 1.0, snareBP: 0.9, hatTone: 0.8, kickDecay: 1.3, kickDrive: 0.3 },
  MINIMAL: { snareDecay: 0.6, snareNoise: 0.9, snareBP: 1.1, hatTone: 1.3, kickDecay: 0.7, kickDrive: 0.25 },
  DUBSTEP: { snareDecay: 1.1, snareNoise: 1.1, snareBP: 1.0, hatTone: 1.0, kickDecay: 1.5, kickDrive: 0.6 },
  NOISE:   { snareDecay: 1.0, snareNoise: 1.6, snareBP: 1.3, hatTone: 1.1, kickDecay: 1.0, kickDrive: 0.85 },
};

// HARD-CLIP curve — chunky square-ish edges for the "cable-pull" gutsy kick.
function kickCurve(drive: number): Float32Array<ArrayBuffer> {
  const n = 1024, c = new Float32Array(n), g = 1 + drive * 14;
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.max(-1, Math.min(1, x * g)) * 0.92; }
  return c;
}

export class DrumKit {
  private noise: AudioBuffer;
  private dc: DC = DRUM_CFG.DUB;
  constructor(private ctx: AudioContext, private out: GainNode) {
    this.noise = this.makeNoise(1);
  }
  setCharacter(id: string): void { this.dc = DRUM_CFG[id] ?? DRUM_CFG.DUB; }

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

  // "cable-pull" kick — ブツっとゴツい: instant onset, hard-clipped chunky body, abrupt
  // gated cut-off (that hard step IS the unplug pop), plus a broadband crackle + deep sub.
  private kick(time: number, lvl: number, p: ParamState): void {
    const ctx = this.ctx;
    const tune = p.kickTune as number;
    const drive = this.dc.kickDrive;
    const bodyLen = Math.max(0.045, (p.kickDecay as number) * this.dc.kickDecay * 0.5);
    const cut = time + bodyLen;
    const shaper = ctx.createWaveShaper(); shaper.curve = kickCurve(0.4 + drive * 0.6); shaper.oversample = "4x";
    // body: sine + square, fast pitch drop, hard clipped
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(tune * 5, time);
    osc.frequency.exponentialRampToValueAtTime(tune, time + 0.022);
    const sq = ctx.createOscillator(); sq.type = "square";
    sq.frequency.setValueAtTime(tune * 2.5, time);
    sq.frequency.exponentialRampToValueAtTime(tune, time + 0.03);
    const sqg = ctx.createGain(); sqg.gain.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(lvl * 1.25, time + 0.0004);  // near-instant onset
    g.gain.setValueAtTime(lvl * 1.05, cut);                     // hold
    g.gain.linearRampToValueAtTime(0, cut + 0.0012);            // ABRUPT cut = ブツッ
    osc.connect(shaper); sq.connect(sqg); sqg.connect(shaper); shaper.connect(g); g.connect(this.out);
    osc.start(time); osc.stop(cut + 0.02); sq.start(time); sq.stop(cut + 0.02);
    // deep DC-ish thump, also cut abruptly
    const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = tune * 0.7;
    const subg = ctx.createGain();
    subg.gain.setValueAtTime(0, time); subg.gain.linearRampToValueAtTime(lvl * 0.9, time + 0.0006);
    subg.gain.setValueAtTime(lvl * 0.7, cut); subg.gain.linearRampToValueAtTime(0, cut + 0.001);
    sub.connect(subg); subg.connect(this.out); sub.start(time); sub.stop(cut + 0.02);
    // broadband "pull" crackle: full-range noise, ultra short, hard clipped
    const nz = this.noiseSrc(time, 0.004);
    const nsh = ctx.createWaveShaper(); nsh.curve = kickCurve(0.8);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(lvl * (0.5 + 0.5 * drive), time); ng.gain.linearRampToValueAtTime(0, time + 0.004);
    nz.connect(nsh); nsh.connect(ng); ng.connect(this.out);
  }

  private snare(time: number, lvl: number, p: ParamState): void {
    const ctx = this.ctx;
    const tone = ctx.createOscillator();
    tone.type = "triangle"; tone.frequency.value = p.snareTune as number;
    const tg = ctx.createGain(); this.env(tg, time, lvl * 0.5, 0.14 * this.dc.snareDecay);
    tone.connect(tg); tg.connect(this.out);
    tone.start(time); tone.stop(time + 0.2 * this.dc.snareDecay + 0.05);
    const nz = this.noiseSrc(time, 0.2 * this.dc.snareDecay);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800 * this.dc.snareBP; bp.Q.value = 0.7;
    const ng = ctx.createGain(); this.env(ng, time, lvl * this.dc.snareNoise, 0.18 * this.dc.snareDecay);
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
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = (p.hatTone as number) * this.dc.hatTone;
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
