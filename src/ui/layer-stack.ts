import { BaseElement } from './base-element';
import { BLEND_META, BLEND_MODES, LAYER_META, type BlendMode, type LayerId, type LayerState, type ViewState } from '../core/types';

export interface LayerStackDetail {
  type: 'opacity' | 'blend' | 'visible' | 'reorder';
  id: LayerId;
  value?: number | boolean | BlendMode;
  to?: LayerId;
}

const LAYER_ACCENT: Record<LayerId, string> = {
  far: '#6ea7d8',
  mid: '#7fb894',
  near: '#d8a463',
};

/**
 * 图层堆栈面板：
 * - 每层独立透明度滑条（0..1）与混合模式（正常/叠加/滤色）
 * - 列表从「顶层」到「底层」显示，拖拽调整合成顺序
 */
export class LayerStackElement extends BaseElement {
  static styles = /* css */ `
    :host { display: block; }

    .stack-head {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 10px;
    }
    .stack-head h2 { margin: 0; font-size: 12px; letter-spacing: 0.16em; color: var(--text-dim); font-weight: 600; }
    .stack-head .hint { font-size: 11px; color: var(--text-faint); }

    .list { display: flex; flex-direction: column; gap: 8px; }

    .layer {
      position: relative;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(24, 33, 43, 0.95), rgba(15, 21, 28, 0.95));
      padding: 9px 10px 10px;
      transition: border-color 120ms ease, box-shadow 160ms ease, opacity 120ms ease, transform 120ms ease;
      --accent-layer: #888;
    }
    .layer::before {
      content: '';
      position: absolute; left: 0; top: 9px; bottom: 9px; width: 2px;
      border-radius: 2px;
      background: var(--accent-layer);
      opacity: 0.85;
    }
    .layer.dragging { opacity: 0.4; }
    .layer:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    .layer.drop-target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-soft), 0 6px 18px rgba(0,0,0,0.5); }
    .layer.hidden-layer { opacity: 0.62; }

    .row { display: flex; align-items: center; gap: 8px; }
    .row.top { justify-content: space-between; }

    .handle {
      width: 16px; height: 22px;
      display: grid; place-items: center;
      cursor: grab;
      color: var(--text-faint);
      border-radius: 4px;
      flex: 0 0 auto;
      touch-action: none;
    }
    .handle:hover { color: var(--text); background: rgba(255,255,255,0.05); }
    .handle:active { cursor: grabbing; }
    .handle svg { display: block; }

    .name { display: flex; align-items: baseline; gap: 7px; min-width: 0; flex: 1; }
    .name .zh { font-size: 14px; font-weight: 600; letter-spacing: 0.02em; }
    .name .code { font-size: 10px; color: var(--text-faint); letter-spacing: 0.1em; }
    .name .hint { font-size: 11px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .tools { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
    .tools button { padding: 2px 6px; font-size: 10px; color: var(--text-dim); }
    .tools button[aria-pressed='true'] { color: var(--accent); border-color: rgba(243,172,60,0.4); background: var(--accent-soft); }

    .controls { margin-top: 8px; display: grid; gap: 7px; }

    .slider-row { display: grid; grid-template-columns: 34px 1fr 46px; align-items: center; gap: 8px; }
    .slider-row label { font-size: 11px; color: var(--text-dim); }
    .slider-row output {
      font-size: 11px; color: var(--text); text-align: right;
      font-family: 'Cascadia Mono', Consolas, monospace;
    }

    .blend-row { display: flex; align-items: center; gap: 8px; }
    .blend-row label { font-size: 11px; color: var(--text-dim); width: 34px; flex: 0 0 auto; }
    .segmented {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
      background: var(--bg-input);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 3px;
      flex: 1;
    }
    .segmented button {
      padding: 4px 0; font-size: 11px; border-radius: 6px;
      background: transparent; border: 1px solid transparent; color: var(--text-dim);
    }
    .segmented button[aria-pressed='true'] {
      background: var(--bg-raised); border-color: var(--line);
      color: var(--text); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .segmented button:hover { color: var(--text); }

    .footer-note {
      margin-top: 10px; font-size: 10.5px; color: var(--text-faint);
      border-top: 1px dashed var(--line-soft); padding-top: 8px; line-height: 1.5;
    }
    .footer-note b { color: var(--text-dim); font-weight: 600; }

    @media (max-width: 520px) {
      .name .hint { display: none; }
    }
  `;

  #view: ViewState | null = null;
  #dragging: LayerId | null = null;
  #built = false;

  set view(view: ViewState) {
    const first = !this.#built;
    this.#view = view;
    if (first) this.render();
    this.sync();
  }

  private render(): void {
    this.#built = true;
    this.root.innerHTML = `
      <div class="stack-head">
        <h2>视景图层</h2>
        <span class="hint">拖拽调整合成顺序</span>
      </div>
      <div class="list" part="list"></div>
      <p class="footer-note">列表自上而下为<b>后渲染 → 先渲染</b>；拖拽到另一图层即可换序，合成器按顺序逐层叠加。</p>
    `;
    const list = this.root.querySelector('.list') as HTMLElement;

    list.addEventListener('click', (event) => this.onClick(event));
    list.addEventListener('input', (event) => this.onInput(event));
    list.addEventListener('dragstart', (event) => this.onDragStart(event));
    list.addEventListener('dragover', (event) => this.onDragOver(event));
    list.addEventListener('dragleave', (event) => this.onDragLeave(event));
    list.addEventListener('drop', (event) => this.onDrop(event));
    list.addEventListener('dragend', () => this.clearDrag());
    list.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  private sync(): void {
    if (!this.#view) return;
    const list = this.root.querySelector('.list') as HTMLElement;
    // 顶层先显示：顺序数组末尾是最后渲染（最上层）
    const displayOrder = [...this.#view.order].reverse();
    const existing = new Map<LayerId, HTMLElement>();
    for (const el of Array.from(list.children) as HTMLElement[]) {
      existing.set(el.dataset.layer as LayerId, el);
    }

    for (const id of displayOrder) {
      let el = existing.get(id);
      if (!el) {
        el = this.createLayerElement(id);
        list.appendChild(el);
      } else {
        list.appendChild(el);
      }
      this.fillLayerElement(el, id, this.#view.layers[id]);
    }
  }

  private createLayerElement(id: LayerId): HTMLElement {
    const el = document.createElement('article');
    el.className = 'layer';
    el.dataset.layer = id;
    el.draggable = true;
    el.tabIndex = 0;
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', `${LAYER_META[id].name}图层（可用 Alt+方向键调整顺序）`);
    el.style.setProperty('--accent-layer', LAYER_ACCENT[id]);
    const meta = LAYER_META[id];
    el.innerHTML = `
      <div class="row top">
        <span class="handle" title="拖拽排序" aria-hidden="true">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/>
            <circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/>
            <circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/>
          </svg>
        </span>
        <div class="name">
          <span class="zh">${meta.name}</span>
          <span class="code mono">${meta.code}</span>
          <span class="hint">${meta.hint}</span>
        </div>
        <div class="tools">
          <button type="button" data-action="up" title="上移一层" aria-label="${meta.name}上移">↑</button>
          <button type="button" data-action="down" title="下移一层" aria-label="${meta.name}下移">↓</button>
          <button type="button" data-action="visible" title="显示 / 隐藏图层" aria-label="显示或隐藏${meta.name}">👁</button>
        </div>
      </div>
      <div class="controls">
        <div class="slider-row">
          <label for="op-${id}">透明度</label>
          <input id="op-${id}" type="range" min="0" max="1" step="0.01" data-action="opacity" aria-label="${meta.name}透明度"/>
          <output data-out="opacity" for="op-${id}">1.00</output>
        </div>
        <div class="blend-row">
          <label>混合</label>
          <div class="segmented" role="group" aria-label="${meta.name}混合模式">
            ${BLEND_MODES.map(
              (mode) =>
                `<button type="button" data-action="blend" data-value="${mode}" title="${BLEND_META[mode].hint}">${BLEND_META[mode].name}</button>`,
            ).join('')}
          </div>
        </div>
      </div>
    `;
    return el;
  }

  private fillLayerElement(el: HTMLElement, id: LayerId, layer: LayerState): void {
    el.classList.toggle('hidden-layer', !layer.visible);
    const slider = el.querySelector<HTMLInputElement>('input[data-action="opacity"]');
    const out = el.querySelector<HTMLElement>('[data-out="opacity"]');
    if (slider) {
      if (slider.value !== String(layer.opacity)) slider.value = String(layer.opacity);
      slider.style.setProperty('--fill', `${layer.opacity * 100}%`);
      slider.setAttribute('aria-valuetext', layer.opacity.toFixed(2));
    }
    if (out) out.textContent = layer.opacity.toFixed(2);

    for (const btn of Array.from(el.querySelectorAll<HTMLButtonElement>('button[data-action="blend"]'))) {
      btn.setAttribute('aria-pressed', String(btn.dataset.value === layer.blend));
    }
    const visBtn = el.querySelector<HTMLButtonElement>('button[data-action="visible"]');
    if (visBtn) {
      visBtn.setAttribute('aria-pressed', String(layer.visible));
      visBtn.style.opacity = layer.visible ? '1' : '0.5';
    }
    const up = el.querySelector<HTMLButtonElement>('button[data-action="up"]');
    const down = el.querySelector<HTMLButtonElement>('button[data-action="down"]');
    const order = this.#view?.order ?? [];
    const index = order.indexOf(id);
    if (up) up.disabled = index === order.length - 1;
    if (down) down.disabled = index === 0;
    void id;
  }

  private layerIdOf(target: EventTarget | null): LayerId | null {
    const el = (target as HTMLElement | null)?.closest?.('.layer') as HTMLElement | null;
    return (el?.dataset.layer as LayerId | undefined) ?? null;
  }

  private onClick(event: Event): void {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const id = this.layerIdOf(button);
    if (!id || !this.#view) return;
    const action = button.dataset.action;
    if (action === 'blend') {
      const value = button.dataset.value as BlendMode;
      if (value) this.emit<LayerStackDetail>('layer-change', { type: 'blend', id, value });
    } else if (action === 'visible') {
      this.emit<LayerStackDetail>('layer-change', {
        type: 'visible',
        id,
        value: !this.#view.layers[id].visible,
      });
    } else if (action === 'up' || action === 'down') {
      const order = this.#view.order;
      const index = order.indexOf(id);
      const target = action === 'up' ? order[index + 1] : order[index - 1];
      if (target) this.emit<LayerStackDetail>('layer-change', { type: 'reorder', id, to: target });
    }
  }

  private onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.dataset.action !== 'opacity') return;
    const id = this.layerIdOf(input);
    if (!id) return;
    const value = Number(input.value);
    input.style.setProperty('--fill', `${value * 100}%`);
    const out = input.parentElement?.querySelector<HTMLElement>('[data-out="opacity"]');
    if (out) out.textContent = value.toFixed(2);
    this.emit<LayerStackDetail>('layer-change', { type: 'opacity', id, value });
  }

  /** Alt + 上下方向键在获得焦点的图层上调整顺序 */
  private onKeyDown(event: KeyboardEvent): void {
    if (!event.altKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const layerEl = (event.target as HTMLElement).closest('.layer') as HTMLElement | null;
    const id = layerEl?.dataset.layer as LayerId | undefined;
    if (!id || !this.#view) return;
    event.preventDefault();
    const order = this.#view.order;
    const index = order.indexOf(id);
    // 界面从顶层往下排，所以界面上的「上」= 数组更靠后
    const target = event.key === 'ArrowUp' ? order[index + 1] : order[index - 1];
    if (!target) return;
    this.emit<LayerStackDetail>('layer-change', { type: 'reorder', id, to: target });
    queueMicrotask(() => {
      const moved = this.root.querySelector<HTMLElement>(`.layer[data-layer="${id}"]`);
      moved?.focus();
    });
  }

  private onDragStart(event: DragEvent): void {
    const id = this.layerIdOf(event.target);
    if (!id) return;
    this.#dragging = id;
    const el = (event.target as HTMLElement).closest('.layer') as HTMLElement;
    el.classList.add('dragging');
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  private onDragOver(event: DragEvent): void {
    if (!this.#dragging) return;
    event.preventDefault();
    const el = (event.target as HTMLElement).closest('.layer') as HTMLElement | null;
    if (!el || el.dataset.layer === this.#dragging) return;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    for (const other of Array.from(this.root.querySelectorAll('.drop-target'))) {
      other.classList.remove('drop-target');
    }
    el.classList.add('drop-target');
  }

  private onDragLeave(event: DragEvent): void {
    const el = (event.target as HTMLElement).closest('.layer') as HTMLElement | null;
    el?.classList.remove('drop-target');
  }

  private onDrop(event: DragEvent): void {
    event.preventDefault();
    const from = this.#dragging;
    const to = this.layerIdOf(event.target);
    this.clearDrag();
    if (!from || !to || from === to) return;
    this.emit<LayerStackDetail>('layer-change', { type: 'reorder', id: from, to });
  }

  private clearDrag(): void {
    this.#dragging = null;
    for (const el of Array.from(this.root.querySelectorAll('.dragging, .drop-target'))) {
      el.classList.remove('dragging', 'drop-target');
    }
  }
}

customElements.define('rail-layer-stack', LayerStackElement);

declare global {
  interface HTMLElementTagNameMap {
    'rail-layer-stack': LayerStackElement;
  }
}

export type { BlendMode };
