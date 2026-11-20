// 共享数据类型

export interface VolumeData {
  /** 体素维度 [nx, ny, nz]，x 变化最快 */
  dims: [number, number, number];
  /** 体素间距 mm [sx, sy, sz] */
  spacing: [number, number, number];
  /** CT 值 (HU)，长度 nx*ny*nz */
  data: Float32Array;
  /** 数据最小/最大值 */
  min: number;
  max: number;
}

export interface ReconParams {
  thresholdMin: number;
  thresholdMax: number;
}

export interface ReconResult {
  /** 顶点坐标（体素坐标系，xyz 连续） */
  positions: Float32Array;
  /** 三角形索引 */
  indices: Uint32Array;
  /** 每个顶点处三线性插值得到的 CT 值 */
  values: Float32Array;
  triCount: number;
  timeMs: number;
  /** 流形修复后保留的连通分量数 */
  components: number;
  /** 修复是否成功（失败时返回的是未修复的原始网格） */
  repaired: boolean;
}

// ---- Worker 消息 ----

export interface InitMsg {
  type: 'init';
  dims: [number, number, number];
  data: Float32Array;
}

export interface ReconMsg {
  type: 'reconstruct';
  id: number;
  params: ReconParams;
}

export type WorkerInMsg = InitMsg | ReconMsg;

export interface ResultMsg {
  type: 'result';
  id: number;
  result: ReconResult;
}

export interface ErrorMsg {
  type: 'error';
  id: number;
  message: string;
}

export type WorkerOutMsg = ResultMsg | ErrorMsg;
