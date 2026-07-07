// beat.ts — lookahead-scheduled step sequencer. 8 drum lanes + 1 bass lane, each a
// 16-step grid. Triggers combine the manual grid with a "quantum gate": whether |ψ|²
// at that lane's field probe exceeds gateThresh right now. Swing + humanize + accent.
import { LANES, type Lane } from "../audio/drums";
import type { ParamState } from "../core/params";

export const ROWS: (Lane | "bass")[] = [...LANES, "bass"];
const LOOKAHEAD = 0.12; // seconds scheduled ahead

export interface BeatDeps {
  now: () => number;                                  // AudioContext.currentTime
  triggerDrum: (lane: Lane, time: number, vel: number) => void;
  triggerBass: (time: number, vel: number) => number; // returns played freq
  probeMag: (row: number) => number;                  // normalized |ψ|² 0..1 at lane probe
  midiNote: (freq: number, vel: number, dur: number, time: number) => void;
  onStep: (step: number, time: number) => void;
}

export class BeatSequencer {
  steps: boolean[][] = ROWS.map(() => Array(16).fill(false));
  prob: number[][] = ROWS.map(() => Array(16).fill(1));
  running = false;
  step = 0;
  private nextTime = 0;

  constructor(private deps: BeatDeps) {
    this.loadDefaultPattern();
  }

  private loadDefaultPattern(): void {
    const set = (row: number, idxs: number[]): void => idxs.forEach((i) => (this.steps[row][i] = true));
    set(0, [0, 4, 8, 12]);          // kick — four on the floor
    set(1, [4, 12]);                // snare — backbeat
    set(3, [2, 6, 10, 14]);         // closed hat — offbeats
    set(4, [7]);                    // open hat
    set(7, [3, 11]);                // perc
    set(8, [0, 3, 6, 8, 11, 14]);   // bass groove
  }

  toggle(on?: boolean): void {
    this.running = on ?? !this.running;
    if (this.running) { this.step = 0; this.nextTime = this.deps.now() + 0.08; }
  }

  clearRow(row: number): void { this.steps[row].fill(false); }

  // Call every animation frame. Reads live params.
  schedule(p: ParamState): void {
    if (!this.running) return;
    const now = this.deps.now();
    const sec16 = 60 / (p.bpm as number) / 4;
    while (this.nextTime < now + LOOKAHEAD) {
      this.fire(this.step, this.nextTime, p, sec16);
      this.nextTime += sec16;
      this.step = (this.step + 1) % 16;
    }
  }

  private fire(step: number, baseTime: number, p: ParamState, sec16: number): void {
    const swing = (step % 2 === 1) ? (p.swing as number) * sec16 * 0.66 : 0;
    const human = (Math.random() * 2 - 1) * (p.humanize as number);
    const time = baseTime + swing + human;
    const mode = p.gateMode as string;
    const thresh = p.gateThresh as number;
    const density = p.patternDensity as number;
    const accent = p.accentAmt as number;

    this.deps.onStep(step, baseTime);

    for (let r = 0; r < ROWS.length; r++) {
      const mag = this.deps.probeMag(r);
      const manual = this.steps[r][step] && Math.random() < this.prob[r][step];
      const gate = mag >= thresh;
      const quantum = gate && Math.random() < density;
      let hit = false;
      switch (mode) {
        case "MANUAL": hit = manual; break;
        case "QUANTUM": hit = quantum; break;
        case "AND": hit = manual && gate; break;
        case "OR": hit = manual || quantum; break;
      }
      if (!hit) continue;
      const vel = Math.min(1, 0.55 + accent * mag);
      const row = ROWS[r];
      if (row === "bass") {
        const f = this.deps.triggerBass(time, vel);
        this.deps.midiNote(f, vel, sec16 * 2, time);
      } else {
        this.deps.triggerDrum(row, time, vel);
      }
    }
  }
}
