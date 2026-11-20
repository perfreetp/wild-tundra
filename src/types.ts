// 热网三维着色系统 —— 核心数据模型

export type NodeType = 'source' | 'junction' | 'building';
export type Side = 'supply' | 'return';
export type ColorMode = 'pressure' | 'temperature';

/** 管网节点（x/y/z 单位：米，z 为高程） */
export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  x: number;
  y: number;
  z: number;
  /** 节点口径，单位 mm，决定球体贴图缩放 */
  diameter: number;
  /** 楼栋热负荷折算的需求流量 m³/h（仅 building 节点有效） */
  demand?: number;
}

/** 管段（沿折线 points 敷设，圆柱逐段挤出） */
export interface Pipe {
  id: string;
  name: string;
  from: string;
  to: string;
  /** 折线控制点（不含隐含的 from/to 端点，可空表示直连） */
  polyline?: [number, number, number][];
  /** 公称直径 mm */
  diameter: number;
}

/** 完整管网（供/回水两套） */
export interface NetworkData {
  version: number;
  name: string;
  nodes: NetworkNode[];
  supplyPipes: Pipe[];
  returnPipes: Pipe[];
}

/** 泄漏点：附着在某管段上，t 为沿管段长度比例 0~1 */
export interface LeakPoint {
  id: string;
  pipeId: string;
  side: Side;
  /** 沿管段起点的比例位置 */
  t: number;
  /** 泄漏影响半径，单位 m（半径场 + 附加出流） */
  radius: number;
}

/** 色带档位（8 级） */
export interface ColorBand {
  /** 下限（含），单位与模式对应：压力 MPa / 温度 ℃ */
  min: number;
  color: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  pressureBands: ColorBand[];
  temperatureBands: ColorBand[];
  /** 比摩阻超阈值判定 Pa/m，超过的管段高亮描边 */
  lossThreshold: number;
}

/** 单管段解算结果 */
export interface PipeResult {
  pipeId: string;
  fromPressure: number; // MPa
  toPressure: number;
  fromTemp: number; // ℃
  toTemp: number;
  flow: number; // m³/h
  velocity: number; // m/s
  lossPerMeter: number; // Pa/m
  overThreshold: boolean;
  length: number; // m
}

/** 泄漏拆分后的虚拟分段（沿程采样用） */
export interface PipeSegment {
  /** 在原管段上的比例区间 */
  t0: number;
  t1: number;
  p0: number;
  p1: number;
  T0: number;
  T1: number;
  flow: number;
  velocity: number;
  lossPerMeter: number;
}

export interface SolverResult {
  /** nodeId -> 压力 MPa */
  nodePressure: Record<string, number>;
  /** nodeId -> 温度 ℃ */
  nodeTemp: Record<string, number>;
  pipes: Record<string, PipeResult>;
  /** 原管段 id -> 虚拟分段（泄漏拆分后的折点段），沿程采样用 */
  segments?: Record<string, PipeSegment[]>;
}

/** 沿程 0.5m 采样点 */
export interface ProfileSample {
  distance: number;
  pressure: number;
  temp: number;
}

/** 管段弹窗信息 */
export interface PipeSelection {
  pipeId: string;
  side: Side;
}

/** 视角预设 */
export interface ViewPreset {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

/** 导出文件封装 */
export interface ExportEnvelope {
  kind: 'network' | 'scheme' | 'full';
  exportedAt: string;
  network?: NetworkData;
  scheme?: ColorScheme;
  leaks?: LeakPoint[];
}
