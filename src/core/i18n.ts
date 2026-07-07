// i18n.ts — EN/JP UI language. paramLabel() covers knob names; t() covers everything else
// (tabs, drum rows, buttons, headers, notes). Persisted in localStorage.
import { PARAMS, type ParamName } from "./params";

export type Lang = "EN" | "JP";
const LS_KEY = "hado.lang";

let current: Lang = (localStorage.getItem(LS_KEY) as Lang) || "EN";
export function getLang(): Lang { return current; }
export function setLang(l: Lang): void { current = l; localStorage.setItem(LS_KEY, l); }
export function toggleLang(): Lang { setLang(current === "EN" ? "JP" : "EN"); return current; }

// Japanese knob labels (fallback to the English PARAMS label when missing).
const PARAM_JA: Partial<Record<ParamName, string>> = {
  geoMode: "幾何モード", geoModeA: "ハイブリッドA", geoModeB: "ハイブリッドB", seedCount: "種数",
  angleOffset: "角度オフセット", wellDepth: "井戸の深さ", wellRadius: "井戸半径",
  lsysIterations: "L反復", branchAngle: "分岐角", lsysSeed: "Lシード", cellCount: "細胞数",
  relax: "Lloyd緩和", wallWidth: "壁の幅", wallHeight: "壁の高さ", geoMix: "幾何ミックス",
  brushRadius: "ブラシ半径", brushDepth: "ブラシ深度",
  packetX: "パケットX", packetY: "パケットY", packetWidth: "パケット幅", px: "運動量X", py: "運動量Y",
  substeps: "サブステップ", damping: "減衰", boundary: "境界", gamma: "ガンマ",
  hueShift: "色相回転", vOverlay: "V重ね",
  bpm: "テンポ", swing: "スイング", gateMode: "ゲート方式", gateThresh: "ゲート閾値",
  accentAmt: "アクセント量", humanize: "ヒューマナイズ", patternDensity: "量子密度",
  kickLevel: "キック", snareLevel: "スネア", clapLevel: "クラップ", hatLevel: "クローズハット",
  ohatLevel: "オープンハット", tomLevel: "タム", rimLevel: "リム", percLevel: "パーカス",
  kickTune: "キック音程", kickDecay: "キック減衰", snareTune: "スネア音程", hatTone: "ハット音色",
  sidechain: "サイドチェイン",
  modeCount: "モード数", fRoot: "基音", warp: "ワープ", scaleQuantize: "スケール", transpose: "移調",
  bassLevel: "ベース音量", bassOct: "ベースオクターブ", bassCutoff: "ベースカットオフ",
  bassReso: "ベース共鳴", bassGlide: "ベースグライド", bassDecay: "ベース減衰",
  padLevel: "パッド音量", padGlide: "パッドグライド", drive: "ドライブ", masterCut: "マスターカットオフ",
  delayTime: "ディレイ時間", delayFb: "ディレイFB", reverbSize: "リバーブ長", reverbMix: "リバーブ量",
  fxSendDrum: "FX送りドラム", fxSendSynth: "FX送りシンセ",
  feedAmount: "帰還量", mutateRate: "変性レート", mutateSmooth: "変性平滑",
  rmsTarget: "RMS目標", centTarget: "重心目標", freeze: "凍結",
  midiEnable: "MIDI有効", midiCh: "MIDIチャンネル", wsRate: "WS送信レート",
  sendField: "場送信", fieldRate: "場レート",
};

export function paramLabel(name: ParamName): string {
  if (current === "JP") return PARAM_JA[name] ?? PARAMS[name].label;
  return PARAMS[name].label;
}

// UI strings keyed by stable id.
const STRINGS: Record<Lang, Record<string, string>> = {
  EN: {
    "tab.GEO": "GEO", "tab.FIELD": "FIELD", "tab.BEAT": "BEAT", "tab.SYNTH": "SYNTH",
    "tab.MUTATE": "MUTATE", "tab.IO": "IO",
    "row.kick": "kick", "row.snare": "snare", "row.clap": "clap", "row.hat": "c.hat",
    "row.ohat": "o.hat", "row.tom": "tom", "row.rim": "rim", "row.perc": "perc", "row.bass": "bass",
    play: "▶ play", stop: "■ stop", clear: "clear", resetPsi: "reset ψ",
    save: "save", export: "export", import: "import",
    connect: "connect", disconnect: "disconnect", enableMidi: "enable midi",
    presetName: "preset name", macros: "MACROS", output: "OUTPUT", presets: "PRESETS",
    midiOut: "MIDI out (bass → notes)", tdBridge: "TouchDesigner bridge",
    beatNote: "gate: MANUAL=grid · QUANTUM=field · AND/OR=combine · Space play · click=fill",
  },
  JP: {
    "tab.GEO": "幾何", "tab.FIELD": "場", "tab.BEAT": "拍", "tab.SYNTH": "音源",
    "tab.MUTATE": "変性", "tab.IO": "入出力",
    "row.kick": "キック", "row.snare": "スネア", "row.clap": "クラップ", "row.hat": "クローズ",
    "row.ohat": "オープン", "row.tom": "タム", "row.rim": "リム", "row.perc": "パーカス", "row.bass": "ベース",
    play: "▶ 再生", stop: "■ 停止", clear: "クリア", resetPsi: "場リセット",
    save: "保存", export: "書出", import: "読込",
    connect: "接続", disconnect: "切断", enableMidi: "MIDI有効化",
    presetName: "プリセット名", macros: "マクロ", output: "出力", presets: "プリセット",
    midiOut: "MIDI出力（ベース→ノート）", tdBridge: "TouchDesigner連携",
    beatNote: "ゲート: MANUAL=グリッド · QUANTUM=場 · AND/OR=合成 · Space再生 · クリック=フィル",
  },
};

export function t(id: string): string {
  return STRINGS[current][id] ?? STRINGS.EN[id] ?? id;
}
