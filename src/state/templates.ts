import type { TileKind } from '../geometry/math';

export interface TemplateTile {
  kind: TileKind;
  x: number;
  z: number;
  rot: number;
}

export interface Template {
  id: string;
  name: string;
  emoji: string;
  /** 适合年龄/难度说明 */
  level: string;
  tiles: TemplateTile[];
}

// 所有坐标以"边长按 1"的台面单位给出,保证相邻片共用等长边
export const TEMPLATES: Template[] = [
  {
    id: 'house',
    name: '小房子',
    emoji: '🏠',
    level: '3 岁起 · 4 片',
    tiles: [
      { kind: 'square', x: 0, z: 0, rot: 0 },
      { kind: 'square', x: 1, z: 0, rot: 0 },
      { kind: 'triangle', x: -0.2113, z: 1.2887, rot: -Math.PI / 6 },
      { kind: 'triangle', x: 1.2113, z: 1.2887, rot: -Math.PI / 6 },
    ],
  },
  {
    id: 'flower',
    name: '小花',
    emoji: '🌼',
    level: '4 岁起 · 6 片',
    tiles: [
      { kind: 'hexagon', x: 0, z: 0, rot: 0 },
      { kind: 'triangle', x: 0, z: 1.577, rot: 0 },
      { kind: 'triangle', x: 1.366, z: 0.789, rot: 0 },
      { kind: 'triangle', x: 1.366, z: -0.789, rot: 0 },
      { kind: 'triangle', x: 0, z: -1.577, rot: 0 },
      { kind: 'triangle', x: -1.366, z: 0, rot: 0 },
    ],
  },
  {
    id: 'rocket',
    name: '小火箭',
    emoji: '🚀',
    level: '5 岁起 · 5 片',
    tiles: [
      { kind: 'square', x: 0, z: 0, rot: 0 },
      { kind: 'square', x: 0, z: 1, rot: 0 },
      { kind: 'triangle', x: 0, z: 2.2887, rot: -Math.PI / 6 },
      { kind: 'triangle', x: -1.2113, z: -0.2887, rot: (5 * Math.PI) / 6 },
      { kind: 'triangle', x: 1.2113, z: -0.2887, rot: Math.PI / 6 },
    ],
  },
  {
    id: 'cube',
    name: '魔法盒(可折)',
    emoji: '📦',
    level: '6 岁 · 折叠挑战',
    tiles: [
      { kind: 'square', x: 0, z: 0, rot: 0 },
      { kind: 'square', x: 1, z: 0, rot: 0 },
      { kind: 'square', x: 2, z: 0, rot: 0 },
      { kind: 'square', x: 0, z: 1, rot: 0 },
      { kind: 'square', x: 1, z: 1, rot: 0 },
      { kind: 'square', x: 2, z: 1, rot: 0 },
    ],
  },
];
