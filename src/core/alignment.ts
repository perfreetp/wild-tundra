import type { PlanPoint, ProfilePoint, TerrainData } from "./types.ts";
import { clamp } from "./math.ts";
import { sampleTerrain, terrainBounds } from "./terrain.ts";

export interface PathSample {
  x: number;
  z: number;
  s: number;
  /** 单位切向量（线路前进方向） */
  tx: number;
  tz: number;
  /** 左法向量 */
  nx: number;
  nz: number;
}

export interface PlanCurve {
  samples: PathSample[];
  length: number;
  /** 每个平曲线控制点对应的里程 */
  controlStations: number[];
  /** 每个控制点实际采用的圆曲线半径（0 = 直线转角） */
  controlRadii: number[];
  arcs: {
    pointIndex: number;
    radius: number;
    tangentLength: number;
    deflection: number;
    length: number;
    startS: number;
  }[];
}

const STEP = 3;

function makeSample(x: number, z: number, s: number): PathSample {
  return { x, z, s, tx: 1, tz: 0, nx: 0, nz: 1 };
}

/**
 * 由平面控制点生成带圆曲线的中心线。θ 为转角，切线长 T = R·tan(θ/2)，
 * 当切线长超过相邻边长的 45% 时按几何上限压缩半径。
 */
export function buildPlanCurve(points: PlanPoint[]): PlanCurve {
  const result: PlanCurve = {
    samples: [],
    length: 0,
    controlStations: [],
    controlRadii: [],
    arcs: [],
  };
  if (points.length < 2) return result;

  const segDir: { x: number; z: number }[] = [];
  const segLen: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dz = points[i + 1].z - points[i].z;
    const len = Math.hypot(dx, dz);
    segLen.push(len);
    segDir.push(len > 1e-9 ? { x: dx / len, z: dz / len } : { x: 1, z: 0 });
  }

  const pts: { x: number; z: number }[] = [];
  const pushUnique = (x: number, z: number) => {
    const last = pts[pts.length - 1];
    if (last && Math.hypot(last.x - x, last.z - z) < 0.02) return;
    pts.push({ x, z });
  };
  const pushLine = (from: { x: number; z: number }, to: { x: number; z: number }) => {
    const len = Math.hypot(to.x - from.x, to.z - from.z);
    const n = Math.max(1, Math.ceil(len / STEP));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      pushUnique(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t);
    }
  };

  const curveStations: { index: number; s: number }[] = [{ index: 0, s: 0 }];
  let cursor = { x: points[0].x, z: points[0].z };
  pushUnique(cursor.x, cursor.z);
  let travelled = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const dIn = segDir[i - 1];
    const dOut = segDir[i];
    const dot = clamp(dIn.x * dOut.x + dIn.z * dOut.z, -1, 1);
    const theta = Math.acos(dot);
    let tangentLength = 0;
    let radius = 0;
    let cross = 0;

    if (theta > 0.002 && p.radius > 0.5) {
      tangentLength = p.radius * Math.tan(theta / 2);
      const maxT = 0.45 * Math.min(segLen[i - 1], segLen[i]);
      if (tangentLength > maxT) tangentLength = maxT;
      radius = tangentLength / Math.tan(theta / 2);
      cross = dIn.x * dOut.z - dIn.z * dOut.x;
    }
    if (tangentLength < 0.4) {
      tangentLength = 0;
      radius = 0;
    }

    if (tangentLength === 0) {
      pushLine(cursor, p);
      travelled += Math.hypot(p.x - cursor.x, p.z - cursor.z);
      cursor = { x: p.x, z: p.z };
      curveStations.push({ index: i, s: travelled });
      continue;
    }

    const ts = { x: p.x - dIn.x * tangentLength, z: p.z - dIn.z * tangentLength };
    const st = { x: p.x + dOut.x * tangentLength, z: p.z + dOut.z * tangentLength };
    // Circle centre sits on the inside of the turn.
    const sign = cross >= 0 ? 1 : -1;
    const cx = ts.x + -dIn.z * radius * sign;
    const cz = ts.z + dIn.x * radius * sign;
    const a0 = Math.atan2(ts.z - cz, ts.x - cx);
    const sweep = sign * theta;
    const arcLen = radius * theta;

    pushLine(cursor, ts);
    travelled += Math.hypot(ts.x - cursor.x, ts.z - cursor.z);

    const arcSegments = Math.max(3, Math.ceil(arcLen / STEP));
    for (let k = 1; k <= arcSegments; k++) {
      const a = a0 + sweep * (k / arcSegments);
      pushUnique(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius);
    }
    const startS = travelled;
    travelled += arcLen;
    curveStations.push({ index: i, s: startS + arcLen / 2 });
    result.arcs.push({
      pointIndex: i,
      radius,
      tangentLength,
      deflection: theta,
      length: arcLen,
      startS,
    });
    cursor = { x: st.x, z: st.z };
  }

  const last = points[points.length - 1];
  pushLine(cursor, last);
  travelled += Math.hypot(last.x - cursor.x, last.z - cursor.z);
  curveStations.push({ index: points.length - 1, s: travelled });

  // Build samples with arc-length stations and tangents.
  const samples: PathSample[] = [];
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    samples.push(makeSample(pts[i].x, pts[i].z, s));
  }
  for (let i = 0; i < samples.length; i++) {
    const a = samples[Math.max(0, i - 1)];
    const b = samples[Math.min(samples.length - 1, i + 1)];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const L = Math.hypot(tx, tz) || 1;
    tx /= L;
    tz /= L;
    samples[i].tx = tx;
    samples[i].tz = tz;
    samples[i].nx = -tz;
    samples[i].nz = tx;
  }

  result.samples = samples;
  result.length = s;
  result.controlStations = new Array(points.length).fill(0);
  result.controlRadii = new Array(points.length).fill(0);
  for (const cs of curveStations) result.controlStations[cs.index] = cs.s;
  for (const arc of result.arcs) result.controlRadii[arc.pointIndex] = arc.radius;
  result.controlStations[0] = 0;
  result.controlStations[points.length - 1] = result.length;
  return result;
}

export interface ProfileSegment {
  s0: number;
  s1: number;
  y0: number;
  y1: number;
  grade: number;
}

export interface ProfileEval {
  points: ProfilePoint[];
  segments: ProfileSegment[];
  maxGrade: number;
  maxGradeSegment: number;
  evalY(s: number): number;
  evalGrade(s: number): number;
}

export function buildProfile(pointsIn: ProfilePoint[]): ProfileEval {
  const points = [...pointsIn].sort((a, b) => a.s - b.s);
  const segments: ProfileSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const ds = b.s - a.s;
    segments.push({
      s0: a.s,
      s1: b.s,
      y0: a.y,
      y1: b.y,
      grade: ds > 1e-6 ? (b.y - a.y) / ds : 0,
    });
  }
  let maxGrade = 0;
  let maxGradeSegment = 0;
  segments.forEach((seg, i) => {
    if (Math.abs(seg.grade) > Math.abs(maxGrade)) {
      maxGrade = seg.grade;
      maxGradeSegment = i;
    }
  });

  const evalY = (s: number): number => {
    if (points.length === 0) return 0;
    if (points.length === 1) return points[0].y;
    if (s <= segments[0].s0) return segments[0].y0;
    const lastSeg = segments[segments.length - 1];
    if (s >= lastSeg.s1) return lastSeg.y1;
    let lo = 0;
    let hi = segments.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (segments[mid].s0 <= s) lo = mid;
      else hi = mid - 1;
    }
    const seg = segments[lo];
    const t = clamp((s - seg.s0) / Math.max(seg.s1 - seg.s0, 1e-9), 0, 1);
    return seg.y0 + (seg.y1 - seg.y0) * t;
  };

  const evalGrade = (s: number): number => {
    if (segments.length === 0) return 0;
    for (const seg of segments) if (s >= seg.s0 && s <= seg.s1) return seg.grade;
    return s < segments[0].s0 ? segments[0].grade : segments[segments.length - 1].grade;
  };

  return { points, segments, maxGrade, maxGradeSegment, evalY, evalGrade };
}

/** 按新线长等比重排纵断面控制点里程，避免控制点落到线路之外。 */
export function rescaleProfile(profile: ProfilePoint[], length: number): ProfilePoint[] {
  if (profile.length === 0) return profile;
  const maxS = Math.max(...profile.map((p) => p.s), 1e-6);
  if (profile.length === 1) return [{ ...profile[0], s: 0 }];
  return profile.map((p) => ({ ...p, s: (p.s / maxS) * length }));
}

/** 依据平均地形纵断面拟合一组纵断面控制点（“贴合地形”）。 */
export function fitProfileToTerrain(
  terrain: TerrainData,
  plan: PlanCurve,
  count: number,
  lift: number,
  maxGrade = 0.03
): ProfilePoint[] {
  if (plan.samples.length < 2) return [];
  const raw: number[] = [];
  const stations: number[] = [];
  const step = Math.max(4, plan.length / 180);
  const n = Math.max(2, Math.round(plan.length / step));
  for (let i = 0; i <= n; i++) {
    const s = (plan.length * i) / n;
    const smp = sampleOnPlan(plan, s);
    if (!smp) continue;
    // 横向取三点平均，弱化局部起伏
    const off = 4;
    const g =
      (sampleTerrain(terrain, smp.x, smp.z) * 2 +
        sampleTerrain(terrain, smp.x + smp.nx * off, smp.z + smp.nz * off) +
        sampleTerrain(terrain, smp.x - smp.nx * off, smp.z - smp.nz * off)) /
      4;
    raw.push(g);
    stations.push(s);
  }
  if (raw.length < 2) return [];
  // 移动平均，窗口约 90 m
  const winRadius = Math.max(1, Math.round(90 / (plan.length / (raw.length - 1))));
  const smooth = raw.map((_, i) => {
    let sum = 0;
    let cnt = 0;
    for (let k = -winRadius; k <= winRadius; k++) {
      const v = raw[i + k];
      if (v === undefined) continue;
      sum += v;
      cnt++;
    }
    return sum / cnt + lift;
  });

  // 方向对称限坡平滑：反复做正/反向坡度限制，曲线在地形附近但不超限。
  const limit = Math.max(0.002, maxGrade);
  const profileY = smooth.slice();
  for (let pass = 0; pass < 12; pass++) {
    let changed = 0;
    for (let i = 1; i < profileY.length; i++) {
      const ds = stations[i] - stations[i - 1];
      const lo = profileY[i - 1] - limit * ds;
      const hi = profileY[i - 1] + limit * ds;
      const v = Math.min(hi, Math.max(lo, profileY[i]));
      if (v !== profileY[i]) { profileY[i] = v; changed++; }
    }
    for (let i = profileY.length - 2; i >= 0; i--) {
      const ds = stations[i + 1] - stations[i];
      const lo = profileY[i + 1] - limit * ds;
      const hi = profileY[i + 1] + limit * ds;
      const v = Math.min(hi, Math.max(lo, profileY[i]));
      if (v !== profileY[i]) { profileY[i] = v; changed++; }
    }
    if (!changed) break;
  }

  // 竖向居中：把路基面（轨顶 - 轨道结构高）相对地面的中位差归零，
  // 使填挖大致平衡而不是一路抬升或下切。
  const structure = 0.88;
  const diffs = profileY.map((y, i) => raw[i] - (y - structure)).sort((a, b) => a - b);
  const median = diffs[Math.floor(diffs.length / 2)] ?? 0;
  const offset = median - lift;
  for (let i = 0; i < profileY.length; i++) profileY[i] += offset;

  const count2 = Math.max(2, count);
  const out: ProfilePoint[] = [];
  for (let i = 0; i < count2; i++) {
    const s = (plan.length * i) / (count2 - 1);
    let idx = 0;
    let best = Infinity;
    for (let k = 0; k < stations.length; k++) {
      const d = Math.abs(stations[k] - s);
      if (d < best) {
        best = d;
        idx = k;
      }
    }
    out.push({
      id: `vp${i + 1}`,
      s: Math.round(s * 100) / 100,
      y: Math.round(profileY[idx] * 100) / 100,
    });
  }
  return out;
}

/** 按里程取中心线上的点（含法向）。 */
function sampleOnPlan(plan: PlanCurve, s: number): PathSample | null {
  const samples = plan.samples;
  if (samples.length === 0) return null;
  if (s <= samples[0].s) return samples[0];
  const last = samples[samples.length - 1];
  if (s >= last.s) return last;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].s < s) lo = mid + 1;
    else hi = mid;
  }
  return samples[lo];
}

/**
 * 约束平面控制点的拖动位置，保证平面顺序不交叉：
 * 内点沿相邻控制点连线方向投影限制在 15%–85%，横向偏移限制在 ±55%。
 */
export function constrainPlanPoint(
  points: PlanPoint[],
  index: number,
  x: number,
  z: number,
  terrain: TerrainData
): { x: number; z: number } {
  const b = terrainBounds(terrain);
  const pad = 60;
  x = clamp(x, b.minX + pad, b.maxX - pad);
  z = clamp(z, b.minZ + pad, b.maxZ - pad);
  if (points.length < 3 || index === 0 || index === points.length - 1) {
    const neighbor = index === 0 ? points[1] : points[points.length - 2];
    if (neighbor) {
      const dx = x - neighbor.x;
      const dz = z - neighbor.z;
      const d = Math.hypot(dx, dz);
      if (d < 70) {
        const k = 70 / Math.max(d, 1e-6);
        x = neighbor.x + dx * k;
        z = neighbor.z + dz * k;
      }
    }
    return { x, z };
  }
  const a = points[index - 1];
  const c = points[index + 1];
  const vx = c.x - a.x;
  const vz = c.z - a.z;
  const span = Math.hypot(vx, vz) || 1;
  const ux = vx / span;
  const uz = vz / span;
  const px = x - a.x;
  const pz = z - a.z;
  let t = (px * ux + pz * uz) / span;
  t = clamp(t, 0.15, 0.85);
  let lat = -px * uz + pz * ux;
  lat = clamp(lat, -span * 0.55, span * 0.55);
  return {
    x: a.x + ux * span * t - uz * lat,
    z: a.z + uz * span * t + ux * lat,
  };
}
