import { describe, expect, it } from 'vitest';
import {
  moveLayer,
  raiseLayer,
  lowerLayer,
  normalizeOrder,
  sanitizeView,
  createDefaultView,
  cloneView,
} from '../src/core/view';
import { LAYER_IDS } from '../src/core/types';

describe('view state', () => {
  it('默认状态含三图层且顺序完整', () => {
    const v = createDefaultView();
    expect(v.order).toEqual(['far', 'mid', 'near']);
    expect(Object.keys(v.layers).sort()).toEqual([...LAYER_IDS].sort());
    expect(v.fog).toBeGreaterThanOrEqual(0);
    expect(v.fog).toBeLessThanOrEqual(1);
  });

  it('cloneView 是深拷贝', () => {
    const v = createDefaultView();
    const c = cloneView(v);
    c.layers.far.opacity = 0.1;
    c.order.push('far');
    c.camera.pitch = 12;
    expect(v.layers.far.opacity).toBe(1);
    expect(v.order.length).toBe(3);
    expect(v.camera.pitch).not.toBe(12);
  });

  it('moveLayer 拖拽排序：把 far 拖到 near 上', () => {
    const next = moveLayer(['far', 'mid', 'near'], 'far', 'near');
    expect(next).toEqual(['mid', 'near', 'far']);
    expect(next.length).toBe(3);
  });

  it('moveLayer 静默处理未知目标', () => {
    const order = ['far', 'mid', 'near'] as const;
    expect(moveLayer([...order], 'far', 'far')).toEqual([...order]);
    expect(moveLayer([...order], 'mid', 'x' as never)).toEqual([...order]);
  });

  it('raise/lower 只在边界外为空操作', () => {
    expect(raiseLayer(['far', 'mid', 'near'], 'far')).toEqual(['mid', 'far', 'near']);
    expect(raiseLayer(['far', 'mid', 'near'], 'near')).toEqual(['far', 'mid', 'near']);
    expect(lowerLayer(['far', 'mid', 'near'], 'near')).toEqual(['far', 'near', 'mid']);
    expect(lowerLayer(['far', 'mid', 'near'], 'far')).toEqual(['far', 'mid', 'near']);
  });

  it('normalizeOrder 去重并补齐缺失图层', () => {
    expect(normalizeOrder(['near', 'near', 'mid'], ['far', 'mid', 'near'])).toEqual(['near', 'mid', 'far']);
    expect(normalizeOrder(['bogus'], ['far', 'mid', 'near'])).toEqual(['far', 'mid', 'near']);
    expect(normalizeOrder(null, ['far', 'mid', 'near'])).toEqual(['far', 'mid', 'near']);
  });

  it('sanitizeView 钳制越界值与非法混合模式', () => {
    const v = sanitizeView({
      layers: {
        far: { opacity: 5, blend: 'multiply', visible: 'yes' },
        mid: { opacity: -2, blend: 'screen' },
        near: { opacity: 0.5, blend: 'overlay' },
      },
      order: ['near', 'mid', 'far'],
      fog: 3,
      colorTemp: 99999,
      camera: { pitch: -90, yaw: 400 },
      night: 'nope',
    });
    expect(v.layers.far.opacity).toBe(1);
    expect(v.layers.far.blend).toBe('normal');
    expect(v.layers.far.visible).toBe(true);
    expect(v.layers.mid.opacity).toBe(0);
    expect(v.layers.mid.visible).toBe(true);
    expect(v.fog).toBe(1);
    expect(v.colorTemp).toBe(8000);
    expect(v.camera.pitch).toBe(-30);
    expect(v.camera.yaw).toBe(60);
    expect(v.night).toBe(false);
    expect(v.order).toEqual(['near', 'mid', 'far']);
  });

  it('sanitizeView 对完全非法的输入返回默认值', () => {
    const d = createDefaultView();
    expect(sanitizeView(null)).toEqual(d);
    expect(sanitizeView('oops')).toEqual(d);
    expect(sanitizeView([1, 2, 3])).toEqual(d);
  });
});
