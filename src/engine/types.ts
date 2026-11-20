import type * as THREE from 'three';

/** 视点标识：前向 / 左前 / 右前 */
export type ViewId = 'front' | 'leftFront' | 'rightFront';

/** 顶部标签页：三个单视点 + 三屏同显 */
export type TabId = ViewId | 'triple';

export const VIEW_IDS: ViewId[] = ['front', 'leftFront', 'rightFront'];

export const VIEW_LABELS: Record<ViewId, string> = {
  front: '前向',
  leftFront: '左前',
  rightFront: '右前',
};

/** 单个视点的相机参数（FOV 30–90°，近裁面 0.5–5m） */
export interface ViewConfig {
  fov: number;
  near: number;
  far: number;
  /** 由轨道中心线自动生成；用户 OrbitControls 调整后会更新 */
  pose: CameraPose;
  /** true 时每帧跟随轨道中心线自动机位；用户手动拖拽后置为 false */
  rigMode: boolean;
}

export interface CameraPose {
  position: [number, number, number];
  /** 观察目标点，与 position 共同决定朝向 */
  lookAt: [number, number, number];
  up: [number, number, number];
}

/** 天气参数：雨雾叠加层，能见度 50–500m */
export interface WeatherConfig {
  rain: boolean;
  fog: boolean;
  /** 能见度（米），50–500 */
  visibility: number;
  /** 雨量强度 0–1，仅在 rain 开启时生效 */
  rainIntensity: number;
}

/** 灯光档位 0–3 */
export type LightLevel = 0 | 1 | 2 | 3;

/** 可在面板调整的材质参数 */
export interface MaterialTuning {
  tunnelColor: string;
  tunnelRoughness: number;
  trainColor: string;
  trainRoughness: number;
  trainMetalness: number;
}

/** 持久化 / 导出的完整场景配置 */
export interface SceneConfig {
  schemaVersion: 1;
  savedAt: string;
  routeProgress: number;
  autoDrive: boolean;
  driveSpeed: number;
  views: Record<ViewId, ViewConfig>;
  weather: WeatherConfig;
  lightLevel: LightLevel;
  materials: MaterialTuning;
}

/** 运行时每帧统计（节流上报给 HUD） */
export interface RenderStats {
  drawCalls: number;
  triangles: number;
  visibleChunks: number;
  totalChunks: number;
  occlusionCulled: number;
  overBudget: boolean;
  fps: number;
}

/** 机位回传（节流，供面板显示与保存最新位置/朝向） */
export type PoseSnapshot = Record<ViewId, CameraPose>;

/** 场景分块：每块几何挂独立 BVH，用于视锥裁剪与射线遮挡 */
export interface SceneChunk {
  id: number;
  group: THREE.Group;
  /** 参与 BVH 裁剪/遮挡的网格（隧道壁、地形、轨道等静态网格） */
  bvhMeshes: THREE.Mesh[];
  /** 不参与遮挡的网格（接触网、轨枕等），仅随分块显隐 */
  extraMeshes: THREE.Object3D[];
  bbox: THREE.Box3;
  /** 分块到轨道起点的距离，用于距离阈值裁剪 */
  distance: number;
  length: number;
}
