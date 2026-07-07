// layout.ts — tabs + square canvas + drum grid (9 lanes × 16) + transport + macro column
// + meters + IO/preset panels. Owns the DOM; main.ts supplies behaviour via hooks.
import { PARAMS, type ParamName, type ParamState, type ParamTab } from "../core/params";
import { makeControl } from "./knob";
import { BeatSequencer, ROWS } from "../seq/beat";

const TABS: ParamTab[] = ["GEO", "FIELD", "BEAT", "SYNTH", "MUTATE", "IO"];
const MACROS: ParamName[] = ["gateThresh", "sidechain", "bassCutoff", "reverbMix"];

export interface UIHooks {
  onParamChange: (name: ParamName) => void;
  onObserve: (x: number, y: number) => void;
  onBrush: (x: number, y: number, raise: boolean) => void;
  onReset: () => void;
  onTogglePlay: () => void;
  presetSave: (name: string) => void;
  presetLoad: (name: string) => void;
  presetList: () => string[];
  exportJSON: () => void;
  importJSON: (text: string) => void;
  midiEnable: () => void;
  midiSelect: (id: string) => void;
  midiDevices: () => { id: string; name: string }[];
  tdConnect: (url: string) => void;
  tdDisconnect: () => void;
}

type Refreshable = HTMLElement & { refresh?: () => void };

export class BeatUI {
  canvas: HTMLCanvasElement;
  private cells: HTMLElement[][] = [];
  private controls: Refreshable[] = [];
  private meterBar: HTMLElement;
  private hud: HTMLElement;
  private warnEl: HTMLElement;
  private playBtn!: HTMLElement;
  private tdStatus!: HTMLElement;
  private midiSel!: HTMLSelectElement;
  private presetSel!: HTMLSelectElement;

  constructor(
    root: HTMLElement, private state: ParamState,
    private seq: BeatSequencer, private hooks: UIHooks,
  ) {
    root.innerHTML = "";
    const left = div("left");
    const right = div("right");
    root.append(left, right);

    const tabsbar = div("tabsbar");
    const panels: Record<string, HTMLElement> = {};
    const tabBtns: HTMLElement[] = [];
    left.appendChild(tabsbar);

    const stage = div("stage");
    this.canvas = document.createElement("canvas");
    this.canvas.id = "glcanvas";
    this.hud = div("hud");
    this.warnEl = div("warn");
    stage.append(this.canvas, this.hud, this.warnEl);

    const panelHost = div("panelhost");
    panelHost.style.cssText = "flex:0 0 auto;max-height:34vh;overflow:hidden;";
    for (const tab of TABS) {
      const panel = document.createElement("div");
      panel.className = "panel" + (tab === "IO" ? " io" : tab === "MUTATE" ? " mutate" : "");
      this.buildPanel(panel, tab);
      panels[tab] = panel;
      panelHost.appendChild(panel);
      const btn = div("tabbtn");
      btn.textContent = tab;
      btn.addEventListener("click", () => {
        for (const b of tabBtns) b.classList.remove("active");
        btn.classList.add("active");
        for (const p of Object.values(panels)) p.classList.remove("active");
        panel.classList.add("active");
      });
      tabBtns.push(btn);
      tabsbar.appendChild(btn);
    }

    left.append(panelHost, stage, this.buildTransport(), this.buildGrid());
    tabBtns[0].classList.add("active");
    panels.GEO.classList.add("active");

    this.meterBar = div("bar");
    this.buildRight(right);
    this.bindCanvas();
  }

  private buildPanel(panel: HTMLElement, tab: ParamTab): void {
    for (const key of Object.keys(PARAMS) as ParamName[]) {
      if (PARAMS[key].tab !== tab) continue;
      const c = makeControl(key, this.state, this.hooks.onParamChange) as Refreshable;
      this.controls.push(c);
      panel.appendChild(c);
    }
    if (tab === "IO") this.buildIO(panel);
    if (tab === "BEAT") {
      const note = div("status");
      note.textContent = "gate: MANUAL=grid · QUANTUM=field · AND/OR=combine · Space play · click=fill";
      panel.appendChild(note);
    }
  }

  private buildIO(panel: HTMLElement): void {
    const midiWrap = div("ctl");
    const midiBtn = button("enable midi", () => { this.hooks.midiEnable(); setTimeout(() => this.refreshMidiDevices(), 400); });
    this.midiSel = document.createElement("select");
    this.midiSel.className = "enumsel";
    this.midiSel.addEventListener("change", () => this.hooks.midiSelect(this.midiSel.value));
    midiWrap.append(labelEl("MIDI out (bass → notes)"), midiBtn, this.midiSel);
    panel.appendChild(midiWrap);

    const tdWrap = div("ctl");
    const url = document.createElement("input");
    url.className = "txt"; url.value = "ws://localhost:9980";
    const row = div("row");
    row.append(button("connect", () => this.hooks.tdConnect(url.value)), button("disconnect", () => this.hooks.tdDisconnect()));
    this.tdStatus = div("status");
    this.tdStatus.textContent = "TD: idle (dormant)";
    tdWrap.append(labelEl("TouchDesigner bridge"), url, row, this.tdStatus);
    panel.appendChild(tdWrap);
  }

  private buildTransport(): HTMLElement {
    const bar = div("transport");
    this.playBtn = button("▶ play", () => this.hooks.onTogglePlay());
    this.playBtn.classList.add("play");
    const clear = button("clear", () => { for (let r = 0; r < ROWS.length; r++) this.seq.clearRow(r); this.refreshGrid(); });
    const reset = button("reset ψ", () => this.hooks.onReset());
    bar.append(this.playBtn, clear, reset);
    return bar;
  }

  private buildGrid(): HTMLElement {
    const grid = div("grid");
    for (let r = 0; r < ROWS.length; r++) {
      const rowEl = div("grow");
      const label = div("glabel");
      label.textContent = ROWS[r];
      rowEl.appendChild(label);
      const rowCells: HTMLElement[] = [];
      for (let c = 0; c < 16; c++) {
        const cell = div("gcell" + (c % 4 === 0 ? " beat" : ""));
        const refresh = (): void => {
          cell.classList.toggle("on", this.seq.steps[r][c]);
          cell.style.opacity = this.seq.steps[r][c] ? String(0.4 + 0.6 * this.seq.prob[r][c]) : "1";
        };
        cell.addEventListener("click", () => { this.seq.steps[r][c] = !this.seq.steps[r][c]; refresh(); });
        let t = 0;
        cell.addEventListener("pointerdown", () => {
          t = window.setTimeout(() => {
            const cyc = [0.25, 0.5, 0.75, 1.0];
            const idx = cyc.indexOf(this.seq.prob[r][c]);
            this.seq.prob[r][c] = cyc[(idx + 1) % cyc.length];
            this.seq.steps[r][c] = true; refresh();
          }, 400);
        });
        cell.addEventListener("pointerup", () => clearTimeout(t));
        (cell as Refreshable).refresh = refresh;
        refresh();
        rowCells.push(cell);
        rowEl.appendChild(cell);
      }
      this.cells.push(rowCells);
      grid.appendChild(rowEl);
    }
    return grid;
  }

  private buildRight(right: HTMLElement): void {
    const h = document.createElement("h4"); h.textContent = "MACROS"; right.appendChild(h);
    for (const m of MACROS) {
      const c = makeControl(m, this.state, this.hooks.onParamChange) as Refreshable;
      this.controls.push(c); right.appendChild(c);
    }
    const mh = document.createElement("h4"); mh.textContent = "OUTPUT";
    const meter = div("meter"); meter.appendChild(this.meterBar);
    right.append(mh, meter);

    const ph = document.createElement("h4"); ph.textContent = "PRESETS";
    this.presetSel = document.createElement("select");
    this.presetSel.className = "enumsel";
    this.refreshPresets();
    this.presetSel.addEventListener("change", () => this.hooks.presetLoad(this.presetSel.value));
    const nameIn = document.createElement("input");
    nameIn.className = "txt"; nameIn.placeholder = "preset name";
    const row1 = div("row");
    row1.append(
      button("save", () => { if (nameIn.value) { this.hooks.presetSave(nameIn.value); this.refreshPresets(); } }),
      button("export", () => this.hooks.exportJSON()),
    );
    const importInput = document.createElement("input");
    importInput.type = "file"; importInput.accept = ".json"; importInput.style.display = "none";
    importInput.addEventListener("change", async () => {
      const f = importInput.files?.[0];
      if (f) this.hooks.importJSON(await f.text());
    });
    const row2 = div("row");
    row2.append(button("import", () => importInput.click()));
    right.append(ph, this.presetSel, nameIn, row1, row2, importInput);
  }

  private bindCanvas(): void {
    const toXY = (e: PointerEvent): [number, number] => {
      const r = this.canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    let down = false, moved = false, shift = false;
    this.canvas.addEventListener("pointerdown", (e) => { down = true; moved = false; shift = e.shiftKey; });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!down) return; moved = true;
      const [x, y] = toXY(e); this.hooks.onBrush(x, y, shift);
    });
    this.canvas.addEventListener("pointerup", (e) => {
      const [x, y] = toXY(e);
      if (!moved) this.hooks.onObserve(x, y);
      down = false;
    });
  }

  // ── live updates ────────────────────────────────────────────────────
  setMeter(rms: number): void { this.meterBar.style.width = `${Math.min(100, rms * 300)}%`; }
  setHud(text: string): void { this.hud.textContent = text; }
  setWarn(text: string): void { this.warnEl.textContent = text; }
  setPlaying(on: boolean): void { this.playBtn.textContent = on ? "■ stop" : "▶ play"; this.playBtn.classList.toggle("active", on); }
  setTdStatus(text: string, cls = ""): void { this.tdStatus.textContent = text; this.tdStatus.className = "status " + cls; }
  setStepCursor(i: number): void {
    for (let r = 0; r < this.cells.length; r++) {
      for (let c = 0; c < 16; c++) this.cells[r][c].classList.toggle("cursor", c === i);
    }
  }
  refreshGrid(): void { for (const row of this.cells) for (const c of row) (c as Refreshable).refresh?.(); }
  refreshAll(): void { for (const c of this.controls) c.refresh?.(); this.refreshGrid(); }
  refreshMidiDevices(): void {
    const devs = this.hooks.midiDevices();
    this.midiSel.innerHTML = "";
    for (const d of devs) { const o = document.createElement("option"); o.value = d.id; o.textContent = d.name; this.midiSel.appendChild(o); }
  }
  private refreshPresets(): void {
    const list = this.hooks.presetList();
    this.presetSel.innerHTML = "";
    for (const nm of list) { const o = document.createElement("option"); o.value = nm; o.textContent = nm; this.presetSel.appendChild(o); }
  }
}

function div(cls: string): HTMLElement { const d = document.createElement("div"); d.className = cls; return d; }
function button(text: string, on: () => void): HTMLElement {
  const b = document.createElement("button"); b.className = "btn"; b.textContent = text;
  b.addEventListener("click", on); return b;
}
function labelEl(text: string): HTMLElement {
  const l = document.createElement("label"); l.innerHTML = `<span>${text}</span>`; return l;
}
