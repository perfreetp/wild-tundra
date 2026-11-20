// 全局共享类型定义

/** 建筑功能类别 */
export type BuildingCategory = "station" | "commercial" | "residential";

export const CATEGORY_LABEL: Record<BuildingCategory, string> = {
  station: "站房",
  commercial: "商业",
  residential: "住宅",
};

/** 剖切方向:水平(高度滑条)或垂直(角度滑条) */
export type ClipDirection = "horizontal" | "vertical";

/** 楼层元数据(每个楼层一个网格) */
export interface FloorInfo {
  /** 全局唯一 id,如 "residential-T1-F05" */
  id: string;
  buildingId: string;
  buildingName: string;
  category: BuildingCategory;
  /** 楼层序号(从 1 开始) */
  floor: number;
  /** 楼层底部标高(米) */
  zMin: number;
  /** 楼层顶部标高(米) */
  zMax: number;
}

/** 视角(相机)状态 */
export interface CameraState {
  alpha: number;
  beta: number;
  radius: number;
  target: [number, number, number];
}

/** 可持久化 / 导入导出的剖切状态 */
export interface SectionState {
  /** 剖切高度 0-120 米(水平方向) */
  clipHeight: number;
  /** 剖切方向 */
  direction: ClipDirection;
  /** 垂直剖切角度 0-180 度 */
  clipAngle: number;
  /** 视图模式 */
  viewMode: "orbit" | "top";
  camera: CameraState | null;
  /** 当前选中楼层 */
  selectedFloorId: string | null;
}

export const DEFAULT_STATE: SectionState = {
  clipHeight: 40,
  direction: "horizontal",
  clipAngle: 45,
  viewMode: "orbit",
  camera: null,
  selectedFloorId: null,
};

export const MAX_CLIP_HEIGHT = 120;
