import { useStore } from '../state/store.js';
import {
  BALL_RADIUS_MIN,
  BALL_RADIUS_MAX,
  TUBE_OUTER_DIAMETERS,
  TUBE_WALL_STEP,
  TUBE_WALL_MIN,
  BLOCK_DIRECTIONS,
  PRIMITIVE_TYPES,
  BOOL_OPS,
} from '../kernel/primitives.js';

export default function ParamPanel() {
  const addPrimitive = useStore((s) => s.addPrimitive);
  const selectedIds = useStore((s) => s.selectedIds);
  const tree = useStore((s) => s.tree);
  const updateParams = useStore((s) => s.updateParams);
  const updateTransform = useStore((s) => s.updateTransform);
  const geometryResults = useStore((s) => s.geometryResults);
  const recompute = useStore((s) => s.recompute);

  const node = selectedIds.length === 1 ? tree.nodes[selectedIds[0]] : null;
  const result = node ? geometryResults[node.id] : null;

  return (
    <aside className="param-panel">
      <section>
        <h3>生成基元</h3>
        <div className="primitive-buttons">
          <button onClick={() => addPrimitive('ball')}>＋ 球节点</button>
          <button onClick={() => addPrimitive('tube')}>＋ 圆管柱</button>
          <button onClick={() => addPrimitive('block')}>＋ 连接块</button>
        </div>
        <p className="tip">
          球节点半径 {BALL_RADIUS_MIN}–{BALL_RADIUS_MAX}mm；圆管柱 {TUBE_OUTER_DIAMETERS.length} 档外径、
          壁厚 {TUBE_WALL_STEP}mm 步进；连接块按 6 个空间方向伸出。
        </p>
      </section>

      {!node && (
        <section className="empty-hint">
          <p>未选中节点。</p>
          <p>先在上方生成基元，或在视口 / 历史树中点选一个节点编辑参数。</p>
        </section>
      )}

      {node && (
        <>
          <section>
            <h3>
              {node.kind === 'primitive' ? PRIMITIVE_TYPES[node.type] : BOOL_OPS[node.params.op] ?? '布尔节点'}
              <span className="badge">{node.kind === 'primitive' ? '基元' : '运算'}</span>
            </h3>
            {result?.error && <div className="error-box">求值失败：{result.error}</div>}
            {!result?.error && result && (
              <div className="stat-grid">
                <div><label>体积</label><strong>{result.volume.toFixed(1)}</strong><em>mm³</em></div>
                <div><label>版本</label><strong>v{node.version}</strong></div>
              </div>
            )}
          </section>

          {node.kind === 'primitive' && node.type === 'ball' && (
            <section>
              <h4>球节点参数</h4>
              <RangeRow
                label="半径"
                value={node.params.radius}
                min={BALL_RADIUS_MIN}
                max={BALL_RADIUS_MAX}
                step={1}
                unit="mm"
                onChange={(v) => updateParams(node.id, { radius: v })}
              />
            </section>
          )}

          {node.kind === 'primitive' && node.type === 'tube' && (
            <section>
              <h4>圆管柱参数</h4>
              <label className="field">
                <span>外径（6 档）</span>
                <select
                  value={node.params.outerDiameter}
                  onChange={(e) => updateParams(node.id, { outerDiameter: Number(e.target.value) })}
                >
                  {TUBE_OUTER_DIAMETERS.map((d) => (
                    <option key={d} value={d}>Ø{d} mm</option>
                  ))}
                </select>
              </label>
              <RangeRow
                label="壁厚"
                value={node.params.wall}
                min={TUBE_WALL_MIN}
                max={node.params.outerDiameter / 2 - 1}
                step={TUBE_WALL_STEP}
                unit="mm"
                onChange={(v) => updateParams(node.id, { wall: v })}
              />
              <RangeRow
                label="管长"
                value={node.params.length}
                min={20}
                max={400}
                step={5}
                unit="mm"
                onChange={(v) => updateParams(node.id, { length: v })}
              />
              <p className="tip">管体沿局部 +Z 轴生成，可用旋转变换调整朝向。</p>
            </section>
          )}

          {node.kind === 'primitive' && node.type === 'block' && (
            <section>
              <h4>连接块参数</h4>
              <RangeRow label="中心块尺寸" value={node.params.size} min={10} max={80} step={2} unit="mm"
                onChange={(v) => updateParams(node.id, { size: v })} />
              <RangeRow label="臂截面尺寸" value={node.params.armSize} min={4} max={40} step={2} unit="mm"
                onChange={(v) => updateParams(node.id, { armSize: v })} />
              <RangeRow label="臂伸出长度" value={node.params.armLength} min={0} max={160} step={5} unit="mm"
                onChange={(v) => updateParams(node.id, { armLength: v })} />
              <div className="field">
                <span>伸出方向（6 向勾选）</span>
                <div className="dir-grid">
                  {BLOCK_DIRECTIONS.map((d) => {
                    const checked = node.params.dirs.includes(d.key);
                    return (
                      <label key={d.key} className={`dir-check ${checked ? 'on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const dirs = checked
                              ? node.params.dirs.filter((x) => x !== d.key)
                              : [...node.params.dirs, d.key];
                            updateParams(node.id, { dirs });
                          }}
                        />
                        {d.key}
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {node.kind === 'operation' && (
            <section>
              <h4>布尔运算类型</h4>
              <label className="field">
                <span>运算</span>
                <select
                  value={node.params.op}
                  onChange={(e) => updateParams(node.id, { op: e.target.value })}
                >
                  {Object.entries(BOOL_OPS).map(([op, label]) => (
                    <option key={op} value={op}>{label}</option>
                  ))}
                </select>
              </label>
              <p className="tip">
                差集按子节点顺序：第一个子实体减去其余子实体。可在历史树中重排子节点顺序。
              </p>
            </section>
          )}

          <TransformEditor node={node} onCommit={(patch) => updateTransform(node.id, patch)} />
        </>
      )}

      <section className="recompute-foot">
        {recompute.active ? (
          <span className="live-dot">重算中 {recompute.done}/{recompute.total}
            {recompute.visible ? '（耗时较长，已显示进度）' : ''}
          </span>
        ) : recompute.elapsedMs ? (
          <span className="muted">上次重算耗时 {recompute.elapsedMs.toFixed(0)} ms（超 800ms 显示进度条）</span>
        ) : (
          <span className="muted">参数改动将按依赖顺序重算下游（最多 {12} 级布尔链）</span>
        )}
      </section>
    </aside>
  );
}

function RangeRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <label className="field range-field">
      <span>
        {label}
        <strong>{value}{unit ? ` ${unit}` : ''}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        className="num"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TransformEditor({ node, onCommit }) {
  const t = node.transform;
  const setAxis = (kind, axis, val) => {
    const next = { [kind]: t[kind].map((v, i) => (i === axis ? Number(val) || 0 : v)) };
    onCommit(next);
  };
  return (
    <section>
      <h4>位置 / 旋转</h4>
      <div className="transform-grid">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <label key={`p${axis}`} className="field compact">
            <span>位置 {axis} (mm)</span>
            <input type="number" step={1} value={t.position[i]}
              onChange={(e) => setAxis('position', i, e.target.value)} />
          </label>
        ))}
        {['X', 'Y', 'Z'].map((axis, i) => (
          <label key={`r${axis}`} className="field compact">
            <span>旋转 {axis} (°)</span>
            <input type="number" step={5} value={t.rotation[i]}
              onChange={(e) => setAxis('rotation', i, e.target.value)} />
          </label>
        ))}
      </div>
    </section>
  );
}
