// 三类基元的参数规格与 manifold 实体生成
import { getManifoldSync } from './bridge.js';

// 球节点半径范围 20~80mm
export const BALL_RADIUS_MIN = 20;
export const BALL_RADIUS_MAX = 80;

// 圆管柱：6 档外径（mm），壁厚 2mm 步进
export const TUBE_OUTER_DIAMETERS = [20, 30, 40, 50, 60, 80];
export const TUBE_WALL_STEP = 2;
export const TUBE_WALL_MIN = 2;
export const TUBE_WALL_MAX = 20;
export const TUBE_SEGMENTS = 32;

// 连接块方向：6 个空间方向
export const BLOCK_DIRECTIONS = [
  { key: '+X', vec: [1, 0, 0] },
  { key: '-X', vec: [-1, 0, 0] },
  { key: '+Y', vec: [0, 1, 0] },
  { key: '-Y', vec: [0, -1, 0] },
  { key: '+Z', vec: [0, 0, 1] },
  { key: '-Z', vec: [0, 0, -1] },
];

export const PRIMITIVE_TYPES = {
  ball: '球节点',
  tube: '圆管柱',
  block: '连接块',
};

export const BOOL_OPS = {
  union: '并集',
  difference: '差集',
  intersect: '交集',
};

/**
 * 生成球节点（球体，绕原点）
 * params: { radius }
 */
export function buildBall(params) {
  const M = getManifoldSync();
  const r = THREE_clamp(params.radius ?? 40, BALL_RADIUS_MIN, BALL_RADIUS_MAX);
  return M.Manifold.sphere(r, TUBE_SEGMENTS);
}

/**
 * 生成圆管柱（空心等径圆管，沿局部 +Z 轴，居中于原点）
 * params: { outerDiameter, wall, length }
 * 实现：外圆柱减内圆柱，保证得到带 2mm 壁厚的真实空心管
 */
export function buildTube(params) {
  const M = getManifoldSync();
  const outerD = TUBE_OUTER_DIAMETERS.includes(params.outerDiameter)
    ? params.outerDiameter
    : TUBE_OUTER_DIAMETERS[2];
  const wall = THREE_clamp(params.wall ?? 4, TUBE_WALL_MIN, outerD / 2 - 1);
  const length = Math.max(4, params.length ?? 100);
  const outerR = outerD / 2;
  const innerR = Math.max(0.5, outerR - wall);
  const outer = M.Manifold.cylinder(length, outerR, outerR, TUBE_SEGMENTS, true);
  const inner = M.Manifold.cylinder(length + 2, innerR, innerR, TUBE_SEGMENTS, true);
  return M.Manifold.difference(outer, inner);
}

/**
 * 生成连接块：中心立方体 + 按 6 方向勾选伸出的方臂
 * params: { size, armSize, armLength, dirs: ['+X', ...] }
 */
export function buildBlock(params) {
  const M = getManifoldSync();
  const size = Math.max(4, params.size ?? 30);
  const armSize = Math.max(2, params.armSize ?? 14);
  const armLength = Math.max(0, params.armLength ?? 40);
  const dirs = new Set(params.dirs ?? []);
  const parts = [M.Manifold.cube(size, true)];
  for (const d of BLOCK_DIRECTIONS) {
    if (!dirs.has(d.key) || armLength <= 0) continue;
    const [ax, ay, az] = d.vec;
    // 臂从中心块表面向外伸出 armLength，并嵌入中心块一半厚度以保证并集水密
    const longSide = armLength + size * 0.5;
    const dims = ax !== 0
      ? [longSide, armSize, armSize]
      : ay !== 0
        ? [armSize, longSide, armSize]
        : [armSize, armSize, longSide];
    const arm = M.Manifold.cube(dims, true);
    parts.push(arm.translate([
      ax * (size / 2 + armLength / 2),
      ay * (size / 2 + armLength / 2),
      az * (size / 2 + armLength / 2),
    ]));
  }
  return parts.length === 1 ? parts[0] : M.Manifold.union(parts);
}

function THREE_clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** 根据节点 type+params 生成未施加节点变换的基础实体 */
export function buildPrimitive(node) {
  switch (node.type) {
    case 'ball':
      return buildBall(node.params);
    case 'tube':
      return buildTube(node.params);
    case 'block':
      return buildBlock(node.params);
    default:
      throw new Error(`未知基元类型: ${node.type}`);
  }
}
