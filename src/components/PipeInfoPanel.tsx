import { useMemo } from 'react';
import { useStore } from '../store';
import { nodePositionMap, samplePipeProfile } from '../lib/solver';
import type { Side } from '../types';

function LineChart({
  samples,
  field,
  unit,
  color,
}: {
  samples: { distance: number; pressure: number; temp: number }[];
  field: 'pressure' | 'temp';
  unit: string;
  color: string;
}) {
  const W = 380;
  const H = 170;
  const padL = 46;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const { path, min, max, ticks } = useMemo(() => {
    const vals = samples.map((s) => s[field]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1e-6;
    const x = (i: number) =>
      padL + (i / Math.max(1, samples.length - 1)) * (W - padL - padR);
    const y = (v: number) =>
      padT + (1 - (v - min) / span) * (H - padT - padB);
    const path = samples
      .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s[field]).toFixed(1)}`)
      .join(' ');
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => ({
      y: padT + k * (H - padT - padB),
      v: max - k * span,
    }));
    return { path, min, max, ticks };
  }, [samples, field]);

  const leaks = useStore((s) => s.leaks);
  const selection = useStore((s) => s.selection);
  const leakMarks = useMemo(() => {
    if (!selection) return [];
    const totalD = samples[samples.length - 1]?.distance ?? 0;
    return leaks
      .filter((l) => l.pipeId === selection.pipeId && l.side === selection.side)
      .map((l) => ({
        x: padL + l.t * (W - padL - padR),
        d: l.t * totalD,
      }));
  }, [leaks, selection, samples]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="profile-svg">
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={t.y}
            y2={t.y}
            stroke="#22344f"
            strokeWidth={1}
          />
          <text x={padL - 5} y={t.y + 3} textAnchor="end" className="axis-text">
            {t.v.toFixed(field === 'pressure' ? 4 : 2)}
          </text>
        </g>
      ))}
      <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="#3a557a" />
      <line
        x1={padL}
        x2={W - padR}
        y1={H - padB}
        y2={H - padB}
        stroke="#3a557a"
      />
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      {leakMarks.map((m, i) => (
        <g key={i}>
          <line
            x1={m.x}
            x2={m.x}
            y1={padT}
            y2={H - padB}
            stroke="#ff5a4e"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <text x={m.x} y={padT + 9} textAnchor="middle" className="leak-text">
            泄漏 {m.d.toFixed(1)}m
          </text>
        </g>
      ))}
      <text x={(W + padL) / 2} y={H - 6} textAnchor="middle" className="axis-text">
        沿程距离 (m) · 0.5m 采样 · 共 {samples.length} 点
      </text>
      <text x={10} y={padT + 2} className="axis-text">
        {unit} [{min.toFixed(4)} ~ {max.toFixed(4)}]
      </text>
    </svg>
  );
}

export default function PipeInfoPanel() {
  const selection = useStore((s) => s.selection);
  const network = useStore((s) => s.network);
  const results = useStore((s) => s.results);
  const leaks = useStore((s) => s.leaks);
  const selectPipe = useStore((s) => s.selectPipe);
  const addLeak = useStore((s) => s.addLeak);
  const removeLeak = useStore((s) => s.removeLeak);

  const data = useMemo(() => {
    if (!selection) return null;
    const side: Side = selection.side;
    const pipes =
      side === 'supply' ? network.supplyPipes : network.returnPipes;
    const pipe = pipes.find((p) => p.id === selection.pipeId);
    if (!pipe) return null;
    const result = results[side];
    const pr = result.pipes[pipe.id];
    const fromNode = network.nodes.find((n) => n.id === pipe.from)!;
    const toNode = network.nodes.find((n) => n.id === pipe.to)!;
    const samples = samplePipeProfile(
      result,
      pipe,
      nodePositionMap(network),
      0.5,
    );
    return { side, pipe, pr, fromNode, toNode, samples };
  }, [selection, network, results]);

  if (!selection || !data) return null;
  const { side, pipe, pr, fromNode, toNode, samples } = data;
  const pipeLeaks = leaks.filter(
    (l) => l.pipeId === pipe.id && l.side === side,
  );

  return (
    <section className="pipe-panel panel">
      <div className="panel-title">
        管段详情 · {pipe.name}
        <button className="close-x" onClick={() => selectPipe(null)}>
          ×
        </button>
      </div>

      <div className="kv-grid">
        <div className="kv">
          <span>系统</span>
          <b>{side === 'supply' ? '供水管网' : '回水管网'}</b>
        </div>
        <div className="kv">
          <span>口径 / 长度</span>
          <b>DN{pipe.diameter} / {pr.length.toFixed(1)}m</b>
        </div>
        <div className="kv">
          <span>流量</span>
          <b>{pr.flow.toFixed(1)} m³/h</b>
        </div>
        <div className="kv">
          <span>流速</span>
          <b>{pr.velocity.toFixed(2)} m/s</b>
        </div>
        <div className={`kv ${pr.overThreshold ? 'warn' : ''}`}>
          <span>比摩阻</span>
          <b>
            {pr.lossPerMeter.toFixed(1)} Pa/m
            {pr.overThreshold && <em className="tag-warn">超阈值</em>}
          </b>
        </div>
        <div className="kv">
          <span>总压降</span>
          <b>{(Math.abs(pr.fromPressure - pr.toPressure) * 1000).toFixed(2)} kPa</b>
        </div>
      </div>

      <div className="endpoints">
        {[
          { node: fromNode, key: 'from' as const },
          { node: toNode, key: 'to' as const },
        ].map(({ node, key }) => (
          <div className="endpoint" key={key}>
            <div className="ep-title">
              {key === 'from' ? '起点' : '终点'} · {node.name}
            </div>
            <div className="ep-row">
              压力 <b>{results[side].nodePressure[node.id]?.toFixed(4)}</b> MPa
            </div>
            <div className="ep-row">
              温度 <b>{results[side].nodeTemp[node.id]?.toFixed(2)}</b> ℃
            </div>
            <div className="ep-row muted">
              坐标 ({node.x}, {node.y}, {node.z}) · DN{node.diameter}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-block">
        <div className="chart-title">沿程压降曲线（0.5m 采样）</div>
        <LineChart samples={samples} field="pressure" unit="MPa" color="#4fc3f7" />
      </div>
      <div className="chart-block">
        <div className="chart-title">沿程温度曲线</div>
        <LineChart samples={samples} field="temp" unit="℃" color="#ffb74d" />
      </div>

      <div className="leak-actions">
        <button className="btn primary small" onClick={() => addLeak(pipe.id, side)}>
          ＋ 在此管段布置泄漏点
        </button>
        {pipeLeaks.map((lk) => (
          <span className="leak-chip" key={lk.id}>
            {lk.id} · t={(lk.t * 100).toFixed(0)}% · R{lk.radius}m
            <button onClick={() => removeLeak(lk.id)}>×</button>
          </span>
        ))}
      </div>
    </section>
  );
}
