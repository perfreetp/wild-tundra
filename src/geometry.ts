// 几何工具:折线圆角(圆弧倒角)与弧长参数化

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

const EPS = 1e-6;

export interface ArcSample {
  /** 累计弧长(m) */
  s: number;
  point: Vector3;
  tangent: Vector3;
}

/**
 * 对三维折线的每个转折点做圆弧倒角。
 * @param points 折线原始顶点
 * @param radius 圆角半径(m),转折夹角过小时按邻边长度自动收缩
 * @returns 密集采样后的平滑折线(首尾保持原顶点)
 */
export function filletPolyline(points: Vector3[], radius: number): Vector3[] {
  if (points.length < 3 || radius <= 0) return points.map((p) => p.clone());

  const out: Vector3[] = [points[0].clone()];
  let prevEnd: Vector3 = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];

    const u1 = corner.subtract(prev);
    const u2 = next.subtract(corner);
    const len1 = u1.length();
    const len2 = u2.length();
    if (len1 < EPS || len2 < EPS) continue;
    u1.scaleInPlace(1 / len1);
    u2.scaleInPlace(1 / len2);

    const cosTheta = Math.min(1, Math.max(-1, Vector3.Dot(u1, u2)));
    const theta = Math.acos(cosTheta); // 转折角(0=直行)
    if (theta < 1e-4) {
      // 近乎共线:跳过角点,下一轮从 prevEnd 直接连线即可
      continue;
    }

    const half = theta / 2;
    // 切线点到角点的距离,按相邻直线段余量收缩
    const dMax = Math.min(len1, len2) * 0.45;
    const d = Math.min(radius / Math.tan(half), dMax);
    const r = d * Math.tan(half);

    const t1 = corner.subtract(u1.scale(d));
    const t2 = corner.add(u2.scale(d));

    // 内角平分线方向:入射方向与出射方向之和,指向弯道内侧
    const bisector = u1.add(u2);
    if (bisector.lengthSquared() < EPS) {
      // 180° 折返:无法做圆角,直接保留角点
      out.push(corner.clone());
      prevEnd = corner;
      continue;
    }
    bisector.normalize();
    const center = corner.add(bisector.scale(r / Math.sin(half)));

    const axis = Vector3.Cross(u1, u2).normalize();
    const arcLen = r * theta;
    const steps = Math.max(4, Math.ceil(arcLen / 0.25));

    // 直线段:上一段终点(或起点) -> 本圆弧入口切点
    if (Vector3.DistanceSquared(prevEnd, t1) > EPS) out.push(t1.clone());

    const v1 = t1.subtract(center).scale(1 / r); // 入口径向单位向量
    for (let k = 1; k <= steps; k++) {
      const ang = (theta * k) / steps;
      const radial = rotateAroundAxis(v1, axis, ang);
      out.push(center.add(radial.scale(r)));
    }
    prevEnd = t2;
  }

  if (Vector3.DistanceSquared(prevEnd, points[points.length - 1]) > EPS) {
    out.push(points[points.length - 1].clone());
  }
  return out;
}

/** 绕单位轴旋转向量(罗德里格斯公式);axis 为 u1×u2 时取负角得到内侧转向 */
function rotateAroundAxis(v: Vector3, axis: Vector3, angle: number): Vector3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return v
    .scale(c)
    .add(Vector3.Cross(v, axis).scale(s))
    .add(axis.scale(Vector3.Dot(axis, v) * (1 - c)));
}

/** 弧长表:支持按弧长取位置/切线,二分查找 */
export class ArcLengthTable {
  readonly totalLength: number;
  private readonly cum: number[] = [];
  private readonly pts: Vector3[];

  constructor(sampled: Vector3[]) {
    this.pts = sampled;
    this.cum = [0];
    for (let i = 1; i < sampled.length; i++) {
      this.cum.push(this.cum[i - 1] + Vector3.Distance(sampled[i - 1], sampled[i]));
    }
    this.totalLength = this.cum[this.cum.length - 1] ?? 0;
  }

  /** 找到 s 落在哪一段,返回段起始下标与段内比例 */
  private locate(s: number): [number, number] {
    const x = Math.min(Math.max(s, 0), this.totalLength);
    let lo = 0;
    let hi = this.cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= x) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[lo + 1] - this.cum[lo] || EPS;
    return [lo, Math.min(1, (x - this.cum[lo]) / segLen)];
  }

  positionAt(s: number): Vector3 {
    const [i, t] = this.locate(s);
    return Vector3.Lerp(this.pts[i], this.pts[i + 1], t);
  }

  tangentAt(s: number): Vector3 {
    const [i, t] = this.locate(s);
    const a = this.pts[i];
    const b = this.pts[i + 1];
    const tan = b.subtract(a);
    if (tan.lengthSquared() < EPS) {
      // 找最近的非退化段
      for (let j = i + 1; j < this.pts.length - 1; j++) {
        const d = this.pts[j + 1].subtract(this.pts[j]);
        if (d.lengthSquared() > EPS) return d.normalize();
      }
      return new Vector3(0, 0, 1);
    }
    void t;
    return tan.normalize();
  }

  /** 任意世界点投影到曲线,返回对应弧长(最近点) */
  projectPoint(p: Vector3): number {
    let bestS = 0;
    let bestD = Infinity;
    for (let i = 0; i < this.pts.length - 1; i++) {
      const a = this.pts[i];
      const b = this.pts[i + 1];
      const ab = b.subtract(a);
      const len2 = ab.lengthSquared();
      if (len2 < EPS) continue;
      const t = Math.min(1, Math.max(0, Vector3.Dot(p.subtract(a), ab) / len2));
      const q = a.add(ab.scale(t));
      const d2 = Vector3.DistanceSquared(p, q);
      if (d2 < bestD) {
        bestD = d2;
        bestS = this.cum[i] + Math.sqrt(len2) * t;
      }
    }
    return bestS;
  }
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
