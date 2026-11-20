// 5 段色带：蓝 → 青 → 绿 → 黄 → 红
const STOPS: Array<[number, number, number]> = [
  [0.23, 0.30, 0.75], // 蓝
  [0.20, 0.75, 0.80], // 青
  [0.25, 0.75, 0.30], // 绿
  [0.95, 0.85, 0.25], // 黄
  [0.85, 0.25, 0.20], // 红
];

/** 把 t∈[0,1] 映射到 5 段色带 */
export function colormap5(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = STOPS[i], b = STOPS[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** 根据窗宽窗位把每个顶点的 CT 值映射为顶点色 */
export function computeVertexColors(
  values: Float32Array,
  windowLevel: number,
  windowWidth: number,
): Float32Array {
  const n = values.length;
  const colors = new Float32Array(n * 3);
  const lo = windowLevel - windowWidth / 2;
  const inv = windowWidth > 0 ? 1 / windowWidth : 1;
  for (let i = 0; i < n; i++) {
    const t = (values[i] - lo) * inv;
    const [r, g, b] = colormap5(t);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  return colors;
}
