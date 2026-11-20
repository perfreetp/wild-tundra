/**
 * 全局类型定义：材质、扫描参数、天气档位、点云记录
 */

/** 八类材质体标识 */
export type MaterialId =
  | 'asphalt'
  | 'concrete'
  | 'vehicleMetal'
  | 'signMetal'
  | 'glass'
  | 'plastic'
  | 'vegetation'
  | 'guardrailMetal';

export interface MaterialDef {
  id: MaterialId;
  /** 面板显示名 */
  label: string;
  /** 场景预览色 */
  color: number;
  /** 默认反射率（0.05–0.9） */
  defaultReflectance: number;
  /** 默认粗糙度（0–1） */
  defaultRoughness: number;
}

/** 运行时可调的材质参数 */
export interface MaterialParams {
  reflectance: number;
  roughness: number;
}

export type MaterialParamMap = Record<MaterialId, MaterialParams>;

/** 雨雾档位：晴 + 三档雾（消光系数 0.02 / 0.08 / 0.2 /m） */
export type WeatherLevel = 'clear' | 'lightFog' | 'mediumFog' | 'heavyFog';

export interface WeatherDef {
  id: WeatherLevel;
  label: string;
  /** 大气消光系数 sigma (1/m)，晴天为 0 */
  extinction: number;
  /** 雾的随机丢点概率（sigma=0 时不丢点） */
  dropout: number;
}

/** 扫描参数 */
export interface ScanConfig {
  /** 线束数（垂直方向通道数），16–128 */
  channels: number;
  /** 水平角分辨率（度） */
  horizontalResolutionDeg: number;
  /** 有效量程（m），超出视为无回波 */
  maxRange: number;
  /** 垂直视场上角（度） */
  vfovTopDeg: number;
  /** 垂直视场下角（度） */
  vfovBottomDeg: number;
  /** 传感器离地点高度（m） */
  sensorHeight: number;
}

/** 单条点云记录 */
export interface PointRecord {
  x: number;
  y: number;
  z: number;
  /** 合成后的最终回波强度（0–1） */
  intensity: number;
  /** 命中材质 */
  material: MaterialId;
  /** 命中距离（m） */
  range: number;
  /** 入射角余弦（射线与法线夹角余弦，正值） */
  cosIncidence: number;
  /** 是否属于法线近垂直的强回波高亮 */
  highlight: boolean;
}

export const REFLECTANCE_MIN = 0.05;
export const REFLECTANCE_MAX = 0.9;
export const ROUGHNESS_MIN = 0;
export const ROUGHNESS_MAX = 1;

/** 高亮判定阈值：入射角余弦 >= 该值（法线越接近射线反向，回波越强） */
export const HIGHLIGHT_COS_THRESHOLD = 0.95;
/** 且归一化强度需高于该值 */
export const HIGHLIGHT_INTENSITY_THRESHOLD = 0.35;
