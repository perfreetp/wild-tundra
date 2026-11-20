import { BaseElement } from './base-element';

export interface HUDStats {
  fps: number;
  framesRendered: number;
  width: number;
  height: number;
  drawCalls: number;
  visibilityKm: number;
  layerCount: number;
  night: boolean;
}

/** 画面上叠加的 HUD：帧率、分辨率、能见度、相机角度 */
export class HudOverlayElement extends BaseElement {
  static styles = /* css */ `
    :host {
      position: absolute; inset: 0;
      pointer-events: none;
      display: block;
      font-family: 'Cascadia Mono', 'Consolas', monospace;
    }

    .badge {
      position: absolute; left: 14px; top: 12px;
      display: flex; align-items: center; gap: 8px;
      padding: 4px 9px 4px 7px;
      background: rgba(7, 11, 16, 0.62);
      border: 1px solid rgba(120, 150, 175, 0.22);
      border-radius: 7px;
      backdrop-filter: blur(6px);
      font-size: 10.5px; letter-spacing: 0.06em; color: #cfdae5;
    }
    .badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 6px currentColor; }
    .badge.warn .dot { background: var(--accent); }

    .readouts {
      position: absolute; right: 14px; top: 12px;
      display: grid; gap: 3px;
      text-align: right;
      font-size: 10px; color: rgba(200, 214, 228, 0.78);
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }
    .readouts b { color: #e8eef5; font-weight: 500; }

    .center-cross {
      position: absolute; left: 50%; top: 50%;
      width: 26px; height: 26px; margin: -13px 0 0 -13px;
      opacity: 0.42;
    }
    .center-cross::before, .center-cross::after {
      content: ''; position: absolute; background: currentColor; color: #dfe8f0;
    }
    .center-cross::before { left: 50%; top: 0; bottom: 0; width: 1px; margin-left: -0.5px; }
    .center-cross::after { top: 50%; left: 0; right: 0; height: 1px; margin-top: -0.5px; }

    .bottom {
      position: absolute; left: 14px; bottom: 12px;
      display: flex; align-items: center; gap: 10px;
      font-size: 10px; color: rgba(190, 205, 220, 0.7);
      text-shadow: 0 1px 3px rgba(0,0,0,0.9);
    }
    .bottom .sep { opacity: 0.3; }

    .vignette-corner {
      position: absolute; inset: 0;
      box-shadow: inset 0 0 90px rgba(0,0,0,0.32);
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .readouts { display: none; }
    }
  `;

  #built = false;

  constructor() {
    super();
    this.render();
  }

  private render(): void {
    if (this.#built) return;
    this.#built = true;
    this.root.innerHTML = `
      <div class="vignette-corner"></div>
      <div class="center-cross" aria-hidden="true"></div>
      <div class="badge"><span class="dot"></span><span data-out="status">合成在线</span></div>
      <div class="readouts">
        <span><b data-out="fps">--</b> FPS</span>
        <span data-out="res">--</span>
        <span>能见度 <b data-out="vis">--</b> km</span>
        <span data-out="draws">-- draw</span>
      </div>
      <div class="bottom">
        <span data-out="time">DAY</span>
        <span class="sep">/</span>
        <span data-out="cam">俯仰 0° · 偏航 0°</span>
        <span class="sep">/</span>
        <span data-out="layers">3 层</span>
      </div>
    `;
  }

  updateStats(stats: HUDStats): void {
    const set = (key: string, text: string): void => {
      const el = this.root.querySelector<HTMLElement>(`[data-out="${key}"]`);
      if (el && el.textContent !== text) el.textContent = text;
    };
    set('fps', String(stats.fps || '--'));
    set('res', `${stats.width}×${stats.height}`);
    set('vis', stats.visibilityKm >= 10 ? stats.visibilityKm.toFixed(0) : stats.visibilityKm.toFixed(1));
    set('draws', String(stats.drawCalls));
    set('time', stats.night ? 'NIGHT' : 'DAY');
    set('layers', `${stats.layerCount} 层`);
    const badge = this.root.querySelector('.badge');
    const warming = stats.framesRendered < 3;
    badge?.classList.toggle('warn', !warming && stats.fps < 30);
    set('status', warming ? '首帧渲染中' : stats.fps < 30 ? '合成降帧' : '合成在线');
  }

  updateCamera(pitch: number, yaw: number): void {
    const el = this.root.querySelector<HTMLElement>('[data-out="cam"]');
    if (el) {
      el.textContent = `俯仰 ${pitch > 0 ? '+' : ''}${pitch.toFixed(1)}° · 偏航 ${yaw > 0 ? '+' : ''}${yaw.toFixed(1)}°`;
    }
  }
}

customElements.define('rail-hud', HudOverlayElement);

declare global {
  interface HTMLElementTagNameMap {
    'rail-hud': HudOverlayElement;
  }
}
