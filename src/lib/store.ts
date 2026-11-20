import { writable } from 'svelte/store';
import type { TaskId, TaskStatus, TipReading } from './types';

export interface UiState {
  engineKind: 'WebGPU' | 'WebGL' | '启动中';
  tips: TipReading[];           // [左, 右]
  task: TaskStatus;
  recording: boolean;
  recordFrames: number;
  replaying: boolean;
  message: string;
}

const initialTip: TipReading = {
  pos: { x: 0, y: 0, z: 0 },
  joints: { trocarYaw: 0, trocarPitch: 0, insertion: 0, roll: 0, jaw: 0 },
  jawDeg: 0,
  contact: false,
  holding: null
};

export const uiState = writable<UiState>({
  engineKind: '启动中',
  tips: [{ ...initialTip }, { ...initialTip }],
  task: { id: 'grasp', title: '', description: '', done: false, progress: '', elapsed: 0 },
  recording: false,
  recordFrames: 0,
  replaying: false,
  message: ''
});

/** UI -> 仿真 的命令通道 */
export const commands = {
  switchTask: null as null | ((id: TaskId) => void),
  toggleRecord: null as null | (() => void),
  exportRecord: null as null | (() => void),
  replay: null as null | ((json: string) => void),
  stopReplay: null as null | (() => void)
};
