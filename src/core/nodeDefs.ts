import type {
  NodeDefinition,
  NodeKind,
  ParamDef,
  ParamValue,
  PortDef,
} from "./types";

const scalar = (id: string, label: string): PortDef => ({ id, label, type: "scalar" });
const vector = (id: string, label: string): PortDef => ({ id, label, type: "vector" });
const color = (id: string, label: string): PortDef => ({ id, label, type: "color" });

const num = (
  key: string,
  label: string,
  def: number,
  min: number,
  max: number,
  step = 0.01,
  extra: Partial<ParamDef> = {},
): ParamDef => ({ key, label, kind: "number", default: def, min, max, step, ...extra });

const col = (key: string, label: string, def: string): ParamDef => ({
  key,
  label,
  kind: "color",
  default: def,
});

const vec = (key: string, label: string, def: number[]): ParamDef => ({
  key,
  label,
  kind: "vector3",
  default: def,
});

const sel = (
  key: string,
  label: string,
  def: string,
  options: { value: string; label: string }[],
): ParamDef => ({ key, label, kind: "select", default: def, options, structural: true });

const bool = (key: string, label: string, def: boolean, structural = false): ParamDef => ({
  key,
  label,
  kind: "boolean",
  default: def,
  structural,
});

export const NOISE_TYPE_OPTIONS = [
  { value: "fbm", label: "平滑分形" },
  { value: "ridged", label: "脊状" },
  { value: "cells", label: "细胞斑块" },
  { value: "stripes", label: "条纹" },
];

export const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: n === 1 ? "1 层" : `${n} 层`,
}));

export const GRADIENT_MODE_OPTIONS = [
  { value: "y", label: "沿 Y 轴" },
  { value: "x", label: "沿 X 轴" },
  { value: "radial", label: "径向 XY" },
];

export const NODE_DEFINITIONS: Record<NodeKind, NodeDefinition> = {
  constant: {
    kind: "constant",
    label: "常量",
    category: "source",
    summary: "固定标量 / 向量 / 颜色，用作金属度、基础色等常量输入。",
    inputs: [],
    outputs: [scalar("scalar", "标量"), vector("vector", "向量"), color("color", "颜色")],
    params: [
      num("value", "标量值", 0.9, 0, 1, 0.01),
      vec("vector", "向量", [0.2, 0.45, 0.75]),
      col("color", "颜色", "#b9c2c8"),
    ],
  },
  noise: {
    kind: "noise",
    label: "噪波",
    category: "pattern",
    summary: "三平面程序噪波，可产出生锈斑块、镀锌结晶、积灰与破损遮罩。",
    inputs: [vector("coord", "坐标")],
    outputs: [
      scalar("value", "值"),
      scalar("mask", "遮罩"),
      vector("rgb", "噪波 RGB"),
      color("color", "着色"),
    ],
    params: [
      sel("type", "类型", "fbm", NOISE_TYPE_OPTIONS),
      num("scale", "尺度", 7, 0.2, 48, 0.1, { hint: "越大纹理越细" }),
      sel("octaves", "细节层数", "3", OCTAVE_OPTIONS),
      num("contrast", "对比", 0.35, 0, 1),
      num("threshold", "遮罩阈值", 0.55, 0, 1),
      num("edge", "遮罩柔化", 0.08, 0.002, 0.5, 0.002),
      col("baseColor", "底色", "#aab4bb"),
      col("tint", "斑点色", "#7a5230"),
    ],
  },
  gradient: {
    kind: "gradient",
    label: "渐变",
    category: "pattern",
    summary: "轴向或径向渐变，常用作积灰高度、锈蚀过渡的遮罩。",
    inputs: [vector("coord", "坐标")],
    outputs: [scalar("value", "值"), color("color", "着色")],
    params: [
      sel("mode", "模式", "y", GRADIENT_MODE_OPTIONS),
      num("start", "起点", -0.6, -4, 4),
      num("end", "终点", 0.6, -4, 4),
      bool("invert", "反向", false),
      num("smooth", "柔化", 0.35, 0, 1),
      col("colorA", "低端色", "#6f7378"),
      col("colorB", "高端色", "#c9a26b"),
    ],
  },
  fresnel: {
    kind: "fresnel",
    label: "菲涅尔",
    category: "lighting",
    summary: "视线与法线夹角带来边缘增强，表现镀层边缘高光与锈层起皮。",
    inputs: [scalar("roughness", "粗糙度")],
    outputs: [scalar("value", "值")],
    params: [
      num("scale", "强度", 0.85, 0, 2),
      num("bias", "偏移", 0.0, 0, 1),
      num("power", "幂次", 3.0, 0.5, 10, 0.1),
    ],
  },
  normalNoise: {
    kind: "normalNoise",
    label: "法线扰动",
    category: "lighting",
    summary: "用高度场梯度扰动法线，制造镀锌麻点、锈蚀坑洼的凹凸感。",
    inputs: [scalar("height", "高度")],
    outputs: [vector("normal", "法线")],
    params: [
      num("scale", "缩放", 12, 0.2, 48, 0.1),
      num("strength", "强度", 0.12, 0, 3, 0.005),
      sel("octaves", "细节层数", "2", OCTAVE_OPTIONS),
    ],
  },
  output: {
    kind: "output",
    label: "材质输出",
    category: "output",
    summary: "汇总基础色、金属度、粗糙度、法线与高光强度，交给预览着色器。",
    inputs: [
      color("baseColor", "基础色"),
      scalar("metallic", "金属度"),
      scalar("roughness", "粗糙度"),
      vector("normal", "法线"),
      scalar("specular", "高光强度"),
    ],
    outputs: [],
    params: [],
  },
};

export const NODE_KINDS: NodeKind[] = [
  "constant",
  "noise",
  "gradient",
  "fresnel",
  "normalNoise",
  "output",
];

export function nodeDefinition(kind: NodeKind): NodeDefinition {
  return NODE_DEFINITIONS[kind];
}

export function defaultParams(kind: NodeKind): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  for (const p of NODE_DEFINITIONS[kind].params) {
    params[p.key] = Array.isArray(p.default) ? [...p.default] : p.default;
  }
  return params;
}

export function portOf(
  kind: NodeKind,
  portId: string,
  direction: "input" | "output",
): PortDef | undefined {
  const def = NODE_DEFINITIONS[kind];
  const list = direction === "input" ? def.inputs : def.outputs;
  return list.find((p) => p.id === portId);
}
