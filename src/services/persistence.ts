import type { SceneConfig } from '../engine/types';

const STORAGE_KEY = 'train-cab-view:scene-config:v1';

/** 保存完整场景配置到浏览器本地存储 */
export function saveConfigLocal(config: SceneConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** 从本地存储读取配置，不存在或损坏时返回 null */
export function loadConfigLocal(): SceneConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SceneConfig;
    return validateConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 导出为 JSON 文件并触发浏览器下载，用于分享 */
export function exportConfigFile(config: SceneConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = config.savedAt.replace(/[:.]/g, '-');
  a.href = url;
  a.download = `train-scene-config-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 读取用户选择的 JSON 文件并校验，返回还原用的配置 */
export async function importConfigFile(file: File): Promise<SceneConfig> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('文件不是合法的 JSON');
  }
  if (!validateConfig(parsed)) {
    throw new Error('配置文件结构不兼容，无法还原视点与天气状态');
  }
  return parsed;
}

/** 结构校验：schema 版本 + 三个视点 + 天气字段齐全且在取值范围内 */
export function validateConfig(value: unknown): value is SceneConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  if (c.schemaVersion !== 1 || typeof c.savedAt !== 'string') return false;
  const views = c.views as Record<string, unknown> | undefined;
  if (!views) return false;
  for (const id of ['front', 'leftFront', 'rightFront'] as const) {
    const v = views[id] as Record<string, unknown> | undefined;
    if (!v || typeof v.fov !== 'number' || typeof v.near !== 'number') return false;
    if (v.fov < 30 || v.fov > 90 || v.near < 0.5 || v.near > 5) return false;
  }
  const w = c.weather as Record<string, unknown> | undefined;
  if (
    !w ||
    typeof w.rain !== 'boolean' ||
    typeof w.fog !== 'boolean' ||
    typeof w.visibility !== 'number' ||
    typeof w.rainIntensity !== 'number'
  ) {
    return false;
  }
  if (w.visibility < 50 || w.visibility > 500) return false;
  if (typeof c.lightLevel !== 'number' || c.lightLevel < 0 || c.lightLevel > 3) return false;
  return true;
}
