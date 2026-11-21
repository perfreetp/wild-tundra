export interface PlanPoint {
  id: string;
  x: number;
  z: number;
  /** 该点处圆曲线半径（米），0 表示直线转折 */
  radius: number;
}

export interface ProfilePoint {
  id: string;
  /** 里程（米） */
  s: number;
  /** 轨顶高程（米） */
  y: number;
}

export interface TerrainData {
  nx: number;
  nz: number;
  cell: number;
  originX: number;
  originZ: number;
  heights: Float32Array;
  minH: number;
  maxH: number;
}

export interface ProjectSettings {
  /** 道床顶面宽度（米） */
  ballastWidth: number;
  /** 设计最大坡度（‰），用于地形拟合与超限提示 */
  maxGradePermille: number;
}

export interface Project {
  name: string;
  terrain: TerrainData;
  plan: PlanPoint[];
  profile: ProfilePoint[];
  settings: ProjectSettings;
}

export const TRACK = {
  /** 道床厚度 */
  ballastHeight: 0.5,
  /** 道床边坡 1:m */
  ballastSlope: 1.5,
  /** 轨枕厚度 */
  sleeperHeight: 0.22,
  /** 钢轨高度 */
  railHeight: 0.16,
  /** 轨顶到路基面的高差（道床+轨枕+钢轨） */
  railToFormation: 0.88,
  /** 轨距（标准轨 1435mm） */
  gauge: 1.435,
  /** 轨枕长度 */
  sleeperLength: 2.6,
  /** 路基填/挖边坡 1:m */
  fillSlope: 1.5,
  cutSlope: 1.15,
  /** 路肩宽度 */
  shoulder: 0.6,
} as const;

export function formationHalfWidth(ballastWidth: number): number {
  const ballastBottomHalf = ballastWidth / 2 + TRACK.ballastHeight * TRACK.ballastSlope;
  return Math.max(1.4, ballastBottomHalf + TRACK.shoulder);
}
