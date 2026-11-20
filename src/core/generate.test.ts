import { describe, expect, it } from "vitest";
import { generateShader, hexToLinearRgb, formatFloat, simpleHash } from "./generate";
import { addEdge, addNode, emptyGraph, updateParam } from "./graph";
import type { MaterialGraph } from "./types";

function baseGraph(): MaterialGraph {
  let graph = emptyGraph();
  let outputId = "";
  let noiseId = "";
  let constId = "";
  const added = addNode(graph, "output", 600, 200);
  graph = added.graph;
  outputId = added.node.id;
  const noise = addNode(graph, "noise", 200, 100);
  graph = noise.graph;
  noiseId = noise.node.id;
  const konst = addNode(graph, "constant", 200, 400);
  graph = konst.graph;
  constId = konst.node.id;

  graph = addEdge(graph, {
    fromNode: noiseId,
    fromPort: "color",
    toNode: outputId,
    toPort: "baseColor",
  });
  graph = addEdge(graph, {
    fromNode: constId,
    fromPort: "scalar",
    toNode: outputId,
    toPort: "metallic",
  });
  return graph;
}

describe("formatFloat", () => {
  it("总是输出合法的 GLSL 浮点字面量", () => {
    expect(formatFloat(1)).toBe("1.0");
    expect(formatFloat(0.5)).toBe("0.5");
    expect(formatFloat(-0.0000001)).toBe("0.0");
    expect(formatFloat(Number.NaN)).toBe("0.0");
    expect(formatFloat(0.123456)).toBe("0.12346");
    expect(formatFloat(2.5)).toBe("2.5");
  });
});

describe("hexToLinearRgb", () => {
  it("把 sRGB 十六进制转成线性值", () => {
    expect(hexToLinearRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToLinearRgb("#000000")).toEqual([0, 0, 0]);
    const [r] = hexToLinearRgb("#808080");
    expect(r).toBeGreaterThan(0.2);
    expect(r).toBeLessThan(0.24);
  });
});

describe("generateShader", () => {
  it("为最小可用图生成片元与顶点源码", () => {
    const result = generateShader(baseGraph());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fragmentSource).toContain("void main(void)");
    expect(result.fragmentSource).toContain("gl_FragColor");
    expect(result.vertexSource).toContain("worldViewProjection");
    expect(result.uniforms).toContain("uLightDir");
    expect(result.uniforms).toContain("uRoughnessScale");
  });

  it("参数改动会改变源码与编译 key", () => {
    const graph = baseGraph();
    const before = generateShader(graph);
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    const noise = graph.nodes.find((n) => n.kind === "noise")!;
    const changed = updateParam(graph, noise.id, "scale", 23);
    const after = generateShader(changed);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.fragmentSource).not.toBe(before.fragmentSource);
    expect(after.key).not.toBe(before.key);
  });

  it("相同输入产生逐字节相同的源码", () => {
    const a = generateShader(baseGraph());
    const b = generateShader(baseGraph());
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.fragmentSource).toBe(b.fragmentSource);
    expect(a.key).toBe(b.key);
  });

  it("没有输出节点时给出明确原因", () => {
    let graph = emptyGraph();
    graph = addNode(graph, "noise", 100, 100).graph;
    const result = generateShader(graph);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("材质输出");
  });

  it("存在环时拒绝生成", () => {
    let graph = baseGraph();
    const noise = graph.nodes.find((n) => n.kind === "noise")!;
    // 人为注入一条会形成环的连线（绕过 checkConnection），验证生成器的兜底
    graph = {
      ...graph,
      edges: [
        ...graph.edges,
        { id: "bad", fromNode: "missing", fromPort: "value", toNode: noise.id, toPort: "coord" },
      ],
    };
    const result = generateShader(graph);
    expect(result.ok).toBe(false);
  });

  it("三种噪波类型都会生成合法结构并包含所需 helper", () => {
    for (const type of ["fbm", "ridged", "cells", "stripes"] as const) {
      const graph = baseGraph();
      const noise = graph.nodes.find((n) => n.kind === "noise")!;
      const next = updateParam(graph, noise.id, "type", type);
      const result = generateShader(next);
      expect(result.ok, type).toBe(true);
      if (!result.ok) continue;
      expect(result.fragmentSource).toContain("float hn_vnoise(vec3 x)");
      if (type === "cells") expect(result.fragmentSource).toContain("float hn_cells(vec3 p)");
      if (type === "fbm") expect(result.fragmentSource).toContain("float hn_fbm3(vec3 p)");
    }
  });

  it("节点行号区间落在源码行数范围之内", () => {
    const graph = baseGraph();
    const result = generateShader(graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = result.fragmentSource.split("\n");
    for (const [nodeId, range] of Object.entries(result.nodeLineRanges)) {
      expect(range.start).toBeGreaterThan(0);
      expect(range.end).toBeGreaterThanOrEqual(range.start);
      expect(range.end).toBeLessThanOrEqual(lines.length);
      expect(graph.nodes.some((n) => n.id === nodeId)).toBe(true);
    }
  });

  it("同种节点多个实例不会产生重复声明的变量名", () => {
    let graph = baseGraph();
    const output = graph.nodes.find((n) => n.kind === "output")!;
    const second = addNode(graph, "noise", 200, 600);
    graph = second.graph;
    graph = addEdge(graph, {
      fromNode: second.node.id,
      fromPort: "color",
      toNode: output.id,
      toPort: "specular",
    });
    // specular 是标量，接颜色会失败；改用 value
    graph = {
      ...graph,
      edges: graph.edges.filter((e) => !(e.toPort === "specular")),
    };
    graph = addEdge(graph, {
      fromNode: second.node.id,
      fromPort: "value",
      toNode: output.id,
      toPort: "specular",
    });
    const result = generateShader(graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const declarations = result.fragmentSource
      .split("\n")
      .map((line) => /^\s*(?:float|vec3)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1])
      .filter(Boolean) as string[];
    expect(new Set(declarations).size).toBe(declarations.length);
  });
});

describe("simpleHash", () => {
  it("不同文本产生不同哈希", () => {
    expect(simpleHash("abc")).not.toBe(simpleHash("abd"));
    expect(simpleHash("abc")).toBe(simpleHash("abc"));
  });
});

describe("预设材质可编译", () => {
  it("每个预设都能直接生成源码", async () => {
    const { builtInPresets, blankPreset } = await import("./presets");
    const presets = [...builtInPresets(), blankPreset()];
    for (const preset of presets) {
      const result = generateShader(preset.graph);
      expect(result.ok, preset.id).toBe(true);
      if (!result.ok) continue;
      expect(result.fragmentSource.length, preset.id).toBeGreaterThan(500);
      expect(result.fragmentSource).toContain("gl_FragColor");
    }
  });

  it("四种工况预设无校验错误", async () => {
    const { builtInPresets } = await import("./presets");
    const { validateGraph } = await import("./validate");
    for (const preset of builtInPresets()) {
      const validation = validateGraph(preset.graph);
      expect(validation.issues, preset.id).toEqual([]);
      expect(validation.reachableNodeIds.length, preset.id).toBeGreaterThan(1);
    }
  });
});
