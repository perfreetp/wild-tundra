import { MATERIAL_DEFS, WEATHER_DEFS } from './materials';
import {
  REFLECTANCE_MAX,
  REFLECTANCE_MIN,
  ROUGHNESS_MAX,
  ROUGHNESS_MIN,
  type MaterialId,
  type MaterialParamMap,
  type ScanConfig,
  type WeatherLevel,
} from './types';

export interface PanelCallbacks {
  onMaterialChange: (id: MaterialId, params: MaterialParamMap[MaterialId]) => void;
  onScanChange: (config: ScanConfig) => void;
  onWeatherChange: (weather: WeatherLevel) => void;
  onRescan: () => void;
  onExport: () => void;
  onPointSize: (size: number) => void;
  onToggleCloud: (visible: boolean) => void;
  onToggleAutoRotate: (enabled: boolean) => void;
}

const CHANNEL_OPTIONS = [16, 32, 64, 128];
const RESOLUTION_OPTIONS = [0.1, 0.2, 0.4, 0.8];
const RANGE_OPTIONS = [50, 100, 150, 200];

function section(title: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'panel-section';
  const h = document.createElement('h3');
  h.textContent = title;
  el.appendChild(h);
  return el;
}

function sliderRow(
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  onInput: (v: number) => void,
): { row: HTMLDivElement; valueLabel: HTMLSpanElement } {
  const row = document.createElement('div');
  row.className = 'slider-row';
  const head = document.createElement('div');
  head.className = 'slider-head';
  const name = document.createElement('span');
  name.textContent = label;
  const valueLabel = document.createElement('span');
  valueLabel.className = 'slider-value';
  valueLabel.textContent = value.toFixed(2);
  head.append(name, valueLabel);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    valueLabel.textContent = v.toFixed(2);
    onInput(v);
  });

  row.append(head, input);
  return { row, valueLabel };
}

function selectRow<T extends string | number>(
  label: string,
  options: ReadonlyArray<T>,
  value: T,
  onChange: (v: T) => void,
  format?: (v: T) => string,
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'select-row';
  const name = document.createElement('span');
  name.textContent = label;
  const select = document.createElement('select');
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = String(opt);
    o.textContent = format ? format(opt) : String(opt);
    if (opt === value) o.selected = true;
    select.appendChild(o);
  }
  select.addEventListener('change', () => {
    const raw = select.value;
    const v = (typeof value === 'number' ? parseFloat(raw) : raw) as T;
    onChange(v);
  });
  row.append(name, select);
  return row;
}

export class ControlPanel {
  readonly element: HTMLDivElement;
  private params: MaterialParamMap;
  private config: ScanConfig;
  private weather: WeatherLevel;
  private callbacks: PanelCallbacks;
  private statsEl: HTMLDivElement;
  private progressEl: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private rescanTimer: number | null = null;

  constructor(
    params: MaterialParamMap,
    config: ScanConfig,
    weather: WeatherLevel,
    callbacks: PanelCallbacks,
  ) {
    this.params = params;
    this.config = { ...config };
    this.weather = weather;
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'panel';
    this.element.appendChild(this.buildTitle());
    this.element.appendChild(this.buildMaterials());
    this.element.appendChild(this.buildScan());
    this.element.appendChild(this.buildWeather());
    this.element.appendChild(this.buildDisplay());
    const { wrap, bar } = this.buildProgress();
    this.progressEl = wrap;
    this.progressBar = bar;
    this.element.appendChild(wrap);
    this.statsEl = this.buildStats();
    this.element.appendChild(this.statsEl);
    this.element.appendChild(this.buildActions());
  }

  private buildTitle(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'panel-title';
    el.innerHTML = '<h2>激光雷达回波强度仿真</h2><p>TypeScript · three.js · three-mesh-bvh</p>';
    return el;
  }

  private buildMaterials(): HTMLDivElement {
    const sec = section('材质参数（反射率 / 粗糙度）');
    for (const def of MATERIAL_DEFS) {
      const block = document.createElement('div');
      block.className = 'material-block';
      const head = document.createElement('div');
      head.className = 'material-head';
      const dot = document.createElement('span');
      dot.className = 'material-dot';
      dot.style.background = `#${def.color.toString(16).padStart(6, '0')}`;
      const name = document.createElement('span');
      name.textContent = def.label;
      head.append(dot, name);

      const p = this.params[def.id];
      const refl = sliderRow(
        '反射率',
        REFLECTANCE_MIN,
        REFLECTANCE_MAX,
        0.01,
        p.reflectance,
        (v) => {
          p.reflectance = v;
          this.scheduleRescan();
          this.callbacks.onMaterialChange(def.id, p);
        },
      );
      const rough = sliderRow(
        '粗糙度',
        ROUGHNESS_MIN,
        ROUGHNESS_MAX,
        0.01,
        p.roughness,
        (v) => {
          p.roughness = v;
          this.scheduleRescan();
        },
      );
      block.append(head, refl.row, rough.row);
      sec.appendChild(block);
    }
    return sec;
  }

  private buildScan(): HTMLDivElement {
    const sec = section('扫描参数');
    sec.appendChild(
      selectRow('线束数', CHANNEL_OPTIONS, this.config.channels, (v) => {
        this.config.channels = v;
        this.callbacks.onScanChange({ ...this.config });
      }, (v) => `${v} 线`),
    );
    sec.appendChild(
      selectRow('水平角分辨率', RESOLUTION_OPTIONS, this.config.horizontalResolutionDeg, (v) => {
        this.config.horizontalResolutionDeg = v;
        this.callbacks.onScanChange({ ...this.config });
      }, (v) => `${v}°`),
    );
    sec.appendChild(
      selectRow('量程', RANGE_OPTIONS, this.config.maxRange, (v) => {
        this.config.maxRange = v;
        this.callbacks.onScanChange({ ...this.config });
      }, (v) => `${v} m`),
    );
    const info = document.createElement('p');
    info.className = 'hint';
    info.textContent = `垂直视场 +${this.config.vfovTopDeg}° / ${this.config.vfovBottomDeg}°，当前约 ${
      this.config.channels * Math.round(360 / this.config.horizontalResolutionDeg)
    } 条射线`;
    sec.appendChild(info);
    return sec;
  }

  private buildWeather(): HTMLDivElement {
    const sec = section('雨雾衰减');
    sec.appendChild(
      selectRow(
        '雾浓度档位',
        WEATHER_DEFS.map((w) => w.id),
        this.weather,
        (v) => {
          this.weather = v;
          this.callbacks.onWeatherChange(v);
        },
        (v) => WEATHER_DEFS.find((w) => w.id === v)?.label ?? String(v),
      ),
    );
    const info = document.createElement('p');
    info.className = 'hint';
    info.textContent = 'Beer–Lambert：T=exp(-σ·R)，并按透射率随机丢点，点云实时变稀';
    sec.appendChild(info);
    return sec;
  }

  private buildDisplay(): HTMLDivElement {
    const sec = section('显示');
    const size = sliderRow('点大小', 0.04, 0.4, 0.01, 0.12, (v) => {
      this.callbacks.onPointSize(v);
    });
    sec.appendChild(size.row);

    const cloudRow = document.createElement('label');
    cloudRow.className = 'check-row';
    const cloudCb = document.createElement('input');
    cloudCb.type = 'checkbox';
    cloudCb.checked = true;
    cloudCb.addEventListener('change', () => this.callbacks.onToggleCloud(cloudCb.checked));
    cloudRow.append(cloudCb, document.createTextNode('显示点云'));

    const rotRow = document.createElement('label');
    rotRow.className = 'check-row';
    const rotCb = document.createElement('input');
    rotCb.type = 'checkbox';
    rotCb.addEventListener('change', () => this.callbacks.onToggleAutoRotate(rotCb.checked));
    rotRow.append(rotCb, document.createTextNode('场景自动旋转'));

    sec.append(cloudRow, rotRow);
    return sec;
  }

  private buildProgress(): { wrap: HTMLDivElement; bar: HTMLDivElement } {
    const wrap = document.createElement('div');
    wrap.className = 'progress-wrap';
    wrap.hidden = true;
    const label = document.createElement('span');
    label.className = 'progress-label';
    label.textContent = '扫描中…';
    const track = document.createElement('div');
    track.className = 'progress-track';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    track.appendChild(bar);
    wrap.append(label, track);
    return { wrap, bar };
  }

  private buildStats(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'stats';
    return el;
  }

  private buildActions(): HTMLDivElement {
    const sec = section('操作');
    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    const rescan = document.createElement('button');
    rescan.textContent = '重新扫描';
    rescan.addEventListener('click', () => this.callbacks.onRescan());
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出点云 (.txt)';
    exportBtn.className = 'primary';
    exportBtn.addEventListener('click', () => this.callbacks.onExport());
    btnRow.append(rescan, exportBtn);
    sec.appendChild(btnRow);

    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML =
      '<span>强度色阶：</span>' +
      '<i style="background:linear-gradient(90deg,#0000ff,#00ffff,#00ff00,#ffff00,#ff0000)"></i>' +
      '<span>低 → 高　强回波：白色加亮</span>';
    sec.appendChild(legend);
    return sec;
  }

  /** 滑块连续拖动时做防抖，避免每个 input 事件都全量重扫 */
  private scheduleRescan(): void {
    if (this.rescanTimer !== null) clearTimeout(this.rescanTimer);
    this.rescanTimer = window.setTimeout(() => {
      this.rescanTimer = null;
      this.callbacks.onRescan();
    }, 120);
  }

  setProgress(fraction: number, active: boolean): void {
    this.progressEl.hidden = !active;
    if (active) {
      this.progressBar.style.width = `${Math.round(fraction * 100)}%`;
    }
  }

  setStats(stats: {
    rayCount: number;
    hitCount: number;
    fogDropped: number;
    outOfRange: number;
    elapsedMs: number;
    highlightCount: number;
  }): void {
    const density = stats.rayCount > 0
      ? ((stats.hitCount / stats.rayCount) * 100).toFixed(1)
      : '0.0';
    this.statsEl.innerHTML = `
      <h3>扫描统计</h3>
      <div class="stat-grid">
        <span>射线总数</span><b>${stats.rayCount.toLocaleString()}</b>
        <span>有效回波</span><b>${stats.hitCount.toLocaleString()}</b>
        <span>雾丢点</span><b>${stats.fogDropped.toLocaleString()}</b>
        <span>未命中/超程</span><b>${stats.outOfRange.toLocaleString()}</b>
        <span>强回波高亮</span><b>${stats.highlightCount.toLocaleString()}</b>
        <span>回波率</span><b>${density}%</b>
        <span>扫描耗时</span><b>${stats.elapsedMs.toFixed(0)} ms</b>
      </div>`;
  }
}
