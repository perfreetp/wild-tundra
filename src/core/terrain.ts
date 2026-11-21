import type { TerrainData } from "./types.ts";
import { clamp, fbm2, smoothstep } from "./math.ts";

export const TERRAIN_DEFAULT = {
  width: 1280,
  depth: 960,
  cell: 2,
  seed: 20261,
};

/** Height function used to synthesise the demo terrain. */
function terrainHeight(x: number, z: number, seed: number): number {
  const nx = x / 620;
  const nz = z / 460;
  // Large scale rolling relief.
  const macro = fbm2(nx * 1.25 + 3.1, nz * 1.25 - 7.4, seed, 4) - 0.5;
  const meso = fbm2(nx * 3.3 - 11.0, nz * 3.3 + 4.7, seed + 31, 4) - 0.5;
  const micro = fbm2(nx * 11.0 + 2.3, nz * 11.0 + 9.1, seed + 77, 3) - 0.5;

  let h = 34 + macro * 38 + meso * 11 + micro * 2.4;

  // A ridge running north-south, offset to one side.
  const ridgeAxis = -150 + Math.sin(nz * 1.9) * 90;
  const dRidge = (x - ridgeAxis) / 230;
  h += 15 * Math.exp(-dRidge * dRidge) * (0.55 + 0.45 * fbm2(nz * 2.1, 0.5, seed + 5, 3));

  // A shallow river valley crossing east-west near z = +120.
  const valley = Math.exp(-Math.pow((z - 150 + Math.sin(nx * 2.2) * 40) / 95, 2));
  h -= 15 * valley;

  // Flatten a broad shelf near the middle-east so the alignment has somewhere sane to run.
  // 中部缓坡台地：让线路有合理的填挖交替空间
  const shelf = smoothstep(1 - Math.hypot((x - 120) / 640, (z + 60) / 420));
  h = h * (1 - shelf * 0.7) + 32 * shelf * 0.7;

  return h;
}

export function createTerrain(opts?: Partial<typeof TERRAIN_DEFAULT>): TerrainData {
  const cfg = { ...TERRAIN_DEFAULT, ...(opts ?? {}) };
  const nx = Math.round(cfg.width / cfg.cell) + 1;
  const nz = Math.round(cfg.depth / cfg.cell) + 1;
  const originX = -cfg.width / 2;
  const originZ = -cfg.depth / 2;
  const heights = new Float32Array(nx * nz);
  let minH = Infinity;
  let maxH = -Infinity;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = originX + i * cfg.cell;
      const z = originZ + j * cfg.cell;
      const h = terrainHeight(x, z, cfg.seed);
      heights[j * nx + i] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
  }
  return { nx, nz, cell: cfg.cell, originX, originZ, heights, minH, maxH };
}

export function terrainBounds(t: TerrainData) {
  return {
    minX: t.originX,
    maxX: t.originX + (t.nx - 1) * t.cell,
    minZ: t.originZ,
    maxZ: t.originZ + (t.nz - 1) * t.cell,
  };
}

/** Bilinear height sample, clamped to the terrain edge. */
export function sampleTerrain(t: TerrainData, x: number, z: number): number {
  const fx = clamp((x - t.originX) / t.cell, 0, t.nx - 1.000001);
  const fz = clamp((z - t.originZ) / t.cell, 0, t.nz - 1.000001);
  const i0 = Math.floor(fx);
  const j0 = Math.floor(fz);
  const tx = fx - i0;
  const tz = fz - j0;
  const i1 = Math.min(i0 + 1, t.nx - 1);
  const j1 = Math.min(j0 + 1, t.nz - 1);
  const h00 = t.heights[j0 * t.nx + i0];
  const h10 = t.heights[j0 * t.nx + i1];
  const h01 = t.heights[j1 * t.nx + i0];
  const h11 = t.heights[j1 * t.nx + i1];
  const a = h00 + (h10 - h00) * tx;
  const b = h01 + (h11 - h01) * tx;
  return a + (b - a) * tz;
}

export function terrainNormal(
  t: TerrainData,
  x: number,
  z: number
): [number, number, number] {
  const e = Math.max(t.cell * 0.5, 0.5);
  const hx = sampleTerrain(t, x + e, z) - sampleTerrain(t, x - e, z);
  const hz = sampleTerrain(t, x, z + e) - sampleTerrain(t, x, z - e);
  const nx = -hx / (2 * e);
  const nz = -hz / (2 * e);
  const len = Math.hypot(nx, 1, nz);
  return [nx / len, 1 / len, nz / len];
}

/** Statistics helpful for UI badges. */
export function terrainStats(t: TerrainData) {
  return {
    cells: (t.nx - 1) * (t.nz - 1),
    width: (t.nx - 1) * t.cell,
    depth: (t.nz - 1) * t.cell,
    minH: t.minH,
    maxH: t.maxH,
  };
}
