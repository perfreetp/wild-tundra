import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Vector3,
} from 'three';
import { fbm2D, ridged2D } from '../core/math';

export interface BandOptions {
  radius: number;
  baseY: number;
  height: number;
  arc: number;
  segments: number;
  seed: number;
  frequency: number;
  contrast: number;
  jitter: number;
  colorBottom: Color;
  colorTop: Color;
  snow: number;
  colorSnow?: Color;
}

/** 环绕相机的山脊带（自下而上三段条带），顶点色由山脚渐变到山顶 */
export function buildBandGeometry(opts: BandOptions): BufferGeometry {
  const {
    radius,
    baseY,
    height,
    arc,
    segments,
    seed,
    frequency,
    contrast,
    jitter,
    colorBottom,
    colorTop,
    snow,
    colorSnow = new Color(0.84, 0.89, 0.95),
  } = opts;

  const rows = 3;
  const vertexCount = (segments + 1) * rows;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  const heights: number[] = [];
  let minH = Infinity;
  let maxH = -Infinity;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = -arc + t * arc * 2;
    const ridge = ridged2D(angle * frequency, seed * 0.37, 5, seed);
    const macro = fbm2D(angle * frequency * 0.34, seed * 0.11, 3, seed + 3);
    const base = ridge * contrast + macro * (1 - contrast);
    const profile = Math.max(0, base - (1 - contrast) * 0.32);
    const h = height * (0.14 + 0.86 * profile);
    heights.push(h);
    minH = Math.min(minH, h);
    maxH = Math.max(maxH, h);

    const jitterOffset = (fbm2D(angle * frequency * 2.4, seed * 0.7, 3, seed + 11) - 0.5) * jitter;

    for (let r = 0; r < rows; r++) {
      const f = r / (rows - 1);
      const rad = radius + jitterOffset * f;
      const idx = (i * rows + r) * 3;
      positions[idx] = Math.sin(angle) * rad;
      positions[idx + 1] = baseY + h * f;
      positions[idx + 2] = -Math.cos(angle) * rad;
    }
  }

  const span = Math.max(maxH - minH, 1);
  const tmp = new Color();
  for (let i = 0; i <= segments; i++) {
    const relative = ((heights[i] ?? 0) - minH) / span;
    for (let r = 0; r < rows; r++) {
      const f = r / (rows - 1);
      tmp.copy(colorBottom).lerp(colorTop, Math.pow(f, 0.9));
      const snowMask = snow * Math.max(0, (f - 0.56) / 0.44) * Math.max(0.2, relative);
      if (snowMask > 0) tmp.lerp(colorSnow, snowMask);
      tmp.multiplyScalar(0.86 + 0.14 * f);
      const cIdx = (i * rows + r) * 3;
      colors[cIdx] = tmp.r;
      colors[cIdx + 1] = tmp.g;
      colors[cIdx + 2] = tmp.b;
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = i * rows + r;
      const b = a + 1;
      const c = (i + 1) * rows + r;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export interface ProfilePoint {
  x: number;
  y: number;
}

/**
 * 沿 Z 轴扫掠闭合截面（如道床、钢轨），生成带 UV 的棱柱。
 * uv 横向按周长/uvScale，纵向按 z/uvScale 平铺。
 */
export function sweepProfile(
  profile: readonly ProfilePoint[],
  zStart: number,
  zEnd: number,
  uvScale = 3,
): BufferGeometry {
  const n = profile.length;
  const zLength = Math.abs(zEnd - zStart);
  const steps = Math.max(1, Math.round(zLength / 24));

  const perimeter: number[] = [0];
  for (let i = 1; i < n; i++) {
    const a = profile[i - 1] as ProfilePoint;
    const b = profile[i] as ProfilePoint;
    perimeter.push((perimeter[i - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const z = zStart + (zEnd - zStart) * t;
    for (let i = 0; i < n; i++) {
      const p = profile[i] as ProfilePoint;
      positions.push(p.x, p.y, z);
      uvs.push((perimeter[i] ?? 0) / uvScale, z / uvScale);
    }
  }

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const a = s * n + i;
      const b = s * n + next;
      const c = (s + 1) * n + i;
      const d = (s + 1) * n + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function scatterRing(
  count: number,
  radiusMin: number,
  radiusMax: number,
  arc: number,
  rand: () => number,
): Array<{ x: number; z: number; angle: number; radius: number }> {
  const points: Array<{ x: number; z: number; angle: number; radius: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (rand() * 2 - 1) * arc;
    const radius = radiusMin + rand() * (radiusMax - radiusMin);
    points.push({ x: Math.sin(angle) * radius, z: -Math.cos(angle) * radius, angle, radius });
  }
  return points;
}

/** 构建一盏小型路灯 / 信号灯的点精灵集合 */
export function buildPointCloud(
  points: readonly Vector3[],
  color: Color,
  size: number,
): { geometry: BufferGeometry; color: Color; size: number } {
  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return { geometry, color, size };
}
