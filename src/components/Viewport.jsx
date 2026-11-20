import { useEffect, useRef, useState } from 'react';
import { SceneManager } from '../three/SceneManager.js';
import { useStore } from '../state/store.js';
import { checkInterference } from '../kernel/interference.js';
import { BOOL_OPS } from '../kernel/primitives.js';

export default function Viewport() {
  const mountRef = useRef(null);
  const managerRef = useRef(null);
  const [dropMenu, setDropMenu] = useState(null); // { x, y, sourceId, targetId }
  const [dragGhost, setDragGhost] = useState(null);
  const [liveTransform, setLiveTransform] = useState(null);

  // 订阅视口需要的切片
  const tree = useStore((s) => s.tree);
  const geometryResults = useStore((s) => s.geometryResults);
  const selectedIds = useStore((s) => s.selectedIds);
  const dragBooleanMode = useStore((s) => s.dragBooleanMode);
  const recompute = useStore((s) => s.recompute);
  const interference = useStore((s) => s.interference);
  const createBoolean = useStore((s) => s.createBoolean);
  const setInterference = useStore((s) => s.setInterference);
  const clearInterference = useStore((s) => s.clearInterference);

  // 场景初始化（一次）
  useEffect(() => {
    const manager = new SceneManager(mountRef.current);
    managerRef.current = manager;
    manager.onDragBooleanStart = (st) => setDragGhost({ ...st });
    manager.onDragBooleanMove = (st) => setDragGhost({ ...st });
    manager.onDragBooleanEnd = () => setDragGhost(null);
    manager.onDropBoolean = (sourceId, targetId, x, y) => {
      const rect = mountRef.current.getBoundingClientRect();
      setDropMenu({ x: x - rect.left, y: y - rect.top, sourceId, targetId });
    };
    manager.onTransformPreview = (id, t) => setLiveTransform({ id, ...t });
    return () => manager.dispose();
  }, []);

  // 状态 -> 场景同步
  useEffect(() => {
    managerRef.current?.syncFromState({ tree, geometryResults, selectedIds, dragBooleanMode });
  }, [tree, geometryResults, selectedIds, dragBooleanMode]);

  // 干涉高亮同步
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    if (interference?.geometry) {
      manager.showInterference(interference.geometry);
    } else {
      manager.clearInterference();
    }
  }, [interference]);

  const runInterference = () => {
    if (selectedIds.length !== 2) return;
    const [a, b] = selectedIds;
    const result = checkInterference(geometryResults[a], geometryResults[b]);
    if (result.empty) {
      setInterference({ nodeIds: selectedIds, volume: 0, geometry: null, empty: true });
    } else {
      setInterference({ nodeIds: selectedIds, volume: result.volume, geometry: result.geometry, empty: false });
    }
  };

  const pickOp = (op) => {
    createBoolean(op, dropMenu.targetId, dropMenu.sourceId);
    setDropMenu(null);
  };

  const selectedNode = selectedIds.length === 1 ? tree.nodes[selectedIds[0]] : null;
  const shownTransform = liveTransform && selectedNode && liveTransform.id === selectedNode.id
    ? liveTransform
    : selectedNode?.transform;

  return (
    <div className="viewport-wrap">
      <div className="viewport-toolbar">
        <div className="seg">
          <button onClick={() => managerRef.current?.setTransformMode('translate')} title="移动 (W)">移动</button>
          <button onClick={() => managerRef.current?.setTransformMode('rotate')} title="旋转 (E)">旋转</button>
        </div>
        <label className={`switch ${dragBooleanMode ? 'on' : ''}`}>
          <input type="checkbox" checked={dragBooleanMode} onChange={() => useStore.getState().toggleDragBooleanMode()} />
          拖拽布尔模式
        </label>
        <button className="primary" disabled={selectedIds.length !== 2} onClick={runInterference}>
          干涉检查{selectedIds.length === 2 ? '' : '（选 2 个实体）'}
        </button>
        {interference && (
          <button onClick={clearInterference}>清除高亮</button>
        )}
        <div className="spacer" />
        {interference && (
          <div className={`interference-badge ${interference.empty ? 'ok' : 'hit'}`}>
            {interference.empty
              ? '无干涉：两实体不重叠'
              : `干涉体积：${interference.volume.toFixed(2)} mm³`}
          </div>
        )}
      </div>

      <div className="viewport" ref={mountRef}>
        {dragBooleanMode && (
          <div className="mode-hint">拖拽一个实体到另一个实体上，选择并集 / 差集 / 交集</div>
        )}
        {dragGhost && (
          <div
            className="drag-ghost"
            style={{ left: dragGhost.x + 14, top: dragGhost.y + 14 }}
          >
            {dragGhost.targetId ? '松开以选择布尔运算' : '拖到目标实体上…'}
          </div>
        )}
        {dropMenu && (
          <div className="drop-menu" style={{ left: dropMenu.x, top: dropMenu.y }}>
            <div className="drop-menu-title">选择布尔运算</div>
            {Object.entries(BOOL_OPS).map(([op, label]) => (
              <button key={op} onClick={() => pickOp(op)}>
                {label}
                {op === 'difference' && <span className="hint">（目标 − 被拖实体）</span>}
              </button>
            ))}
            <button className="ghost" onClick={() => setDropMenu(null)}>取消</button>
          </div>
        )}
        {recompute.visible && (
          <div className="progress-overlay">
            <div className="progress-card">
              <div>正在重算布尔链… {recompute.done}/{recompute.total}</div>
              <div className="progress-bar">
                <div style={{ width: `${(recompute.done / recompute.total) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedNode && shownTransform && (
        <div className="transform-readout">
          <span>位置 X {shownTransform.position[0].toFixed(1)} / Y {shownTransform.position[1].toFixed(1)} / Z {shownTransform.position[2].toFixed(1)} mm</span>
          <span>旋转 X {shownTransform.rotation[0].toFixed(1)}° / Y {shownTransform.rotation[1].toFixed(1)}° / Z {shownTransform.rotation[2].toFixed(1)}°</span>
          <span className="muted">松手后自动按依赖顺序重算下游</span>
        </div>
      )}
    </div>
  );
}
