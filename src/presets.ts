import * as THREE from 'three';
import type { CameraParams, TimeOfDay } from './types';

export const DEFAULT_PARAMS: CameraParams = {
  focalLength: 8,
  fov: 60,
  distortionMode: 'barrel',
  distortionAmount: 0.35,
  exposureStops: 0,
  dynamicRange: 12,
  glareEnabled: true,
  glareThreshold: 0.8,
  glareIntensity: 1.0,
  rollingShutterTilt: 0.25,
  gridEnabled: true,
  gridStep: 0.1,
  timeOfDay: 'day',
  cameraHeight: 1.5,
  cameraPitch: -4,
};

export interface LightingPreset {
  label: string;
  skyColor: THREE.Color;
  groundColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  hemiIntensity: number;
  sunIntensity: number;
  sunColor: THREE.Color;
  sunPosition: [number, number, number];
  /** 环境整体亮度（曝光参考） */
  ambientLevel: number;
  /** 场景中人工光源（车灯/路灯）强度倍数 */
  artificialLightScale: number;
  /** 隧道段内部亮度倍数 */
  tunnelInteriorLevel: number;
}

export const LIGHTING_PRESETS: Record<TimeOfDay, LightingPreset> = {
  day: {
    label: '白天',
    skyColor: new THREE.Color('#87b5e0'),
    groundColor: new THREE.Color('#5a6b4d'),
    fogColor: new THREE.Color('#a8c4dd'),
    fogDensity: 0.0035,
    hemiIntensity: 1.0,
    sunIntensity: 2.4,
    sunColor: new THREE.Color('#fff4e0'),
    sunPosition: [60, 90, 40],
    ambientLevel: 1.0,
    artificialLightScale: 0.15,
    tunnelInteriorLevel: 0.22,
  },
  dusk: {
    label: '黄昏',
    skyColor: new THREE.Color('#c97b5a'),
    groundColor: new THREE.Color('#3d3340'),
    fogColor: new THREE.Color('#8a5a52'),
    fogDensity: 0.006,
    hemiIntensity: 0.45,
    sunIntensity: 0.9,
    sunColor: new THREE.Color('#ff9a5c'),
    sunPosition: [-80, 18, -30],
    ambientLevel: 0.42,
    artificialLightScale: 0.7,
    tunnelInteriorLevel: 0.14,
  },
  night: {
    label: '夜间',
    skyColor: new THREE.Color('#05080f'),
    groundColor: new THREE.Color('#18202c'),
    fogColor: new THREE.Color('#070d18'),
    fogDensity: 0.0045,
    hemiIntensity: 0.28,
    sunIntensity: 0.04,
    sunColor: new THREE.Color('#5a74b8'),
    sunPosition: [40, 60, -50],
    ambientLevel: 0.12,
    artificialLightScale: 2.6,
    tunnelInteriorLevel: 0.08,
  },
};

/** 道路长度（Z 轴方向，相机在一端看向 -Z） */
export const ROAD_LENGTH = 400;
export const ROAD_WIDTH = 14;

/** 隧道在道路上的 Z 区间（相机位于 z=+20 附近，向 -Z 观察） */
export const TUNNEL_ENTRY_Z = -70;
export const TUNNEL_EXIT_Z = -130;
