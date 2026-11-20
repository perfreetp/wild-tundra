import { useEffect, useRef } from "react";

export interface LightAngle {
  azimuth: number;
  elevation: number;
}

interface PreviewPanelProps {
  hostRef: React.RefObject<HTMLDivElement | null>;
  light: LightAngle;
  onLightChange: (light: LightAngle) => void;
  roughness: number;
  onRoughnessChange: (value: number) => void;
  exposure: number;
  onExposureChange: (value: number) => void;
  ready: boolean;
  statusLine: string;
  compileMs: number;
  compiling: boolean;
  sampleText: string;
}

const SIZE = 132;

export function PreviewPanel(props: PreviewPanelProps) {
  const {
    hostRef,
    light,
    onLightChange,
    roughness,
    onRoughnessChange,
    exposure,
    onExposureChange,
    ready,
    statusLine,
    compileMs,
    compiling,
    sampleText,
  } = props;

  const lightDialRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<"light" | "rough" | null>(null);
  const latest = useRef({ light, onLightChange, roughness, onRoughnessChange });
  latest.current = { light, onLightChange, roughness, onRoughnessChange };

  // 光源：在圆盘上拖动，方位角绕盘心，仰角为距盘心的距离
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const mode = dragging.current;
      if (!mode) return;
      if (mode === "light") {
        const rect = lightDialRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const radius = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2 - 10));
        const azimuth = Math.atan2(dy, dx);
        const elevation = (1 - radius) * (Math.PI / 2);
        latest.current.onLightChange({ azimuth, elevation });
      }
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const radiusRatio = 1 - light.elevation / (Math.PI / 2);
  const knobX = Math.cos(light.azimuth) * radiusRatio * (SIZE / 2 - 10);
  const knobY = Math.sin(light.azimuth) * radiusRatio * (SIZE / 2 - 10);

  return (
    <section className="preview-panel" data-testid="preview-panel">
      <div className="preview-canvas-wrap">
        <div className="preview-canvas-layer" ref={hostRef} data-testid="preview-host" data-preview-host="true" />
        <div className="preview-labels">
          <span>球体 · 高光走向</span>
          <span>平面 · 材质铺展</span>
        </div>
        {!ready ? <div className="preview-overlay">正在初始化 WebGL 预览…</div> : null}
        <div className="preview-status" data-testid="preview-status">
          <span className={compiling ? "dot compiling" : "dot"} />
          {statusLine}
          <span className="preview-ms">{compileMs > 0 ? `${compileMs.toFixed(0)} ms` : "—"}</span>
        </div>
      </div>

      <div className="preview-controls">
        <div className="control-block">
          <span className="control-label">光源角度</span>
          <div className="light-dial-row">
            <div
              ref={lightDialRef}
              className="light-dial"
              style={{ width: SIZE, height: SIZE }}
              onPointerDown={(event) => {
                dragging.current = "light";
                const rect = lightDialRef.current?.getBoundingClientRect();
                if (!rect) return;
                const dx = event.clientX - (rect.left + rect.width / 2);
                const dy = event.clientY - (rect.top + rect.height / 2);
                const radius = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2 - 10));
                latest.current.onLightChange({
                  azimuth: Math.atan2(dy, dx),
                  elevation: (1 - radius) * (Math.PI / 2),
                });
              }}
              data-testid="light-dial"
            >
              <span className="dial-ring" />
              <span className="dial-cross-h" />
              <span className="dial-cross-v" />
              <span className="dial-knob" style={{ left: SIZE / 2 + knobX, top: SIZE / 2 + knobY }} />
              <span className="dial-center" />
            </div>
            <div className="dial-readout">
              <span>
                方位 <b data-testid="light-azimuth">{Math.round(normalizeDegrees((light.azimuth * 180) / Math.PI))}°</b>
              </span>
              <span>
                仰角 <b data-testid="light-elevation">{Math.round((light.elevation * 180) / Math.PI)}°</b>
              </span>
              <p className="muted small">在圆盘上拖动，预览里高光位置随之移动。</p>
            </div>
          </div>
        </div>

        <div className="control-block">
          <label className="control-slider" title="预览专用的粗糙度倍率：叠加在图里“粗糙度”输入之上，不写进节点参数">
            <span className="control-label">
              粗糙度倍率 <b data-testid="roughness-value">{roughness.toFixed(2)}</b>
            </span>
            <input
              type="range"
              min={0.2}
              max={2.2}
              step={0.01}
              value={roughness}
              onChange={(event) => onRoughnessChange(Number(event.target.value))}
              onPointerDown={() => {
                dragging.current = "rough";
              }}
              onPointerUp={() => {
                dragging.current = null;
              }}
              data-testid="roughness-slider"
            />
          </label>
          <label className="control-slider">
            <span className="control-label">
              曝光 <b>{exposure.toFixed(2)}</b>
            </span>
            <input
              type="range"
              min={0.4}
              max={2.2}
              step={0.01}
              value={exposure}
              onChange={(event) => onExposureChange(Number(event.target.value))}
              data-testid="exposure-slider"
            />
          </label>
        </div>
      </div>
      <div className="preview-sample muted small" data-testid="preview-sample">
        {sampleText}
      </div>
    </section>
  );
}

function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}
