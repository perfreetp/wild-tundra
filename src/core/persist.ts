import { sanitizeView } from './view';
import type { ViewState } from './types';
import { LAYER_IDS } from './types';

export const STORAGE_KEY = 'railview.compositor.view.v1';
export const EXPORT_KIND = 'railview-view-state';
export const EXPORT_VERSION = 1;

export interface ExportDocument {
  kind: typeof EXPORT_KIND;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  app: string;
  view: ViewState;
}

export function buildExportDocument(view: ViewState, now: Date = new Date()): ExportDocument {
  return {
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    app: 'railview-compositor',
    view: sanitizeView(view),
  };
}

export function serializeExport(view: ViewState, now?: Date): string {
  return `${JSON.stringify(buildExportDocument(view, now), null, 2)}\n`;
}

export type ImportResult =
  | { ok: true; view: ViewState; source: 'document' | 'bare-view' }
  | { ok: false; error: string };

function looksLikeView(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return 'layers' in v || 'order' in v || 'camera' in v;
}

/** 解析导入文件：支持导出文档，也兼容裸 ViewState JSON */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '文件不是有效的 JSON。' };
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'JSON 顶层应为对象。' };
  }
  const doc = raw as Record<string, unknown>;
  if (doc.kind !== undefined && doc.kind !== EXPORT_KIND) {
    return { ok: false, error: `不认识的文件类型：${String(doc.kind)}` };
  }
  if (doc.version !== undefined) {
    if (typeof doc.version !== 'number' || !Number.isFinite(doc.version)) {
      return { ok: false, error: '版本号无效。' };
    }
    if (doc.version > EXPORT_VERSION) {
      return { ok: false, error: `文件版本 ${doc.version} 高于当前支持的 ${EXPORT_VERSION}。` };
    }
  }
  if ('view' in doc) {
    if (!looksLikeView(doc.view)) return { ok: false, error: '缺少有效的 view 字段。' };
    return { ok: true, view: sanitizeView(doc.view), source: 'document' };
  }
  if (looksLikeView(doc)) {
    return { ok: true, view: sanitizeView(doc), source: 'bare-view' };
  }
  return { ok: false, error: '未找到视景状态数据。' };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  view: ViewState | null;
  error?: string;
}

export function saveToStorage(view: ViewState, storage: StorageLike | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ kind: EXPORT_KIND, version: EXPORT_VERSION, view }));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage(storage: StorageLike | null = safeStorage()): LoadResult {
  if (!storage) return { view: null };
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { view: null };
  }
  if (!text) return { view: null };
  const parsed = parseImport(text);
  if (!parsed.ok) return { view: null, error: parsed.error };
  return { view: parsed.view };
}

export function clearStorage(storage: StorageLike | null = safeStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function safeStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    const probe = '__railview_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** 供测试与调试：校验图层顺序包含全部图层 */
export function orderIsComplete(order: readonly string[]): boolean {
  return LAYER_IDS.every((id) => order.includes(id)) && order.length === LAYER_IDS.length;
}
