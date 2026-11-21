import type { PlanPoint, ProfilePoint, ProjectSettings, TerrainData } from "./types.ts";
import { TRACK, formationHalfWidth } from "./types.ts";
import { buildPlanCurve, buildProfile, type PlanCurve, type ProfileEval } from "./alignment.ts";
import { sampleTerrain } from "./terrain.ts";
import { clamp } from "./math.ts";

export type SideMode = "fill" | "cut" | "flat";

export interface CorridorStation {
  s: number;
  x: number;
  z: number;
  /** 单位切向量 */
  tx: number;
  tz: number;
  /** 单位左法向量 */
  nx: number;
  nz: number;
  railY: number;
  formY: number;
  ballastTopHalf: number;
  ballastBottomHalf: number;
  halfFormation: number;
  yBallastTop: number;
  left: ToeInfo;
  right: ToeInfo;
}

export interface ToeInfo {
  mode: SideMode;
  /** 坡脚到中线的水平距离（米） */
  offset: number;
  /** 坡脚处地面高程 */
  groundY: number;
  /** 路基边缘处地面高程 */
  edgeGroundY: number;
  /** 路基边缘与地面高差（正=填方，负=挖方） */
  depth: number;
}

export interface Corridor {
  plan: PlanCurve;
  profile: ProfileEval;
  stations: CorridorStation[];
  maxToe: number;
  fillVolume: number;
  cutVolume: number;
  maxFillDepth: number;
  maxCutDepth: number;
}

const TOE_SEARCH = 90;
const TOE_STEP = 0.5;

function findToe(
  terrain: TerrainData,
  x: number,
  z: number,
  nx: number,
  nz: number,
  halfFormation: number,
  formY: number,
  side: number
): ToeInfo {
  const sign = side >= 0 ? 1 : -1;
  const ex = x + nx * halfFormation * sign;
  const ez = z + nz * halfFormation * sign;
  const edgeGround = sampleTerrain(terrain, ex, ez);
  const depth = formY - edgeGround;
  const mode: SideMode = Math.abs(depth) < 0.08 ? "flat" : depth > 0 ? "fill" : "cut";
  const slope = mode === "cut" ? TRACK.cutSlope : TRACK.fillSlope;

  const slopeY = (off: number) =>
    mode === "cut"
      ? formY + (off - halfFormation) / slope
      : formY - (off - halfFormation) / slope;

  let toeOffset = halfFormation;
  let toeGround = edgeGround;
  let prevOff = halfFormation;
  let prevDelta = 0;
  let found = false;

  if (mode !== "flat") {
    for (let off = halfFormation + TOE_STEP; off <= TOE_SEARCH; off += TOE_STEP) {
      const gx = x + nx * off * sign;
      const gz = z + nz * off * sign;
      const g = sampleTerrain(terrain, gx, gz);
      const delta = slopeY(off) - g;
      if (off === halfFormation + TOE_STEP) prevDelta = delta;
      if (mode === "fill" ? delta <= 0 : delta >= 0) {
        const t = Math.abs(prevDelta) / Math.max(1e-6, Math.abs(prevDelta) + Math.abs(delta));
        const hitOff = prevOff + (off - prevOff) * clamp(t, 0, 1);
        toeOffset = hitOff;
        toeGround = sampleTerrain(
          terrain,
          x + nx * hitOff * sign,
          z + nz * hitOff * sign
        );
        found = true;
        break;
      }
      prevOff = off;
      prevDelta = delta;
    }
  }

  if (!found) {
    // 未找到相交：按最大搜索距离收尾，避免断面无法闭合。
    toeOffset = mode === "flat" ? halfFormation : TOE_SEARCH;
    toeGround =
      mode === "flat"
        ? edgeGround
        : slopeY(toeOffset);
  }

  if (mode === "flat") {
    toeOffset = halfFormation + 0.9;
    toeGround = edgeGround;
  }

  return { mode, offset: toeOffset, groundY: toeGround, edgeGroundY: edgeGround, depth };
}

export function buildCorridor(
  terrain: TerrainData,
  planPoints: PlanPoint[],
  profilePoints: ProfilePoint[],
  settings: ProjectSettings
): Corridor {
  const plan = buildPlanCurve(planPoints);
  const profile = buildProfile(profilePoints);
  const halfFormation = formationHalfWidth(settings.ballastWidth);
  const ballastTopHalf = settings.ballastWidth / 2;
  const ballastBottomHalf = ballastTopHalf + TRACK.ballastHeight * TRACK.ballastSlope;

  const stations: CorridorStation[] = [];
  let maxToe = halfFormation;
  let fillVolume = 0;
  let cutVolume = 0;
  let maxFillDepth = 0;
  let maxCutDepth = 0;

  const samples = plan.samples;
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const railY = profile.evalY(p.s);
    const formY = railY - TRACK.railToFormation;
    const left = findToe(terrain, p.x, p.z, p.nx, p.nz, halfFormation, formY, 1);
    const right = findToe(terrain, p.x, p.z, p.nx, p.nz, halfFormation, formY, -1);
    maxToe = Math.max(maxToe, left.offset, right.offset);
    if (left.depth > 0) maxFillDepth = Math.max(maxFillDepth, left.depth);
    if (right.depth > 0) maxFillDepth = Math.max(maxFillDepth, right.depth);
    if (left.depth < 0) maxCutDepth = Math.max(maxCutDepth, -left.depth);
    if (right.depth < 0) maxCutDepth = Math.max(maxCutDepth, -right.depth);
    stations.push({
      s: p.s,
      x: p.x,
      z: p.z,
      tx: p.tx,
      tz: p.tz,
      nx: p.nx,
      nz: p.nz,
      railY,
      formY,
      ballastTopHalf,
      ballastBottomHalf,
      halfFormation,
      yBallastTop: formY + TRACK.ballastHeight,
      left,
      right,
    });
  }

  // 平滑坡脚偏移：坡脚由离散地形采样得到，直接使用会出现锯齿。
  // 用滑动平均 + 单调限幅处理，让边坡线连续。
  smoothToes(stations);

  // 统一断面模式：一侧填、一侧挖会让人难以判断该断面归属，
  // 按两侧高差绝对值更大的那一侧决定整断面为填方或挖方。
  for (const st of stations) {
    const net = st.left.depth + st.right.depth;
    const mode: SideMode = Math.abs(net) < 0.12 ? "flat" : net > 0 ? "fill" : "cut";
    st.left.mode = mode;
    st.right.mode = mode;
  }

  // 挖填方体积：断面积分（近似梯形）。
  for (let i = 1; i < stations.length; i++) {
    const a = stations[i - 1];
    const b = stations[i];
    const ds = b.s - a.s;
    if (ds <= 0) continue;
    for (const side of ["left", "right"] as const) {
      const ta = a[side];
      const tb = b[side];
      const widthA = Math.max(0, ta.offset - halfFormation);
      const widthB = Math.max(0, tb.offset - halfFormation);
      const areaA = Math.abs(ta.depth) * halfFormation + 0.5 * Math.abs(ta.depth) * widthA;
      const areaB = Math.abs(tb.depth) * halfFormation + 0.5 * Math.abs(tb.depth) * widthB;
      const d = (ta.depth + tb.depth) / 2;
      if (d > 0.01) fillVolume += ((areaA + areaB) / 2) * ds;
      else if (d < -0.01) cutVolume += ((areaA + areaB) / 2) * ds;
    }
  }

  return {
    plan,
    profile,
    stations,
    maxToe,
    fillVolume,
    cutVolume,
    maxFillDepth,
    maxCutDepth,
  };
}

/** 对两侧坡脚偏移量做滑动平均，消除逐站搜索带来的锯齿。 */
function smoothToes(stations: CorridorStation[], window = 5) {
  if (stations.length < 3) return;
  for (const key of ["left", "right"] as const) {
    const raw = stations.map((s) => s[key].offset);
    const out = raw.slice();
    for (let i = 0; i < raw.length; i++) {
      let sum = 0;
      let wsum = 0;
      for (let k = -window; k <= window; k++) {
        const j = i + k;
        if (j < 0 || j >= raw.length) continue;
        const w = window + 1 - Math.abs(k);
        sum += raw[j] * w;
        wsum += w;
      }
      out[i] = sum / Math.max(wsum, 1);
    }
    for (let i = 0; i < stations.length; i++) {
      const side = stations[i][key];
      const newOffset = Math.max(stations[i].halfFormation, out[i]);
      const groundY = side.groundY;
      side.offset = newOffset;
      // 坡脚高程：填方取边坡延伸值，挖方沿地面平滑值
      if (side.mode === "cut") {
        const slope = 1 / TRACK.cutSlope;
        side.groundY = Math.max(groundY, stations[i].formY + (newOffset - stations[i].halfFormation) * slope);
      } else if (side.mode === "fill") {
        const slope = 1 / TRACK.fillSlope;
        side.groundY = Math.min(groundY, stations[i].formY - (newOffset - stations[i].halfFormation) * slope);
      } else {
        side.groundY = groundY;
      }
    }
  }
}

/** 沿线的地面高程序列，用于纵断面图。 */
export function groundProfileAlong(corridor: Corridor, terrain: TerrainData, step = 6) {
  const out: { s: number; y: number }[] = [];
  const samples = corridor.plan.samples;
  if (samples.length < 2) return out;
  const total = corridor.plan.length;
  const n = Math.max(2, Math.round(total / step));
  for (let i = 0; i <= n; i++) {
    const s = (total * i) / n;
    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].s < s) lo = mid + 1;
      else hi = mid;
    }
    const b = samples[Math.min(lo, samples.length - 1)];
    const a = samples[Math.max(0, lo - 1)];
    const span = b.s - a.s;
    const t = span > 1e-6 ? (s - a.s) / span : 0;
    // 横向取三点平均以反映路肩范围
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    const nx = a.nx + (b.nx - a.nx) * t;
    const nz = a.nz + (b.nz - a.nz) * t;
    const off = corridor.stations[0]?.halfFormation ?? 3;
    const y =
      (sampleTerrain(terrain, x, z) * 2 +
        sampleTerrain(terrain, x + nx * off, z + nz * off) +
        sampleTerrain(terrain, x - nx * off, z - nz * off)) /
      4;
    out.push({ s, y });
  }
  return out;
}

/** 沿线取任意里程处的坐标与方向（线性插值）。 */
export function pathAt(corridor: Corridor, s: number) {
  const samples = corridor.plan.samples;
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
  const b = samples[lo];
  const a = samples[Math.max(0, lo - 1)];
  const span = b.s - a.s;
  const t = span > 1e-6 ? (s - a.s) / span : 0;
  return {
    s,
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    tx: a.tx + (b.tx - a.tx) * t,
    tz: a.tz + (b.tz - a.tz) * t,
    nx: a.nx + (b.nx - a.nx) * t,
    nz: a.nz + (b.nz - a.nz) * t,
  };
}
