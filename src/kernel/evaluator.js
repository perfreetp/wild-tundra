// 历史树求值器：按依赖顺序把节点树求值为 manifold 实体
import { getManifoldSync } from './bridge.js';
import { buildPrimitive } from './primitives.js';

/**
 * 静音规则：
 * - 静音的叶子：视为空实体
 * - 静音的布尔节点：跳过自身运算，直接透传第一个有效（非静音/非空）子节点
 * - 所有子节点均无效时：空实体
 */
export class Evaluator {
  constructor(nodes) {
    this.nodes = nodes; // id -> node 记录（含 version）
    this.cache = new Map(); // nodeId+version -> { manifold, volume, error }
  }

  /** 对单个节点求值（带缓存） */
  evaluate(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return emptyResult();
    const cacheKey = `${nodeId}@${node.version}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    let result;
    if (node.kind === 'primitive') {
      result = this.evalPrimitive(node);
    } else {
      result = this.evalOperation(node);
    }
    this.cache.set(cacheKey, result);
    return result;
  }

  evalPrimitive(node) {
    if (node.muted) return emptyResult();
    try {
      const base = buildPrimitive(node); // 局部坐标实体
      const transformed = applyTransform(base, node.transform);
      const volume = transformed.volume();
      return { manifold: transformed, volume, error: null };
    } catch (err) {
      return { manifold: null, volume: 0, error: String(err?.message ?? err) };
    }
  }

  evalOperation(node) {
    const M = getManifoldSync();
    const childResults = (node.children || [])
      .map((id) => this.evaluate(id))
      .filter((r) => r.manifold && !r.manifold.isEmpty());

    // 静音布尔节点：跳过自身运算，透传第一个有效子节点（仍施加本节点变换）
    if (node.muted) {
      if (childResults.length === 0) return emptyResult();
      const passthrough = applyTransform(childResults[0].manifold, node.transform);
      return { manifold: passthrough, volume: passthrough.volume(), error: null };
    }
    if (childResults.length === 0) return emptyResult();
    if (childResults.length === 1) {
      // 单子节点：布尔无意义，直接透传（仍施加本节点变换）
      const only = childResults[0].manifold;
      const moved = applyTransform(only, node.transform);
      return { manifold: moved, volume: moved.volume(), error: null };
    }
    try {
      const operands = childResults.map((r) => r.manifold);
      let out;
      switch (node.params.op) {
        case 'union':
          out = M.Manifold.union(operands);
          break;
        case 'difference':
          out = M.Manifold.difference(operands);
          break;
        case 'intersect':
          out = M.Manifold.intersection(operands);
          break;
        default:
          throw new Error(`未知布尔运算: ${node.params.op}`);
      }
      out = applyTransform(out, node.transform);
      return { manifold: out, volume: out.volume(), error: null };
    } catch (err) {
      return { manifold: null, volume: 0, error: String(err?.message ?? err) };
    }
  }
}

function emptyResult() {
  return { manifold: null, volume: 0, error: null };
}

/** 施加节点的平移 + 欧拉角（角度制，XYZ 顺序）变换 */
export function applyTransform(manifold, transform) {
  if (!transform) return manifold;
  const { position = [0, 0, 0], rotation = [0, 0, 0] } = transform;
  let out = manifold;
  if (rotation.some((a) => Math.abs(a) > 1e-9)) {
    out = out.rotate([rotation[0] || 0, rotation[1] || 0, rotation[2] || 0]);
  }
  if (position.some((p) => Math.abs(p) > 1e-9)) {
    out = out.translate([position[0] || 0, position[1] || 0, position[2] || 0]);
  }
  return out;
}

/**
 * 收集受某节点变更影响、且布尔链深度 <= maxDepth 的全部下游节点（含自身）。
 * 按依赖拓扑顺序返回，供分帧异步重算。
 */
export function collectRecomputeOrder(nodes, rootId, maxDepth = 12) {
  // parentIndex 反向映射
  const parentOf = new Map();
  for (const [id, n] of Object.entries(nodes)) {
    for (const c of n.children || []) parentOf.set(c, id);
  }
  const order = [];
  const visited = new Set();
  let truncated = false;

  const walk = (id, depth) => {
    if (visited.has(id)) return;
    if (depth > maxDepth) {
      truncated = true;
      return;
    }
    visited.add(id);
    order.push(id);
    const parent = parentOf.get(id);
    if (parent) walk(parent, depth + 1);
  };
  walk(rootId, 0);
  return { order, truncated };
}
