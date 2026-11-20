import { clamp } from './math';
import {
  BLEND_MODES,
  COLOR_TEMP_MAX,
  COLOR_TEMP_MIN,
  LAYER_IDS,
  PITCH_MAX,
  PITCH_MIN,
  YAW_MAX,
  YAW_MIN,
  type BlendMode,
  type CameraState,
  type LayerId,
  type LayerState,
  type ViewState,
} from './types';

export function createDefaultView(): ViewState {
  return {
    layers: {
      far: { opacity: 1, blend: 'normal', visible: true },
      mid: { opacity: 1, blend: 'normal', visible: true },
      near: { opacity: 1, blend: 'normal', visible: true },
    },
    order: ['far', 'mid', 'near'],
    fog: 0.34,
    colorTemp: 5600,
    night: false,
    camera: { pitch: -2, yaw: 0 },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return clamp(n, min, max);
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function isLayerId(value: unknown): value is LayerId {
  return typeof value === 'string' && (LAYER_IDS as readonly string[]).includes(value);
}

export function isBlendMode(value: unknown): value is BlendMode {
  return typeof value === 'string' && (BLEND_MODES as readonly string[]).includes(value);
}

export function normalizeLayer(value: unknown, fallback: LayerState): LayerState {
  if (!isRecord(value)) return { ...fallback };
  return {
    opacity: num(value.opacity, fallback.opacity, 0, 1),
    blend: isBlendMode(value.blend) ? value.blend : fallback.blend,
    visible: bool(value.visible, fallback.visible),
  };
}

/** 校验并补全图层顺序：去重、丢弃非法值、补上缺失图层 */
export function normalizeOrder(value: unknown, fallback: LayerId[]): LayerId[] {
  const seen = new Set<LayerId>();
  const result: LayerId[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isLayerId(item) && !seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  for (const id of LAYER_IDS) {
    if (!seen.has(id)) result.push(id);
  }
  if (result.length === 0) return [...fallback];
  return result;
}

export function normalizeCamera(value: unknown, fallback: CameraState): CameraState {
  if (!isRecord(value)) return { ...fallback };
  return {
    pitch: num(value.pitch, fallback.pitch, PITCH_MIN, PITCH_MAX),
    yaw: num(value.yaw, fallback.yaw, YAW_MIN, YAW_MAX),
  };
}

/** 将任意未知输入规整为合法的 ViewState（用于导入与 localStorage 恢复） */
export function sanitizeView(value: unknown): ViewState {
  const fallback = createDefaultView();
  if (!isRecord(value)) return fallback;
  const rawLayers = isRecord(value.layers) ? value.layers : {};
  return {
    layers: {
      far: normalizeLayer(rawLayers.far, fallback.layers.far),
      mid: normalizeLayer(rawLayers.mid, fallback.layers.mid),
      near: normalizeLayer(rawLayers.near, fallback.layers.near),
    },
    order: normalizeOrder(value.order, fallback.order),
    fog: num(value.fog, fallback.fog, 0, 1),
    colorTemp: num(value.colorTemp, fallback.colorTemp, COLOR_TEMP_MIN, COLOR_TEMP_MAX),
    night: bool(value.night, fallback.night),
    camera: normalizeCamera(value.camera, fallback.camera),
  };
}

export function cloneView(view: ViewState): ViewState {
  return {
    layers: {
      far: { ...view.layers.far },
      mid: { ...view.layers.mid },
      near: { ...view.layers.near },
    },
    order: [...view.order],
    fog: view.fog,
    colorTemp: view.colorTemp,
    night: view.night,
    camera: { ...view.camera },
  };
}

/**
 * 将某图层拖放到目标图层的位置（拖拽排序），返回新数组。
 * - 向上拖（目标更靠近顶层）：落在目标之上
 * - 向下拖：落在目标之下
 */
export function moveLayer(order: readonly LayerId[], from: LayerId, to: LayerId): LayerId[] {
  if (from === to) return [...order];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) return [...order];
  const next = order.filter((id) => id !== from);
  const anchor = next.indexOf(to);
  const insertAt = fromIndex < toIndex ? anchor + 1 : anchor;
  next.splice(insertAt, 0, from);
  return next;
}

/** 把图层上移一位（靠近顶层，即数组尾部） */
export function raiseLayer(order: readonly LayerId[], id: LayerId): LayerId[] {
  const index = order.indexOf(id);
  if (index < 0 || index === order.length - 1) return [...order];
  const next = [...order];
  const a = next[index] as LayerId;
  const b = next[index + 1] as LayerId;
  next[index] = b;
  next[index + 1] = a;
  return next;
}

/** 把图层下移一位（靠近底层） */
export function lowerLayer(order: readonly LayerId[], id: LayerId): LayerId[] {
  const index = order.indexOf(id);
  if (index <= 0) return [...order];
  const next = [...order];
  const a = next[index] as LayerId;
  const b = next[index - 1] as LayerId;
  next[index] = b;
  next[index - 1] = a;
  return next;
}
