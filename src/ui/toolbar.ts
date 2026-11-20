import { BaseElement } from './base-element';
import type { ViewState } from '../core/types';

export type ToolbarAction = 'export' | 'import' | 'reset' | 'preset';

export interface ToolbarDetail {
  action: ToolbarAction;
  preset?: string;
}

interface PresetDef {
  id: string;
  name: string;
  desc: string;
  apply: (view: ViewState) => void;
}

export const PRESETS: PresetDef[] = [
  {
    id: 'clear-noon',
    name: '晴空午间',
    desc: '通透大气，三层全开',
    apply: (v) => {
      v.fog = 0.16;
      v.colorTemp = 5800;
      v.night = false;
      v.layers.far = { opacity: 1, blend: 'normal', visible: true };
      v.layers.mid = { opacity: 1, blend: 'normal', visible: true };
      v.layers.near = { opacity: 1, blend: 'normal', visible: true };
    },
  },
  {
    id: 'morning-mist',
    name: '清晨薄雾',
    desc: '远景淡出，暖色空气',
    apply: (v) => {
      v.fog = 0.62;
      v.colorTemp = 4100;
      v.night = false;
      v.layers.far = { opacity: 0.78, blend: 'normal', visible: true };
      v.layers.mid = { opacity: 1, blend: 'normal', visible: true };
      v.layers.near = { opacity: 1, blend: 'normal', visible: true };
    },
  },
  {
    id: 'dusk-overlay',
    name: '黄昏叠加',
    desc: '叠加混合强化层次',
    apply: (v) => {
      v.fog = 0.4;
      v.colorTemp = 3100;
      v.night = false;
      v.layers.far = { opacity: 0.9, blend: 'normal', visible: true };
      v.layers.mid = { opacity: 0.72, blend: 'overlay', visible: true };
      v.layers.near = { opacity: 1, blend: 'normal', visible: true };
    },
  },
  {
    id: 'night-screen',
    name: '夜间滤色',
    desc: '冷色夜色 + 滤色提亮',
    apply: (v) => {
      v.fog = 0.52;
      v.colorTemp = 7200;
      v.night = true;
      v.layers.far = { opacity: 0.85, blend: 'screen', visible: true };
      v.layers.mid = { opacity: 0.9, blend: 'normal', visible: true };
      v.layers.near = { opacity: 1, blend: 'normal', visible: true };
    },
  },
];

/** 顶部工具栏：预设、导出、导入、重置 */
export class ToolbarElement extends BaseElement {
  static styles = /* css */ `
    :host { display: block; }

    .bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .brand {
      display: flex; align-items: center; gap: 9px; margin-right: auto; min-width: 0;
    }
    .logo {
      width: 26px; height: 26px; border-radius: 7px; flex: 0 0 auto;
      background: linear-gradient(145deg, #f5b64a, #b4731a);
      display: grid; place-items: center;
      box-shadow: 0 2px 8px rgba(243,172,60,0.28), inset 0 1px 0 rgba(255,255,255,0.35);
      color: #241703;
    }
    .title { display: flex; flex-direction: column; min-width: 0; }
    .title .t { font-size: 13px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }
    .title .s { font-size: 10px; color: var(--text-faint); letter-spacing: 0.08em; white-space: nowrap; }

    .presets { display: flex; gap: 5px; flex-wrap: wrap; }
    .presets button { font-size: 11.5px; padding: 5px 9px; }
    .presets button[aria-pressed='true'] { border-color: rgba(243,172,60,0.55); color: var(--accent); background: var(--accent-soft); }

    .divider { width: 1px; align-self: stretch; background: var(--line); margin: 0 2px; }

    .actions { display: flex; gap: 5px; }
    .actions button { font-size: 11.5px; padding: 5px 10px; display: inline-flex; align-items: center; gap: 5px; }
    .actions .save-state { color: var(--ok); font-size: 10.5px; opacity: 0; transition: opacity 200ms ease; }
    .actions .save-state.on { opacity: 1; }

    @media (max-width: 760px) {
      .presets { order: 3; width: 100%; }
      .title .s { display: none; }
    }
  `;

  #built = false;
  #activePreset: string | null = null;

  constructor() {
    super();
    this.render();
  }

  set activePreset(id: string | null) {
    this.#activePreset = id;
    for (const btn of Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-preset]'))) {
      btn.setAttribute('aria-pressed', String(btn.dataset.preset === id));
    }
  }

  flashSaved(text: string): void {
    const el = this.root.querySelector<HTMLElement>('.save-state');
    if (!el) return;
    el.textContent = text;
    el.classList.add('on');
    window.clearTimeout(Number(el.dataset.timer ?? 0));
    const timer = window.setTimeout(() => {
      el.classList.remove('on');
    }, 1800);
    el.dataset.timer = String(timer);
  }

  private render(): void {
    if (this.#built) return;
    this.#built = true;
    this.root.innerHTML = `
      <div class="bar">
        <div class="brand">
          <span class="logo" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M3 13V4.2c0-.7.6-1.2 1.2-1.2h7.6c.7 0 1.2.5 1.2 1.2V13"/>
              <path d="M3 13h10M5.4 8.2h5.2"/>
              <circle cx="5.6" cy="11" r="0.7" fill="currentColor" stroke="none"/>
              <circle cx="10.4" cy="11" r="0.7" fill="currentColor" stroke="none"/>
            </svg>
          </span>
          <span class="title">
            <span class="t">列车视景合成台</span>
            <span class="s">RAILVIEW COMPOSITOR · 多图层实景合成</span>
          </span>
        </div>

        <div class="presets" role="group" aria-label="视景预设">
          ${PRESETS.map(
            (p) => `<button type="button" data-preset="${p.id}" title="${p.desc}" aria-pressed="false">${p.name}</button>`,
          ).join('')}
        </div>

        <div class="divider" aria-hidden="true"></div>

        <div class="actions">
          <button type="button" class="primary" data-action="export" title="导出当前合成状态为 JSON">
            <span aria-hidden="true">⇩</span> 导出 JSON
          </button>
          <button type="button" data-action="import" title="从 JSON 文件还原合成状态">
            <span aria-hidden="true">⇧</span> 导入
          </button>
          <button type="button" data-action="reset" title="恢复到初始状态">重置</button>
          <span class="save-state" aria-live="polite"></span>
        </div>
      </div>
    `;

    this.root.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest('button');
      if (!btn) return;
      if (btn.dataset.preset) {
        this.emit<ToolbarDetail>('toolbar-action', { action: 'preset', preset: btn.dataset.preset });
        return;
      }
      const action = btn.dataset.action as ToolbarAction | undefined;
      if (action) this.emit<ToolbarDetail>('toolbar-action', { action });
    });
  }

  /** 供外层显示当前预设名 */
  get activePreset(): string | null {
    return this.#activePreset;
  }

}


customElements.define('rail-toolbar', ToolbarElement);

declare global {
  interface HTMLElementTagNameMap {
    'rail-toolbar': ToolbarElement;
  }
}
