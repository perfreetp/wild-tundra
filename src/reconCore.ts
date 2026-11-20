// 重建核心算法：与 UI/Worker 解耦，便于在 Node 中单独测试。
import type Module from 'manifold-3d';

export type ManifoldModule = Awaited<ReturnType<typeof Module>>;

export interface RawMesh {
  positions: Float32Array;
  indices: Uint32Array;
}

// ---------- Marching Tetrahedra ----------

// 立方体 8 角点偏移（x 最快）
const CORNER: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];
// 立方体的 6 四面体剖分（主对角线 0-6）
const TETS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6],
  [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6],
];
// 四面体 6 条边的端点（局部编号）
const TET_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
];

/**
 * 对阈值带 [tmin, tmax] 定义的蒙版做 marching tetrahedra。
 * 标量场 f(v) = min(v - tmin, tmax - v)，内部 f >= 0，等值面 f = 0。
 */
export function marchingTets(
  dims: [number, number, number],
  volume: Float32Array,
  tmin: number,
  tmax: number,
): RawMesh {
  const [nx, ny, nz] = dims;
  // 加 1 圈“外部”padding（f = -1），保证贴边界的蒙版也能生成封闭表面
  const px = nx + 2, py = ny + 2, pz = nz + 2;
  const field = new Float32Array(px * py * pz).fill(-1);
  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      const dstBase = (x: number) => (x + 1) + px * ((y + 1) + py * (z + 1));
      const srcBase = nx * (y + ny * z);
      for (let x = 0; x < nx; x++) {
        const v = volume[srcBase + x];
        field[dstBase(x)] = Math.min(v - tmin, tmax - v);
      }
    }
  }

  const positions: number[] = [];
  const indices: number[] = [];
  // 网格边 -> 顶点编号 缓存（key = 小端点编号 * 总顶点数 + 大端点编号）
  const total = px * py * pz;
  const edgeCache = new Map<number, number>();

  const cornerIdx = new Int32Array(8); // 角点线性编号
  const cornerF = new Float32Array(8); // 角点场值

  const interp = (a: number, b: number, fa: number, fb: number): number => {
    const key = a < b ? a * total + b : b * total + a;
    const hit = edgeCache.get(key);
    if (hit !== undefined) return hit;
    const t = fa / (fa - fb); // f=0 处
    const ax = a % px, ay = ((a / px) | 0) % py, az = (a / (px * py)) | 0;
    const bx = b % px, by = ((b / px) | 0) % py, bz = (b / (px * py)) | 0;
    const idx = positions.length / 3;
    // 注意：此处为 padded 坐标，统一在循环结束后减 1 回到原体数据坐标系
    positions.push(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
    edgeCache.set(key, idx);
    return idx;
  };

  const tetV = new Array<number>(4);
  const tetF = new Array<number>(4);

  const emitTri = (a: number, b: number, c: number, dx: number, dy: number, dz: number) => {
    // 保证法线朝外：与“内侧角点质心 → 外侧角点质心”方向同向
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const ccx = positions[c * 3], ccy = positions[c * 3 + 1], ccz = positions[c * 3 + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = ccx - ax, vy = ccy - ay, vz = ccz - az;
    const nx2 = uy * vz - uz * vy, ny2 = uz * vx - ux * vz, nz2 = ux * vy - uy * vx;
    if (nx2 * dx + ny2 * dy + nz2 * dz < 0) {
      indices.push(a, c, b);
    } else {
      indices.push(a, b, c);
    }
  };

  for (let z = 0; z < pz - 1; z++) {
    for (let y = 0; y < py - 1; y++) {
      for (let x = 0; x < px - 1; x++) {
        const base = x + px * (y + py * z);
        // 立方体 8 角点
        let anyIn = false, anyOut = false;
        for (let c = 0; c < 8; c++) {
          const [ox, oy, oz] = CORNER[c];
          const gi = base + ox + px * (oy + py * oz);
          cornerIdx[c] = gi;
          const f = field[gi];
          cornerF[c] = f;
          if (f >= 0) anyIn = true; else anyOut = true;
        }
        if (!anyIn || !anyOut) continue;

        for (const tet of TETS) {
          let mask = 0;
          for (let i = 0; i < 4; i++) {
            tetV[i] = cornerIdx[tet[i]];
            tetF[i] = cornerF[tet[i]];
            if (tetF[i] >= 0) mask |= 1 << i;
          }
          if (mask === 0 || mask === 15) continue;

          const inside: number[] = [];
          const outside: number[] = [];
          for (let i = 0; i < 4; i++) (mask & (1 << i) ? inside : outside).push(i);

          // 定向基准：内侧角点质心 → 外侧角点质心
          let ix = 0, iy = 0, iz = 0, ox = 0, oy = 0, oz = 0;
          for (const i of inside) {
            const gi = tetV[i];
            ix += gi % px; iy += ((gi / px) | 0) % py; iz += (gi / (px * py)) | 0;
          }
          for (const i of outside) {
            const gi = tetV[i];
            ox += gi % px; oy += ((gi / px) | 0) % py; oz += (gi / (px * py)) | 0;
          }
          const dx = ox / outside.length - ix / inside.length;
          const dy = oy / outside.length - iy / inside.length;
          const dz = oz / outside.length - iz / inside.length;

          // 边上插值点（按需）
          const ev = new Array<number>(6).fill(-1);
          const edgePoint = (e: number): number => {
            if (ev[e] >= 0) return ev[e];
            const [i, j] = TET_EDGES[e];
            ev[e] = interp(tetV[i], tetV[j], tetF[i], tetF[j]);
            return ev[e];
          };
          // 顶点 i 与 j 之间的边编号
          const edgeOf = (i: number, j: number): number => {
            for (let e = 0; e < 6; e++) {
              const [a, b] = TET_EDGES[e];
              if ((a === i && b === j) || (a === j && b === i)) return e;
            }
            return -1;
          };

          if (inside.length === 1 || inside.length === 3) {
            const single = inside.length === 1 ? inside[0] : outside[0];
            const others = [0, 1, 2, 3].filter((i) => i !== single);
            emitTri(
              edgePoint(edgeOf(single, others[0])),
              edgePoint(edgeOf(single, others[1])),
              edgePoint(edgeOf(single, others[2])),
              dx, dy, dz,
            );
          } else {
            // 2 内 2 外：四边形 = 两个三角形
            const [i1, i2] = inside;
            const [o1, o2] = outside;
            const p1 = edgePoint(edgeOf(i1, o1));
            const p2 = edgePoint(edgeOf(i1, o2));
            const p3 = edgePoint(edgeOf(i2, o2));
            const p4 = edgePoint(edgeOf(i2, o1));
            emitTri(p1, p2, p3, dx, dy, dz);
            emitTri(p1, p3, p4, dx, dy, dz);
          }
        }
      }
    }
  }

  const pos = new Float32Array(positions);
  for (let i = 0; i < pos.length; i++) pos[i] -= 1; // padded → 原坐标系
  return {
    positions: pos,
    indices: new Uint32Array(indices),
  };
}

// ---------- 流形修复：布尔合并 + 去孤立小块 ----------

export interface RepairResult {
  mesh: RawMesh;
  components: number;
  repaired: boolean;
}

export async function repairWithManifold(
  M: ManifoldModule,
  raw: RawMesh,
): Promise<RepairResult> {
  try {
    const mesh = new M.Mesh({
      numProp: 3,
      vertProperties: raw.positions,
      triVerts: raw.indices,
    });
    mesh.merge(); // 合并重合顶点，保证边流形
    const man = new M.Manifold(mesh);

    if (man.isEmpty()) {
      man.delete();
      return { mesh: raw, components: 0, repaired: false };
    }

    // 分解连通分量，布尔合并体积不小于最大分量 1% 的部分，去掉孤立小块
    const comps = man.decompose();
    man.delete();
    let kept: typeof man;
    let keptCount = comps.length;
    if (comps.length > 1) {
      const vols = comps.map((c) => c.volume());
      const maxVol = Math.max(...vols);
      const keep = comps.filter((_, i) => vols[i] >= maxVol * 0.01);
      keptCount = keep.length;
      kept = M.Manifold.union(keep);
      for (const c of comps) c.delete();
    } else {
      kept = comps[0];
    }

    const out = kept.getMesh();
    kept.delete();
    const result: RawMesh = {
      positions: out.vertProperties.slice(0, out.numVert * 3) as Float32Array,
      indices: out.triVerts as Uint32Array,
    };
    return { mesh: result, components: keptCount, repaired: true };
  } catch (e) {
    console.warn('manifold 修复失败，返回原始网格:', e);
    return { mesh: raw, components: 0, repaired: false };
  }
}

// ---------- 顶点 CT 值三线性采样 ----------

export function sampleValues(
  dims: [number, number, number],
  volume: Float32Array,
  positions: Float32Array,
): Float32Array {
  const [nx, ny, nz] = dims;
  const n = positions.length / 3;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const px = positions[i * 3], py = positions[i * 3 + 1], pz = positions[i * 3 + 2];
    const x0 = Math.max(0, Math.min(nx - 2, Math.floor(px)));
    const y0 = Math.max(0, Math.min(ny - 2, Math.floor(py)));
    const z0 = Math.max(0, Math.min(nz - 2, Math.floor(pz)));
    const fx = Math.max(0, Math.min(1, px - x0));
    const fy = Math.max(0, Math.min(1, py - y0));
    const fz = Math.max(0, Math.min(1, pz - z0));
    const i000 = x0 + nx * (y0 + ny * z0);
    const i100 = i000 + 1;
    const i010 = i000 + nx;
    const i110 = i010 + 1;
    const i001 = i000 + nx * ny;
    const i101 = i001 + 1;
    const i011 = i001 + nx;
    const i111 = i011 + 1;
    const c00 = volume[i000] + (volume[i100] - volume[i000]) * fx;
    const c10 = volume[i010] + (volume[i110] - volume[i010]) * fx;
    const c01 = volume[i001] + (volume[i101] - volume[i001]) * fx;
    const c11 = volume[i011] + (volume[i111] - volume[i011]) * fx;
    const c0 = c00 + (c10 - c00) * fy;
    const c1 = c01 + (c11 - c01) * fy;
    out[i] = c0 + (c1 - c0) * fz;
  }
  return out;
}
