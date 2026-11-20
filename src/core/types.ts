/** 图层标识：远景 / 中景 / 近景 */
export const LAYER_IDS = ['far', 'mid', 'near'] as const;
export type LayerId = (typeof LAYER_IDS)[number];

/** 需求中的三种混合模式：正常 / 叠加 / 滤色 */
export const BLEND_MODES = ['normal', 'overlay', 'screen'] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

export interface LayerState {
  /** 0..1 */
  opacity: number;
  blend: BlendMode;
  visible: boolean;
}

export interface CameraState {
  /** 俯仰角，-30..30 度，正值抬头 */
  pitch: number;
  /** 偏航角，-60..60 度，正值向右 */
  yaw: number;
}

export interface ViewState {
  /** 每个图层独立的合成参数 */
  layers: Record<LayerId, LayerState>;
  /** 合成顺序：数组从「下层」到「上层」，即先渲染 → 后渲染 */
  order: LayerId[];
  /** 雾效强度 0..1 */
  fog: number;
  /** 环境光色温 2000..8000 K */
  colorTemp: number;
  /** 昼夜状态（true = 夜间） */
  night: boolean;
  camera: CameraState;
}

export interface LayerMeta {
  id: LayerId;
  name: string;
  code: string;
  hint: string;
  /** 场景主体距离说明，用于雾效权重 */
  distance: string;
}

export const LAYER_META: Record<LayerId, LayerMeta> = {
  far: {
    id: 'far',
    name: '远景',
    code: 'FAR',
    hint: '天穹 · 山脊 · 云层',
    distance: '2–14 km',
  },
  mid: {
    id: 'mid',
    name: '中景',
    code: 'MID',
    hint: '丘陵 · 村镇 · 林木',
    distance: '120–900 m',
  },
  near: {
    id: 'near',
    name: '近景',
    code: 'NEAR',
    hint: '轨道 · 接触网 · 道旁',
    distance: '0–600 m',
  },
};

export const BLEND_META: Record<BlendMode, { name: string; hint: string }> = {
  normal: { name: '正常', hint: '按图层透明度直接覆盖' },
  overlay: { name: '叠加', hint: '保留高光与阴影的对比合成' },
  screen: { name: '滤色', hint: '提亮画面，适合亮部叠加' },
};

export const COLOR_TEMP_MIN = 2000;
export const COLOR_TEMP_MAX = 8000;
export const PITCH_MIN = -30;
export const PITCH_MAX = 30;
export const YAW_MIN = -60;
export const YAW_MAX = 60;
