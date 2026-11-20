// 值噪声 + 分形叠加,用于生成初始溯溪峡谷地形
import { N } from './heightfield.js';

function hash2(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const u = smooth(fx);
  const v = smooth(fz);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm2(x, z, octaves) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/**
 * 生成溯溪峡谷:起伏高地 + 一条蜿蜒下切的溪流河谷。
 * 河床约 2~4 米,两侧谷壁陡起,远处为 30~90 米高地。
 */
export function generateCanyon(heights) {
  // 溪流中线(沿 z 方向蜿蜒)
  const pathX = (z) =>
    N * 0.5 + Math.sin(z * 0.0042) * 170 + Math.sin(z * 0.0109 + 1.7) * 55;

  for (let z = 0; z < N; z++) {
    const px = pathX(z);
    for (let x = 0; x < N; x++) {
      const base = 24 + fbm2(x * 0.004, z * 0.004, 5) * 58; // 24~82 起伏高地
      const ridge = fbm2(x * 0.021 + 7.3, z * 0.021 + 2.1, 3) * 7; // 细部山脊
      let h = base + ridge;

      const d = Math.abs(x - px);
      let v = 1 - Math.min(d / 130, 1); // 距溪流的归一化权重
      v = v * v * (3 - 2 * v);
      const carve = Math.pow(v, 1.7); // 下切剖面,谷壁更陡
      const floor = 2.2 + fbm2(x * 0.05, z * 0.05, 2) * 2.0; // 河床 2.2~4.2
      h = h * (1 - carve) + floor * carve;

      heights[z * N + x] = h;
    }
  }
}
