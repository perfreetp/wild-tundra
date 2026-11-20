import type { Vector3 } from '@babylonjs/core';

/** 器械关节角(度),由关节链逐级解算得到 */
export interface JointAngles {
  /** 绕戳卡点偏航 */
  trocarYaw: number;
  /** 绕戳卡点俯仰 */
  trocarPitch: number;
  /** 沿杆轴向插入深度 (mm) */
  insertion: number;
  /** 杆自转 */
  roll: number;
  /** 钳口开合角(单侧) */
  jaw: number;
}

/** 器械完整运动学状态 */
export interface InstrumentState {
  yaw: number;      // rad,绕戳卡点
  pitch: number;    // rad,绕戳卡点
  depth: number;    // mm,戳卡点到钳尖距离
  roll: number;     // rad
  jaw: number;      // rad,0=闭合
}

export interface TipReading {
  pos: { x: number; y: number; z: number };
  joints: JointAngles;
  jawDeg: number;
  contact: boolean;
  holding: string | null;
}

export type TaskId = 'grasp' | 'place' | 'ring';

export interface TaskStatus {
  id: TaskId;
  title: string;
  description: string;
  done: boolean;
  progress: string;
  elapsed: number;
}

/** 记录帧:回放时完全由该数据驱动 */
export interface RecordFrame {
  t: number; // ms,相对记录起点
  instruments: InstrumentState[]; // [左, 右]
}

export interface RecordFile {
  app: 'laparo-trainer';
  version: 1;
  task: TaskId;
  startedAt: string;
  frames: RecordFrame[];
}

export interface Vec3Like { x: number; y: number; z: number }

export function v3like(v: Vector3): Vec3Like {
  return { x: v.x, y: v.y, z: v.z };
}
