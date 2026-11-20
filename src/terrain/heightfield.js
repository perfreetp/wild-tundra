// 高度场:1024x1024 顶点网格,雕刻笔刷、笔画事务、32 步撤销/重做
export const N = 1024;                 // 每边顶点数
export const CELLS = N - 1;            // 每边格子数
export const WORLD_SIZE = 1024;        // 世界尺寸(米)
export const CELL = WORLD_SIZE / CELLS; // 单格世界尺寸(米)
export const CHUNK_SHIFT = 6;          // 块 = 64x64 格
export const CHUNKS_PER_SIDE = 16;

const MAX_UNDO = 32;

export class HeightField {
  constructor() {
    this.heights = new Float32Array(N * N);
    this.undoStack = [];
    this.redoStack = [];
    this.dirtyChunks = new Set(); // 待刷新顶点缓冲的块索引,由渲染层消费
    this.stroke = null;           // 当前笔画(一次按下-拖动-抬起)
  }

  /** 双线性采样(格坐标,自动夹取边界) */
  sample(gx, gz) {
    gx = Math.min(Math.max(gx, 0), N - 1);
    gz = Math.min(Math.max(gz, 0), N - 1);
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(x0 + 1, N - 1);
    const z1 = Math.min(z0 + 1, N - 1);
    const fx = gx - x0;
    const fz = gz - z0;
    const h = this.heights;
    const a = h[z0 * N + x0];
    const b = h[z0 * N + x1];
    const c = h[z1 * N + x0];
    const d = h[z1 * N + x1];
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  }

  /** 世界坐标采样 */
  sampleWorld(wx, wz) {
    return this.sample(wx / CELL, wz / CELL);
  }

  /** 中心差分地表法线,返回 [nx, ny, nz] */
  normalAt(x, z) {
    const h = this.heights;
    const xl = x > 0 ? x - 1 : x;
    const xr = x < N - 1 ? x + 1 : x;
    const zu = z > 0 ? z - 1 : z;
    const zd = z < N - 1 ? z + 1 : z;
    const nx = h[z * N + xl] - h[z * N + xr];
    const nz = h[zu * N + x] - h[zd * N + x];
    const ny = 2 * CELL;
    const inv = 1 / Math.hypot(nx, ny, nz);
    return [nx * inv, ny * inv, nz * inv];
  }

  /** 3x3 邻域加权平均(核 1-2-1 / 2-4-2 / 1-2-1) */
  avg3x3(x, z) {
    const h = this.heights;
    let sum = 0;
    let wsum = 0;
    for (let dz = -1; dz <= 1; dz++) {
      const cz = Math.min(Math.max(z + dz, 0), N - 1);
      for (let dx = -1; dx <= 1; dx++) {
        const cx = Math.min(Math.max(x + dx, 0), N - 1);
        const w = dx === 0 && dz === 0 ? 4 : dx === 0 || dz === 0 ? 2 : 1;
        sum += h[cz * N + cx] * w;
        wsum += w;
      }
    }
    return sum / wsum;
  }

  beginStroke() {
    this.stroke = { backup: new Map(), x0: N, z0: N, x1: -1, z1: -1 };
  }

  /** 写入单个顶点高度;笔画内首触备份原值,并标记脏块 */
  setHeight(x, z, v) {
    const i = z * N + x;
    const st = this.stroke;
    if (st) {
      if (!st.backup.has(i)) st.backup.set(i, this.heights[i]);
      if (x < st.x0) st.x0 = x;
      if (x > st.x1) st.x1 = x;
      if (z < st.z0) st.z0 = z;
      if (z > st.z1) st.z1 = z;
    }
    this.heights[i] = v;
    this.dirtyChunks.add((z >> CHUNK_SHIFT) * CHUNKS_PER_SIDE + (x >> CHUNK_SHIFT));
  }

  /**
   * 应用笔刷一帧。opts: { type, strength(0-100), radius(格), dt(秒), flattenTarget }
   * 返回受影响格数。
   */
  applyBrush(gx, gz, opts) {
    const r = opts.radius;
    const s = opts.strength / 100;
    const dt = opts.dt;
    const x0 = Math.max(0, Math.floor(gx - r));
    const x1 = Math.min(N - 1, Math.ceil(gx + r));
    const z0 = Math.max(0, Math.floor(gz - r));
    const z1 = Math.min(N - 1, Math.ceil(gz + r));
    let count = 0;

    for (let z = z0; z <= z1; z++) {
      const dz = z - gz;
      for (let x = x0; x <= x1; x++) {
        const dx = x - gx;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d > r) continue;
        // 平滑衰减权重(smoothstep 落型)
        const t = 1 - d / r;
        const w = t * t * (3 - 2 * t);
        const i = z * N + x;
        const h = this.heights[i];
        let nh = h;

        if (opts.type === 'raise') {
          // 沿地表法线叠加:高度场取法线位移的竖直分量
          const n = this.normalAt(x, z);
          nh = h + s * 12 * dt * w * n[1];
        } else if (opts.type === 'flatten') {
          // 拉向首次采样高度
          const k = Math.min(1, s * 5 * dt) * w;
          nh = h + (opts.flattenTarget - h) * k;
        } else {
          // 平滑:3x3 加权平均,单帧最大改动 0.5 米
          const avg = this.avg3x3(x, z);
          let delta = (avg - h) * Math.min(1, s * 6 * dt) * w;
          if (delta > 0.5) delta = 0.5;
          else if (delta < -0.5) delta = -0.5;
          nh = h + delta;
        }

        this.setHeight(x, z, nh);
        count++;
      }
    }
    return count;
  }

  /** 结束笔画,压缩为一条撤销记录(只存脏矩形的前后高度) */
  commitStroke() {
    const st = this.stroke;
    this.stroke = null;
    if (!st || st.backup.size === 0) return false;
    const w = st.x1 - st.x0 + 1;
    const h = st.z1 - st.z0 + 1;
    const before = new Float32Array(w * h);
    const after = new Float32Array(w * h);
    for (let z = 0; z < h; z++) {
      for (let x = 0; x < w; x++) {
        const gi = (st.z0 + z) * N + (st.x0 + x);
        const li = z * w + x;
        after[li] = this.heights[gi];
        const b = st.backup.get(gi);
        before[li] = b === undefined ? this.heights[gi] : b;
      }
    }
    this.undoStack.push({ x0: st.x0, z0: st.z0, x1: st.x1, z1: st.z1, before, after });
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack.length = 0;
    return true;
  }

  /** 外部整体改写(导入/重生成)也入撤销栈 */
  pushExternalChange(beforeHeights) {
    this.undoStack.push({
      x0: 0, z0: 0, x1: N - 1, z1: N - 1,
      before: beforeHeights,
      after: new Float32Array(this.heights)
    });
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  applyRecord(rec, useAfter) {
    const src = useAfter ? rec.after : rec.before;
    const w = rec.x1 - rec.x0 + 1;
    const h = rec.z1 - rec.z0 + 1;
    for (let z = 0; z < h; z++) {
      const row = (rec.z0 + z) * N + rec.x0;
      this.heights.set(src.subarray(z * w, z * w + w), row);
    }
    const cx0 = rec.x0 >> CHUNK_SHIFT;
    const cx1 = rec.x1 >> CHUNK_SHIFT;
    const cz0 = rec.z0 >> CHUNK_SHIFT;
    const cz1 = rec.z1 >> CHUNK_SHIFT;
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        this.dirtyChunks.add(cz * CHUNKS_PER_SIDE + cx);
      }
    }
  }

  undo() {
    const rec = this.undoStack.pop();
    if (!rec) return false;
    this.applyRecord(rec, false);
    this.redoStack.push(rec);
    return true;
  }

  redo() {
    const rec = this.redoStack.pop();
    if (!rec) return false;
    this.applyRecord(rec, true);
    this.undoStack.push(rec);
    return true;
  }

  minMax() {
    let min = Infinity;
    let max = -Infinity;
    const h = this.heights;
    for (let i = 0; i < h.length; i++) {
      const v = h[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min, max };
  }
}
