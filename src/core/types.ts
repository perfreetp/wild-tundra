/**
 * 节点图的纯数据模型：类型、端口、节点定义。
 * 这一层不依赖 React / Babylon，浏览器与 Node 测试环境都能直接跑。
 */

/** 端口数据类型：标量（float）/ 向量（vec3）/ 颜色（vec3，显示上区分）。 */
export type PortType = "scalar" | "vector" | "color";

/** 节点种类。 */
export type NodeKind =
  | "constant"
  | "noise"
  | "gradient"
  | "fresnel"
  | "normalNoise"
  | "output";

export interface PortDef {
  id: string;
  label: string;
  type: PortType;
}

export type ParamValue = number | string | boolean | number[];

export interface ParamDef {
  key: string;
  label: string;
  kind: "number" | "color" | "vector3" | "select" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  default: ParamValue;
  /** 影响着色器源码形状的参数（例如噪波类型）需要整段重编，其余只更新 uniform。 */
  structural?: boolean;
  hint?: string;
}

export interface NodeDefinition {
  kind: NodeKind;
  label: string;
  /** 该节点在面板上的分类色。 */
  category: "source" | "pattern" | "lighting" | "output";
  summary: string;
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  /** 画布位置（左上角，像素）。 */
  x: number;
  y: number;
  params: Record<string, ParamValue>;
}

export interface GraphEdge {
  id: string;
  /** 源节点与输出端口。 */
  fromNode: string;
  fromPort: string;
  /** 目标节点与输入端口。 */
  toNode: string;
  toPort: string;
}

export interface MaterialGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** 每个端口类型在着色器里对应的 GLSL 类型。 */
export const GLSL_TYPE: Record<PortType, string> = {
  scalar: "float",
  vector: "vec3",
  color: "vec3",
};

export const PORT_TYPE_LABEL: Record<PortType, string> = {
  scalar: "标量",
  vector: "向量",
  color: "颜色",
};

/** 端口类型的主题色，画布与图例共用。 */
export const PORT_TYPE_COLOR: Record<PortType, string> = {
  scalar: "#f2c14e",
  vector: "#4fd1c5",
  color: "#f472b6",
};
