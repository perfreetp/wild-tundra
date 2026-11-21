import type { TerrainData } from "./types.ts";
import { TRACK } from "./types.ts";
import type { Corridor, CorridorStation } from "./corridor.ts";
import { clamp } from "./math.ts";

export interface CorridorRaster {
  width: number;
  height: number;
  cell: number;
  originX: number;
  originZ: number;
  /** 每个像元的 (整平面 - 地面) 高差，正=填方，负=挖方，0=未扰动 */
  delta: Float32Array;
  /** 1=填方区，-1=挖方区，0=无 */
  zone: Int8Array;
  /** 归一化到 [0,1] 的到坡脚的距离（用于着色渐隐） */
  edgeFade: Float32Array;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const RASTER_CELL = 2;

/** 站点的断面高程（给定横向偏移，左正右负）。 */
export function sectionY(st: CorridorStation, offset: number): number {
  const absOff = Math.abs(offset);
  if (absOff <= st.halfFormation) return st.formY;
  const side = offset >= 0 ? st.left : st.right;
  const rise = (absOff - st.halfFormation) / (side.mode === "cut" ? TRACK.cutSlope : TRACK.fillSlope);
  return side.mode === "cut" ? st.formY + rise : st.formY - rise;
}

/** 把走廊断面栅格化到地形范围上，供着色与整平网格共用。 */
export function rasterizeCorridor(terrain: TerrainData, corridor: Corridor): CorridorRaster {
  const minX = terrain.originX;
  const minZ = terrain.originZ;
  const width = Math.max(2, Math.ceil(((terrain.nx - 1) * terrain.cell) / RASTER_CELL));
  const height = Math.max(2, Math.ceil(((terrain.nz - 1) * terrain.cell) / RASTER_CELL));
  const delta = new Float32Array(width * height);
  const zone = new Int8Array(width * height);
  const edgeFade = new Float32Array(width * height);
  // 记录每个像元归属桩号的纵向距离：相邻桩号的覆盖带会重叠，
  // 必须按“最近桩号”归属，否则边界会沿里程出现锯齿。
  const alongAbs = new Float32Array(width * height).fill(Infinity);
  const stations = corridor.stations;
  if (stations.length < 2) {
    return {
      width, height, cell: RASTER_CELL, originX: minX, originZ: minZ,
      delta, zone, edgeFade, minX, maxX: minX, maxZ: minZ, minZ,
    };
  }
  const maxToe = corridor.maxToe;

  // 每一站只处理其影响范围内的像元
  for (let k = 0; k < stations.length; k++) {
    const st = stations[k];
    const reach = Math.max(st.left.offset, st.right.offset) + RASTER_CELL * 1.5;
    const minI = Math.max(0, Math.floor((st.x - reach - minX) / RASTER_CELL));
    const maxI = Math.min(width - 1, Math.ceil((st.x + reach - minX) / RASTER_CELL));
    const minJ = Math.max(0, Math.floor((st.z - reach - minZ) / RASTER_CELL));
    const maxJ = Math.min(height - 1, Math.ceil((st.z + reach - minZ) / RASTER_CELL));
    if (minI > maxI || minJ > maxJ) continue;
    // 沿线路方向覆盖到相邻桩号的一半距离，保证栅格无缝拼接
    const dPrev = k > 0 ? st.s - stations[k - 1].s : 0;
    const dNext = k < stations.length - 1 ? stations[k + 1].s - st.s : 0;
    const halfAlong = Math.max(RASTER_CELL * 1.2, (dPrev + dNext) * 0.55);

    for (let j = minJ; j <= maxJ; j++) {
      const z = minZ + (j + 0.5) * RASTER_CELL;
      const dz = z - st.z;
      for (let i = minI; i <= maxI; i++) {
        const x = minX + (i + 0.5) * RASTER_CELL;
        const dx = x - st.x;
        const along = dx * st.tx + dz * st.tz;
        if (Math.abs(along) > halfAlong) continue;
        const offset = dx * st.nx + dz * st.nz;
        const side = offset >= 0 ? st.left : st.right;
        const absOff = Math.abs(offset);
        // 严格止于坡脚：挖填分界线就是要表达这条边界
        if (absOff > side.offset + 0.6) continue;
        const d = sectionY(st, offset) - groundAt(terrain, x, z);
        const idx = j * width + i;
        const aAbs = Math.abs(along);
        if (aAbs >= alongAbs[idx]) continue;
        alongAbs[idx] = aAbs;
        // 填挖符号统一取整断面模式，避免两个桩号边界交错出现噪点
        const forcedZone = st.left.mode === "cut" ? -1 : st.left.mode === "fill" ? 1 : 0;
        delta[idx] = clamp(d, -60, 60);
        zone[idx] = forcedZone !== 0
          ? forcedZone
          : d > 0.05 ? 1 : d < -0.05 ? -1 : 0;
        const span = Math.max(1, side.offset);
        edgeFade[idx] = clamp(absOff / span, 0, 1);
      }
    }
  }

  // 清理孤立像元：与四邻域符号都相反的单元视为噪声，按邻居多数改写。
  cleanZones(zone, width, height);

  return {
    width, height, cell: RASTER_CELL, originX: minX, originZ: minZ,
    delta, zone, edgeFade, minX, maxX: minX + width * RASTER_CELL, maxZ: minZ + height * RASTER_CELL, minZ,
  };
}

/** 去除栅格中的孤立反转像元，使填挖边界连续。 */
function cleanZones(zone: Int8Array, width: number, height: number) {
  const src = zone.slice();
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const idx = j * width + i;
      const z = src[idx];
      if (z === 0) continue;
      let same = 0;
      let opposite = 0;
      const nb: number[] = [];
      if (i > 0) nb.push(idx - 1);
      if (i < width - 1) nb.push(idx + 1);
      if (j > 0) nb.push(idx - width);
      if (j < height - 1) nb.push(idx + width);
      for (const n of nb) {
        if (src[n] === z) same++;
        else if (src[n] === -z) opposite++;
      }
      // 四个正交邻居全部为反号 → 该像元多半是采样噪声
      if (opposite >= 3 && same === 0) zone[idx] = -z;
    }
  }
}

/** 栅格范围内最近的地面高度（与地形网格一致的双线性插值）。 */
function groundAt(terrain: TerrainData, x: number, z: number): number {
  const fx = clamp((x - terrain.originX) / terrain.cell, 0, terrain.nx - 1.000001);
  const fz = clamp((z - terrain.originZ) / terrain.cell, 0, terrain.nz - 1.000001);
  const i0 = Math.floor(fx);
  const j0 = Math.floor(fz);
  const tx = fx - i0;
  const tz = fz - j0;
  const i1 = Math.min(i0 + 1, terrain.nx - 1);
  const j1 = Math.min(j0 + 1, terrain.nz - 1);
  const h = terrain.heights;
  const a = h[j0 * terrain.nx + i0] + (h[j0 * terrain.nx + i1] - h[j0 * terrain.nx + i0]) * tx;
  const b = h[j1 * terrain.nx + i0] + (h[j1 * terrain.nx + i1] - h[j1 * terrain.nx + i0]) * tx;
  return a + (b - a) * tz;
}

export function rasterStats(r: CorridorRaster) {
  let fill = 0;
  let cut = 0;
  let maxFill = 0;
  let maxCut = 0;
  for (let i = 0; i < r.zone.length; i++) {
    const z = r.zone[i];
    if (z > 0) {
      fill++;
      maxFill = Math.max(maxFill, r.delta[i]);
    } else if (z < 0) {
      cut++;
      maxCut = Math.max(maxCut, -r.delta[i]);
    }
  }
  return {
    fillCells: fill,
    cutCells: cut,
    fillArea: fill * r.cell * r.cell,
    cutArea: cut * r.cell * r.cell,
    maxFill,
    maxCut,
  };
}
