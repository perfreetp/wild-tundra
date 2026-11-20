import { describe, expect, it } from 'vitest';
import {
  kelvinToRgb,
  temperatureTint,
  rgbToHex,
  linearToSrgb,
  srgbToLinear,
  luminance,
  effectiveColorTemp,
} from '../src/core/color';
import { buildPalette } from '../src/render/palette';
import { clamp, lerp, smoothstep, fbm2D, valueNoise2D, ridged2D, mulberry32 } from '../src/core/math';

describe('kelvin / color', () => {
  it('2000K 偏暖（红 > 蓝），8000K 偏冷（蓝 > 红）', () => {
    const warm = kelvinToRgb(2000);
    expect(warm[0]).toBeGreaterThan(warm[2]);
    const cool = kelvinToRgb(8000);
    expect(cool[2]).toBeGreaterThanOrEqual(cool[0] * 0.98);
  });

  it('色温白平衡在 6500K 附近中性', () => {
    const t = temperatureTint(6500);
    expect(t[0]).toBeCloseTo(1, 2);
    expect(t[1]).toBeCloseTo(1, 2);
    expect(t[2]).toBeCloseTo(1, 2);
  });

  it('低色温暖通道更强，高色温冷通道更强', () => {
    const warm = temperatureTint(2400);
    const cool = temperatureTint(8000);
    expect(warm[0]).toBeGreaterThan(warm[2]);
    expect(cool[2]).toBeGreaterThan(cool[0]);
    for (const v of [...warm, ...cool]) {
      expect(v).toBeGreaterThan(0.5);
      expect(v).toBeLessThanOrEqual(1.121);
    }
  });

  it('色温染色幅度受控（不出现某通道被压没）', () => {
    for (const k of [2000, 2400, 4000, 5600, 7000, 8000]) {
      const t = temperatureTint(k);
      const min = Math.min(...t);
      const max = Math.max(...t);
      expect(max - min).toBeLessThan(0.5);
      expect(min).toBeGreaterThan(0.55);
    }
  });

  it('effectiveColorTemp 在物理范围内并随昼夜偏移', () => {
    expect(effectiveColorTemp(5600, false)).toBe(5300);
    expect(effectiveColorTemp(5600, true)).toBe(7400);
    expect(effectiveColorTemp(8000, true)).toBe(8000);
    expect(effectiveColorTemp(2000, false)).toBe(2000);
    for (const base of [2000, 3500, 5600, 8000]) {
      for (const night of [false, true]) {
        const v = effectiveColorTemp(base, night);
        expect(v).toBeGreaterThanOrEqual(2000);
        expect(v).toBeLessThanOrEqual(8000);
      }
    }
  });

  it('sRGB 传输函数互逆', () => {
    for (const v of [0, 0.02, 0.2, 0.5, 0.9, 1]) {
      expect(srgbToLinear(linearToSrgb(v))).toBeCloseTo(v, 6);
    }
  });

  it('rgbToHex 输出合法十六进制', () => {
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
    expect(rgbToHex([1, 1, 1])).toBe('#ffffff');
    expect(rgbToHex([1, 0, 0])).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('亮度权重符合 Rec.709', () => {
    expect(luminance([1, 1, 1])).toBeCloseTo(1, 6);
    expect(luminance([0, 1, 0])).toBeCloseTo(0.7152, 4);
  });
});

describe('palette', () => {
  it('白天与夜间差异显著', () => {
    const day = buildPalette(5600, 0);
    const night = buildPalette(5600, 1);
    expect(luminance([day.zenith.r, day.zenith.g, day.zenith.b])).toBeGreaterThan(
      luminance([night.zenith.r, night.zenith.g, night.zenith.b]) * 2,
    );
    expect(day.sunIntensity).toBeGreaterThan(night.sunIntensity);
    expect(night.night).toBe(1);
  });

  it('色温改变地平线色调', () => {
    const warm = buildPalette(2400, 0);
    const cool = buildPalette(8000, 0);
    const warmRatio = warm.horizon.r / Math.max(warm.horizon.b, 1e-5);
    const coolRatio = cool.horizon.r / Math.max(cool.horizon.b, 1e-5);
    expect(warmRatio).toBeGreaterThan(coolRatio);
  });

  it('太阳方向为单位向量且高于地平线', () => {
    for (const n of [0, 0.5, 1]) {
      const p = buildPalette(5600, n);
      expect(p.sunDir.length()).toBeCloseTo(1, 4);
      expect(p.sunDir.y).toBeGreaterThan(0);
    }
  });

  it('可复用输出对象（避免每帧分配）', () => {
    const out = buildPalette(5000, 0);
    const again = buildPalette(7400, 1, out);
    expect(again).toBe(out);
    expect(again.night).toBe(1);
  });
});

describe('math helpers', () => {
  it('clamp / lerp / smoothstep', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });

  it('噪声输出范围正确且可复现', () => {
    for (let i = 0; i < 200; i++) {
      const n = valueNoise2D(i * 0.37, i * 0.11, 3);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
    expect(fbm2D(1.3, 2.7, 5, 9)).toBeCloseTo(fbm2D(1.3, 2.7, 5, 9), 12);
    for (let i = 0; i < 100; i++) {
      const r = ridged2D(i * 0.2, 0.4, 4, 2);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('mulberry32 确定性且落在 [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
