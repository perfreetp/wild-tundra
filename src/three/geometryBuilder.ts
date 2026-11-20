import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {
  LeakPoint,
  NetworkData,
  NetworkNode,
  Pipe,
  Side,
  SolverResult,
} from '../types';
import { pipePoints } from '../lib/geometry';

export const ATTR_NAMES = [
  'position',
  'normal',
  'uv',
  'aPressure',
  'aTemp',
  'aPipeId',
  'aNodeId',
  'aLeakD',
  'aLeakC',
  'aOver',
  'aDist',
] as const;

const RADIAL_SEGMENTS = 14;
/** 沿管段方向的最大分段长度（米），保证顶点密度足以承载泄漏半径场 */
const AXIAL_STEP = 0.5;

/** 保证几何具备全部着色属性（动态属性先填 0） */
function withAttrs(geo: THREE.BufferGeometry, vertexCount: number): THREE.BufferGeometry {
  for (const name of ATTR_NAMES) {
    if (geo.getAttribute(name)) continue;
    const size = name === 'position' || name === 'normal' ? 3 : 1;
    geo.setAttribute(name, new THREE.BufferAttribute(new Float32Array(vertexCount * size), size));
  }
  return geo;
}

/**
 * 沿 a->b 按 AXIAL_STEP 切分的挤出圆柱：
 * 分段数 = ceil(长度/步长)，环顶点携带连续沿程距离，
 * 使泄漏半径场（最小 2m）至少覆盖若干环顶点。
 */
function cylinderSegment(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  ringDistances: number[],
  startDistance: number,
): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const slices = Math.max(1, Math.ceil(len / AXIAL_STEP));
  const geo = new THREE.CylinderGeometry(
    radius,
    radius,
    Math.max(len, 0.05),
    RADIAL_SEGMENTS,
    slices,
    false,
  );
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );
  geo.applyQuaternion(q);
  geo.translate(mid.x, mid.y, mid.z);
  withAttrs(geo, geo.attributes.position.count);

  // 按顶点环位置写入沿管累计距离（圆柱局部 +Y 为起点 a）
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const aDist = geo.getAttribute('aDist') as THREE.BufferAttribute;
  const axis = new THREE.Vector3();
  for (let v = 0; v < pos.count; v++) {
    axis.fromBufferAttribute(pos, v).sub(a);
    const along = THREE.MathUtils.clamp(axis.dot(dir), 0, len);
    const d = startDistance + along;
    aDist.setX(v, d);
    ringDistances.push(d);
  }
  return geo;
}

function jointSphere(pos: THREE.Vector3, radius: number, atDistance: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, RADIAL_SEGMENTS, 10);
  geo.translate(pos.x, pos.y, pos.z);
  withAttrs(geo, geo.attributes.position.count);
  const aDist = geo.getAttribute('aDist') as THREE.BufferAttribute;
  for (let v = 0; v < aDist.count; v++) aDist.setX(v, atDistance);
  return geo;
}

export interface BuiltPipe {
  pipeId: string;
  geometry: THREE.BufferGeometry;
}

/** 单管段：沿折线逐段圆柱挤出（0.5m 步长切分）+ 折点球过渡 */
export function buildPipeGeometry(
  pipe: Pipe,
  nodePos: Map<string, [number, number, number]>,
  numericId: number,
): BuiltPipe {
  const points = pipePoints(pipe, nodePos);
  const radius = pipe.diameter / 2000; // mm -> m 半径
  const parts: THREE.BufferGeometry[] = [];
  const ringDistances: number[] = [];
  let cumDist = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = cylinderSegment(a, b, radius, ringDistances, cumDist);
    parts.push(seg);
    const segLen = a.distanceTo(b);
    cumDist += segLen;
    if (i < points.length - 1) {
      parts.push(jointSphere(b, radius * 1.02, cumDist));
    }
  }

  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  void ringDistances;
  fillStatic(merged, numericId, -1, 0, 0);
  return { pipeId: pipe.id, geometry: merged };
}

function fillStatic(
  geo: THREE.BufferGeometry,
  pipeId: number,
  nodeId: number,
  leakC: number,
  over: number,
) {
  const count = geo.attributes.position.count;
  const ensure = (name: string, size: number) => {
    if (!geo.getAttribute(name)) {
      geo.setAttribute(
        name,
        new THREE.BufferAttribute(new Float32Array(count * size), size),
      );
    }
  };
  ensure('aPressure', 1);
  ensure('aTemp', 1);
  ensure('aPipeId', 1);
  ensure('aNodeId', 1);
  ensure('aLeakD', 1);
  ensure('aLeakC', 1);
  ensure('aOver', 1);
  ensure('aDist', 1);
  const set = (name: string, value: number) => {
    const attr = geo.getAttribute(name) as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) attr.setX(i, value);
    attr.needsUpdate = true;
  };
  set('aPipeId', pipeId);
  set('aNodeId', nodeId);
  set('aLeakC', leakC);
  set('aLeakD', 0);
  set('aOver', over);
}

/** 节点球：按口径缩放，building 节点附带楼栋挂点小立管标记 */
export function buildNodeGeometry(
  network: NetworkData,
  numericNodeId: Map<string, number>,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const node of network.nodes) {
    const r = Math.max(0.55, (node.diameter / 1000) * 1.1);
    const geo = new THREE.SphereGeometry(r, 18, 14);
    geo.translate(node.x, node.y, node.z);
    withAttrs(geo, geo.attributes.position.count);
    fillStatic(geo, -1, numericNodeId.get(node.id) ?? -1, 0, 0);
    parts.push(geo);

    if (node.type === 'building') {
      // 挂点：地面小基座 + 竖向立管
      const base = new THREE.CylinderGeometry(r * 0.9, r * 1.1, 0.6, 12);
      base.translate(node.x, node.y, 0.3);
      withAttrs(base, base.attributes.position.count);
      fillStatic(base, -1, numericNodeId.get(node.id) ?? -1, 0, 0);
      parts.push(base);
    }
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** 描边 hull：沿法线外扩的纯色背面壳 */
export function buildHullGeometry(geo: THREE.BufferGeometry, grow = 1.35): THREE.BufferGeometry {
  const clone = geo.clone();
  const pos = clone.attributes.position as THREE.BufferAttribute;
  const nrm = clone.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nrm.getX(i) * grow * 0.18,
      pos.getY(i) + nrm.getY(i) * grow * 0.18,
      pos.getZ(i) + nrm.getZ(i) * grow * 0.18,
    );
  }
  pos.needsUpdate = true;
  return clone;
}

export interface PipeIdMaps {
  /** 管段 id -> 数值 id（写入 aPipeId） */
  pipeNumeric: Map<string, number>;
  /** 数值 id -> 管段 id（射线拾取反查） */
  numericToPipe: Map<number, string>;
  nodeNumeric: Map<string, number>;
  numericToNode: Map<number, string>;
}

export function buildIdMaps(network: NetworkData, side: Side): PipeIdMaps {
  const pipes = side === 'supply' ? network.supplyPipes : network.returnPipes;
  const pipeNumeric = new Map<string, number>();
  const numericToPipe = new Map<number, string>();
  pipes.forEach((p, i) => {
    pipeNumeric.set(p.id, i + 1);
    numericToPipe.set(i + 1, p.id);
  });
  const nodeNumeric = new Map<string, number>();
  const numericToNode = new Map<number, string>();
  network.nodes.forEach((n, i) => {
    nodeNumeric.set(n.id, i + 1);
    numericToNode.set(i + 1, n.id);
  });
  return { pipeNumeric, numericToPipe, nodeNumeric, numericToNode };
}

/** 泄漏半径场参数（世界坐标中的投影点与半径） */
export interface LeakField {
  pipeId: string;
  distance: number;
  radius: number;
}

export function leakToFields(
  leaks: LeakPoint[],
  pipes: Pipe[],
  nodePos: Map<string, [number, number, number]>,
): LeakField[] {
  return leaks.map((lk) => {
    const pipe = pipes.find((p) => p.id === lk.pipeId)!;
    const pts = pipePoints(pipe, nodePos);
    let total = 0;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      total += pts[i].distanceTo(pts[i - 1]);
      cum.push(total);
    }
    return { pipeId: lk.pipeId, distance: lk.t * total, radius: lk.radius };
  });
}

/** 逐顶点写入解算结果 + 泄漏半径场 + 超阈值标记 */
export function writePipeVertexState(
  geo: THREE.BufferGeometry,
  pipe: Pipe,
  result: SolverResult,
  leaks: LeakField[],
  nodePos: Map<string, [number, number, number]>,
) {
  const count = geo.attributes.position.count;
  const aP = geo.getAttribute('aPressure') as THREE.BufferAttribute;
  const aT = geo.getAttribute('aTemp') as THREE.BufferAttribute;
  const aLD = geo.getAttribute('aLeakD') as THREE.BufferAttribute;
  const aLC = geo.getAttribute('aLeakC') as THREE.BufferAttribute;
  const aOver = geo.getAttribute('aOver') as THREE.BufferAttribute;
  const aDist = geo.getAttribute('aDist') as THREE.BufferAttribute;

  const pr = result.pipes[pipe.id];
  const pFrom = result.nodePressure[pipe.from] ?? 0;
  const pTo = result.nodePressure[pipe.to] ?? pFrom;
  const tFrom = result.nodeTemp[pipe.from] ?? 0;
  const tTo = result.nodeTemp[pipe.to] ?? tFrom;
  const pts = pipePoints(pipe, nodePos);
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += pts[i].distanceTo(pts[i - 1]);
  }
  const pipeLeaks = leaks.filter((l) => l.pipeId === pipe.id);
  const over = pr?.overThreshold ? 1 : 0;
  for (let v = 0; v < count; v++) {
    const d = aDist.getX(v);
    const u = total > 0 ? d / total : 0;
    aP.setX(v, pFrom + (pTo - pFrom) * u);
    aT.setX(v, tFrom + (tTo - tFrom) * u);
    let cover = 0;
    let bestD = Infinity;
    for (const lf of pipeLeaks) {
      const dist = Math.abs(d - lf.distance);
      bestD = Math.min(bestD, dist);
      if (dist <= lf.radius) {
        cover = Math.max(cover, 1 - dist / lf.radius);
      }
    }
    aLC.setX(v, cover);
    aLD.setX(v, pipeLeaks.length ? bestD : 0);
    aOver.setX(v, over);
  }
  [aP, aT, aLD, aLC, aOver].forEach((a) => (a.needsUpdate = true));
}

/** 节点球逐顶点写入节点压力/温度 */
export function writeNodeVertexState(
  geo: THREE.BufferGeometry,
  network: NetworkData,
  nodeNumeric: Map<string, number>,
  result: SolverResult,
  affectedBuildings: Set<string>,
) {
  const count = geo.attributes.position.count;
  const aP = geo.getAttribute('aPressure') as THREE.BufferAttribute;
  const aT = geo.getAttribute('aTemp') as THREE.BufferAttribute;
  const aLC = geo.getAttribute('aLeakC') as THREE.BufferAttribute;
  const aOver = geo.getAttribute('aOver') as THREE.BufferAttribute;
  for (let v = 0; v < count; v++) {
    const nid = (geo.getAttribute('aNodeId') as THREE.BufferAttribute).getX(v);
    const node = network.nodes.find((n) => nodeNumeric.get(n.id) === nid);
    if (!node) continue;
    aP.setX(v, result.nodePressure[node.id] ?? 0);
    aT.setX(v, result.nodeTemp[node.id] ?? 0);
    const affected = affectedBuildings.has(node.id) ? 1 : 0;
    aLC.setX(v, affected);
    aOver.setX(v, node.type === 'source' ? 0.35 : 0);
  }
  [aP, aT, aLC, aOver].forEach((a) => (a.needsUpdate = true));
}
