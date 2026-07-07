// params.ts — single source of truth for all parameters (drives UI, preset, TD send).
// HADŌ BEAT / 波動拍 — the quantum field drives a rhythm engine.
export type ParamTab = "PERFORM" | "GEO" | "FIELD" | "BEAT" | "SYNTH" | "MUTATE" | "IO" | "INFO";

export interface NumberParam {
  kind: "number";
  tab: ParamTab;
  label: string;
  min: number;
  max: number;
  def: number;
  step?: number;
  unit?: string;
}
export interface EnumParam {
  kind: "enum";
  tab: ParamTab;
  label: string;
  options: readonly string[];
  def: string;
}
export interface BoolParam {
  kind: "bool";
  tab: ParamTab;
  label: string;
  def: boolean;
}
export type ParamDef = NumberParam | EnumParam | BoolParam;

const n = (
  tab: ParamTab, label: string, min: number, max: number, def: number,
  step?: number, unit?: string,
): NumberParam => ({ kind: "number", tab, label, min, max, def, step, unit });
const e = (tab: ParamTab, label: string, options: readonly string[], def: string): EnumParam =>
  ({ kind: "enum", tab, label, options, def });
const b = (tab: ParamTab, label: string, def: boolean): BoolParam =>
  ({ kind: "bool", tab, label, def });

export const PARAMS = {
  // ── PERFORM ──────────────────────────────────────────────────────────
  masterGain: n("PERFORM", "master gain", 0, 1.5, 0.9, 0.01),

  // ── GEO ──────────────────────────────────────────────────────────────
  geoMode: e("GEO", "geo mode", ["PHYLLO", "LSYS", "VORO", "HYBRID"], "PHYLLO"),
  geoModeA: e("GEO", "hybrid A", ["PHYLLO", "LSYS", "VORO"], "PHYLLO"),
  geoModeB: e("GEO", "hybrid B", ["PHYLLO", "LSYS", "VORO"], "VORO"),
  seedCount: n("GEO", "seeds", 8, 256, 55, 1),
  angleOffset: n("GEO", "angle offset", -3, 3, 0, 0.01, "°"),
  wellDepth: n("GEO", "well depth", 0, 1, 0.6, 0.01),
  wellRadius: n("GEO", "well radius", 0.01, 0.1, 0.03, 0.001),
  lsysIterations: n("GEO", "L iterations", 1, 5, 3, 1),
  branchAngle: n("GEO", "branch angle", 15, 40, 25.7, 0.1, "°"),
  lsysSeed: n("GEO", "L seed", 1, 9999, 1, 1),
  cellCount: n("GEO", "cells", 8, 128, 32, 1),
  relax: n("GEO", "Lloyd relax", 0, 8, 2, 1),
  wallWidth: n("GEO", "wall width", 0.005, 0.04, 0.012, 0.001),
  wallHeight: n("GEO", "wall height", 0, 1, 0.7, 0.01),
  geoMix: n("GEO", "geo mix", 0, 1, 0, 0.01),
  brushRadius: n("GEO", "brush radius", 0.01, 0.1, 0.04, 0.001),
  brushDepth: n("GEO", "brush depth", -1, 1, -0.5, 0.01),

  // ── FIELD ────────────────────────────────────────────────────────────
  packetX: n("FIELD", "packet x", 0, 1, 0.5, 0.001),
  packetY: n("FIELD", "packet y", 0, 1, 0.5, 0.001),
  packetWidth: n("FIELD", "packet width", 0.02, 0.2, 0.08, 0.001),
  px: n("FIELD", "momentum x", -40, 40, 8, 0.1),
  py: n("FIELD", "momentum y", -40, 40, 0, 0.1),
  substeps: n("FIELD", "substeps", 1, 32, 8, 1),
  damping: n("FIELD", "damping", 0, 0.02, 0.002, 0.0001),
  boundary: e("FIELD", "boundary", ["reflect", "absorb"], "reflect"),
  gamma: n("FIELD", "gamma", 0.3, 1.5, 0.7, 0.01),
  hueShift: n("FIELD", "hue shift", 0, 360, 0, 1, "°"),
  vOverlay: n("FIELD", "V overlay", 0, 1, 0.3, 0.01),

  // ── BEAT ─────────────────────────────────────────────────────────────
  bpm: n("BEAT", "bpm", 40, 200, 120, 1),
  swing: n("BEAT", "swing", 0, 0.7, 0.15, 0.01),
  gateMode: e("BEAT", "gate mode", ["MANUAL", "QUANTUM", "AND", "OR"], "AND"),
  gateThresh: n("BEAT", "gate thresh", 0, 1, 0.4, 0.01),
  accentAmt: n("BEAT", "accent amt", 0, 1, 0.5, 0.01),
  humanize: n("BEAT", "humanize", 0, 0.05, 0.006, 0.001, "s"),
  patternDensity: n("BEAT", "quantum density", 0, 1, 0.5, 0.01),
  kickLevel: n("BEAT", "kick", 0, 1, 0.9, 0.01),
  snareLevel: n("BEAT", "snare", 0, 1, 0.7, 0.01),
  clapLevel: n("BEAT", "clap", 0, 1, 0.5, 0.01),
  hatLevel: n("BEAT", "closed hat", 0, 1, 0.5, 0.01),
  ohatLevel: n("BEAT", "open hat", 0, 1, 0.4, 0.01),
  tomLevel: n("BEAT", "tom", 0, 1, 0.5, 0.01),
  rimLevel: n("BEAT", "rim", 0, 1, 0.45, 0.01),
  percLevel: n("BEAT", "perc", 0, 1, 0.5, 0.01),
  kickTune: n("BEAT", "kick tune", 30, 90, 50, 1, "Hz"),
  kickDecay: n("BEAT", "kick decay", 0.1, 1.2, 0.4, 0.01, "s"),
  snareTune: n("BEAT", "snare tune", 120, 320, 190, 1, "Hz"),
  hatTone: n("BEAT", "hat tone", 2000, 9000, 6500, 50, "Hz"),
  sidechain: n("BEAT", "sidechain", 0, 1, 0.6, 0.01),

  // ── SYNTH ────────────────────────────────────────────────────────────
  modeCount: n("SYNTH", "modes", 1, 16, 6, 1),
  fRoot: n("SYNTH", "f root", 30, 400, 55, 1, "Hz"),
  warp: n("SYNTH", "warp", 0.3, 2.0, 0.7, 0.01),
  scaleQuantize: e("SYNTH", "scale", ["chromatic", "penta", "just", "gamelan"], "penta"),
  transpose: n("SYNTH", "transpose", -24, 24, 0, 1),
  bassLevel: n("SYNTH", "bass level", 0, 1, 0.6, 0.01),
  bassOct: n("SYNTH", "bass octave", -2, 2, 0, 1),
  bassCutoff: n("SYNTH", "bass cutoff", 100, 6000, 800, 10, "Hz"),
  bassReso: n("SYNTH", "bass reso", 0, 25, 6, 0.1),
  bassGlide: n("SYNTH", "bass glide", 0, 0.2, 0.02, 0.001, "s"),
  bassDecay: n("SYNTH", "bass decay", 0.05, 1.5, 0.35, 0.01, "s"),
  padLevel: n("SYNTH", "pad level", 0, 1, 0.15, 0.01),
  padGlide: n("SYNTH", "pad glide", 0.05, 3, 0.8, 0.01, "s"),
  drive: n("SYNTH", "drive", 0, 1, 0.15, 0.01),
  masterCut: n("SYNTH", "master cutoff", 300, 18000, 16000, 50, "Hz"),
  delayTime: n("SYNTH", "delay time", 20, 1200, 300, 1, "ms"),
  delayFb: n("SYNTH", "delay fb", 0, 0.85, 0.3, 0.01),
  reverbSize: n("SYNTH", "reverb size", 1, 8, 2.4, 0.1, "s"),
  reverbMix: n("SYNTH", "reverb mix", 0, 1, 0.18, 0.01),
  fxSendDrum: n("SYNTH", "fx send drum", 0, 1, 0.2, 0.01),
  fxSendSynth: n("SYNTH", "fx send synth", 0, 1, 0.35, 0.01),

  // ── MUTATE ───────────────────────────────────────────────────────────
  feedAmount: n("MUTATE", "feed amount", 0, 1, 0.3, 0.01),
  mutateRate: n("MUTATE", "mutate rate", 0.1, 2, 0.5, 0.01, "Hz"),
  mutateSmooth: n("MUTATE", "mutate smooth", 1, 10, 4, 0.1, "s"),
  rmsTarget: n("MUTATE", "rms target", -48, 0, -18, 0.5, "dB"),
  centTarget: n("MUTATE", "cent target", 200, 4000, 1000, 10, "Hz"),
  freeze: b("MUTATE", "freeze", false),

  // ── IO ───────────────────────────────────────────────────────────────
  midiEnable: b("IO", "midi enable", false),
  midiCh: n("IO", "midi ch", 1, 16, 10, 1),
  wsRate: n("IO", "ws rate", 10, 60, 30, 1, "fps"),
  sendField: b("IO", "send field", false),
  fieldRate: n("IO", "field rate", 5, 30, 15, 1, "fps"),
} as const satisfies Record<string, ParamDef>;

export type ParamName = keyof typeof PARAMS;
export type ParamValue = number | string | boolean;
export type ParamState = Record<ParamName, ParamValue>;

export function defaultState(): ParamState {
  const s = {} as ParamState;
  for (const key of Object.keys(PARAMS) as ParamName[]) s[key] = PARAMS[key].def;
  return s;
}

export interface Settings {
  gridSize: number;
  wsUrl: string;
  midiDeviceId: string;
}
export function defaultSettings(): Settings {
  return { gridSize: 256, wsUrl: "ws://localhost:9980", midiDeviceId: "" };
}
