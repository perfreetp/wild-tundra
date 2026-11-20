import { defaultParams } from "./nodeDefs";
import type { GraphEdge, GraphNode, MaterialGraph, NodeKind, ParamValue } from "./types";

export function nextNodeId(graph: MaterialGraph): string {
  const used = new Set(graph.nodes.map((n) => n.id));
  let index = graph.nodes.length + 1;
  while (used.has(`n${index}`)) index++;
  return `n${index}`;
}

export function nextEdgeId(graph: MaterialGraph): string {
  const used = new Set(graph.edges.map((e) => e.id));
  let index = graph.edges.length + 1;
  while (used.has(`e${index}`)) index++;
  return `e${index}`;
}

export function createNode(kind: NodeKind, id: string, x: number, y: number): GraphNode {
  return {
    id,
    kind,
    x: Math.round(x),
    y: Math.round(y),
    params: defaultParams(kind),
  };
}

/** 节点卡片在画布上的占位尺寸（与 NodeCanvas 保持一致）。 */
export const NODE_LAYOUT_WIDTH = 214;

const NODE_PORT_ROWS: Record<NodeKind, number> = {
  constant: 3,
  noise: 4,
  gradient: 2,
  fresnel: 1,
  normalNoise: 1,
  output: 5,
};

/** 节点卡片高度估算（与 NodeCanvas 的排版常量一致）。 */
export function estimatedNodeHeight(kind: NodeKind): number {
  return 34 + Math.max(1, NODE_PORT_ROWS[kind] ?? 3) * 24 + 12;
}

/**
 * 为新节点找一个不与现有节点重叠的位置：从起点按列优先扫描网格，
 * 一旦找到空位就返回，避免连续添加时卡片堆在一起。
 */
export function findFreePosition(
  graph: MaterialGraph,
  kind: NodeKind,
  originX = 260,
  originY = 120,
): { x: number; y: number } {
  const width = NODE_LAYOUT_WIDTH;
  const height = estimatedNodeHeight(kind);
  const gapX = 36;
  const gapY = 32;
  const columns = 4;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < columns; col++) {
      const x = originX + col * (width + gapX);
      const y = originY + row * (height + gapY + 40);
      const overlaps = graph.nodes.some((node) => {
        const nodeW = NODE_LAYOUT_WIDTH;
        const nodeH = estimatedNodeHeight(node.kind);
        return x < node.x + nodeW + 12 && x + width + 12 > node.x && y < node.y + nodeH + 12 && y + height + 12 > node.y;
      });
      if (!overlaps) return { x, y };
    }
  }
  return { x: originX, y: originY };
}

export function emptyGraph(): MaterialGraph {
  return { nodes: [], edges: [] };
}

export function addNode(
  graph: MaterialGraph,
  kind: NodeKind,
  x: number,
  y: number,
): { graph: MaterialGraph; node: GraphNode } {
  const node = createNode(kind, nextNodeId(graph), x, y);
  return { graph: { ...graph, nodes: [...graph.nodes, node] }, node };
}

/** 返回新图，同时清理与被删节点相关的连线。 */
export function removeNode(graph: MaterialGraph, nodeId: string): MaterialGraph {
  return {
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    edges: graph.edges.filter((e) => e.fromNode !== nodeId && e.toNode !== nodeId),
  };
}

export function moveNode(graph: MaterialGraph, nodeId: string, x: number, y: number): MaterialGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, x: Math.round(x), y: Math.round(y) } : n,
    ),
  };
}

export function updateParam(
  graph: MaterialGraph,
  nodeId: string,
  key: string,
  value: ParamValue,
): MaterialGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, params: { ...n.params, [key]: value } } : n,
    ),
  };
}

export function addEdge(
  graph: MaterialGraph,
  edge: Omit<GraphEdge, "id">,
  replaceEdgeId?: string,
): MaterialGraph {
  const edges = replaceEdgeId ? graph.edges.filter((e) => e.id !== replaceEdgeId) : graph.edges;
  const newEdge: GraphEdge = { ...edge, id: nextEdgeId({ ...graph, edges }) };
  return { ...graph, edges: [...edges, newEdge] };
}

export function removeEdge(graph: MaterialGraph, edgeId: string): MaterialGraph {
  return { ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) };
}

export function edgeIntoPort(
  graph: MaterialGraph,
  nodeId: string,
  portId: string,
): GraphEdge | undefined {
  return graph.edges.find((e) => e.toNode === nodeId && e.toPort === portId);
}

/** 拓扑排序：只包含从输出节点可达的节点。存在环时返回 null。 */
export function topologicalOrder(graph: MaterialGraph, reachable?: string[]): GraphNode[] | null {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const reachableSet = reachable ? new Set(reachable) : new Set(graph.nodes.map((n) => n.id));
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of reachableSet) indegree.set(id, 0);
  for (const edge of graph.edges) {
    if (!reachableSet.has(edge.fromNode) || !reachableSet.has(edge.toNode)) continue;
    indegree.set(edge.toNode, (indegree.get(edge.toNode) ?? 0) + 1);
    const list = outgoing.get(edge.fromNode);
    if (list) list.push(edge.toNode);
    else outgoing.set(edge.fromNode, [edge.toNode]);
  }
  const queue: string[] = [];
  for (const [id, degree] of indegree) if (degree === 0) queue.push(id);
  queue.sort();
  const order: GraphNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    const node = nodeById.get(id);
    if (!node) continue;
    order.push(node);
    for (const next of outgoing.get(id) ?? []) {
      const degree = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }
  if (order.length !== reachableSet.size) return null;
  return order;
}

/** 深拷贝图并重排节点 / 连线 id，用于复制方案。 */
export function cloneGraph(graph: MaterialGraph): MaterialGraph {
  const idMap = new Map<string, string>();
  const nodes = graph.nodes.map((node, i) => {
    const id = `n${i + 1}`;
    idMap.set(node.id, id);
    return {
      ...node,
      id,
      params: Object.fromEntries(
        Object.entries(node.params).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
      ),
    };
  });
  const edges = graph.edges.map((edge, i) => ({
    ...edge,
    id: `e${i + 1}`,
    fromNode: idMap.get(edge.fromNode) ?? edge.fromNode,
    toNode: idMap.get(edge.toNode) ?? edge.toNode,
  }));
  return { nodes, edges };
}

export function countNodesOfKind(graph: MaterialGraph, kind: NodeKind): number {
  return graph.nodes.filter((n) => n.kind === kind).length;
}
