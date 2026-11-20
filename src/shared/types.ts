// 共享类型定义：主线程与 Worker 之间的消息协议与领域模型

export type HardnessLevel = 'soft' | 'medium' | 'hard'

/** 三档硬度：衰减半径决定邻域范围，弹性/阻尼决定回弹速度 */
export interface HardnessProfile {
  level: HardnessLevel
  label: string
  /** 接触影响半径（世界单位，相对器官尺寸会再做一次缩放） */
  influenceRadius: number
  /** 接触刚度：越大越难压入 */
  contactStiffness: number
  /** 回弹弹簧系数：越大回弹越快 */
  springK: number
  /** 阻尼：越大振荡越少、回弹越慢 */
  damping: number
}

export const HARDNESS_PROFILES: Record<HardnessLevel, HardnessProfile> = {
  soft: {
    level: 'soft',
    label: '软',
    influenceRadius: 0.55,
    contactStiffness: 22,
    springK: 18,
    damping: 6.5,
  },
  medium: {
    level: 'medium',
    label: '中',
    influenceRadius: 0.38,
    contactStiffness: 45,
    springK: 42,
    damping: 10,
  },
  hard: {
    level: 'hard',
    label: '硬',
    influenceRadius: 0.24,
    contactStiffness: 85,
    springK: 90,
    damping: 16,
  },
}

export interface OrganDescriptor {
  id: string
  name: string
  englishName: string
  color: number
  /** 程序化网格的细分粒度，保证顶点密度足够支撑形变 */
  segments: number
}

/** 左侧面板可切换的 3 个器官模型 */
export const ORGANS: OrganDescriptor[] = [
  { id: 'liver', name: '肝脏', englishName: 'Liver', color: 0x8c3b2e, segments: 96 },
  { id: 'kidney', name: '肾脏', englishName: 'Kidney', color: 0x7a2f3d, segments: 88 },
  { id: 'gland', name: '腺体', englishName: 'Gland', color: 0xb06a4f, segments: 96 },
]

// ---------- Worker 消息协议 ----------

export interface InitMessage {
  type: 'init'
  organId: string
  /** 静止态顶点（xyz 交错） */
  restPositions: ArrayBuffer
  /** 三角形索引 */
  indices: ArrayBuffer
  /** 包围球，用于生成虚拟骨骼网格 */
  center: [number, number, number]
  radius: number
  vertexCount: number
}

export interface FrameInputMessage {
  type: 'frame'
  dt: number
  /** 探针是否正在接触表面 */
  contact: boolean
  /** 接触点（世界/器官局部坐标，本视口器官不动，二者一致） */
  pointX: number
  pointY: number
  pointZ: number
  /** 表面法线（指向探针） */
  normalX: number
  normalY: number
  normalZ: number
  /** 接触深度（探针侵入表面的距离） */
  depth: number
  profile: HardnessProfile
  /** 用于零拷贝回传的缓冲 */
  outputBuffer: ArrayBuffer
}

export interface FrameResultMessage {
  type: 'frameResult'
  positions: ArrayBuffer
  /** 当前最大顶点形变位移（相对静止态的距离） */
  maxDeformation: number
  /** 本帧物理 + 蒙皮计算耗时（毫秒，Worker 内测量） */
  computeMs: number
  /** 蒙皮骨骼数量（初始化诊断信息） */
}

export interface InitDoneMessage {
  type: 'initDone'
  boneCount: number
  weightsPerVertex: number
}

export type WorkerOutboundMessage = FrameResultMessage | InitDoneMessage
