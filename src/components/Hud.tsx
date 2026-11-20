import { useAppStore } from '../store/appStore';
import { VIEW_IDS, VIEW_LABELS } from '../engine/types';

/** 运行时 HUD：绘制调用预算、裁剪统计、FPS、里程 */
export function Hud() {
  const stats = useAppStore((s) => s.stats);
  const tab = useAppStore((s) => s.tab);
  const routeProgress = useAppStore((s) => s.routeProgress);
  const routeLength = useAppStore((s) => s.routeLength);

  return (
    <div className="hud">
      <div className={`hud-card budget ${stats?.overBudget ? 'over' : 'ok'}`}>
        <span className="hud-label">
          绘制调用{tab === 'triple' ? '（三屏合计 / 上限 200）' : '（上限 200）'}
        </span>
        <strong className="hud-big">
          {stats ? stats.drawCalls : '—'}
          <small>/200</small>
        </strong>
        {stats?.overBudget && <span className="budget-warn">超预算，已自动收窄视距</span>}
      </div>

      <div className="hud-card">
        <span className="hud-label">可见分块</span>
        <strong>
          {stats ? `${stats.visibleChunks} / ${stats.totalChunks}` : '—'}
        </strong>
        <span className="hud-sub">遮挡剔除 {stats?.occlusionCulled ?? 0}</span>
      </div>

      <div className="hud-card">
        <span className="hud-label">三角形</span>
        <strong>{stats ? stats.triangles.toLocaleString() : '—'}</strong>
        <span className="hud-sub">{stats?.fps ?? '—'} FPS</span>
      </div>

      <div className="hud-card">
        <span className="hud-label">里程</span>
        <strong>
          {routeProgress.toFixed(0)}
          <small>/{(routeLength || 0).toFixed(0)} m</small>
        </strong>
      </div>

      {tab === 'triple' && (
        <div className="hud-card view-legend">
          {VIEW_IDS.map((id, i) => (
            <span key={id} className="legend-item">
              <i>{i + 1}</i> {VIEW_LABELS[id]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
