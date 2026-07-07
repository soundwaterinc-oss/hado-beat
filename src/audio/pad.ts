// pad.ts — soft eigenmode pad for atmosphere under the beat. Detuned sine bank tracking
// the spectrum modes, slow glide, low level. (A quieter descendant of HADŌ's drone.)
import type { ModeFeature } from "../core/features";
import type { ParamState } from "../core/params";

interface Voice { osc: OscillatorNode; det: OscillatorNode; gain: GainNode; pan: StereoPannerNode }

export class Pad {
  private voices: Voice[] = [];
  constructor(private ctx: AudioContext, out: GainNode, maxModes = 16) {
    for (let i = 0; i < maxModes; i++) {
      const osc = ctx.createOscillator(); osc.type = "sine";
      const det = ctx.createOscillator(); det.type = "sine";
      const gain = ctx.createGain(); gain.gain.value = 0;
      const pan = ctx.createStereoPanner(); pan.pan.value = i % 2 ? 0.5 : -0.5;
      osc.connect(gain); det.connect(gain); gain.connect(pan); pan.connect(out);
      osc.start(); det.start();
      this.voices.push({ osc, det, gain, pan });
    }
  }

  update(modes: ModeFeature[], p: ParamState): void {
    const now = this.ctx.currentTime;
    const glide = p.padGlide as number;
    const level = p.padLevel as number;
    const count = Math.min(this.voices.length, p.modeCount as number);
    for (let i = 0; i < this.voices.length; i++) {
      const v = this.voices[i];
      const m = modes[i];
      if (i < count && m && level > 0.001) {
        const f = Math.min(4000, Math.max(30, m.f));
        v.osc.frequency.setTargetAtTime(f, now, glide * 0.3);
        v.det.frequency.setTargetAtTime(f * 1.005, now, glide * 0.3);
        v.gain.gain.setTargetAtTime((m.a * level) / Math.sqrt(count) * 0.5, now, glide * 0.3);
      } else {
        v.gain.gain.setTargetAtTime(0, now, 0.2);
      }
    }
  }
}
