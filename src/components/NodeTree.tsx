import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { NetworkNode } from '../types';

const TYPE_LABEL: Record<NetworkNode['type'], string> = {
  source: '热源',
  junction: '节点',
  building: '楼栋',
};

export default function NodeTree() {
  const network = useStore((s) => s.network);
  const results = useStore((s) => s.results);
  const side = useStore((s) => s.side);
  const colorMode = useStore((s) => s.colorMode);
  const affected = useStore((s) => s.affectedBuildings);
  const leaks = useStore((s) => s.leaks);
  const requestFocus = useStore((s) => s.requestFocusNode);
  const selectNode = useStore((s) => s.selectNode);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | NetworkNode['type']>('all');

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = network.nodes.filter((n) => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (q && !`${n.id} ${n.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const map: Record<NetworkNode['type'], NetworkNode[]> = {
      source: [],
      junction: [],
      building: [],
    };
    filtered.forEach((n) => map[n.type].push(n));
    return map;
  }, [network.nodes, filter, typeFilter]);

  const leakPipeSet = new Set(leaks.filter((l) => l.side === side).map((l) => l.pipeId));

  return (
    <aside className="node-tree panel">
      <div className="panel-title">
        节点树
        <span className="count">{network.nodes.length}</span>
      </div>
      <input
        className="search-input"
        placeholder="搜索节点名称 / ID"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="type-filter">
        {(['all', 'source', 'junction', 'building'] as const).map((t) => (
          <button
            key={t}
            className={`chip ${typeFilter === t ? 'active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? '全部' : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="tree-scroll">
        {(['source', 'junction', 'building'] as const).map((type) =>
          groups[type].length ? (
            <div key={type} className="tree-group">
              <div className="tree-group-title">
                {TYPE_LABEL[type]}（{groups[type].length}）
              </div>
              {groups[type].map((n) => {
                const p = results[side].nodePressure[n.id];
                const T = results[side].nodeTemp[n.id];
                const isAffected = affected.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`tree-item ${isAffected ? 'affected' : ''}`}
                    onClick={() => {
                      requestFocus(n.id);
                      selectNode(n.id);
                    }}
                    title={`${n.name} · DN${n.diameter}`}
                  >
                    <span className={`dot dot-${n.type}`} />
                    <div className="tree-item-main">
                      <div className="tree-item-name">
                        {n.name}
                        {isAffected && <span className="badge-danger">受影响</span>}
                      </div>
                      <div className="tree-item-meta">
                        {colorMode === 'pressure'
                          ? `P ${p?.toFixed(4) ?? '-'} MPa`
                          : `T ${T?.toFixed(1) ?? '-'} ℃`}
                        <span className="muted"> · DN{n.diameter}</span>
                        {n.type === 'building' && (
                          <span className="muted"> · {n.demand}m³/h</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null,
        )}
      </div>

      {leakPipeSet.size > 0 && (
        <div className="tree-footer">
          当前视图泄漏管段：{leakPipeSet.size} 条 · 受影响楼栋 {affected.size} 个
        </div>
      )}
    </aside>
  );
}
