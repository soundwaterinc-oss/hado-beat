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
  masterGain: "マスター音量",
  feedAmount: "帰還量", mutateRate: "変性レート", mutateSmooth: "変性平滑",
  rmsTarget: "RMS目標", centTarget: "重心目標", freeze: "凍結",
  midiEnable: "MIDI有効", midiCh: "MIDIチャンネル", wsRate: "WS送信レート",
  sendField: "場送信", fieldRate: "場レート",
  character: "キャラクター", arrangeOn: "自動展開", engine: "展開エンジン",
  climate: "気候帯", current: "潮流", soil: "土質", weather: "天気",
  sectionBars: "セクション小節", stageBars: "ステージ小節",
};

const DESC_EN: Partial<Record<ParamName, string>> = {
  geoMode: "which plant geometry builds the potential V (wells & walls)",
  geoModeA: "source A blended in HYBRID mode", geoModeB: "source B blended in HYBRID mode",
  seedCount: "number of phyllotaxis seeds / wells",
  angleOffset: "nudge the golden angle — swirls the spiral",
  wellDepth: "depth of each well (how strongly it traps the wave)", wellRadius: "size of each well",
  lsysIterations: "L-system growth depth (branch complexity)", branchAngle: "L-system branch angle",
  lsysSeed: "random seed (reproducible L-system / Voronoi)", cellCount: "number of Voronoi cells",
  relax: "Lloyd relaxation passes (evens out cells)", wallWidth: "barrier wall thickness",
  wallHeight: "barrier wall height (reflects the wave)", geoMix: "crossfade A↔B in HYBRID",
  brushRadius: "canvas brush size", brushDepth: "brush amount: dig (−) / raise (+)",
  packetX: "initial wave-packet x", packetY: "initial wave-packet y", packetWidth: "wave-packet size",
  px: "initial momentum x", py: "initial momentum y",
  substeps: "sim steps per frame (accuracy vs cost)", damping: "bleeds energy so the sim stays stable",
  boundary: "reflect (box) or absorb (soft edges)", gamma: "brightness curve of |ψ|²",
  hueShift: "rotate phase → hue mapping", vOverlay: "show the potential walls",
  bpm: "tempo", swing: "shuffle — delays off-beat 16ths",
  gateMode: "MANUAL grid · QUANTUM field · AND tight · OR busy",
  gateThresh: "|ψ|² a lane probe must exceed to fire", accentAmt: "how much |ψ|² boosts velocity",
  humanize: "random timing scatter", patternDensity: "thins the quantum (field-driven) hits",
  kickLevel: "kick drum level", snareLevel: "snare level", clapLevel: "clap level",
  hatLevel: "closed hi-hat level", ohatLevel: "open hi-hat level", tomLevel: "tom level",
  rimLevel: "rim level", percLevel: "perc level", kickTune: "kick fundamental pitch",
  kickDecay: "kick length", snareTune: "snare body pitch", hatTone: "hi-hat highpass frequency",
  sidechain: "how hard the kick ducks bass+pad (pump)",
  modeCount: "how many spectral peaks are used", fRoot: "base frequency the spectrum maps onto",
  warp: "spectrum → pitch curve", scaleQuantize: "scale the bass snaps to", transpose: "semitone transpose",
  bassLevel: "bass level", bassOct: "bass octave shift", bassCutoff: "bass filter cutoff",
  bassReso: "bass filter resonance", bassGlide: "bass portamento", bassDecay: "bass note length",
  padLevel: "eigenmode pad level", padGlide: "pad glide time", drive: "master saturation",
  masterCut: "master lowpass cutoff", delayTime: "delay time", delayFb: "delay feedback",
  reverbSize: "reverb length", reverbMix: "reverb send", fxSendDrum: "drum → FX send",
  fxSendSynth: "synth → FX send", masterGain: "final output level",
  feedAmount: "depth of audio → geometry feedback (0 = off)", mutateRate: "how often geometry mutates",
  mutateSmooth: "smoothing of the mutation", rmsTarget: "loudness the feedback aims for",
  centTarget: "brightness the feedback aims for", freeze: "pause the mutation loop",
  midiEnable: "enable WebMIDI output", midiCh: "MIDI channel", wsRate: "TouchDesigner JSON send rate",
  sendField: "stream the 64×64 |ψ|² field to TD", fieldRate: "TD field-frame rate",
  character: "bass-led genre voice: JAZZ / DUB / MINIMAL / DUBSTEP (wobble) / NOISE (drive)",
  arrangeOn: "auto-evolve the beat every section / stage (keeps the genre)",
  engine: "how factors map to development: PLANT growth · PHYSICS oscillation · GEOMETRY quantised",
  climate: "factor: tropical→busy … polar→sparse (energy & tempo)",
  current: "factor: warm / cold / gyre / upwelling (motion & density)",
  soil: "factor: sand / clay / loam / volcanic (which voices dominate)",
  weather: "factor: clear / rain / storm / fog (swing, space, reverb)",
  sectionBars: "cycles per section — new pattern each section",
  stageBars: "cycles per stage of the 1→5 arc (sparse→dense→resolve)",
};
const DESC_JP: Partial<Record<ParamName, string>> = {
  geoMode: "ポテンシャルV（井戸と壁）を作る植物幾何の種類",
  geoModeA: "HYBRID時に混ぜる素材A", geoModeB: "HYBRID時に混ぜる素材B",
  seedCount: "フィロタキシスの種（井戸）の数", angleOffset: "黄金角を微調整——螺旋が渦を巻く",
  wellDepth: "各井戸の深さ（波を捕える強さ）", wellRadius: "各井戸の大きさ",
  lsysIterations: "L-systemの成長段階（枝の複雑さ）", branchAngle: "L-systemの分岐角",
  lsysSeed: "乱数シード（再現用）", cellCount: "ボロノイ細胞の数",
  relax: "Lloyd緩和の回数（細胞を均す）", wallWidth: "障壁の壁の厚み",
  wallHeight: "障壁の壁の高さ（波を反射）", geoMix: "HYBRIDのA↔Bクロスフェード",
  brushRadius: "ブラシ半径", brushDepth: "ブラシ量：掘る(−)/盛る(+)",
  packetX: "初期波束のX位置", packetY: "初期波束のY位置", packetWidth: "波束の大きさ",
  px: "初期運動量X", py: "初期運動量Y",
  substeps: "1フレームのシミュ回数（精度⇄負荷）", damping: "エネルギーを逃がし発散を防ぐ",
  boundary: "reflect（箱）/ absorb（柔らかい端）", gamma: "|ψ|²の明るさカーブ",
  hueShift: "位相→色相の回転", vOverlay: "ポテンシャルの壁を表示",
  bpm: "テンポ", swing: "シャッフル——裏の16分を遅らせる",
  gateMode: "MANUAL格子 · QUANTUM場 · AND密 · OR多",
  gateThresh: "レーンが発火する|ψ|²閾値", accentAmt: "|ψ|²がベロシティを上げる量",
  humanize: "タイミングのランダム散らし", patternDensity: "量子（場駆動）ヒットを間引く",
  kickLevel: "キックの音量", snareLevel: "スネアの音量", clapLevel: "クラップの音量",
  hatLevel: "クローズハットの音量", ohatLevel: "オープンハットの音量", tomLevel: "タムの音量",
  rimLevel: "リムの音量", percLevel: "パーカスの音量", kickTune: "キックの基音",
  kickDecay: "キックの長さ", snareTune: "スネアの胴の音程", hatTone: "ハットのハイパス周波数",
  sidechain: "キックがベース+パッドをダッキングする量（ポンプ）",
  modeCount: "使うスペクトルのピーク数", fRoot: "スペクトルを写す基準周波数",
  warp: "スペクトル→ピッチのカーブ", scaleQuantize: "ベースが吸着するスケール", transpose: "半音移調",
  bassLevel: "ベースの音量", bassOct: "ベースのオクターブ", bassCutoff: "ベースのフィルタカットオフ",
  bassReso: "ベースのレゾナンス", bassGlide: "ベースのポルタメント", bassDecay: "ベースの音の長さ",
  padLevel: "固有モードパッドの音量", padGlide: "パッドのグライド", drive: "マスターのサチュレーション",
  masterCut: "マスターのローパス", delayTime: "ディレイ時間", delayFb: "ディレイのフィードバック",
  reverbSize: "残響の長さ", reverbMix: "残響の送り", fxSendDrum: "ドラム→FX送り",
  fxSendSynth: "シンセ→FX送り", masterGain: "最終出力レベル",
  feedAmount: "音→幾何フィードバックの深さ（0で停止）", mutateRate: "幾何が変性する頻度",
  mutateSmooth: "変性の平滑化", rmsTarget: "フィードバックが目指す音量",
  centTarget: "フィードバックが目指す明るさ", freeze: "変性ループを一時停止",
  midiEnable: "WebMIDI出力を有効化", midiCh: "MIDIチャンネル", wsRate: "TD JSON送信レート",
  sendField: "64×64 |ψ|² 場をTDへ送出", fieldRate: "TD場フレームレート",
  character: "ベース主体のジャンル音色: JAZZ/DUB/MINIMAL/DUBSTEP(ワブル)/NOISE(歪み)",
  arrangeOn: "セクション/ステージごとにビートを自動変性（ジャンルは保持）",
  engine: "ファクターの写像: PLANT成長 · PHYSICS振動 · GEOMETRY量子化",
  climate: "ファクター: 熱帯→密…極地→疎（エネルギー・テンポ）",
  current: "ファクター: 暖流/寒流/環流/湧昇（動き・密度）",
  soil: "ファクター: 砂/粘土/壌土/火山（どの声部が支配的か）",
  weather: "ファクター: 快晴/雨/嵐/霧（スイング・空間・残響）",
  sectionBars: "1セクションの周期数——毎セクション新パターン",
  stageBars: "1→5アークの各ステージの周期数（疎→密→終）",
};
export function paramDesc(name: ParamName): string {
  return (current === "JP" ? DESC_JP[name] : DESC_EN[name]) ?? "";
}

export function paramLabel(name: ParamName): string {
  if (current === "JP") return PARAM_JA[name] ?? PARAMS[name].label;
  return PARAMS[name].label;
}

// UI strings keyed by stable id.
const STRINGS: Record<Lang, Record<string, string>> = {
  EN: {
    "tab.PERFORM": "PLAY", "tab.INFO": "INFO",
    "tab.GEO": "GEO", "tab.FIELD": "FIELD", "tab.BEAT": "BEAT", "tab.SYNTH": "SYNTH",
    "tab.EVOLVE": "EVOLVE", "tab.MUTATE": "MUTATE", "tab.IO": "IO",
    perform: "PERFORMANCE", quickPresets: "PRESETS", gateModeLabel: "GATE MODE",
    conceptTitle: "HADŌ BEAT / 波動拍 — concept",
    concept:
      "The time-independent Schrödinger equation −∇²ψ + Vψ = Eψ is the same mathematics as a " +
      "vibrating membrane: quantum stationary states ARE acoustic modes. Plant geometry " +
      "(phyllotaxis / L-system / Voronoi) shapes a potential V; a wave packet ψ evolves on it, and " +
      "here it drives a beat machine. Each drum/bass lane samples |ψ|² at a field probe — when the " +
      "wavefunction floods that probe, the lane fires (the quantum gate). The eigen-spectrum tunes " +
      "the resonant bass and pad; the kick pumps a sidechain. Superposition → groove.\n\n" +
      "Click the field to collapse ψ and drop a fill. Drag to brush the potential (Shift = raise). " +
      "Space plays; R resets the field; F freezes the mutation loop.",
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
    "tab.PERFORM": "演奏", "tab.INFO": "説明",
    "tab.GEO": "幾何", "tab.FIELD": "場", "tab.BEAT": "拍", "tab.SYNTH": "音源",
    "tab.EVOLVE": "展開", "tab.MUTATE": "変性", "tab.IO": "入出力",
    perform: "演奏コントロール", quickPresets: "プリセット", gateModeLabel: "ゲート方式",
    conceptTitle: "HADŌ BEAT / 波動拍 — 概念",
    concept:
      "時間非依存シュレディンガー方程式 −∇²ψ + Vψ = Eψ は膜の振動と同じ数学で、量子の定常状態＝音響の固有モードです。" +
      "植物の幾何（フィロタキシス／L-system／ボロノイ）がポテンシャルVを形づくり、その上を波束ψが時間発展し、" +
      "ここではそれがビートマシンを駆動します。各ドラム/ベースのレーンは場のプローブで |ψ|² をサンプルし、" +
      "波動関数がそこに満ちるとレーンが発火します（量子ゲート）。固有スペクトルがレゾナントベースとパッドを調律し、" +
      "キックがサイドチェインをポンプします。重ね合わせ→グルーヴ。\n\n" +
      "キャンバスをクリックするとψが収縮しフィルが落ちます。ドラッグでポテンシャルを掘る（Shiftで盛る）。" +
      "Spaceで再生、Rで場リセット、Fで変性ループ凍結。",
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

// Scale option labels in kana (shown when JP); EN uses the roman labels passed in.
const SCALE_JA: Record<string, string> = {
  chromatic: "クロマチック", major: "メジャー（セイヨウ）", minor: "マイナー（セイヨウ）",
  dorian: "ドリアン（セイヨウ）", phrygian: "フリジアン（セイヨウ）", lydian: "リディアン（セイヨウ）",
  mixolydian: "ミクソリディアン（セイヨウ）", harmonicMinor: "ハーモニックマイナー（セイヨウ）",
  melodicMinor: "メロディックマイナー（セイヨウ）", penta: "メジャーペンタ", minorPent: "マイナーペンタ",
  blues: "ブルース（アメリカ）", wholeTone: "ホールトーン", just: "ジャストメジャー（セイヨウ）",
  ryukyu: "リュウキュウ（オキナワ）", yo: "ヨ（ニホン）", insen: "インセン（ニホン）",
  hirajoshi: "ヒラジョウシ（ニホン）", iwato: "イワト（ニホン）", kumoi: "クモイ（ニホン）",
  bhairav: "バイラヴ（インド）", yaman: "ヤマン（インド）", todi: "トーディ（インド）", bhairavi: "バイラヴィ（インド）",
  rast: "ラースト（アラブ／トルコ）", hijaz: "ヒジャーズ（アラブ）", bayati: "バヤーティ（アラブ）", saba: "サバー（アラブ）",
  slendro: "スレンドロ（ジャワ）", gamelan: "ガムラン（バリ／ジャワ）", pelog: "ペロッグ（ジャワ）",
  tizita: "ティザータ（エチオピア）", hungarianMinor: "ハンガリアンマイナー（ハンガリー）",
  doubleHarmonic: "ダブルハーモニック（ビザンチン）", phrygianDom: "フリジアンドミナント（アンダルシア）",
};

// resolve an enum option's display text: JP kana if available, else the (roman) label, else the id.
export function enumOptionLabel(id: string, enLabels?: Record<string, string>): string {
  if (current === "JP") return SCALE_JA[id] ?? enLabels?.[id] ?? id;
  return enLabels?.[id] ?? id;
}
