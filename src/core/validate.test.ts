import { describe, expect, it } from "vitest";
import { addEdge, addNode, emptyGraph } from "./graph";
import {
  checkConnection,
  findCyclicEdgeIds,
  validateGraph,
  wouldCreateCycle,
} from "./validate";
import type { MaterialGraph } from "./types";

function connect(
  graph: MaterialGraph,
  fromNode: string,
  fromPort: string,
  toNode: string,
  toPort: string,
): MaterialGraph {
  const check = checkConnection(graph, { fromNode, fromPort, toNode, toPort });
  if (!check.ok) return graph;
  return addEdge(graph, { fromNode, fromPort, toNode, toPort }, check.replacesEdgeId);
}

describe("checkConnection", () => {
  it("拒绝不同类型端口", () => {
    let graph = emptyGraph();
    const noise = addNode(graph, "noise", 0, 0);
    graph = noise.graph;
    const output = addNode(graph, "output", 400, 0);
    graph = output.graph;
    const result = checkConnection(graph, {
      fromNode: noise.node.id,
      fromPort: "color",
      toNode: output.node.id,
      toPort: "metallic",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("type-mismatch");
    expect(result.message).toContain("颜色");
    expect(result.message).toContain("标量");
  });

  it("允许同类型端口", () => {
    let graph = emptyGraph();
    const fresnel = addNode(graph, "fresnel", 0, 0);
    graph = fresnel.graph;
    const output = addNode(graph, "output", 400, 0);
    graph = output.graph;
    const result = checkConnection(graph, {
      fromNode: fresnel.node.id,
      fromPort: "value",
      toNode: output.node.id,
      toPort: "metallic",
    });
    expect(result.ok).toBe(true);
  });

  it("拒绝自连", () => {
    let graph = emptyGraph();
    const noise = addNode(graph, "noise", 0, 0);
    graph = noise.graph;
    const result = checkConnection(graph, {
      fromNode: noise.node.id,
      fromPort: "rgb",
      toNode: noise.node.id,
      toPort: "coord",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("self-loop");
  });

  it("返回将被替换的既有连线", () => {
    let graph = emptyGraph();
    const a = addNode(graph, "constant", 0, 0);
    graph = a.graph;
    const b = addNode(graph, "constant", 0, 200);
    graph = b.graph;
    const output = addNode(graph, "output", 400, 0);
    graph = output.graph;
    graph = connect(graph, a.node.id, "scalar", output.node.id, "metallic");
    const result = checkConnection(graph, {
      fromNode: b.node.id,
      fromPort: "scalar",
      toNode: output.node.id,
      toPort: "metallic",
    });
    expect(result.ok).toBe(true);
    expect(result.replacesEdgeId).toBe(graph.edges[0].id);
  });
});

describe("环检测", () => {
  it("识别直接环", () => {
    let graph = emptyGraph();
    const noise = addNode(graph, "noise", 0, 0);
    graph = noise.graph;
    const grad = addNode(graph, "gradient", 300, 0);
    graph = grad.graph;
    // noise.rgb -> gradient.coord（向量 -> 向量）
    graph = {
      ...graph,
      edges: [
        { id: "e1", fromNode: noise.node.id, fromPort: "rgb", toNode: grad.node.id, toPort: "coord" },
        { id: "e2", fromNode: grad.node.id, fromPort: "color", toNode: noise.node.id, toPort: "coord" },
      ],
    };
    // gradient.color 是颜色，接到 noise.coord（向量）是类型不符；把 comp 换成 concept 检查
    const cyclic = findCyclicEdgeIds(graph);
    expect(cyclic.length).toBeGreaterThan(0);
    expect(wouldCreateCycle(graph, noise.node.id, noise.node.id)).toBe(true);
  });

  it("连线前的预判会拦截成环连接", () => {
    let graph = emptyGraph();
    const first = addNode(graph, "noise", 0, 0);
    graph = first.graph;
    const second = addNode(graph, "noise", 300, 0);
    graph = second.graph;
    // noise.rgb(向量) → 另一个 noise.coord(向量)，两段连起来就是一个环
    graph = connect(graph, first.node.id, "rgb", second.node.id, "coord");
    const result = checkConnection(graph, {
      fromNode: second.node.id,
      fromPort: "rgb",
      toNode: first.node.id,
      toPort: "coord",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("cycle");
    expect(result.message).toContain("环");
  });

  it("validateGraph 把环上的连线标为无效", () => {
    const graph: MaterialGraph = {
      nodes: [
        { id: "a", kind: "noise", x: 0, y: 0, params: {} },
        { id: "b", kind: "gradient", x: 100, y: 0, params: {} },
      ],
      edges: [
        { id: "e1", fromNode: "a", fromPort: "rgb", toNode: "b", toPort: "coord" },
        { id: "e2", fromNode: "b", fromPort: "value", toNode: "a", toPort: "coord" },
      ],
    };
    // e2 类型不符（标量→向量），因此还会额外报告 mismatch
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.invalidEdgeIds).toContain("e1");
    expect(result.cyclicEdgeIds.length).toBeGreaterThan(0);
  });

  it("断开环上的连线后校验恢复", () => {
    let graph: MaterialGraph = {
      nodes: [
        { id: "a", kind: "noise", x: 0, y: 0, params: {} },
        { id: "b", kind: "gradient", x: 100, y: 0, params: {} },
        { id: "o", kind: "output", x: 400, y: 0, params: {} },
      ],
      edges: [
        { id: "e1", fromNode: "a", fromPort: "rgb", toNode: "b", toPort: "coord" },
        { id: "e2", fromNode: "a", fromPort: "color", toNode: "o", toPort: "baseColor" },
        { id: "e3", fromNode: "b", fromPort: "value", toNode: "a", toPort: "coord" },
      ],
    };
    expect(validateGraph(graph).cyclicEdgeIds.length).toBeGreaterThan(0);
    graph = { ...graph, edges: graph.edges.filter((e) => e.id !== "e3") };
    const after = validateGraph(graph);
    expect(after.ok).toBe(true);
    expect(after.cyclicEdgeIds).toEqual([]);
  });
});

describe("validateGraph", () => {
  it("报告重复占用同一输入端口", () => {
    const graph: MaterialGraph = {
      nodes: [
        { id: "c1", kind: "constant", x: 0, y: 0, params: {} },
        { id: "c2", kind: "constant", x: 0, y: 100, params: {} },
        { id: "o", kind: "output", x: 400, y: 0, params: {} },
      ],
      edges: [
        { id: "e1", fromNode: "c1", fromPort: "scalar", toNode: "o", toPort: "metallic" },
        { id: "e2", fromNode: "c2", fromPort: "scalar", toNode: "o", toPort: "metallic" },
      ],
    };
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.invalidEdgeIds.length).toBe(1);
  });

  it("可达集合只包含连到输出的节点", () => {
    let graph = emptyGraph();
    const output = addNode(graph, "output", 400, 0);
    graph = output.graph;
    const used = addNode(graph, "constant", 0, 0);
    graph = used.graph;
    const orphan = addNode(graph, "noise", 0, 300);
    graph = orphan.graph;
    graph = connect(graph, used.node.id, "color", output.node.id, "baseColor");
    const result = validateGraph(graph);
    expect(result.reachableNodeIds).toContain(used.node.id);
    expect(result.reachableNodeIds).not.toContain(orphan.node.id);
  });
});
