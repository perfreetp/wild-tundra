import { NODE_DEFINITIONS, portOf } from "./nodeDefs";
import type { GraphEdge, MaterialGraph, PortType } from "./types";

export type IssueCode =
  | "cycle"
  | "type-mismatch"
  | "self-loop"
  | "missing-node"
  | "missing-port"
  | "wrong-direction";

export interface GraphIssue {
  code: IssueCode;
  message: string;
  edgeId?: string;
  nodeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: GraphIssue[];
  /** 处在环里的连线，用于画布标红。 */
  cyclicEdgeIds: string[];
  /** 任何违规连线，用于画布标红。 */
  invalidEdgeIds: string[];
  /** 从输出节点反向可达的节点（参与着色器生成的节点）。 */
  reachableNodeIds: string[];
}

function edgeKey(edge: Pick<GraphEdge, "fromNode" | "fromPort" | "toNode" | "toPort">): string {
  return `${edge.fromNode}:${edge.fromPort}->${edge.toNode}:${edge.toPort}`;
}

export function edgeSignature(edge: Pick<GraphEdge, "fromNode" | "fromPort" | "toNode" | "toPort">): string {
  return edgeKey(edge);
}

/** 返回图里所有参与环的连线 id。使用迭代式 DFS + 栈内染色。 */
export function findCyclicEdgeIds(graph: MaterialGraph): string[] {
  const adjacency = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    const list = adjacency.get(edge.fromNode);
    if (list) list.push(edge);
    else adjacency.set(edge.fromNode, [edge]);
  }

  const state = new Map<string, 0 | 1 | 2>(); // 0/未访问 1/在栈上 2/完成
  const cycleEdges = new Set<string>();
  const stack: { node: string; edges: GraphEdge[]; index: number }[] = [];

  const nodeIds = new Set<string>([...graph.nodes.map((n) => n.id), ...graph.edges.flatMap((e) => [e.fromNode, e.toNode])]);

  for (const start of nodeIds) {
    if (state.get(start)) continue;
    state.set(start, 1);
    stack.push({ node: start, edges: adjacency.get(start) ?? [], index: 0 });
    while (stack.length) {
      const frame = stack[stack.length - 1];
      if (frame.index >= frame.edges.length) {
        state.set(frame.node, 2);
        stack.pop();
        continue;
      }
      const edge = frame.edges[frame.index++];
      const target = edge.toNode;
      const targetState = state.get(target) ?? 0;
      if (targetState === 1) {
        // 找到一条回边：从栈里 target 的位置到栈顶的所有边 + 这条边构成环
        cycleEdges.add(edge.id);
        const fromIndex = stack.findIndex((f) => f.node === target);
        for (let i = fromIndex; i < stack.length; i++) {
          const next = stack[i + 1];
          if (!next) continue;
          for (const e of stack[i].edges) {
            if (e.toNode === next.node) cycleEdges.add(e.id);
          }
        }
      } else if (targetState === 0) {
        state.set(target, 1);
        stack.push({ node: target, edges: adjacency.get(target) ?? [], index: 0 });
      }
    }
  }
  return [...cycleEdges];
}

/** 判断新增 from→to 这条边是否会形成环（不修改图）。 */
export function wouldCreateCycle(graph: MaterialGraph, fromNode: string, toNode: string): boolean {
  if (fromNode === toNode) return true;
  // 从 toNode 出发能否回到 fromNode
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = adjacency.get(edge.fromNode);
    if (list) list.push(edge.toNode);
    else adjacency.set(edge.fromNode, [edge.toNode]);
  }
  const seen = new Set<string>([toNode]);
  const queue = [toNode];
  while (queue.length) {
    const current = queue.pop()!;
    if (current === fromNode) return true;
    for (const next of adjacency.get(current) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

export interface ConnectRequest {
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface ConnectCheck {
  ok: boolean;
  code?: IssueCode;
  message?: string;
  /** 目标输入口已存在连线时，需要先替换掉的那条。 */
  replacesEdgeId?: string;
}

export function checkConnection(graph: MaterialGraph, request: ConnectRequest): ConnectCheck {
  const { fromNode, fromPort, toNode, toPort } = request;
  const source = graph.nodes.find((n) => n.id === fromNode);
  const target = graph.nodes.find((n) => n.id === toNode);
  if (!source || !target) {
    return { ok: false, code: "missing-node", message: "端口所属节点不存在" };
  }
  if (fromNode === toNode) {
    return { ok: false, code: "self-loop", message: "不能把节点连接到它自己" };
  }
  const outPort = portOf(source.kind, fromPort, "output");
  const inPort = portOf(target.kind, toPort, "input");
  if (!outPort || !inPort) {
    return { ok: false, code: "missing-port", message: "端口不存在" };
  }
  if (outPort.type !== inPort.type) {
    return {
      ok: false,
      code: "type-mismatch",
      message: `类型不同：${labelType(outPort.type)} 不能接到 ${labelType(inPort.type)}`,
    };
  }
  if (wouldCreateCycle(graph, fromNode, toNode)) {
    return { ok: false, code: "cycle", message: "该连接会形成环，已阻止" };
  }
  const existing = graph.edges.find((e) => e.toNode === toNode && e.toPort === toPort);
  return { ok: true, replacesEdgeId: existing?.id };
}

function labelType(type: PortType): string {
  return type === "scalar" ? "标量" : type === "vector" ? "向量" : "颜色";
}

function reachableFromOutput(graph: MaterialGraph): string[] {
  const outputIds = graph.nodes.filter((n) => n.kind === "output").map((n) => n.id);
  const incoming = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const list = incoming.get(edge.toNode);
    if (list) list.push(edge.fromNode);
    else incoming.set(edge.toNode, [edge.fromNode]);
  }
  const seen = new Set<string>();
  const queue = [...outputIds];
  while (queue.length) {
    const current = queue.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of incoming.get(current) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return [...seen];
}

/** 全量校验：类型、端口、重复占用、环。断线/重连后都会重新调用。 */
export function validateGraph(graph: MaterialGraph): ValidationResult {
  const issues: GraphIssue[] = [];
  const invalidEdgeIds = new Set<string>();
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const occupied = new Map<string, string>();

  for (const edge of graph.edges) {
    const source = nodeById.get(edge.fromNode);
    const target = nodeById.get(edge.toNode);
    if (!source || !target) {
      issues.push({ code: "missing-node", message: "连线指向的节点不存在", edgeId: edge.id });
      invalidEdgeIds.add(edge.id);
      continue;
    }
    if (edge.fromNode === edge.toNode) {
      issues.push({ code: "self-loop", message: "节点连接到了自身", edgeId: edge.id, nodeId: edge.fromNode });
      invalidEdgeIds.add(edge.id);
      continue;
    }
    const outPort = portOf(source.kind, edge.fromPort, "output");
    const inPort = portOf(target.kind, edge.toPort, "input");
    if (!outPort || !inPort) {
      issues.push({ code: "missing-port", message: "连线引用了不存在的端口", edgeId: edge.id });
      invalidEdgeIds.add(edge.id);
      continue;
    }
    if (outPort.type !== inPort.type) {
      issues.push({
        code: "type-mismatch",
        message: `类型不匹配：${outPort.label}（${labelType(outPort.type)}）→ ${inPort.label}（${labelType(inPort.type)}）`,
        edgeId: edge.id,
      });
      invalidEdgeIds.add(edge.id);
      continue;
    }
    const key = `${edge.toNode}:${edge.toPort}`;
    const previous = occupied.get(key);
    if (previous) {
      issues.push({
        code: "wrong-direction",
        message: "同一个输入端口被多条连线占用",
        edgeId: edge.id,
      });
      invalidEdgeIds.add(edge.id);
      continue;
    }
    occupied.set(key, edge.id);
  }

  const cyclicEdgeIds = findCyclicEdgeIds(graph);
  for (const id of cyclicEdgeIds) {
    invalidEdgeIds.add(id);
    const edge = graph.edges.find((e) => e.id === id);
    issues.push({
      code: "cycle",
      message: "连线形成了环，已标红，请断开其中一条",
      edgeId: id,
      nodeId: edge?.fromNode,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    cyclicEdgeIds,
    invalidEdgeIds: [...invalidEdgeIds],
    reachableNodeIds: reachableFromOutput(graph),
  };
}

/** 供 UI 快速拿到“输出节点是否存在”的提示。 */
export function describeNodeKind(kind: string): string {
  return (NODE_DEFINITIONS as Record<string, { label: string } | undefined>)[kind]?.label ?? kind;
}
