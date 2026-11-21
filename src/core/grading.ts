import type { TerrainData } from "./types.ts";
import { TRACK } from "./types.ts";
import type { Corridor, CorridorStation } from "./corridor.ts";
import { sectionY } from "./raster.ts";
import { clamp } from "./math.ts";

/** 以空间桶索引站点，加速沿线最近站点检索。 */
export class StationIndex {
  private buckets = new Map<number, number[]>();
  private bucketSize = 24;
  private stations: CorridorStation[];

  constructor(stations: CorridorStation[]) {
    this.stations = stations;
    for (let i = 0; i < stations.length; i++) {
      const st = stations[i];
      const key = this.key(st.x, st.z);
      let list = this.buckets.get(key);
      if (!list) {
        list = [];
        this.buckets.set(key, list);
      }
      list.push(i);
    }
  }

  private key(x: number, z: number) {
    const bx = Math.floor(x / this.bucketSize);
    const bz = Math.floor(z / this.bucketSize);
    return (bx + 4096) * 8192 + (bz + 4096);
  }

  /** 返回距该点最近的站点，以及横向/纵向偏移。 */
  nearest(x: number, z: number, maxDist = 140): {
    station: CorridorStation;
    offset: number;
    along: number;
  } | null {
    const bx = Math.floor(x / this.bucketSize);
    const bz = Math.floor(z / this.bucketSize);
    let best: CorridorStation | null = null;
    let bestD = Infinity;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const list = this.buckets.get((bx + dx + 4096) * 8192 + (bz + dz + 4096));
        if (!list) continue;
        for (const idx of list) {
          const st = this.stations[idx];
          const d = Math.hypot(st.x - x, st.z - z);
          if (d < bestD) {
            bestD = d;
            best = st;
          }
        }
      }
    }
    if (!best || bestD > maxDist) return null;
    const dx = x - best.x;
    const dz = z - best.z;
    return {
      station: best,
      offset: dx * best.nx + dz * best.nz,
      along: dx * best.tx + dz * best.tz,
    };
  }
}

export interface GradedTerrain {
  heights: Float32Array;
  /** 每个顶点是否被工程改变（用于着色/统计） */
  touched: Uint8Array;
  /** 填方覆盖强度 0..1（每顶点，解析计算，边界连续） */
  fill: Float32Array;
  /** 挖方覆盖强度 0..1 */
  cut: Float32Array;
}

/**
 * 按走廊断面“开挖/填筑”地形顶点：
 *  - 挖方区把地面压到设计面（含边坡），形成真正切开的堑口；
 *  - 填方区保持原地形，由路基网格叠加显示。
 */
export function excavateTerrain(
  terrain: TerrainData,
  corridor: Corridor
): GradedTerrain {
  const { nx, nz, cell, originX, originZ, heights } = terrain;
  const out = new Float32Array(heights);
  const touched = new Uint8Array(nx * nz);
  const fill = new Float32Array(nx * nz);
  const cut = new Float32Array(nx * nz);
  const stations = corridor.stations;
  if (stations.length < 2) return { heights: out, touched, fill, cut };

  const index = new StationIndex(stations);
  const searchReach = corridor.maxToe + cell * 4;
  const half = stations[0].halfFormation;

  // 走廊包围盒：只处理可能受影响的顶点
  let cx0 = Infinity, cx1 = -Infinity, cz0 = Infinity, cz1 = -Infinity;
  for (const st of stations) {
    const r = Math.max(st.left.offset, st.right.offset, half) + cell * 3;
    if (st.x - r < cx0) cx0 = st.x - r;
    if (st.x + r > cx1) cx1 = st.x + r;
    if (st.z - r < cz0) cz0 = st.z - r;
    if (st.z + r > cz1) cz1 = st.z + r;
  }
  const i0 = clamp(Math.floor((cx0 - originX) / cell), 0, nx - 1);
  const i1 = clamp(Math.ceil((cx1 - originX) / cell), 0, nx - 1);
  const j0 = clamp(Math.floor((cz0 - originZ) / cell), 0, nz - 1);
  const j1 = clamp(Math.ceil((cz1 - originZ) / cell), 0, nz - 1);

  for (let j = j0; j <= j1; j++) {
    const z = originZ + j * cell;
    for (let i = i0; i <= i1; i++) {
      const x = originX + i * cell;
      const near = index.nearest(x, z, searchReach);
      if (!near) continue;
      const { station: st, offset } = near;
      const side = offset >= 0 ? st.left : st.right;
      const absOff = Math.abs(offset);
      // 用站点法向计算横向偏移，但在两个桩号之间做线性回退：
      // nearest 已保证站点距离足够近，纵向插值误差可忽略。
      if (absOff > side.offset + cell * 1.2) continue;
      const idx = j * nx + i;
      const strength = clamp(Math.abs(side.depth) / 3.0, 0.3, 1);
      if (side.mode === "fill") {
        fill[idx] = Math.max(fill[idx], strength * fillFade(absOff, side.offset, cell));
      } else if (side.mode === "cut") {
        cut[idx] = Math.max(cut[idx], strength * fillFade(absOff, side.offset, cell));
      }
      if (absOff <= half) {
        if (st.formY < out[idx]) out[idx] = st.formY;
        touched[idx] = 1;
      } else if (side.mode === "cut") {
        const gy = sectionY(st, offset);
        if (gy < out[idx] - 0.0005) {
          out[idx] = gy;
          touched[idx] = 1;
        }
      }
    }
  }
  return { heights: out, touched, fill, cut };
}

/** 坡脚内侧为 1，越过坡脚后一个网格宽度内渐隐到 0。 */
function fillFade(absOff: number, toe: number, cell: number) {
  if (absOff <= toe) return 1;
  return clamp(1 - (absOff - toe) / cell, 0, 1);
}

export interface GradingColors {
  fillTop: [number, number, number];
  fillSlope: [number, number, number];
  cutTop: [number, number, number];
  cutSlope: [number, number, number];
}

export const GRADING_COLORS: GradingColors = {
  fillTop: [0.85, 0.70, 0.47],
  fillSlope: [0.78, 0.62, 0.40],
  cutTop: [0.68, 0.70, 0.65],
  cutSlope: [0.60, 0.64, 0.61],
};

/**
 * 生成“工程整治面”网格：路基面 + 两侧边坡。
 * 填方边坡向下延伸至坡脚，挖方边坡向上延伸至坡顶。
 */
export function buildGradingGeometry(corridor: Corridor): {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
} {
  const stations = corridor.stations;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  if (stations.length < 2) {
    return {
      positions: new Float32Array(0), normals: new Float32Array(0),
      colors: new Float32Array(0), indices: new Uint32Array(0),
    };
  }

  const addQuad = (
    a0: number[], a1: number[], b0: number[], b1: number[],
    c0: number[], c1: number[], color: [number, number, number]
  ) => {
    const base = pos.length / 3;
    for (const p of [a0, a1, b0]) {
      pos.push(p[0], p[1], p[2]);
      col.push(color[0], color[1], color[2], 1);
    }
    for (const p of [b0, a1, b1]) {
      pos.push(p[0], p[1], p[2]);
      col.push(color[0], color[1], color[2], 1);
    }
    for (const p of [b0, b1, c0]) {
      pos.push(p[0], p[1], p[2]);
      col.push(color[0], color[1], color[2], 1);
    }
    for (const p of [c0, b1, c1]) {
      pos.push(p[0], p[1], p[2]);
      col.push(color[0], color[1], color[2], 1);
    }
    void base;
  };
  void addQuad;

  const half = stations[0].halfFormation;

  // ---------------- 路基面 ----------------
  const baseForm = pos.length / 3;
  for (const st of stations) {
    const isCut = st.left.mode === "cut" || st.right.mode === "cut";
    const c = isCut ? GRADING_COLORS.cutTop : GRADING_COLORS.fillTop;
    const l = [st.x + st.nx * half, st.formY, st.z + st.nz * half];
    const r = [st.x - st.nx * half, st.formY, st.z - st.nz * half];
    pos.push(l[0], l[1], l[2], r[0], r[1], r[2]);
    col.push(c[0], c[1], c[2], 1, c[0], c[1], c[2], 1);
  }
  for (let i = 0; i < stations.length - 1; i++) {
    const a = baseForm + i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  // ---------------- 填方边坡 ----------------
  // 挖方断面已在地形上直接开挖成堑口，无需重复建坡；
  // 填方断面需要补出向下的路堤边坡。坡脚处加密 2 个过渡点，
  // 让边坡末端稍微插入地面，避免出现悬空白边。
  const STRIDE = 4;
  for (const sideKey of ["left", "right"] as const) {
    const sign = sideKey === "left" ? 1 : -1;
    const c = GRADING_COLORS.fillSlope;
    // 逐段扫描：只在连续同为填方的桩号区间内生成边坡网格，
    // 这样挖方区段完全不产生多余三角形，也就不会出现碎片。
    let i = 0;
    while (i < stations.length) {
      const sideOf = (k: number) =>
        (sideKey === "left" ? stations[k].left : stations[k].right).mode === "fill";
      if (!sideOf(i)) { i++; continue; }
      let j = i;
      while (j + 1 < stations.length && sideOf(j + 1)) j++;
      // 生成 [i, j] 区间
      const baseSlope = pos.length / 3;
      for (let k = i; k <= j; k++) {
        const st = stations[k];
        const side = sideKey === "left" ? st.left : st.right;
        const e = { x: st.x + st.nx * half * sign, z: st.z + st.nz * half * sign, y: st.formY };
        const off = Math.max(half + 0.001, side.offset);
        const toeY = side.groundY + 0.05;
        const toe = { x: st.x + st.nx * off * sign, z: st.z + st.nz * off * sign, y: toeY };
        const m1 = {
          x: e.x + (toe.x - e.x) * 0.42,
          z: e.z + (toe.z - e.z) * 0.42,
          y: st.formY + (toeY - st.formY) * 0.42,
        };
        const m2 = {
          x: e.x + (toe.x - e.x) * 0.86,
          z: e.z + (toe.z - e.z) * 0.86,
          y: st.formY + (toeY - st.formY) * 0.86,
        };
        pos.push(e.x, e.y, e.z, m1.x, m1.y, m1.z, m2.x, m2.y, m2.z, toe.x, toe.y, toe.z);
        for (let q = 0; q < STRIDE; q++) col.push(c[0], c[1], c[2], 1);
      }
      const segCount = j - i;
      for (let k = 0; k < segCount; k++) {
        const a = baseSlope + k * STRIDE;
        const b = a + STRIDE;
        for (let q = 0; q < STRIDE - 1; q++) {
          if (sign > 0) {
            idx.push(a + q, b + q, a + q + 1, a + q + 1, b + q, b + q + 1);
          } else {
            idx.push(a + q, a + q + 1, b + q, a + q + 1, b + q + 1, b + q);
          }
        }
      }
      i = j + 1;
    }
  }

  // ---------------- 线路两端封口 ----------------
  // 填方边坡在线路起终点会以“断面”形式敞开，用竖直端墙闭合。
  for (const endIdx of [0, stations.length - 1]) {
    const st = stations[endIdx];
    const dirX = endIdx === 0 ? -st.tx : st.tx;
    const dirZ = endIdx === 0 ? -st.tz : st.tz;
    for (const sideKey of ["left", "right"] as const) {
      const side = sideKey === "left" ? st.left : st.right;
      if (side.mode !== "fill") continue;
      const sgn = sideKey === "left" ? 1 : -1;
      const o0 = half;
      const o1 = Math.max(half + 0.01, side.offset);
      const y0 = st.formY;
      const y1 = side.groundY + 0.05;
      const c = GRADING_COLORS.fillSlope;
      const base = pos.length / 3;
      pos.push(
        st.x + st.nx * o0 * sgn, y0, st.z + st.nz * o0 * sgn,
        st.x + st.nx * o0 * sgn, y1 - 0.4, st.z + st.nz * o0 * sgn,
        st.x + st.nx * o1 * sgn, y1, st.z + st.nz * o1 * sgn
      );
      for (let k = 0; k < 3; k++) col.push(c[0], c[1], c[2], 1);
      if (dirX * st.nx + dirZ * st.nz >= 0) {
        idx.push(base, base + 1, base + 2);
      } else {
        idx.push(base, base + 2, base + 1);
      }
    }
  }

  const verts = pos.length / 3;
  const positions = new Float32Array(pos);
  const colors = new Float32Array(col);
  const indices = new Uint32Array(idx);
  const normals = new Float32Array(verts * 3);
  computeNormalsFromIndex(positions, indices, normals);
  return { positions, normals, colors, indices };
}

function computeNormalsFromIndex(p: Float32Array, indices: Uint32Array, out: Float32Array) {
  out.fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const o of [a, b, c]) {
      out[o] += nx;
      out[o + 1] += ny;
      out[o + 2] += nz;
    }
  }
  for (let i = 0; i < out.length; i += 3) {
    const l = Math.hypot(out[i], out[i + 1], out[i + 2]) || 1;
    out[i] /= l;
    out[i + 1] /= l;
    out[i + 2] /= l;
  }
}

/** 工程网格的横断面面积（用于校核）。 */
export function formationArea(st: CorridorStation) {
  return st.halfFormation * 2;
}

export { TRACK };

/**
 * 沿坡脚（挖填分界线）生成贴地彩色描边带。
 * 填方边界为暖金色，挖方边界为青色，宽度约 0.6 m。
 */
export function buildBoundaryRibbon(corridor: Corridor): {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
} {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const stations = corridor.stations;
  if (stations.length < 2) {
    return { positions: new Float32Array(0), colors: new Float32Array(0), indices: new Uint32Array(0) };
  }
  const HALF_W = 0.5;
  const half = stations[0].halfFormation;
  const cutSlope = 1 / 1.15;
  const fillSlope = 1 / 1.5;

  for (const sideKey of ["left", "right"] as const) {
    const sign = sideKey === "left" ? 1 : -1;
    const base = pos.length / 3;
    for (let i = 0; i < stations.length; i++) {
      const st = stations[i];
      const side = sideKey === "left" ? st.left : st.right;
      const c: [number, number, number] =
        side.mode === "cut" ? [0.55, 0.93, 1.0] : [1.0, 0.8, 0.42];
      const ox = st.nx * sign;
      const oz = st.nz * sign;
      // 描边带贴在坡面上、略偏内侧：挖方坡脚处坡面与地形等高，
      // 直接放在坡脚容易被地形三角面切出齿状缺口。
      const innerOff = Math.max(half + 0.2, side.offset - 0.55);
      const innerY = side.mode === "cut"
        ? st.formY + (innerOff - half) * cutSlope
        : st.formY - (innerOff - half) * fillSlope;
      const y = innerY + 0.12;
      const w = side.mode === "cut" ? HALF_W * 0.45 : HALF_W * 0.8;
      pos.push(
        st.x + ox * (innerOff - w), y, st.z + oz * (innerOff - w),
        st.x + ox * (innerOff + w), y, st.z + oz * (innerOff + w)
      );
      col.push(c[0], c[1], c[2], 1, c[0], c[1], c[2], 1);
    }
    for (let i = 0; i < stations.length - 1; i++) {
      const aSide = sideKey === "left" ? stations[i].left : stations[i].right;
      const bSide = sideKey === "left" ? stations[i + 1].left : stations[i + 1].right;
      // 填/挖模式切换处断开，否则描边会被拉成斜穿场地的长条
      if (aSide.mode !== bSide.mode) continue;
      const a = base + i * 2;
      if (sign > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  return {
    positions: new Float32Array(pos),
    colors: new Float32Array(col),
    indices: new Uint32Array(idx),
  };
}
