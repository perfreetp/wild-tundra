/** Small dependency-free numeric helpers shared by the geometry core. */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Deterministic integer hash -> [0,1). */
export function hash2i(i: number, j: number, seed: number): number {
  let h =
    Math.imul(i | 0, 374761393) +
    Math.imul(j | 0, 668265263) +
    Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** 2D value noise with quintic interpolation. Output in [0,1]. */
export function valueNoise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);
  const i1 = a + (b - a) * u;
  const i2 = c + (d - c) * u;
  return i1 + (i2 - i1) * v;
}

export function fbm2(
  x: number,
  y: number,
  seed: number,
  octaves = 4,
  lacunarity = 2.0,
  gain = 0.5
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + o * 1013);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** Chainage formatting: K1+250 / K0+035. */
export function formatChainage(s: number): string {
  const sign = s < 0 ? "-" : "";
  const v = Math.abs(s);
  const km = Math.floor(v / 1000);
  const m = Math.floor(v % 1000);
  return `${sign}K${km}+${String(m).padStart(3, "0")}`;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nextId(list: { id: string }[], prefix: string): string {
  let i = 1;
  const used = new Set(list.map((p) => p.id));
  while (used.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}
