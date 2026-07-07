# HADŌ BEAT / 波動拍

A beat-machine derivative of [HADŌ / 波動庭](https://github.com/soundwaterinc-oss/hado-field)
— the quantum field becomes a **rhythm engine**. EL-SYSTEMA lineage.

The same WebGL2 Schrödinger field (植物ポテンシャル: phyllotaxis / L-system / Voronoi)
now drives a lookahead-scheduled step sequencer. Each drum/bass lane samples `|ψ|²` at a
field probe: when the wavefunction floods that probe, the lane fires. The eigen-spectrum
tunes the bass and pad; the kick pumps a sidechain. Superposition → groove.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite → dist/
```

Latest desktop **Chrome / Edge** (WebGL2 + `EXT_color_buffer_float`, Web Audio, WebMIDI).
Click anywhere (or press Space) to start.

## Play

- **Space** — play / stop. **click canvas** — collapse ψ + a live fill hit.
- **Drag** — brush the potential (dig); **Shift+drag** — raise walls; **R** reset field; **F** freeze.
- **Drum grid** — 8 drum lanes + bass, 16 steps. Click toggles; long-press cycles step probability.
- Tabs **GEO / FIELD / BEAT / SYNTH / MUTATE / IO**; knobs vertical-drag, double-click resets.
- Presets: Techno / Broken / Quantum + save/export/import.

## Gate modes (the core idea)

Each step, a lane may fire from the **manual grid** and/or the **quantum gate**
(`|ψ|²` at that lane's probe ≥ `gateThresh`):

- **MANUAL** — classic drum machine, grid only.
- **QUANTUM** — pure field rhythm; the wavefunction plays the drums (thinned by `quantum density`).
- **AND** — grid step only fires if the field also floods there (tight, evolving).
- **OR** — grid + field triggers combined (busy, generative).

`accent amt` maps `|ψ|²` to velocity, `swing`/`humanize` loosen the grid, `sidechain`
ducks bass+pad under each kick.

## Sound

- **Drums** — synthesized kick / snare / clap / closed+open hat / tom / rim / perc (no samples).
- **Bass** — resonant saw, pitch = lowest eigenmode (scale-quantised), filter-plucked, sidechained.
- **Pad** — soft eigenmode bank under the beat.
- **Master** — drive → lowpass → limiter; per-bus FX sends (ping-pong delay + generated-IR reverb).

## Architecture

Reuses HADŌ's `core/features.ts` (`HadoFeatures`) seam: `audio/` and `seq/` never import
`field/` or `geometry/`. The sequencer takes field access as injected callbacks
(`probeMag`, `now`, trigger fns), so the field and the beat engine stay decoupled — the
same seam that lets any EL-SYSTEMA machine join `el-systema-core`.

MUTATE feedback and the dormant TouchDesigner bridge (`io/tdBridge.ts`, no socket until
you press Connect) carry over unchanged from HADŌ.

## Background playback & language

- **Keeps playing in the background** — the field simulation, sequencer and audio run off a
  Web Worker metronome (not `requestAnimationFrame`), so the beat and the quantum-gated
  field keep evolving even when the tab is hidden or another window is focused. The
  scheduler widens its lookahead to 1.4 s when hidden so throttled timers stay gapless.
  Open several tabs to layer multiple instances — each keeps running.
- **EN / 日本語** — toggle in the top-right tab bar; all labels switch live (persisted).
