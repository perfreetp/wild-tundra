import * as THREE from 'three';

export type RenderMode = 'visible' | 'thermal';

export interface HudState {
  temperature: number;
  visibility: number;
  position: THREE.Vector3;
  mode: RenderMode;
}

/** 左侧数据面板:温度 / 能见度 / 位置 / 渲染模式 */
export class FrHud extends HTMLElement {
  private tempValue!: HTMLElement;
  private tempBar!: HTMLElement;
  private visValue!: HTMLElement;
  private visBar!: HTMLElement;
  private posEl!: HTMLElement;
  private modeEl!: HTMLElement;

  connectedCallback(): void {
    this.innerHTML = `
      <div class="panel">
        <h2>内攻环境侦测</h2>
        <div class="metric">
          <div class="label">环境温度</div>
          <div class="value ok" id="hud-temp">--<span class="unit">°C</span></div>
          <div class="bar"><i id="hud-temp-bar" style="width:0%"></i></div>
        </div>
        <div class="metric">
          <div class="label">能见度</div>
          <div class="value ok" id="hud-vis">--<span class="unit">m</span></div>
          <div class="bar"><i id="hud-vis-bar" style="width:100%"></i></div>
        </div>
        <div class="pos" id="hud-pos"></div>
        <div class="mode" id="hud-mode"></div>
      </div>`;
    this.tempValue = this.querySelector('#hud-temp')!;
    this.tempBar = this.querySelector('#hud-temp-bar')!;
    this.visValue = this.querySelector('#hud-vis')!;
    this.visBar = this.querySelector('#hud-vis-bar')!;
    this.posEl = this.querySelector('#hud-pos')!;
    this.modeEl = this.querySelector('#hud-mode')!;
  }

  update(state: HudState): void {
    const t = state.temperature;
    this.tempValue.innerHTML = `${t.toFixed(1)}<span class="unit">°C</span>`;
    this.tempValue.className = 'value ' + (t > 120 ? 'hot' : t > 50 ? 'warm' : 'ok');
    this.tempBar.style.width = `${Math.min(100, (t / 400) * 100)}%`;

    const v = state.visibility;
    this.visValue.innerHTML = `${v.toFixed(1)}<span class="unit">m</span>`;
    this.visValue.className = 'value ' + (v < 3 ? 'hot' : v < 10 ? 'warm' : 'ok');
    this.visBar.style.width = `${Math.min(100, (v / 30) * 100)}%`;

    const p = state.position;
    this.posEl.textContent = `位置 X ${p.x.toFixed(1)}  Y ${p.y.toFixed(1)}  Z ${p.z.toFixed(1)}`;
    this.modeEl.textContent = state.mode === 'thermal' ? '◉ 热成像模式' : '◉ 可见光模式';
  }
}

export interface ToolbarState {
  mode: RenderMode;
  recording: boolean;
  roaming: boolean;
  playing: boolean;
  hasTrajectory: boolean;
}

/** 顶部工具栏,通过 CustomEvent 向外派发命令 */
export class FrToolbar extends HTMLElement {
  private state: ToolbarState = {
    mode: 'visible', recording: false, roaming: false, playing: false, hasTrajectory: false
  };

  connectedCallback(): void {
    this.innerHTML = `
      <div class="bar">
        <button data-cmd="mode">热成像</button>
        <span class="sep"></span>
        <button data-cmd="roam">自动漫游</button>
        <button data-cmd="record">录制轨迹</button>
        <button data-cmd="export">导出路径</button>
        <button data-cmd="import">导入路径</button>
        <span class="sep"></span>
        <button data-cmd="reset">重置视角</button>
        <span class="hint">点击画面锁定鼠标 · WASD 移动 · Space/C 升降</span>
      </div>`;
    this.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = (btn as HTMLElement).dataset.cmd!;
        if (cmd === 'mode') {
          this.dispatchEvent(new CustomEvent('command', {
            detail: this.state.mode === 'visible' ? 'mode-thermal' : 'mode-visible'
          }));
        } else {
          this.dispatchEvent(new CustomEvent('command', { detail: cmd }));
        }
      });
    });
    this.refresh();
  }

  setState(patch: Partial<ToolbarState>): void {
    Object.assign(this.state, patch);
    this.refresh();
  }

  private refresh(): void {
    const set = (cmd: string, text: string, cls = '') => {
      const btn = this.querySelector(`button[data-cmd="${cmd}"]`) as HTMLButtonElement | null;
      if (btn) { btn.textContent = text; btn.className = cls; }
    };
    set('mode', this.state.mode === 'thermal' ? '可见光' : '热成像',
      this.state.mode === 'thermal' ? 'active' : '');
    set('roam', this.state.roaming ? '停止漫游' : '自动漫游', this.state.roaming ? 'active' : '');
    set('record', this.state.recording ? '■ 停止录制' : '录制轨迹', this.state.recording ? 'rec' : '');
    set('export', this.state.hasTrajectory ? '导出路径' : '导出路径(空)');
    set('import', this.state.playing ? '回放中…' : '导入路径', this.state.playing ? 'active' : '');
  }
}

customElements.define('fr-hud', FrHud);
customElements.define('fr-toolbar', FrToolbar);

export function toast(message: string, ms = 2200): void {
  const el = document.getElementById('toast')!;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}
