import * as THREE from 'three';

export interface TrajectorySample {
  /** 相对录制开始的秒数 */
  t: number;
  p: [number, number, number];
  q: [number, number, number, number];
}

export interface TrajectoryFile {
  type: 'fire-roam-trajectory';
  version: 1;
  name?: string;
  samples: TrajectorySample[];
}

/** 轨迹记录器:固定频率采样相机位姿 */
export class TrajectoryRecorder {
  recording = false;
  samples: TrajectorySample[] = [];
  private startTime = 0;
  private lastSample = -Infinity;
  private interval: number;

  constructor(sampleHz = 10) {
    this.interval = 1 / sampleHz;
  }

  start(now: number): void {
    this.recording = true;
    this.samples = [];
    this.startTime = now;
    this.lastSample = -Infinity;
  }

  stop(): void {
    this.recording = false;
  }

  sample(now: number, obj: THREE.Object3D): void {
    if (!this.recording) return;
    const t = now - this.startTime;
    if (t - this.lastSample < this.interval) return;
    this.lastSample = t;
    this.samples.push({
      t,
      p: [obj.position.x, obj.position.y, obj.position.z],
      q: [obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w]
    });
  }
}

/** 轨迹播放器:按时间戳线性插值位置、球面插值姿态 */
export class TrajectoryPlayer {
  playing = false;
  private samples: TrajectorySample[] = [];
  private startTime = 0;
  onFinished: (() => void) | null = null;

  load(samples: TrajectorySample[]): void {
    this.samples = samples;
  }

  get duration(): number {
    return this.samples.length > 0 ? this.samples[this.samples.length - 1].t : 0;
  }

  play(now: number): void {
    if (this.samples.length < 2) return;
    this.playing = true;
    this.startTime = now;
  }

  stop(): void {
    this.playing = false;
  }

  /** 每帧调用,把位姿写入 target;返回是否仍在播放 */
  apply(now: number, target: THREE.Object3D): boolean {
    if (!this.playing || this.samples.length < 2) return false;
    const t = now - this.startTime;
    const last = this.samples[this.samples.length - 1];
    if (t >= last.t) {
      this.playing = false;
      this.onFinished?.();
      return false;
    }
    // 二分查找区间
    let lo = 0, hi = this.samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.samples[mid].t <= t) lo = mid; else hi = mid;
    }
    const a = this.samples[lo];
    const b = this.samples[hi];
    const k = (t - a.t) / Math.max(1e-6, b.t - a.t);
    target.position.set(
      a.p[0] + (b.p[0] - a.p[0]) * k,
      a.p[1] + (b.p[1] - a.p[1]) * k,
      a.p[2] + (b.p[2] - a.p[2]) * k
    );
    const qa = new THREE.Quaternion(...a.q);
    const qb = new THREE.Quaternion(...b.q);
    target.quaternion.copy(qa.slerp(qb, k));
    return true;
  }
}

/** 预设自动漫游路径(沿三室门洞穿行) */
export const PRESET_WAYPOINTS: Array<[number, number, number]> = [
  [-9, 1.6, 1.1],
  [-5, 1.6, 1.1],
  [-3, 1.6, 1.1],   // 门洞 1
  [-0.5, 1.6, 0.5],
  [1, 1.6, -2.5],
  [3.5, 1.6, -1.9], // 门洞 2
  [5.5, 1.6, -3],
  [6.6, 1.6, -1],   // 门洞 3
  [7, 1.6, 1.5],
  [7.2, 1.6, 4.2],
  [4.5, 1.6, 4.5]
];

/** 沿预设路径自动漫游(位置 Catmull-Rom 平滑,视线朝行进方向) */
export class AutoRoam {
  active = false;
  private curve: THREE.CatmullRomCurve3;
  private duration: number;
  private startTime = 0;
  onFinished: (() => void) | null = null;

  constructor(waypoints: Array<[number, number, number]> = PRESET_WAYPOINTS, durationSec = 75) {
    this.curve = new THREE.CatmullRomCurve3(
      waypoints.map((w) => new THREE.Vector3(w[0], w[1], w[2])),
      false, 'centripetal', 0.5
    );
    this.duration = durationSec;
  }

  start(now: number): void {
    this.active = true;
    this.startTime = now;
  }

  stop(): void {
    this.active = false;
  }

  apply(now: number, target: THREE.Object3D): boolean {
    if (!this.active) return false;
    const u = (now - this.startTime) / this.duration;
    if (u >= 1) {
      this.active = false;
      this.onFinished?.();
      return false;
    }
    const pos = this.curve.getPointAt(u);
    const ahead = this.curve.getPointAt(Math.min(1, u + 0.02));
    ahead.y = pos.y; // 视线保持水平
    target.position.copy(pos);
    // Matrix4.lookAt 采用相机约定(-Z 朝向目标),与相机子节点一致
    const m = new THREE.Matrix4().lookAt(pos, ahead, new THREE.Vector3(0, 1, 0));
    target.quaternion.setFromRotationMatrix(m);
    return true;
  }
}

export function exportTrajectory(samples: TrajectorySample[], name = 'roam-path'): void {
  const file: TrajectoryFile = { type: 'fire-roam-trajectory', version: 1, name, samples };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseTrajectoryFile(text: string): TrajectorySample[] {
  const data = JSON.parse(text) as Partial<TrajectoryFile>;
  if (data.type !== 'fire-roam-trajectory' || !Array.isArray(data.samples)) {
    throw new Error('不是有效的漫游路径文件');
  }
  for (const s of data.samples) {
    if (typeof s.t !== 'number' || !Array.isArray(s.p) || !Array.isArray(s.q)) {
      throw new Error('路径文件数据损坏');
    }
  }
  return data.samples;
}
