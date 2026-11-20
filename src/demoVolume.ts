import type { VolumeData } from './types';

/**
 * 生成一个合成的演示体数据：
 * 一个类器官椭球（HU≈50），内部一个高密度“病灶”球（HU≈120），
 * 加少量随机孤立噪点块（用于演示流形修复去小块）。
 */
export function makeDemoVolume(): VolumeData {
  const nx = 96, ny = 96, nz = 96;
  const data = new Float32Array(nx * ny * nz);
  const cx = nx / 2, cy = ny / 2, cz = nz / 2;

  // 简单可复现的伪随机
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i = x + nx * (y + ny * z);
        let v = -1000; // 空气背景
        // 器官椭球（带一点不规则起伏）
        const dx = (x - cx) / 34, dy = (y - cy) / 28, dz = (z - cz) / 38;
        const wobble = 0.08 * Math.sin(x * 0.35) * Math.cos(z * 0.3);
        const r = dx * dx + dy * dy + dz * dz + wobble;
        if (r < 1) {
          v = 45 + 15 * Math.sin(x * 0.2) * Math.cos(y * 0.23) + (rand() - 0.5) * 10;
          // 内部病灶
          const lx = (x - cx - 10) / 9, ly = (y - cy + 6) / 9, lz = (z - cz - 4) / 9;
          if (lx * lx + ly * ly + lz * lz < 1) v = 120 + (rand() - 0.5) * 12;
        }
        // 孤立噪点小块（模拟伪影，重建时应被流形清理去掉）
        if (rand() < 0.00012) v = 60;
        data[i] = v;
      }
    }
  }

  return {
    dims: [nx, ny, nz],
    spacing: [1, 1, 1],
    data,
    min: -1000,
    max: 140,
  };
}
