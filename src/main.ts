// main.ts — HADŌ BEAT startup + rAF loop. The quantum field drives a lookahead-scheduled
// beat engine; plant geometry shapes the potential; acoustic feedback grows the field.
import "./ui/style.css";
import { defaultState, defaultSettings, type ParamName } from "./core/params";
import { features } from "./core/features";
import {
  BUILTIN_PRESETS, loadUserPresets, saveUserPreset, applyPreset,
  exportJSON, importJSON,
} from "./core/preset";
import { QuantumField } from "./field/schrodinger";
import { Probes } from "./field/probes";
import { Spectrum } from "./field/spectrum";
import { Potential } from "./geometry/potential";
import { AudioEngine } from "./audio/engine";
import { Mutator } from "./feedback/mutate";
import { MidiOut } from "./io/midi";
import { TdBridge } from "./io/tdBridge";
import { BeatUI, type UIHooks } from "./ui/layout";
import { BeatSequencer, ROWS } from "./seq/beat";
import type { Lane } from "./audio/drums";

const state = defaultState();
const settings = defaultSettings();

let field: QuantumField;
let potential: Potential;
let fieldMax = 1e-6;
const spectrum = new Spectrum();
const probes = new Probes();
const audio = new AudioEngine();
const mutator = new Mutator();
const midi = new MidiOut();
const td = new TdBridge();

// lane→field sampling points (golden angle spread) for quantum gating
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const lanePts = ROWS.map((_, k) => {
  const r = 0.4 * Math.sqrt((k + 0.5) / ROWS.length);
  const a = k * GOLDEN;
  return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
});
function laneMag(row: number): number {
  const pt = lanePts[row];
  return Math.min(1, field.sampleMag(pt.x, pt.y) / fieldMax);
}
function lowestFreq(): number {
  return features.modes[0]?.f ?? (state.fRoot as number);
}

function rebakeGeometry(): void { field.uploadV(potential.bake(state)); }

// ── sequencer deps ────────────────────────────────────────────────────
const seq = new BeatSequencer({
  now: () => audio.now,
  triggerDrum: (lane, time, vel) => {
    audio.drums.trigger(lane, time, vel, state);
    if (lane === "kick") audio.pump(time, state.sidechain as number, state.kickDecay as number);
  },
  triggerBass: (time, vel) => audio.bass.note(lowestFreq(), time, vel, state),
  probeMag: (row) => laneMag(row),
  midiNote: (f, vel, dur) => midi.noteOn(f, vel, dur, state.midiCh as number),
  onStep: (step, time) => {
    const delay = Math.max(0, (time - audio.now) * 1000);
    window.setTimeout(() => ui.setStepCursor(step), delay);
  },
});

// ── UI hooks ──────────────────────────────────────────────────────────
const GEO_PARAMS = new Set<ParamName>([
  "geoMode", "geoModeA", "geoModeB", "seedCount", "angleOffset", "wellDepth", "wellRadius",
  "lsysIterations", "branchAngle", "lsysSeed", "cellCount", "relax", "wallWidth",
  "wallHeight", "geoMix",
]);

function fill(x: number, y: number): void {
  // canvas click = observe (collapse) + a live fill hit
  void audio.resume();
  field.collapse(x, y, 0.05);
  const t = audio.now;
  const vel = 0.9;
  const lane: Lane = y > 0.6 ? "snare" : y > 0.3 ? "clap" : "perc";
  audio.drums.trigger(lane, t, vel, state);
  const f = audio.bass.note(lowestFreq(), t, 0.8, state);
  midi.noteOn(f, 0.8, 0.2, state.midiCh as number);
  features.collapse = { x, y, localV: 0, nearestMode: 0 };
  td.sendEvent("collapse", { x, y, pitch: f, vel });
}

const hooks: UIHooks = {
  onParamChange: (name) => { if (GEO_PARAMS.has(name)) rebakeGeometry(); },
  onObserve: (x, y) => fill(x, y),
  onBrush: (x, y, raise) => {
    potential.brush.paint(x, y, state.brushRadius as number, state.brushDepth as number, raise);
    rebakeGeometry();
  },
  onReset: () => { field.reset(state); spectrum.snapshot(field); },
  onTogglePlay: () => { void audio.resume(); seq.toggle(); ui.setPlaying(seq.running); },
  presetSave: (n) => saveUserPreset(n, state),
  presetLoad: (n) => {
    const all = [...BUILTIN_PRESETS, ...loadUserPresets()];
    const p = all.find((x) => x.name === n);
    if (!p) return;
    Object.assign(state, applyPreset(p));
    ui.refreshAll(); rebakeGeometry();
  },
  presetList: () => [...BUILTIN_PRESETS, ...loadUserPresets()].map((p) => p.name),
  exportJSON: () => {
    const blob = new Blob([exportJSON(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "hado-beat.json"; a.click();
  },
  importJSON: (text) => {
    try { Object.assign(state, importJSON(text)); ui.refreshAll(); rebakeGeometry(); }
    catch { ui.setWarn("import failed"); }
  },
  midiEnable: () => { void midi.enable(); },
  midiSelect: (id) => midi.select(id),
  midiDevices: () => midi.devices,
  tdConnect: (url) => { settings.wsUrl = url; td.connect(url); },
  tdDisconnect: () => td.disconnect(),
};

const root = document.getElementById("app")!;
const ui = new BeatUI(root, state, seq, hooks);

field = new QuantumField(ui.canvas, settings.gridSize);
potential = new Potential(field.gridSize);
rebakeGeometry();
field.reset(state);
spectrum.snapshot(field);
probes.layout(12);

mutator.onRebake = () => rebakeGeometry();
mutator.onWarn = (m) => ui.setWarn(m);
td.onStatus = (s) => ui.setTdStatus(`TD: ${s}`, s === "open" ? "ok" : s === "error" ? "err" : "");

const kick = (): void => { void audio.resume(); };
window.addEventListener("pointerdown", kick, { once: true });
window.addEventListener("keydown", kick, { once: true });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); void audio.resume(); seq.toggle(); ui.setPlaying(seq.running); }
  else if (e.key === "r" || e.key === "R") { field.reset(state); spectrum.snapshot(field); }
  else if (e.key === "f" || e.key === "F") { state.freeze = !(state.freeze as boolean); ui.refreshAll(); }
});

function resize(): void {
  const stage = ui.canvas.parentElement!;
  const px = Math.max(64, Math.min(stage.clientWidth, stage.clientHeight) - 8);
  ui.canvas.style.width = px + "px";
  ui.canvas.style.height = px + "px";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ui.canvas.width = Math.floor(px * dpr);
  ui.canvas.height = Math.floor(px * dpr);
}
window.addEventListener("resize", resize);
resize();

let lastTs = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - lastTs) / 1000);
  lastTs = now;

  field.step(state, potential.vmax);
  spectrum.accumulate(field);
  features.t = now / 1000;
  features.modes = spectrum.update(now, state.modeCount as number, state.fRoot as number, state.warp as number);
  probes.sample(field, features.probes);

  // running max for lane gating normalisation
  let mx = 1e-6;
  const d = field.reducedData;
  for (let i = 0; i < d.length; i += 4) if (d[i] > mx) mx = d[i];
  fieldMax = mx;

  seq.schedule(state);
  audio.update(features, state, now);
  mutator.update(dt, features.analysis, state);

  midi.sendCC(features, state, now);
  td.sendState(features, state, now);
  td.sendField(field.reducedData, state, now);

  field.render(state, ui.canvas.width, ui.canvas.height);
  ui.setMeter(features.analysis.rms);
  ui.setHud(`${field.gridSize}² · ${state.gateMode} · ${seq.running ? "▶" : "■"}${state.freeze ? " · FROZEN" : ""}`);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
