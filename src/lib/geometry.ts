import * as THREE from 'three';
import type { Pipe } from '../types';

export type Vec3Tuple = [number, number, number];

/** 取管段完整折线：from 端点 + 中间控制点 + to 端点 */
export function pipePoints(
  pipe: Pipe,
  nodePos: Map<string, Vec3Tuple>,
): THREE.Vector3[] {
  const a = nodePos.get(pipe.from)!;
  const b = nodePos.get(pipe.to)!;
  const pts: Vec3Tuple[] = [a, ...(pipe.polyline ?? []), b];
  return pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
}

/** 折线累计长度与总长 */
export function polylineLength(points: THREE.Vector3[]): {
  total: number;
  cum: number[];
} {
  const cum = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += points[i].distanceTo(points[i - 1]);
    cum.push(total);
  }
  return { total, cum };
}

/** 按比例 t (0~1) 取折线上的位置与切线 */
export function pointAt(
  points: THREE.Vector3[],
  cum: number[],
  total: number,
  t: number,
): { pos: THREE.Vector3; tangent: THREE.Vector3 } {
  const d = THREE.MathUtils.clamp(t, 0, 1) * total;
  for (let i = 1; i < points.length; i++) {
    if (d <= cum[i] || i === points.length - 1) {
      const segLen = cum[i] - cum[i - 1] || 1e-9;
      const localT = THREE.MathUtils.clamp((d - cum[i - 1]) / segLen, 0, 1);
      const pos = points[i - 1].clone().lerp(points[i], localT);
      const tangent = points[i].clone().sub(points[i - 1]).normalize();
      return { pos, tangent };
    }
  }
  return {
    pos: points[points.length - 1].clone(),
    tangent: new THREE.Vector3(1, 0, 0),
  };
}

/** 折线最近点（用于泄漏点拖拽吸附），返回 t 比例与三维位置 */
export function closestOnPolyline(
  points: THREE.Vector3[],
  cum: number[],
  total: number,
  target: THREE.Vector3,
): { t: number; pos: THREE.Vector3; distance: number } {
  let best = {
    t: 0,
    pos: points[0].clone(),
    distance: Infinity,
  };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const ab = b.clone().sub(a);
    const lenSq = ab.lengthSq() || 1e-12;
    const u = THREE.MathUtils.clamp(
      target.clone().sub(a).dot(ab) / lenSq,
      0,
      1,
    );
    const pos = a.clone().addScaledVector(ab, u);
    const distance = pos.distanceTo(target);
    if (distance < best.distance) {
      const segLen = cum[i] - cum[i - 1] || 1e-9;
      const d = cum[i - 1] + u * segLen;
      best = { t: d / (total || 1e-9), pos, distance };
    }
  }
  return best;
}

/** 沿管段每 stepM 米采样（强制含两端） */
export function sampleAlong(
  points: THREE.Vector3[],
  cum: number[],
  total: number,
  stepM = 0.5,
): { t: number; distance: number; pos: THREE.Vector3 }[] {
  const out: { t: number; distance: number; pos: THREE.Vector3 }[] = [];
  const n = Math.max(1, Math.round(total / stepM));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const { pos } = pointAt(points, cum, total, t);
    out.push({ t, distance: +(t * total).toFixed(3), pos });
  }
  return out;
}

/** 线性插值（压力/温度沿程） */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
