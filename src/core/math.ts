export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  return a === b ? 0 : clamp01((value - a) / (b - a));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = inverseLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash1(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** Smooth 2D value noise in [0, 1]. */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const s = seed * 37.17;
  const a = hash2(xi + s, yi + s);
  const b = hash2(xi + 1 + s, yi + s);
  const c = hash2(xi + s, yi + 1 + s);
  const d = hash2(xi + 1 + s, yi + 1 + s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

/** Fractal 2D noise in [0, 1]. */
export function fbm2D(x: number, y: number, octaves = 4, seed = 0, gain = 0.5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  let vx = x;
  let vy = y;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(vx * freq, vy * freq, seed + i * 13.7) * amp;
    norm += amp;
    amp *= gain;
    freq *= 2.0;
  }
  return sum / norm;
}

/** Ridged fractal noise in [0, 1]，用于山脊轮廓。 */
export function ridged2D(x: number, y: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise2D(x * freq, y * freq, seed + i * 21.3);
    sum += (1 - Math.abs(n * 2 - 1)) * amp;
    norm += amp;
    amp *= 0.52;
    freq *= 2.07;
  }
  return sum / norm;
}

/** Smooth 1D value noise in [-1, 1]. */
export function valueNoise1D(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash1(i + seed * 101.7);
  const b = hash1(i + 1 + seed * 101.7);
  return (lerp(a, b, u) * 2 - 1);
}

/** Fractal 1D noise in [-1, 1]. */
export function fbm1D(x: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise1D(x * freq, seed + i * 7.31) * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
