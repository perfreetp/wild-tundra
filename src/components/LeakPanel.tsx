import { useStore } from '../store';

/** 泄漏点管理：半径场调节、定位、删除；受影响楼栋清单 */
export default function LeakPanel() {
  const leaks = useStore((s) => s.leaks);
  const network = useStore((s) => s.network);
  const updateLeak = useStore((s) => s.updateLeak);
  const removeLeak = useStore((s) => s.removeLeak);
  const affected = useStore((s) => s.affectedBuildings);
  const requestFocusNode = useStore((s) => s.requestFocusNode);
  const selectPipe = useStore((s) => s.selectPipe);

  const nodeName = (id: string) =>
    network.nodes.find((n) => n.id === id)?.name ?? id;

  return (
    <aside className="leak-panel panel">
      <div className="panel-title">
        泄漏点半径场
        <span className="count">{leaks.length}</span>
      </div>
      {!leaks.length && (
        <div className="empty-tip">
          点选管段后可布置泄漏点，或直接在三维视图中拖动红色泄漏标记
        </div>
      )}
      <div className="leak-list">
        {leaks.map((lk) => (
          <div className="leak-card" key={lk.id}>
            <div className="leak-card-head">
              <b>{lk.id}</b>
              <span className="muted">
                {lk.side === 'supply' ? '供水' : '回水'} · {lk.pipeId}
              </span>
              <button
                className="link-btn"
                onClick={() =>
                  selectPipe({ pipeId: lk.pipeId, side: lk.side })
                }
              >
                查看管段
              </button>
            </div>
            <div className="leak-row">
              位置 t
              <input
                type="range"
                min={0.02}
                max={0.98}
                step={0.01}
                value={lk.t}
                onChange={(e) =>
                  updateLeak(lk.id, { t: Number(e.target.value) })
                }
              />
              <b>{(lk.t * 100).toFixed(0)}%</b>
            </div>
            <div className="leak-row">
              半径 R
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={lk.radius}
                onChange={(e) =>
                  updateLeak(lk.id, { radius: Number(e.target.value) })
                }
              />
              <b>{lk.radius}m</b>
            </div>
            <button
              className="btn danger small"
              onClick={() => removeLeak(lk.id)}
            >
              删除泄漏点
            </button>
          </div>
        ))}
      </div>

      <div className="affected-block">
        <div className="threshold-title">
          受影响楼栋挂点
          <span className={affected.size ? 'badge-danger' : 'badge-ok'}>
            {affected.size} 个
          </span>
        </div>
        <div className="affected-list">
          {[...affected].map((id) => (
            <button
              key={id}
              className="affected-chip"
              onClick={() => requestFocusNode(id)}
            >
              {nodeName(id)}
            </button>
          ))}
          {!affected.size && <span className="muted">暂无受影响楼栋</span>}
        </div>
      </div>
    </aside>
  );
}
