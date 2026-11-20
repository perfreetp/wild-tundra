import { BaseElement } from './base-element';
import { COLOR_TEMP_MAX, COLOR_TEMP_MIN, PITCH_MAX, PITCH_MIN, YAW_MAX, YAW_MIN } from '../core/types';
import { effectiveColorTemp, kelvinToRgb, linearToSrgb } from '../core/color';
import type { ViewState } from '../core/types';

export interface ControlChangeDetail {
  type: 'fog' | 'color-temp' | 'night' | 'pitch' | 'yaw' | 'reset-camera';
  value?: number | boolean;
}

function kelvinGradientCss(): string {
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const k = COLOR_TEMP_MIN + (COLOR_TEMP_MAX - COLOR_TEMP_MIN) * t;
    const [r, g, b] = kelvinToRgb(k);
    const hex = `rgb(${Math.round(linearToSrgb(r) * 255)} ${Math.round(linearToSrgb(g) * 255)} ${Math.round(linearToSrgb(b) * 255)})`;
    stops.push(`${hex} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/** 环境与相机控制面板：雾效、色温、昼夜、俯仰/偏航 */
export class SceneControlsElement extends BaseElement {
  static styles = /* css */ `
    :host { display: block; }
    section { padding: 0; }

    h2 {
      margin: 0 0 10px; font-size: 12px; letter-spacing: 0.16em;
      color: var(--text-dim); font-weight: 600;
    }
    h3 {
      margin: 0 0 8px; font-size: 11px; letter-spacing: 0.12em;
      color: var(--text-faint); font-weight: 600; text-transform: uppercase;
    }

    .group {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(24,33,43,0.7), rgba(15,21,28,0.7));
      padding: 10px 11px 11px;
      margin-bottom: 10px;
    }

    .label-row {
      display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
      margin-bottom: 4px;
    }
    .label-row .label { font-size: 12px; color: var(--text); }
    .label-row .sub { font-size: 10.5px; color: var(--text-faint); }
    .value {
      font-family: 'Cascadia Mono', Consolas, monospace;
      font-size: 12px; color: var(--accent);
      font-variant-numeric: tabular-nums;
    }

    .slider-line { display: flex; align-items: center; gap: 9px; }
    .slider-line input[type='range'] { flex: 1; }
    .slider-line .num {
      width: 58px; flex: 0 0 auto;
      padding: 3px 5px; font-size: 11px; text-align: right;
      font-family: 'Cascadia Mono', Consolas, monospace;
    }

    .scale {
      display: flex; justify-content: space-between;
      font-size: 10px; color: var(--text-faint); margin-top: 2px;
      font-family: 'Cascadia Mono', Consolas, monospace;
    }

    /* 色温滑条：把轨道换成色温渐变 */
    #temp::-webkit-slider-runnable-track {
      height: 8px; border-radius: 999px;
      background: var(--temp-gradient);
      border: 1px solid rgba(255,255,255,0.08);
    }
    #temp::-webkit-slider-thumb {
      width: 16px; height: 16px; margin-top: -5px;
      border: 2px solid #fff; background: #10161d;
    }

    .day-night {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      background: var(--bg-input); padding: 3px;
      border: 1px solid var(--line); border-radius: 9px;
    }
    .day-night button {
      padding: 7px 0; font-size: 12px; border-radius: 7px;
      background: transparent; border-color: transparent; color: var(--text-dim);
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .day-night button[aria-pressed='true'] {
      background: var(--bg-raised); color: var(--text);
      border-color: var(--line); box-shadow: 0 1px 0 rgba(255,255,255,0.05);
    }
    .day-night button[aria-pressed='true'][data-mode='day'] { color: #ffd48a; }
    .day-night button[aria-pressed='true'][data-mode='night'] { color: #9dc4f0; }

    .axis {
      display: grid; grid-template-columns: 1fr; gap: 2px; margin-bottom: 9px;
    }
    .axis:last-child { margin-bottom: 0; }
    .axis .head { display: flex; justify-content: space-between; align-items: baseline; }
    .axis .head .nm { font-size: 11.5px; color: var(--text-dim); }
    .axis .head .val { font-size: 11px; font-family: 'Cascadia Mono', Consolas, monospace; color: var(--cyan); }
    .axis .track { display: flex; align-items: center; gap: 7px; }
    .axis .track .end { font-size: 9.5px; color: var(--text-faint); width: 26px; flex: 0 0 auto; text-align: center; font-family: 'Cascadia Mono', Consolas, monospace; }
    .axis input { flex: 1; }

    .reset-row { display: flex; gap: 6px; margin-top: 9px; }
    .reset-row button { flex: 1; font-size: 11.5px; padding: 5px 0; }

    .hint { font-size: 10.5px; color: var(--text-faint); line-height: 1.5; margin-top: 7px; }
  `;

  #view: ViewState | null = null;
  #built = false;

  set view(view: ViewState) {
    this.#view = view;
    if (!this.#built) this.render();
    this.sync();
  }

  private render(): void {
    this.#built = true;
    this.root.innerHTML = `
      <h2>环境 · 相机</h2>

      <div class="group">
        <div class="label-row">
          <span class="label">雾效强度</span>
          <span class="value" data-out="fog">0.34</span>
        </div>
        <input id="fog" type="range" min="0" max="1" step="0.01" aria-label="雾效强度" />
        <div class="scale"><span>0 · 通透</span><span>1 · 浓雾</span></div>
      </div>

      <div class="group">
        <div class="label-row">
          <span class="label">环境色温</span>
          <span class="value" data-out="temp">5600 K</span>
        </div>
        <input id="temp" type="range" min="${COLOR_TEMP_MIN}" max="${COLOR_TEMP_MAX}" step="50" aria-label="环境色温" style="--temp-gradient: ${kelvinGradientCss()}" />
        <div class="scale"><span>2000 K · 暖</span><span>8000 K · 冷</span></div>
        <p class="hint" data-out="temp-hint">白天在设定色温上叠加 -300K 的暖偏移（大气散射）</p>
      </div>

      <div class="group">
        <h3>昼夜</h3>
        <div class="day-night" role="group" aria-label="昼夜切换">
          <button type="button" data-mode="day" data-action="day"><span aria-hidden="true">☀</span> 白天</button>
          <button type="button" data-mode="night" data-action="night"><span aria-hidden="true">☾</span> 夜间</button>
        </div>
        <p class="hint">切换会同步天空、太阳/月亮、整体光照与环境光色温（夜间偏冷）。</p>
      </div>

      <div class="group">
        <h3>视景相机</h3>
        <div class="axis">
          <div class="head"><span class="nm">俯仰</span><span class="val" data-out="pitch">0°</span></div>
          <div class="track">
            <span class="end">-30</span>
            <input id="pitch" type="range" min="${PITCH_MIN}" max="${PITCH_MAX}" step="0.5" aria-label="相机俯仰" />
            <span class="end">+30</span>
          </div>
        </div>
        <div class="axis">
          <div class="head"><span class="nm">偏航</span><span class="val" data-out="yaw">0°</span></div>
          <div class="track">
            <span class="end">-60</span>
            <input id="yaw" type="range" min="${YAW_MIN}" max="${YAW_MAX}" step="0.5" aria-label="相机偏航" />
            <span class="end">+60</span>
          </div>
        </div>
        <div class="reset-row">
          <button type="button" data-action="reset-camera">回正视角</button>
        </div>
        <p class="hint">也可在画面上按住拖拽调整视角，滚轮微调俯仰。</p>
      </div>
    `;

    this.root.addEventListener('input', (event) => this.onInput(event));
    this.root.addEventListener('click', (event) => this.onClick(event));
  }

  private sync(): void {
    if (!this.#view) return;
    const v = this.#view;
    const fog = this.root.querySelector<HTMLInputElement>('#fog');
    if (fog) {
      if (fog.value !== String(v.fog)) fog.value = String(v.fog);
      fog.style.setProperty('--fill', `${v.fog * 100}%`);
    }
    const fogOut = this.root.querySelector<HTMLElement>('[data-out="fog"]');
    if (fogOut) fogOut.textContent = v.fog.toFixed(2);

    const temp = this.root.querySelector<HTMLInputElement>('#temp');
    if (temp && temp.value !== String(v.colorTemp)) temp.value = String(v.colorTemp);
    const tempOut = this.root.querySelector<HTMLElement>('[data-out="temp"]');
    if (tempOut) {
      const eff = effectiveColorTemp(v.colorTemp, v.night);
      const drift = eff - Math.round(v.colorTemp);
      tempOut.textContent = drift === 0 ? `${Math.round(v.colorTemp)} K` : `${Math.round(v.colorTemp)} K → ${eff} K`;
    }
    const tempHint = this.root.querySelector<HTMLElement>('[data-out="temp-hint"]');
    if (tempHint) {
      tempHint.textContent = v.night
        ? '夜间在设定色温上叠加 +1800K 的冷偏移（月光）'
        : '白天在设定色温上叠加 -300K 的暖偏移（大气散射）';
    }

    const pitch = this.root.querySelector<HTMLInputElement>('#pitch');
    if (pitch) pitch.value = String(v.camera.pitch);
    const yaw = this.root.querySelector<HTMLInputElement>('#yaw');
    if (yaw) yaw.value = String(v.camera.yaw);
    const pitchOut = this.root.querySelector<HTMLElement>('[data-out="pitch"]');
    if (pitchOut) pitchOut.textContent = `${v.camera.pitch > 0 ? '+' : ''}${v.camera.pitch.toFixed(1)}°`;
    const yawOut = this.root.querySelector<HTMLElement>('[data-out="yaw"]');
    if (yawOut) yawOut.textContent = `${v.camera.yaw > 0 ? '+' : ''}${v.camera.yaw.toFixed(1)}°`;

    for (const btn of Array.from(this.root.querySelectorAll<HTMLButtonElement>('[data-mode]'))) {
      const isNight = btn.dataset.mode === 'night';
      btn.setAttribute('aria-pressed', String(v.night === isNight));
    }
  }

  private onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.tagName !== 'INPUT') return;
    const value = Number(input.value);
    switch (input.id) {
      case 'fog': {
        input.style.setProperty('--fill', `${value * 100}%`);
        const out = this.root.querySelector<HTMLElement>('[data-out="fog"]');
        if (out) out.textContent = value.toFixed(2);
        this.emit<ControlChangeDetail>('control-change', { type: 'fog', value });
        break;
      }
      case 'temp': {
        const out = this.root.querySelector<HTMLElement>('[data-out="temp"]');
        if (out) {
          const eff = effectiveColorTemp(value, this.#view?.night ?? false);
          out.textContent = eff === Math.round(value) ? `${Math.round(value)} K` : `${Math.round(value)} K → ${eff} K`;
        }
        this.emit<ControlChangeDetail>('control-change', { type: 'color-temp', value });
        break;
      }
      case 'pitch': {
        const out = this.root.querySelector<HTMLElement>('[data-out="pitch"]');
        if (out) out.textContent = `${value > 0 ? '+' : ''}${value.toFixed(1)}°`;
        this.emit<ControlChangeDetail>('control-change', { type: 'pitch', value });
        break;
      }
      case 'yaw': {
        const out = this.root.querySelector<HTMLElement>('[data-out="yaw"]');
        if (out) out.textContent = `${value > 0 ? '+' : ''}${value.toFixed(1)}°`;
        this.emit<ControlChangeDetail>('control-change', { type: 'yaw', value });
        break;
      }
      default:
        break;
    }
  }

  private onClick(event: Event): void {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'day') this.emit<ControlChangeDetail>('control-change', { type: 'night', value: false });
    else if (action === 'night') this.emit<ControlChangeDetail>('control-change', { type: 'night', value: true });
    else if (action === 'reset-camera') this.emit<ControlChangeDetail>('control-change', { type: 'reset-camera' });
  }
}

customElements.define('rail-scene-controls', SceneControlsElement);

declare global {
  interface HTMLElementTagNameMap {
    'rail-scene-controls': SceneControlsElement;
  }
}
