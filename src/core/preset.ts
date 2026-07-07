// preset.ts — named presets (localStorage) + JSON export/import of full state.
import { PARAMS, defaultState, type ParamName, type ParamState } from "./params";

const LS_KEY = "hado.presets.v1";

export interface Preset {
  name: string;
  params: Partial<Record<ParamName, number | string | boolean>>;
}

export const BUILTIN_PRESETS: Preset[] = [
  {
    name: "Techno",
    params: { geoMode: "PHYLLO", seedCount: 55, wellDepth: 0.7, bpm: 130, swing: 0.08,
      gateMode: "AND", gateThresh: 0.35, sidechain: 0.7, bassCutoff: 700, bassReso: 8,
      fRoot: 55, warp: 0.7, reverbMix: 0.15, feedAmount: 0.3 },
  },
  {
    name: "Broken",
    params: { geoMode: "VORO", cellCount: 40, relax: 3, bpm: 92, swing: 0.32,
      gateMode: "OR", gateThresh: 0.45, patternDensity: 0.35, sidechain: 0.4,
      fRoot: 44, warp: 0.9, bassCutoff: 1100, reverbMix: 0.28, feedAmount: 0.4 },
  },
  {
    name: "Quantum",
    params: { geoMode: "LSYS", lsysIterations: 4, branchAngle: 22, bpm: 138, swing: 0.14,
      gateMode: "QUANTUM", gateThresh: 0.3, patternDensity: 0.6, sidechain: 0.6,
      fRoot: 62, warp: 1.1, padLevel: 0.25, reverbMix: 0.3, feedAmount: 0.5 },
  },
];

export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    return [];
  }
}

export function saveUserPreset(name: string, state: ParamState): void {
  const presets = loadUserPresets().filter((p) => p.name !== name);
  presets.push({ name, params: { ...state } });
  localStorage.setItem(LS_KEY, JSON.stringify(presets));
}

export function deleteUserPreset(name: string): void {
  const presets = loadUserPresets().filter((p) => p.name !== name);
  localStorage.setItem(LS_KEY, JSON.stringify(presets));
}

// Apply a preset onto a fresh default so missing keys fall back cleanly.
export function applyPreset(preset: Preset): ParamState {
  const state = defaultState();
  for (const key of Object.keys(preset.params) as ParamName[]) {
    if (key in PARAMS) state[key] = preset.params[key]!;
  }
  return state;
}

export function exportJSON(state: ParamState): string {
  return JSON.stringify({ format: "hado-preset-1", params: state }, null, 2);
}

export function importJSON(text: string): ParamState {
  const parsed = JSON.parse(text) as { params?: Record<string, unknown> };
  const state = defaultState();
  const src = parsed.params ?? {};
  for (const key of Object.keys(PARAMS) as ParamName[]) {
    if (key in src) state[key] = src[key] as number | string | boolean;
  }
  return state;
}
