import type { ColorScheme } from '../types';

/** 默认 8 级色带方案（压力 MPa / 温度 ℃） */
export const DEFAULT_SCHEME: ColorScheme = {
  id: 'default-scheme',
  name: '默认工程色带',
  pressureBands: [
    { min: 0.0, color: '#2b5fbf' },
    { min: 0.2, color: '#1f8fd1' },
    { min: 0.4, color: '#19b3a6' },
    { min: 0.55, color: '#46b96b' },
    { min: 0.7, color: '#a8c23f' },
    { min: 0.85, color: '#e8b62c' },
    { min: 1.0, color: '#e8782c' },
    { min: 1.15, color: '#d12f2f' },
  ],
  temperatureBands: [
    { min: 0, color: '#1f4fd1' },
    { min: 45, color: '#1f8fd1' },
    { min: 55, color: '#19b3a6' },
    { min: 65, color: '#46b96b' },
    { min: 80, color: '#a8c23f' },
    { min: 95, color: '#e8b62c' },
    { min: 105, color: '#e8782c' },
    { min: 112, color: '#d12f2f' },
  ],
  lossThreshold: 120,
};

export const BAND_COUNT = 8;

export function ensureEightBands(bands: { min: number; color: string }[]) {
  while (bands.length < BAND_COUNT) {
    bands.push({ min: 0, color: '#888888' });
  }
  return bands.slice(0, BAND_COUNT);
}
