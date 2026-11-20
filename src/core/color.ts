/**
 * 环境色温工具（纯函数，便于单测）
 * 采用 Tanner Helland 的黑体近似，输出线性空间的 RGB。
 */

import { clamp } from './math';

export type RGB = [number, number, number];

export function kelvinToRgb(kelvin: number): RGB {
  const t = clamp(kelvin, 1000, 40000) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }

  return [clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255];
}

/** sRGB 传输函数（用于把线性值写进 canvas / 素材） */
export function linearToSrgb(v: number): number {
  const x = clamp(v, 0, 1);
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

export function srgbToLinear(v: number): number {
  const x = clamp(v, 0, 1);
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function luminance(rgb: RGB): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const k = clamp(t, 0, 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export function scaleRgb(rgb: RGB, factor: number): RGB {
  return [rgb[0] * factor, rgb[1] * factor, rgb[2] * factor];
}

/**
 * 以 6500K 为中性白的相对白平衡系数：6500K 为 [1,1,1]，
 * 低色温偏暖(橙)、高色温偏冷(蓝)。为避免整幅画面被染色过重，
 * 结果向中性压缩到约 0.66..1.05 的区间。
 */
export function temperatureTint(kelvin: number): RGB {
  const white = kelvinToRgb(6500);
  const color = kelvinToRgb(kelvin);
  const raw: RGB = [
    color[0] / Math.max(white[0], 1e-4),
    color[1] / Math.max(white[1], 1e-4),
    color[2] / Math.max(white[2], 1e-4),
  ];
  const peak = Math.max(raw[0], raw[1], raw[2], 1e-4);
  const STRENGTH = 0.32;
  return [
    clamp(1 + (raw[0] / peak - 1) * STRENGTH, 0.6, 1.12),
    clamp(1 + (raw[1] / peak - 1) * STRENGTH, 0.6, 1.12),
    clamp(1 + (raw[2] / peak - 1) * STRENGTH, 0.6, 1.12),
  ];
}

/** RGB 0..1 → #rrggbb（按 sRGB 传递函数编码） */
export function rgbToHex(rgb: RGB): string {
  const toHex = (v: number) =>
    Math.round(linearToSrgb(clamp(v, 0, 1)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

/** 供 CSS 使用的色温渐变停靠点 */
export const KELVIN_STOPS: ReadonlyArray<{ k: number; rgb: RGB }> = [
  { k: 2000, rgb: kelvinToRgb(2000) },
  { k: 3000, rgb: kelvinToRgb(3000) },
  { k: 4000, rgb: kelvinToRgb(4000) },
  { k: 5000, rgb: kelvinToRgb(5000) },
  { k: 6500, rgb: kelvinToRgb(6500) },
  { k: 8000, rgb: kelvinToRgb(8000) },
];

/** 夜间相对白天的色温偏移（更冷，模拟月光） */
export const NIGHT_TEMP_OFFSET = 1800;

/**
 * 实际作用于环境光的色温：昼夜切换在滑条基础上做偏移，
 * 结果始终落在 2000..8000K 的物理范围内。
 */
export function effectiveColorTemp(base: number, night: boolean): number {
  const v = night ? base + NIGHT_TEMP_OFFSET : base - 300;
  return Math.round(clamp(v, 2000, 8000));
}
