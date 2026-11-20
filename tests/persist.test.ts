import { describe, expect, it } from 'vitest';
import {
  buildExportDocument,
  EXPORT_KIND,
  EXPORT_VERSION,
  loadFromStorage,
  orderIsComplete,
  parseImport,
  saveToStorage,
  serializeExport,
  STORAGE_KEY,
  type StorageLike,
} from '../src/core/persist';
import { createDefaultView } from '../src/core/view';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function sampleView() {
  const v = createDefaultView();
  v.fog = 0.71;
  v.colorTemp = 7300;
  v.night = true;
  v.layers.far = { opacity: 0.33, blend: 'screen', visible: true };
  v.layers.mid = { opacity: 0.66, blend: 'overlay', visible: false };
  v.layers.near = { opacity: 0.99, blend: 'normal', visible: true };
  v.order = ['near', 'far', 'mid'];
  v.camera = { pitch: 17.5, yaw: -42 };
  return v;
}

describe('export document', () => {
  it('包含类型、版本与导出时间', () => {
    const doc = buildExportDocument(sampleView(), new Date('2026-01-01T00:00:00Z'));
    expect(doc.kind).toBe(EXPORT_KIND);
    expect(doc.version).toBe(EXPORT_VERSION);
    expect(doc.exportedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(doc.app).toBe('railview-compositor');
  });

  it('导出的 JSON 可被导入并完整还原', () => {
    const original = sampleView();
    const text = serializeExport(original, new Date('2026-02-02T03:04:05Z'));
    const parsed = parseImport(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.source).toBe('document');
    expect(parsed.view.fog).toBeCloseTo(0.71, 5);
    expect(parsed.view.colorTemp).toBe(7300);
    expect(parsed.view.night).toBe(true);
    expect(parsed.view.layers.far).toEqual({ opacity: 0.33, blend: 'screen', visible: true });
    expect(parsed.view.layers.mid).toEqual({ opacity: 0.66, blend: 'overlay', visible: false });
    expect(parsed.view.order).toEqual(['near', 'far', 'mid']);
    expect(parsed.view.camera.pitch).toBe(17.5);
    expect(parsed.view.camera.yaw).toBe(-42);
  });
});

describe('parseImport', () => {
  it('拒绝非 JSON', () => {
    const r = parseImport('这不是 json');
    expect(r.ok).toBe(false);
  });

  it('拒绝数组/原始值', () => {
    expect(parseImport('[]').ok).toBe(false);
    expect(parseImport('42').ok).toBe(false);
    expect(parseImport('null').ok).toBe(false);
  });

  it('拒绝未知 kind', () => {
    const r = parseImport(JSON.stringify({ kind: 'something-else', view: {} }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('something-else');
  });

  it('拒绝过高的版本', () => {
    const r = parseImport(JSON.stringify({ kind: EXPORT_KIND, version: 99, view: sampleView() }));
    expect(r.ok).toBe(false);
  });

  it('兼容裸 ViewState JSON', () => {
    const v = sampleView();
    const r = parseImport(JSON.stringify(v));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('bare-view');
      expect(r.view.camera.yaw).toBe(-42);
    }
  });

  it('缺少 view 字段时报错', () => {
    const r = parseImport(JSON.stringify({ kind: EXPORT_KIND, version: 1 }));
    expect(r.ok).toBe(false);
  });

  it('非法数值被钳制而非拒绝', () => {
    const r = parseImport(
      JSON.stringify({
        view: { fog: 42, colorTemp: -5, camera: { pitch: 1000, yaw: -1000 } },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.view.fog).toBe(1);
      expect(r.view.colorTemp).toBe(2000);
      expect(r.view.camera.pitch).toBe(30);
      expect(r.view.camera.yaw).toBe(-60);
      expect(orderIsComplete(r.view.order)).toBe(true);
    }
  });
});

describe('localStorage round-trip', () => {
  it('保存后能读回相同状态', () => {
    const storage = new MemoryStorage();
    const v = sampleView();
    expect(saveToStorage(v, storage)).toBe(true);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
    const loaded = loadFromStorage(storage);
    expect(loaded.error).toBeUndefined();
    expect(loaded.view).not.toBeNull();
    expect(loaded.view?.camera).toEqual({ pitch: 17.5, yaw: -42 });
    expect(loaded.view?.order).toEqual(['near', 'far', 'mid']);
  });

  it('空存储返回 null 且不抛错', () => {
    const storage = new MemoryStorage();
    expect(loadFromStorage(storage)).toEqual({ view: null });
  });

  it('损坏数据返回错误但不崩溃', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    const loaded = loadFromStorage(storage);
    expect(loaded.view).toBeNull();
    expect(loaded.error).toBeTruthy();
  });

  it('写入失败（配额/隐私模式）返回 false', () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(saveToStorage(sampleView(), failing)).toBe(false);
  });
});
