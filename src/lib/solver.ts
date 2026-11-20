import type {
  LeakPoint,
  NetworkData,
  NetworkNode,
  Pipe,
  PipeResult,
  PipeSegment,
  Side,
  SolverResult,
} from '../types';
import { pipePoints, pointAt, polylineLength } from './geometry';

// ---- 水力计算常量（热媒水 ~70℃ 钢制管道，简化工程模型） ----
const RHO = 977.8; // 密度 kg/m³
const NU = 0.41e-6; // 运动粘度 m²/s
const ROUGHNESS = 0.0005; // 管壁当量粗糙度 m
const SUPPLY_ROOT_P = 1.0; // MPa
const SUPPLY_ROOT_T = 110; // ℃
const RETURN_ROOT_P = 0.25; // MPa
const BUILDING_RETURN_T = 60; // ℃

interface GNode {
  id: string;
  demand: number; // m³/h
  isLeak: boolean;
}

interface GPipe {
  id: string;
  originalId: string;
  from: string;
  to: string;
  diameter: number; // mm
  length: number; // m
  t0: number; // 在原管段上的比例区间
  t1: number;
}

/** Swamee-Jain 显式摩擦因子 */
function frictionFactor(re: number, dM: number): number {
  if (re < 1) return 0.03;
  const a = ROUGHNESS / (3.7 * dM);
  const b = 5.74 / Math.pow(re, 0.9);
  return 0.25 / Math.pow(Math.log10(a + b), 2);
}

/** 管段比摩阻 Pa/m 与流速 m/s；q 为 m³/h */
function hydraulics(diameterMm: number, qM3h: number, length: number) {
  const d = diameterMm / 1000;
  const area = Math.PI * (d * d) / 4;
  const q = qM3h / 3600;
  const v = area > 0 ? q / area : 0;
  const re = (v * d) / NU;
  const f = frictionFactor(re, d);
  // dp = f · L/D · ρv²/2
  const lossPerMeter = (f * RHO * v * v) / (2 * d);
  const dpPa = lossPerMeter * length;
  return { velocity: v, lossPerMeter, dpMPa: dpPa / 1e6 };
}

/** 温降简化模型 ℃：沿程散热，小流量温降更大 */
function tempDrop(qM3h: number, length: number): number {
  const q = Math.max(qM3h, 1);
  return 0.002 * length * Math.pow(30 / q, 0.25);
}

/** 泄漏附加出流 m³/h，按影响半径折算 */
export function leakFlow(radiusM: number): number {
  return 0.5 * radiusM * radiusM;
}

interface OrientedGraph {
  nodes: Map<string, GNode>;
  pipes: GPipe[];
  root: string;
  parent: Map<string, string | null>;
  parentPipe: Map<string, GPipe | null>;
  children: Map<string, string[]>;
  order: string[]; // BFS 顺序（根在前）
}

function orient(
  nodes: Map<string, GNode>,
  pipes: GPipe[],
  root: string,
): OrientedGraph {
  const adj = new Map<string, { pipe: GPipe; other: string }[]>();
  nodes.forEach((_, id) => adj.set(id, []));
  for (const p of pipes) {
    adj.get(p.from)?.push({ pipe: p, other: p.to });
    adj.get(p.to)?.push({ pipe: p, other: p.from });
  }
  const parent = new Map<string, string | null>();
  const parentPipe = new Map<string, GPipe | null>();
  const children = new Map<string, string[]>();
  const order: string[] = [];
  nodes.forEach((_, id) => children.set(id, []));
  const queue = [root];
  parent.set(root, null);
  parentPipe.set(root, null);
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const { pipe, other } of adj.get(cur) ?? []) {
      if (parent.has(other) || other === cur) continue;
      parent.set(other, cur);
      parentPipe.set(other, pipe);
      children.get(cur)!.push(other);
      queue.push(other);
    }
  }
  return { nodes, pipes, root, parent, parentPipe, children, order };
}

/** 泄漏点拆分：把带泄漏的管段切成虚拟管段并插入泄漏虚拟节点 */
function buildVirtualGraph(
  network: NetworkData,
  sidePipes: Pipe[],
  leaks: LeakPoint[],
  nodePos: Map<string, [number, number, number]>,
): {
  nodes: Map<string, GNode>;
  pipes: GPipe[];
  leakNodeIds: Map<string, string>;
} {
  const nodes = new Map<string, GNode>();
  for (const n of network.nodes) {
    nodes.set(n.id, {
      id: n.id,
      demand: n.type === 'building' ? n.demand ?? 0 : 0,
      isLeak: false,
    });
  }
  const pipes: GPipe[] = [];
  const leakNodeIds = new Map<string, string>();
  const byPipe = new Map<string, LeakPoint[]>();
  for (const lk of leaks) {
    if (!byPipe.has(lk.pipeId)) byPipe.set(lk.pipeId, []);
    byPipe.get(lk.pipeId)!.push(lk);
  }

  for (const pipe of sidePipes) {
    const leakList = (byPipe.get(pipe.id) ?? []).slice().sort((a, b) => a.t - b.t);
    if (!leakList.length) {
      const len = polylineLength(pipePoints(pipe, nodePos)).total;
      pipes.push({
        id: pipe.id,
        originalId: pipe.id,
        from: pipe.from,
        to: pipe.to,
        diameter: pipe.diameter,
        length: len,
        t0: 0,
        t1: 1,
      });
      continue;
    }
    const pts = pipePoints(pipe, nodePos);
    const { total, cum } = polylineLength(pts);
    let prevId = pipe.from;
    let prevT = 0;
    leakList.forEach((lk, idx) => {
      const leakId = `__leak_${lk.id}`;
      const { pos } = pointAt(pts, cum, total, lk.t);
      nodePos.set(leakId, [pos.x, pos.y, pos.z]);
      nodes.set(leakId, {
        id: leakId,
        demand: leakFlow(lk.radius),
        isLeak: true,
      });
      leakNodeIds.set(lk.id, leakId);
      pipes.push({
        id: `${pipe.id}__s${idx}a`,
        originalId: pipe.id,
        from: prevId,
        to: leakId,
        diameter: pipe.diameter,
        length: (lk.t - prevT) * total,
        t0: prevT,
        t1: lk.t,
      });
      prevId = leakId;
      prevT = lk.t;
    });
    pipes.push({
      id: `${pipe.id}__send`,
      originalId: pipe.id,
      from: prevId,
      to: pipe.to,
      diameter: pipe.diameter,
      length: (1 - prevT) * total,
      t0: prevT,
      t1: 1,
    });
  }
  return { nodes, pipes, leakNodeIds };
}

function solveSide(
  network: NetworkData,
  sidePipes: Pipe[],
  leaks: LeakPoint[],
  side: Side,
  lossThreshold: number,
): SolverResult {
  const nodePos = new Map<string, [number, number, number]>();
  network.nodes.forEach((n) => nodePos.set(n.id, [n.x, n.y, n.z]));
  const { nodes, pipes } = buildVirtualGraph(
    network,
    sidePipes,
    leaks,
    nodePos,
  );

  const source = network.nodes.find((n) => n.type === 'source');
  const root = source?.id ?? network.nodes[0]?.id ?? '';
  const g = orient(nodes, pipes, root);

  const nodePressure: Record<string, number> = {};
  const nodeTemp: Record<string, number> = {};
  const flowAt = new Map<string, number>(); // 虚拟节点流量 m³/h
  const segAcc = new Map<
    string,
    PipeSegment[]
  >();
  const pipeAgg = new Map<
    string,
    { dp: number; len: number; flowMax: number; vMax: number }
  >();

  // 1) 流量自叶向根汇总
  const post = [...g.order].reverse();
  for (const id of post) {
    let q = nodes.get(id)?.demand ?? 0;
    for (const c of g.children.get(id) ?? []) q += flowAt.get(c) ?? 0;
    flowAt.set(id, q);
  }

  // 2) 压力与温度
  if (side === 'supply') {
    nodePressure[root] = SUPPLY_ROOT_P;
    nodeTemp[root] = SUPPLY_ROOT_T;
    for (const id of g.order) {
      if (id === root) continue;
      const edge = g.parentPipe.get(id)!;
      const par = g.parent.get(id)!;
      const q = flowAt.get(id) ?? 0;
      const h = hydraulics(edge.diameter, q, edge.length);
      nodePressure[id] = nodePressure[par] - h.dpMPa;
      nodeTemp[id] = nodeTemp[par] - tempDrop(q, edge.length);
      pushSegment(segAcc, edge, nodePressure[par], nodePressure[id],
        nodeTemp[par], nodeTemp[id], q, h);
      aggregate(pipeAgg, edge, h, q);
    }
  } else {
    nodePressure[root] = RETURN_ROOT_P;
    // 回水：压力沿程（建筑→热源）下降，即叶节点压力更高；温度自叶向根混合
    for (const id of g.order) {
      if (id === root) continue;
      const edge = g.parentPipe.get(id)!;
      const par = g.parent.get(id)!;
      const q = flowAt.get(id) ?? 0;
      const h = hydraulics(edge.diameter, q, edge.length);
      nodePressure[id] = nodePressure[par] + h.dpMPa;
      aggregate(pipeAgg, edge, h, q);
    }
    for (const id of post) {
      if (id === root) {
        // 根节点温度由各支路回水混合（诊断值）
      }
      const kids = g.children.get(id) ?? [];
      if (!kids.length) {
        nodeTemp[id] = nodes.get(id)?.isLeak
          ? BUILDING_RETURN_T + 10
          : BUILDING_RETURN_T;
      } else {
        let qSum = 0;
        let enthalpy = 0;
        for (const c of kids) {
          const edge = g.parentPipe.get(c)!;
          const q = flowAt.get(c) ?? 0;
          const afterLoss = nodeTemp[c] - tempDrop(q, edge.length);
          enthalpy += afterLoss * q;
          qSum += q;
        }
        nodeTemp[id] = qSum > 0 ? enthalpy / qSum : BUILDING_RETURN_T;
      }
    }
    // 回填虚拟管段温/压区间（方向 parent→child）
    for (const id of g.order) {
      if (id === root) continue;
      const edge = g.parentPipe.get(id)!;
      const par = g.parent.get(id)!;
      const q = flowAt.get(id) ?? 0;
      const h = hydraulics(edge.diameter, q, edge.length);
      pushSegment(
        segAcc,
        edge,
        nodePressure[par],
        nodePressure[id],
        nodeTemp[par] ?? nodeTemp[id],
        nodeTemp[id],
        q,
        h,
      );
    }
  }

  // 3) 不可达节点兜底
  nodes.forEach((_, id) => {
    if (nodePressure[id] === undefined) nodePressure[id] = 0.05;
    if (nodeTemp[id] === undefined) {
      nodeTemp[id] = side === 'supply' ? SUPPLY_ROOT_T : BUILDING_RETURN_T;
    }
  });

  // 4) 汇总到原管段结果
  const pipeResults: Record<string, PipeResult> = {};
  for (const pipe of sidePipes) {
    const agg = pipeAgg.get(pipe.id);
    const len = polylineLength(pipePoints(pipe, nodePos)).total;
    const fp = nodePressure[pipe.from] ?? 0.05;
    const tp = nodePressure[pipe.to] ?? 0.05;
    const ft = nodeTemp[pipe.from] ?? 0;
    const tt = nodeTemp[pipe.to] ?? 0;
    const loss = agg && agg.len > 0 ? agg.dp / agg.len : 0;
    pipeResults[pipe.id] = {
      pipeId: pipe.id,
      fromPressure: fp,
      toPressure: tp,
      fromTemp: ft,
      toTemp: tt,
      flow: agg?.flowMax ?? 0,
      velocity: agg?.vMax ?? 0,
      lossPerMeter: loss,
      overThreshold: loss > lossThreshold,
      length: len,
    };
  }

  return {
    nodePressure,
    nodeTemp,
    pipes: pipeResults,
    segments: Object.fromEntries(segAcc),
  };
}

function pushSegment(
  acc: Map<string, PipeSegment[]>,
  edge: GPipe,
  p0: number,
  p1: number,
  T0: number,
  T1: number,
  q: number,
  h: { velocity: number; lossPerMeter: number },
) {
  const list = acc.get(edge.originalId) ?? [];
  list.push({
    t0: edge.t0,
    t1: edge.t1,
    p0,
    p1,
    T0,
    T1,
    flow: q,
    velocity: h.velocity,
    lossPerMeter: h.lossPerMeter,
  });
  acc.set(edge.originalId, list);
}

function aggregate(
  agg: Map<string, { dp: number; len: number; flowMax: number; vMax: number }>,
  edge: GPipe,
  h: { velocity: number; lossPerMeter: number; dpMPa: number },
  q: number,
) {
  const cur = agg.get(edge.originalId) ?? {
    dp: 0,
    len: 0,
    flowMax: 0,
    vMax: 0,
  };
  cur.dp += h.dpMPa * 1e6;
  cur.len += edge.length;
  cur.flowMax = Math.max(cur.flowMax, q);
  cur.vMax = Math.max(cur.vMax, h.velocity);
  agg.set(edge.originalId, cur);
}

/** 解算整套管网（供/回水） */
export function solveNetwork(
  network: NetworkData,
  leaks: LeakPoint[],
  lossThreshold: number,
): Record<Side, SolverResult> {
  const supplyLeaks = leaks.filter((l) => l.side === 'supply');
  const returnLeaks = leaks.filter((l) => l.side === 'return');
  return {
    supply: solveSide(
      network,
      network.supplyPipes,
      supplyLeaks,
      'supply',
      lossThreshold,
    ),
    return: solveSide(
      network,
      network.returnPipes,
      returnLeaks,
      'return',
      lossThreshold,
    ),
  };
}

/** 管段沿程 0.5m 采样（含泄漏折点） */
export function samplePipeProfile(
  result: SolverResult,
  pipe: Pipe,
  nodePos: Map<string, [number, number, number]>,
  stepM = 0.5,
): { distance: number; pressure: number; temp: number }[] {
  const pts = pipePoints(pipe, nodePos);
  const { total } = polylineLength(pts);
  const segs: PipeSegment[] =
    result.segments?.[pipe.id] ?? [
      {
        t0: 0,
        t1: 1,
        p0: result.nodePressure[pipe.from],
        p1: result.nodePressure[pipe.to],
        T0: result.nodeTemp[pipe.from],
        T1: result.nodeTemp[pipe.to],
        flow: result.pipes[pipe.id]?.flow ?? 0,
        velocity: result.pipes[pipe.id]?.velocity ?? 0,
        lossPerMeter: result.pipes[pipe.id]?.lossPerMeter ?? 0,
      },
    ];
  const sorted = [...segs].sort((a, b) => a.t0 - b.t0);
  const n = Math.max(1, Math.round(total / stepM));
  const out: { distance: number; pressure: number; temp: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const seg =
      sorted.find((s) => t >= s.t0 && t <= s.t1) ?? sorted[sorted.length - 1];
    const lt = seg.t1 > seg.t0 ? (t - seg.t0) / (seg.t1 - seg.t0) : 0;
    out.push({
      distance: +(t * total).toFixed(2),
      pressure: +(seg.p0 + (seg.p1 - seg.p0) * lt).toFixed(5),
      temp: +(seg.T0 + (seg.T1 - seg.T0) * lt).toFixed(3),
    });
  }
  return out;
}

export function nodePositionMap(network: NetworkData) {
  const m = new Map<string, [number, number, number]>();
  network.nodes.forEach((n: NetworkNode) => m.set(n.id, [n.x, n.y, n.z]));
  return m;
}
