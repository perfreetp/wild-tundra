/** 全局参数类型定义 */

export type DistortionMode = 'barrel' | 'pincushion' | 'off';
export type TimeOfDay = 'day' | 'dusk' | 'night';

/** 镜头与成像参数 */
export interface CameraParams {
  // 镜头
  focalLength: number; // 焦距 mm（仅作物理标注，FOV 为实际生效值）
  fov: number; // 垂直视场角，30~120 度
  distortionMode: DistortionMode;
  distortionAmount: number; // 0~1 畸变强度
  // 曝光 / 动态范围（档位制）
  exposureStops: number; // EV 补偿档位 -6 ~ +6
  dynamicRange: number; // 模拟传感器动态范围，档，6~20
  // 夜间眩光
  glareEnabled: boolean;
  glareThreshold: number; // 触发光晕的光源强度阈值 0~2
  glareIntensity: number; // 光晕强度
  // 滚动快门
  rollingShutterTilt: number; // 倾斜量 0~1（0 = 全局快门）
  // 标定网格
  gridEnabled: boolean;
  gridStep: number; // 网格间距（归一化画面比例 0.02~0.5）
  // 环境
  timeOfDay: TimeOfDay;
  // 相机机位
  cameraHeight: number;
  cameraPitch: number; // 俯仰角 度
}

export interface CameraPreset {
  id: string;
  name: string;
  savedAt: number;
  params: CameraParams;
}

/** 场景内可移动对象 */
export type SceneObjectType = 'vehicle' | 'lane';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  name: string;
  /** 世界坐标（车道线用两个点描述，存中点） */
  position: [number, number, number];
  /** 朝向（绕 Y 轴，弧度） */
  rotationY: number;
  /** 车辆颜色 */
  color?: number;
  /** 车道线长度/宽度 */
  length?: number;
  width?: number;
}
