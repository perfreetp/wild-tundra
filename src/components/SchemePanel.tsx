import { useStore } from '../store';
import { BAND_COUNT } from '../lib/scheme';
import type { ColorMode } from '../types';

/** 右侧色带方案编辑 + 图例 */
export default function SchemePanel() {
  const scheme = useStore((s) => s.scheme);
  const colorMode = useStore((s) => s.colorMode);
  const updateBand = useStore((s) => s.updateBand);
  const updateThreshold = useStore((s) => s.updateThreshold);
  const results = useStore((s) => s.results);
  const side = useStore((s) => s.side);

  const bands =
    colorMode === 'pressure' ? scheme.pressureBands : scheme.temperatureBands;
  const unit = colorMode === 'pressure' ? 'MPa' : '℃';

  const overCount = Object.values(results[side].pipes).filter(
    (p) => p.overThreshold,
  ).length;

  return (
    <aside className="scheme-panel panel">
      <div className="panel-title">
        8 级色带 · {colorMode === 'pressure' ? '压力' : '温度'}档位
      </div>
      <div className="band-list">
        {Array.from({ length: BAND_COUNT }).map((_, i) => {
          const band = bands[i] ?? bands[bands.length - 1];
          return (
            <div className="band-row" key={i}>
              <span className="band-level">{i + 1}</span>
              <input
                type="color"
                value={band.color}
                onChange={(e) =>
                  updateBand(colorMode as ColorMode, i, { color: e.target.value })
                }
              />
              <span className="band-ge" style={{ background: band.color }} />
              <label className="band-min">
                ≥
                <input
                  type="number"
                  step={colorMode === 'pressure' ? 0.05 : 5}
                  value={band.min}
                  onChange={(e) =>
                    updateBand(colorMode as ColorMode, i, {
                      min: Number(e.target.value),
                    })
                  }
                />
                {unit}
              </label>
            </div>
          );
        })}
      </div>

      <div className="threshold-block">
        <div className="threshold-title">
          比摩阻超阈值描边
          <span className={overCount ? 'badge-danger' : 'badge-ok'}>
            {overCount} 管段超限
          </span>
        </div>
        <div className="threshold-row">
          <input
            type="range"
            min={30}
            max={400}
            step={5}
            value={scheme.lossThreshold}
            onChange={(e) => updateThreshold(Number(e.target.value))}
          />
          <b>{scheme.lossThreshold} Pa/m</b>
        </div>
      </div>
    </aside>
  );
}
