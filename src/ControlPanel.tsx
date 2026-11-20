import type { ClipState } from './Viewport';

interface ControlPanelProps {
  dataMin: number;
  dataMax: number;
  windowWidth: number;
  windowLevel: number;
  thresholdMin: number;
  thresholdMax: number;
  opacity: number;
  clip: ClipState;
  canExport: boolean;
  onWindowChange: (width: number, level: number) => void;
  onThresholdChange: (min: number, max: number) => void;
  onOpacityChange: (o: number) => void;
  onClipChange: (c: ClipState) => void;
  onImportDicom: (files: FileList) => void;
  onDemo: () => void;
  onExportSTL: () => void;
  onExportGLB: () => void;
}

function Slider(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const { label, min, max, step = 1, value, format, onChange } = props;
  return (
    <label className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{format ? format(value) : value}</span>
    </label>
  );
}

const CLIP_AXES = [
  { key: 'z' as const, name: '横断面 (轴位)' },
  { key: 'y' as const, name: '冠状面' },
  { key: 'x' as const, name: '矢状面' },
];

export function ControlPanel(p: ControlPanelProps) {
  const range = Math.max(1, p.dataMax - p.dataMin);
  return (
    <div className="control-panel">
      <section>
        <h3>数据</h3>
        <div className="btn-row">
          <label className="btn file-btn">
            导入 DICOM 序列
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) p.onImportDicom(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <button className="btn" onClick={p.onDemo}>演示数据</button>
        </div>
      </section>

      <section>
        <h3>窗宽 / 窗位</h3>
        <Slider label="窗宽" min={1} max={range} value={p.windowWidth}
          onChange={(w) => p.onWindowChange(w, p.windowLevel)} />
        <Slider label="窗位" min={p.dataMin} max={p.dataMax} value={p.windowLevel}
          onChange={(l) => p.onWindowChange(p.windowWidth, l)} />
      </section>

      <section>
        <h3>灰度阈值带（重建蒙版）</h3>
        <Slider label="下限" min={p.dataMin} max={p.dataMax} value={p.thresholdMin}
          onChange={(v) => p.onThresholdChange(Math.min(v, p.thresholdMax), p.thresholdMax)} />
        <Slider label="上限" min={p.dataMin} max={p.dataMax} value={p.thresholdMax}
          onChange={(v) => p.onThresholdChange(p.thresholdMin, Math.max(v, p.thresholdMin))} />
      </section>

      <section>
        <h3>外观</h3>
        <Slider label="不透明度" min={0.05} max={1} step={0.01} value={p.opacity}
          format={(v) => v.toFixed(2)} onChange={p.onOpacityChange} />
      </section>

      <section>
        <h3>剖切平面</h3>
        {CLIP_AXES.map(({ key, name }) => (
          <div key={key} className="clip-row">
            <label>
              <input
                type="checkbox"
                checked={p.clip[key].enabled}
                onChange={(e) =>
                  p.onClipChange({ ...p.clip, [key]: { ...p.clip[key], enabled: e.target.checked } })
                }
              />
              {name}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(p.clip[key].pos * 100)}
              disabled={!p.clip[key].enabled}
              onChange={(e) =>
                p.onClipChange({ ...p.clip, [key]: { ...p.clip[key], pos: Number(e.target.value) / 100 } })
              }
            />
          </div>
        ))}
      </section>

      <section>
        <h3>导出</h3>
        <div className="btn-row">
          <button className="btn" disabled={!p.canExport} onClick={p.onExportSTL}>导出 STL</button>
          <button className="btn" disabled={!p.canExport} onClick={p.onExportGLB}>导出 GLB</button>
        </div>
      </section>
    </div>
  );
}
