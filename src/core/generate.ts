/**
 * 节点图 → GLSL 源码生成。
 *
 * 约定：
 * - 所有节点参数以字面量烘焙进源码，因此任何参数改动都会生成新源码，右侧代码面板立即可见。
 * - 预览面板的光源方位、粗糙度缩放、曝光走 uniform，不触发重编。
 * - 生成是纯函数，源码哈希用作 GPU 编译缓存键。
 * - 每个节点产生的局部变量都带节点序号前缀，多个同类节点不会互相重复声明。
 */
import { nodeDefinition } from "./nodeDefs";
import { topologicalOrder } from "./graph";
import type { GraphNode, MaterialGraph, PortType } from "./types";
import { validateGraph, type GraphIssue } from "./validate";

export const GENERATOR_VERSION = 7;

export interface NodeLineRange {
  start: number;
  end: number;
}

export interface GeneratedShader {
  ok: true;
  vertexSource: string;
  fragmentSource: string;
  uniforms: string[];
  attributes: string[];
  /** 每个节点在片元源码中的行号区间（1 基，闭区间）。 */
  nodeLineRanges: Record<string, NodeLineRange>;
  /** 生成结果哈希，用作编译缓存键。 */
  key: string;
  reachableNodeIds: string[];
  notes: string[];
}

export interface GenerateError {
  ok: false;
  reason: string;
  issues: GraphIssue[];
}

export type GenerateResult = GeneratedShader | GenerateError;

/* ------------------------------------------------------------------ */
/* 数值与颜色                                                          */
/* ------------------------------------------------------------------ */

export function formatFloat(value: number): string {
  if (!Number.isFinite(value)) return "0.0";
  let text = value.toFixed(5);
  text = text.replace(/0+$/, "");
  if (text.endsWith(".")) text += "0";
  if (text === "-0.0") text = "0.0";
  return text;
}

export function srgbToLinear(channel: number): number {
  const c = Math.min(1, Math.max(0, channel));
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function hexToLinearRgb(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  const value = match ? match[1] : "808080";
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

export function glslVec3(values: number[] | string): string {
  if (typeof values === "string") {
    const [r, g, b] = hexToLinearRgb(values);
    return `vec3(${formatFloat(r)}, ${formatFloat(g)}, ${formatFloat(b)})`;
  }
  const components = [0, 1, 2].map((i) => formatFloat(Number(values[i] ?? 0)));
  return `vec3(${components[0]}, ${components[1]}, ${components[2]})`;
}

export function glslFloat(value: unknown, fallback = 0): string {
  const numeric = typeof value === "number" ? value : Number(value);
  return formatFloat(Number.isFinite(numeric) ? numeric : fallback);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function clamp01(value: unknown, fallback: number): number {
  return clampNumber(value, 0, 1, fallback);
}

/** 由字符串派生的稳定小偏移，避免多个同类噪波节点完全重合。 */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 1000;
}

const DEFAULT_BASE_COLOR = "#b9c2c8";

/* ------------------------------------------------------------------ */
/* 节点代码生成                                                        */
/* ------------------------------------------------------------------ */

class Lines {
  readonly items: string[] = [];

  get length(): number {
    return this.items.length;
  }

  push(line = ""): void {
    this.items.push(line);
  }

  pushAll(lines: readonly string[]): void {
    for (const line of lines) this.items.push(line);
  }
}

type EmitContext = {
  node: GraphNode;
  /** 输出端口对应的变量名。 */
  varOf: (portId: string) => string;
  /** 输入端口已就绪的变量名，未连接时为 null。 */
  inputOf: (portId: string) => string | null;
  /** 该节点专属的局部变量名。 */
  tmp: (name: string) => string;
  helpers: Set<string>;
};

const TYPE_COMMENT: Record<PortType, string> = {
  scalar: "float",
  vector: "vec3",
  color: "vec3",
};

function sanitize(text: string): string {
  return text.replace(/[^a-zA-Z0-9_]/g, "_");
}

const EMITTERS: Record<Exclude<GraphNode["kind"], "output">, (out: Lines, ctx: EmitContext) => void> = {
  constant(out, { node, varOf }) {
    const vector = Array.isArray(node.params.vector) ? node.params.vector : [0.2, 0.45, 0.75];
    out.push("// 常量：标量 / 向量 / 颜色三路输出");
    out.push(`float ${varOf("scalar")} = ${glslFloat(node.params.value, 0.5)};`);
    out.push(`vec3 ${varOf("vector")} = ${glslVec3(vector)};`);
    out.push(
      `vec3 ${varOf("color")} = ${glslVec3(
        typeof node.params.color === "string" ? node.params.color : DEFAULT_BASE_COLOR,
      )};`,
    );
  },

  noise(out, { node, varOf, inputOf, tmp, helpers }) {
    const type = String(node.params.type ?? "fbm");
    const octaves = Math.round(clampNumber(node.params.octaves, 1, 6, 3));
    const scale = clampNumber(node.params.scale, 0.05, 64, 7);
    const contrast = clamp01(node.params.contrast, 0.35);
    const threshold = clamp01(node.params.threshold, 0.55);
    const edge = clampNumber(node.params.edge, 0.002, 0.5, 0.08);
    const base = glslVec3(typeof node.params.baseColor === "string" ? node.params.baseColor : DEFAULT_BASE_COLOR);
    const tint = glslVec3(typeof node.params.tint === "string" ? node.params.tint : "#7a5230");
    const seed = hashString(node.id) * 0.137;
    const coord = inputOf("coord");
    const typeLabel =
      type === "ridged" ? "脊状" : type === "cells" ? "细胞斑块" : type === "stripes" ? "条纹" : "平滑分形";
    const p = tmp("p");
    const value = varOf("value");

    helpers.add("hn_vnoise");
    let valueExpr: string;
    if (type === "cells") {
      helpers.add("hn_cells");
      valueExpr = `1.0 - clamp(hn_cells(${p} * ${glslFloat(scale)} + ${glslFloat(seed)}) * 1.35, 0.0, 1.0)`;
    } else if (type === "stripes") {
      helpers.add(`hn_fbm${octaves}`);
      valueExpr = `0.5 + 0.5 * sin(${p}.x * ${glslFloat(scale * 4)} + hn_fbm${octaves}(${p} * ${glslFloat(
        scale * 0.35,
      )} + ${glslFloat(seed)}) * 6.2831853)`;
    } else if (type === "ridged") {
      helpers.add(`hn_ridge${octaves}`);
      valueExpr = `hn_ridge${octaves}(${p} * ${glslFloat(scale)} + ${glslFloat(seed)})`;
    } else {
      helpers.add(`hn_fbm${octaves}`);
      valueExpr = `hn_fbm${octaves}(${p} * ${glslFloat(scale)} + ${glslFloat(seed)})`;
    }

    const raw = tmp("raw");
    out.push(`// 噪波：${typeLabel}，${octaves} 层细节`);
    out.push(`vec3 ${p} = ${coord ?? "vPositionW"};`);
    out.push(`float ${raw} = ${valueExpr};`);
    // 对比度：原始值向 smoothstep 后的值插值，保持可预测的 [0,1] 范围
    out.push(`float ${value} = mix(${raw}, smoothstep(0.2, 0.8, ${raw}), ${glslFloat(contrast)});`);
    out.push(
      `float ${varOf("mask")} = smoothstep(${glslFloat(threshold - edge)}, ${glslFloat(threshold + edge)}, ${value});`,
    );
    out.push("// RGB 取三个相位偏移的采样，便于做彩色锈迹");
    const scaleLit = glslFloat(scale);
    out.push(
      `vec3 ${varOf("rgb")} = vec3(hn_vnoise(${p} * ${scaleLit} + ${glslFloat(seed)}), ` +
        `hn_vnoise(${p} * ${scaleLit} + ${glslFloat(seed + 17.3)}), ` +
        `hn_vnoise(${p} * ${scaleLit} + ${glslFloat(seed + 41.1)}));`,
    );
    out.push(
      `vec3 ${varOf("color")} = mix(${base}, ${tint}, ${varOf("mask")}) * (0.9 + 0.2 * ${value});`,
    );
  },

  gradient(out, { node, varOf, inputOf, tmp }) {
    const mode = String(node.params.mode ?? "y");
    const invert = Boolean(node.params.invert);
    const smooth = clamp01(node.params.smooth, 0.3);
    const start = clampNumber(node.params.start, -8, 8, -0.6);
    const end = clampNumber(node.params.end, -8, 8, 0.6);
    const colorA = glslVec3(typeof node.params.colorA === "string" ? node.params.colorA : "#6f7378");
    const colorB = glslVec3(typeof node.params.colorB === "string" ? node.params.colorB : "#c9a26b");
    const coord = inputOf("coord");
    const modeLabel = mode === "x" ? "沿 X 轴" : mode === "radial" ? "径向" : "沿 Y 轴";
    const gpos = tmp("gpos");
    const gt = tmp("gt");
    const linear = tmp("linear");
    const shaped = tmp("shaped");
    const safeStart = glslFloat(start);
    const safeEnd = glslFloat(end);

    out.push(`// 渐变：${modeLabel}${invert ? "（反向）" : ""}`);
    out.push(`vec3 ${gpos} = ${coord ?? "vPositionW"};`);
    if (mode === "x") out.push(`float ${gt} = ${gpos}.x;`);
    else if (mode === "radial") out.push(`float ${gt} = length(${gpos}.xy);`);
    else out.push(`float ${gt} = ${gpos}.y;`);
    out.push(
      `float ${linear} = clamp((${gt} - (${safeStart})) / max((${safeEnd}) - (${safeStart}), 0.0001), 0.0, 1.0);`,
    );
    out.push(`float ${shaped} = mix(${linear}, smoothstep(0.0, 1.0, ${linear}), ${glslFloat(smooth)});`);
    out.push(`float ${varOf("value")} = ${invert ? `1.0 - ${shaped}` : shaped};`);
    out.push(`vec3 ${varOf("color")} = mix(${colorA}, ${colorB}, ${varOf("value")});`);
  },

  fresnel(out, { node, varOf, inputOf, tmp }) {
    const scale = clampNumber(node.params.scale, 0, 4, 0.85);
    const bias = clampNumber(node.params.bias, 0, 1, 0);
    const power = clampNumber(node.params.power, 0.25, 16, 3);
    const roughness = inputOf("roughness");
    const rough = tmp("rough");
    out.push("// 菲涅尔：边缘增强，粗糙度越高边缘越宽");
    out.push(`float ${rough} = clamp(${roughness ?? "0.35"}, 0.0, 1.0);`);
    out.push(
      `float ${varOf("value")} = clamp(${glslFloat(bias)} + ${glslFloat(scale)} * pow(1.0 - clamp(dot(N_geo, V), 0.0, 1.0), ${glslFloat(
        power,
      )} * (0.6 + 0.8 * ${rough})), 0.0, 4.0);`,
    );
  },

  normalNoise(out, { node, varOf, inputOf, tmp, helpers }) {
    const octaves = Math.round(clampNumber(node.params.octaves, 1, 6, 2));
    const scale = clampNumber(node.params.scale, 0.1, 64, 12);
    const strength = clampNumber(node.params.strength, 0, 3, 0.12);
    const height = inputOf("height");
    const fbm = `hn_fbm${octaves}`;
    const pos = tmp("pos");
    const amp = tmp("amp");
    const h0 = tmp("h0");
    const grad = tmp("grad");
    helpers.add("hn_vnoise");
    helpers.add(fbm);
    out.push("// 法线扰动：高度场梯度投影到切平面后扰动法线");
    out.push(`vec3 ${pos} = vPositionW * ${glslFloat(scale)};`);
    out.push(`float ${amp} = ${glslFloat(strength)} * ${height ? `(0.25 + clamp(${height}, 0.0, 2.0))` : "1.0"};`);
    out.push(`float ${h0} = ${fbm}(${pos});`);
    out.push(`float ${tmp("hx")} = ${fbm}(${pos} + vec3(0.07, 0.0, 0.0));`);
    out.push(`float ${tmp("hy")} = ${fbm}(${pos} + vec3(0.0, 0.07, 0.0));`);
    out.push(`float ${tmp("hz")} = ${fbm}(${pos} + vec3(0.0, 0.0, 0.07));`);
    out.push(
      `vec3 ${grad} = vec3(${tmp("hx")} - ${h0}, ${tmp("hy")} - ${h0}, ${tmp("hz")} - ${h0}) / 0.07;`,
    );
    out.push(`${grad} -= N_geo * dot(${grad}, N_geo);`);
    out.push(`vec3 ${varOf("normal")} = normalize(N_geo - ${amp} * ${grad});`);
  },
};

/* ------------------------------------------------------------------ */
/* GLSL 工具函数（按需注入）                                            */
/* ------------------------------------------------------------------ */

const NOISE_CORE = [
  "// 稳定哈希，避免依赖 fract(sin()) 的精度问题",
  "float hn_hash(vec3 p) {",
  "  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));",
  "  p *= 27.0;",
  "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
  "}",
  "float hn_vnoise(vec3 x) {",
  "  vec3 i = floor(x);",
  "  vec3 f = fract(x);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  float n000 = hn_hash(i);",
  "  float n100 = hn_hash(i + vec3(1.0, 0.0, 0.0));",
  "  float n010 = hn_hash(i + vec3(0.0, 1.0, 0.0));",
  "  float n110 = hn_hash(i + vec3(1.0, 1.0, 0.0));",
  "  float n001 = hn_hash(i + vec3(0.0, 0.0, 1.0));",
  "  float n101 = hn_hash(i + vec3(1.0, 0.0, 1.0));",
  "  float n011 = hn_hash(i + vec3(0.0, 1.0, 1.0));",
  "  float n111 = hn_hash(i + vec3(1.0, 1.0, 1.0));",
  "  return mix(",
  "    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),",
  "    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),",
  "    f.z);",
  "}",
];

const LACUNARITY = 2.03;
const FBM_OFFSETS = [7.1, 19.3, 31.7, 53.9];

function fbmHelper(octaves: number): string[] {
  const lines = [`float hn_fbm${octaves}(vec3 p) {`, "  float s = 0.5 * hn_vnoise(p);"];
  let amplitude = 0.5;
  let total = 0.5;
  for (let i = 1; i < octaves; i++) {
    amplitude *= 0.5;
    total += amplitude;
    const freq = Math.pow(LACUNARITY, i);
    lines.push(
      `  s += ${formatFloat(amplitude)} * hn_vnoise(p * ${formatFloat(freq)} + ${formatFloat(FBM_OFFSETS[i - 1] ?? 7.1)});`,
    );
  }
  lines.push(`  return s / ${formatFloat(total)};`, "}");
  return lines;
}

function ridgeHelper(octaves: number): string[] {
  const lines = [
    `float hn_ridge${octaves}(vec3 p) {`,
    "  float s = 0.5 * (1.0 - abs(2.0 * hn_vnoise(p) - 1.0));",
  ];
  let amplitude = 0.5;
  let total = 0.5;
  for (let i = 1; i < octaves; i++) {
    amplitude *= 0.5;
    total += amplitude;
    const freq = Math.pow(LACUNARITY, i);
    lines.push(
      `  s += ${formatFloat(amplitude)} * (1.0 - abs(2.0 * hn_vnoise(p * ${formatFloat(freq)} + ${formatFloat(
        FBM_OFFSETS[i - 1] ?? 7.1,
      )}) - 1.0));`,
    );
  }
  lines.push(`  return s / ${formatFloat(total)};`, "}");
  return lines;
}

const CELLS_HELPER = [
  "// 细胞噪声：到最近特征点的距离",
  "float hn_cells(vec3 p) {",
  "  vec3 i = floor(p);",
  "  vec3 f = fract(p);",
  "  float d = 8.0;",
  "  for (int x = -1; x <= 1; x++) {",
  "    for (int y = -1; y <= 1; y++) {",
  "      for (int z = -1; z <= 1; z++) {",
  "        vec3 g = vec3(float(x), float(y), float(z));",
  "        vec3 o = vec3(hn_hash(i + g), hn_hash(i + g + vec3(19.1, 7.7, 3.3)), hn_hash(i + g + vec3(5.5, 29.3, 11.1)));",
  "        vec3 r = g + o - f;",
  "        d = min(d, dot(r, r));",
  "      }",
  "    }",
  "  }",
  "  return clamp(sqrt(d), 0.0, 1.0);",
  "}",
];

function helperSource(name: string): string[] | null {
  if (name === "hn_vnoise") return NOISE_CORE;
  if (name === "hn_cells") return CELLS_HELPER;
  const fbm = /^hn_fbm(\d+)$/.exec(name);
  if (fbm) return fbmHelper(Number(fbm[1]));
  const ridge = /^hn_ridge(\d+)$/.exec(name);
  if (ridge) return ridgeHelper(Number(ridge[1]));
  return null;
}

/** 固定注入顺序，保证同样的图得到逐字节相同的源码。 */
function helperOrder(names: Set<string>): string[] {
  const order: string[] = [];
  if (names.has("hn_vnoise")) order.push("hn_vnoise");
  for (let i = 1; i <= 6; i++) if (names.has(`hn_fbm${i}`)) order.push(`hn_fbm${i}`);
  for (let i = 1; i <= 6; i++) if (names.has(`hn_ridge${i}`)) order.push(`hn_ridge${i}`);
  if (names.has("hn_cells")) order.push("hn_cells");
  return order;
}

/* ------------------------------------------------------------------ */
/* 顶点源码与 uniform                                                   */
/* ------------------------------------------------------------------ */

export const VERTEX_SOURCE = `precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

void main(void) {
  vec4 worldPos = world * vec4(position, 1.0);
  vPositionW = worldPos.xyz;
  vNormalW = normalize(mat3(world) * normal);
  vUV = uv;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

export const SHADER_UNIFORMS = [
  "world",
  "worldViewProjection",
  "cameraPosition",
  "uLightDir",
  "uLightIntensity",
  "uRoughnessScale",
  "uExposure",
];

/* ------------------------------------------------------------------ */
/* 片元生成                                                            */
/* ------------------------------------------------------------------ */

export function simpleHash(text: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    hash1 = (Math.imul(hash1, 33) ^ code) >>> 0;
    hash2 = (Math.imul(hash2, 31) ^ code) >>> 0;
  }
  return hash1.toString(36) + hash2.toString(36);
}

function buildFragment(
  graph: MaterialGraph,
  order: GraphNode[],
  reachable: string[],
): { source: string; ranges: Record<string, NodeLineRange>; notes: string[] } {
  const helpers = new Set<string>();
  const ranges: Record<string, NodeLineRange> = {};
  const notes: string[] = [];
  const indexOf = new Map(order.map((n, i) => [n.id, i]));
  const inputSource = new Map<string, { node: string; port: string }>();
  for (const edge of graph.edges) {
    inputSource.set(`${edge.toNode}:${edge.toPort}`, { node: edge.fromNode, port: edge.fromPort });
  }

  const varOf = (nodeId: string, portId: string) =>
    `nd${indexOf.get(nodeId) ?? 0}_${sanitize(portId)}`;
  const inputOf = (nodeId: string, portId: string) => {
    const source = inputSource.get(`${nodeId}:${portId}`);
    return source ? varOf(source.node, source.port) : null;
  };

  const body = new Lines();
  const bodyRanges: Record<string, NodeLineRange> = {};

  body.push("  // ---- 几何基向量 ----");
  body.push("  vec3 N_geo = normalize(vNormalW);");
  body.push("  vec3 V = normalize(cameraPosition - vPositionW);");
  body.push("");

  for (const node of order) {
    if (node.kind === "output") continue;
    const emitter = EMITTERS[node.kind];
    if (!emitter) continue;
    const start = body.length + 1;
    const index = indexOf.get(node.id) ?? 0;
    emitter(body, {
      node,
      varOf: (portId) => varOf(node.id, portId),
      inputOf: (portId) => inputOf(node.id, portId),
      tmp: (name) => `nd${index}_${name}`,
      helpers,
    });
    body.push("");
    bodyRanges[node.id] = { start, end: body.length };
  }

  const outputNode = order.find((n) => n.kind === "output");
  if (outputNode) {
    const start = body.length + 1;
    const colorIn = inputOf(outputNode.id, "baseColor");
    const metallicIn = inputOf(outputNode.id, "metallic");
    const roughnessIn = inputOf(outputNode.id, "roughness");
    const normalIn = inputOf(outputNode.id, "normal");
    const specularIn = inputOf(outputNode.id, "specular");

    body.push("  // ---- 材质输出：汇总各路输入 ----");
    body.push(`  vec3 outBaseColor = ${colorIn ?? glslVec3(DEFAULT_BASE_COLOR)};`);
    body.push(`  float outMetallic = clamp(${metallicIn ?? "0.9"}, 0.0, 1.0);`);
    body.push(`  float outRoughness = clamp((${roughnessIn ?? "0.35"}) * uRoughnessScale, 0.03, 1.0);`);
    body.push(`  vec3 outNormal = normalize(${normalIn ?? "N_geo"});`);
    body.push(`  float outSpecular = clamp(${specularIn ?? "1.0"}, 0.0, 3.0);`);
    body.push("");
    body.push("  // ---- GGX 高光 + 半球环境，便于观察高光走向 ----");
    body.push("  vec3 L = normalize(uLightDir);");
    body.push("  float NdL = max(dot(outNormal, L), 0.0);");
    body.push("  float NdV = max(dot(outNormal, V), 0.001);");
    body.push("  vec3 H = normalize(L + V);");
    body.push("  float NdH = max(dot(outNormal, H), 0.0);");
    body.push("  float alpha = max(outRoughness * outRoughness, 0.002);");
    body.push("  float alpha2 = alpha * alpha;");
    body.push("  float denom = NdH * NdH * (alpha2 - 1.0) + 1.0;");
    body.push("  float D = alpha2 / max(3.14159265 * denom * denom, 1e-6);");
    body.push("  float gL = sqrt(alpha2 + (1.0 - alpha2) * NdL * NdL);");
    body.push("  float gV = sqrt(alpha2 + (1.0 - alpha2) * NdV * NdV);");
    body.push("  float G = 0.5 / max(NdL * gL + NdV * gV, 1e-4);");
    body.push("  vec3 F0 = mix(vec3(0.04), outBaseColor, outMetallic);");
    body.push("  vec3 F = F0 + (vec3(1.0) - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);");
    body.push("  vec3 specular = D * G * F * uLightIntensity * outSpecular;");
    body.push("");
    body.push("  // 金属没有漫反射；轻微包裹避免明暗交界过硬");
    body.push("  float wrap = clamp((dot(outNormal, L) + 0.35) / 1.35, 0.0, 1.0);");
    body.push("  vec3 diffuse = outBaseColor * (1.0 - outMetallic) * wrap / 3.14159265;");
    body.push("");
    body.push("  // 环境反射：沿反射向量取一条程序化天空带");
    body.push("  vec3 R = reflect(-V, outNormal);");
    body.push("  float skyT = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);");
    body.push("  vec3 skyLow = vec3(0.05, 0.06, 0.075);");
    body.push("  vec3 skyHigh = vec3(0.36, 0.45, 0.56);");
    body.push("  vec3 envColor = mix(skyLow, skyHigh, skyT);");
    body.push("  float envFocus = mix(1.0, 0.22, outRoughness);");
    body.push("  vec3 envSpec = envColor * envFocus * mix(vec3(0.12), vec3(1.0), outMetallic) * (0.55 + 0.45 * F);");
    body.push("  float rim = pow(1.0 - NdV, 3.0);");
    body.push("");
    body.push("  vec3 lit = diffuse * 0.9 + specular * NdL * 1.35 + envSpec + outBaseColor * rim * 0.07;");
    body.push("  lit *= uExposure;");
    body.push("  // ACES 近似色调映射 + sRGB 编码");
    body.push("  lit = clamp((lit * (2.51 * lit + 0.03)) / (lit * (2.43 * lit + 0.59) + 0.14), 0.0, 1.0);");
    body.push("  vec3 displayColor = pow(lit, vec3(1.0 / 2.2));");
    body.push("  gl_FragColor = vec4(displayColor, 1.0);");
    bodyRanges[outputNode.id] = { start, end: body.length };
  }

  const final: string[] = [];
  final.push("precision highp float;");
  final.push("");
  final.push("// ============================================================");
  final.push("// 输电金具表面防腐材质 — 由节点图自动生成，请勿手工修改");
  final.push(`// 生成器 v${GENERATOR_VERSION} | 节点 ${order.length} 个 | 连线 ${graph.edges.length} 条`);
  final.push("// ============================================================");
  final.push("");
  final.push("varying vec3 vPositionW;");
  final.push("varying vec3 vNormalW;");
  final.push("varying vec2 vUV;");
  final.push("");
  final.push("uniform vec3 cameraPosition;   // 相机位置（Babylon 内置）");
  final.push("uniform vec3 uLightDir;        // 预览光源方向（单位向量）");
  final.push("uniform float uLightIntensity; // 光源强度");
  final.push("uniform float uRoughnessScale; // 预览面板粗糙度缩放");
  final.push("uniform float uExposure;       // 曝光");
  final.push("");

  const usedHelpers = helperOrder(helpers);
  if (usedHelpers.length) {
    final.push("// ---- 程序化噪声工具函数 ----");
    for (const name of usedHelpers) {
      const source = helperSource(name);
      if (!source) continue;
      for (const line of source) final.push(line);
      final.push("");
    }
  }

  final.push("void main(void) {");
  const bodyStartLine = final.length + 1;
  for (const line of body.items) final.push(line);
  final.push("}");

  for (const [nodeId, range] of Object.entries(bodyRanges)) {
    ranges[nodeId] = {
      start: range.start + bodyStartLine - 1,
      end: range.end + bodyStartLine - 1,
    };
  }

  const unreachable = graph.nodes.filter((n) => !reachable.includes(n.id) && n.kind !== "output");
  if (unreachable.length) {
    notes.push(`已跳过 ${unreachable.length} 个未接入输出节点的节点`);
  }

  return { source: final.join("\n") + "\n", ranges, notes };
}

/* ------------------------------------------------------------------ */
/* 对外入口                                                            */
/* ------------------------------------------------------------------ */

export function generateShader(graph: MaterialGraph): GenerateResult {
  const validation = validateGraph(graph);
  const outputNode = graph.nodes.find((n) => n.kind === "output");
  if (!outputNode) {
    return {
      ok: false,
      reason: "缺少「材质输出」节点：从左侧节点库拖入一个，再把材质参数接上去。",
      issues: validation.issues,
    };
  }

  const reachableSet = new Set(validation.reachableNodeIds);
  const blocking = validation.issues.filter((issue) => {
    if (!issue.edgeId) return false;
    const edge = graph.edges.find((e) => e.id === issue.edgeId);
    if (!edge) return false;
    return reachableSet.has(edge.fromNode) || reachableSet.has(edge.toNode);
  });
  if (blocking.length) {
    return { ok: false, reason: blocking[0].message, issues: validation.issues };
  }

  const order = topologicalOrder(graph, validation.reachableNodeIds);
  if (!order) {
    return {
      ok: false,
      reason: "图中存在环，已阻止生成；请断开标红的连线。",
      issues: validation.issues,
    };
  }

  const fragment = buildFragment(graph, order, validation.reachableNodeIds);
  const key = `hme-v${GENERATOR_VERSION}-${simpleHash(fragment.source + VERTEX_SOURCE)}`;

  return {
    ok: true,
    vertexSource: VERTEX_SOURCE,
    fragmentSource: fragment.source,
    uniforms: [...SHADER_UNIFORMS],
    attributes: ["position", "normal", "uv"],
    nodeLineRanges: fragment.ranges,
    key,
    reachableNodeIds: validation.reachableNodeIds,
    notes: fragment.notes,
  };
}

/** 供 UI 展示：节点输出端口在 GLSL 中的类型。 */
export function glslTypeOf(node: GraphNode, portId: string): string {
  const port = nodeDefinition(node.kind).outputs.find((p) => p.id === portId);
  return port ? TYPE_COMMENT[port.type] : "float";
}
