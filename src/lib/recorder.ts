import type { InstrumentState, RecordFile, RecordFrame, TaskId } from './types';
import type { Instrument } from './instrument';

const SAMPLE_INTERVAL = 1 / 30; // 30 Hz 采样

/** 操作记录:采样器械运动学状态,可导出 JSON、可回放 */
export class Recorder {
  recording = false;
  private frames: RecordFrame[] = [];
  private clock = 0;
  private acc = 0;
  private task: TaskId = 'grasp';

  start(task: TaskId): void {
    this.frames = [];
    this.clock = 0;
    this.acc = 0;
    this.task = task;
    this.recording = true;
  }

  stop(): void {
    this.recording = false;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  update(dt: number, instruments: Instrument[]): void {
    if (!this.recording) return;
    this.clock += dt;
    this.acc += dt;
    if (this.acc < SAMPLE_INTERVAL) return;
    this.acc = 0;
    this.frames.push({
      t: Math.round(this.clock * 1000),
      instruments: instruments.map((i) => ({ ...i.state }))
    });
  }

  toJSON(): string {
    const file: RecordFile = {
      app: 'laparo-trainer',
      version: 1,
      task: this.task,
      startedAt: new Date().toISOString(),
      frames: this.frames
    };
    return JSON.stringify(file);
  }

  download(): void {
    const blob = new Blob([this.toJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laparo-record-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/** 回放器:按时间戳线性插值驱动器械 */
export class Replayer {
  playing = false;
  private frames: RecordFrame[] = [];
  private cursor = 0; // ms

  load(json: string): string | null {
    try {
      const data = JSON.parse(json) as RecordFile;
      if (data.app !== 'laparo-trainer' || !Array.isArray(data.frames) || data.frames.length === 0) {
        return '文件格式不正确或没有记录帧';
      }
      this.frames = data.frames;
      this.cursor = 0;
      this.playing = true;
      return null;
    } catch {
      return 'JSON 解析失败';
    }
  }

  stop(): void {
    this.playing = false;
  }

  update(dt: number, instruments: Instrument[]): boolean {
    if (!this.playing) return false;
    this.cursor += dt * 1000;
    const frames = this.frames;
    if (this.cursor >= frames[frames.length - 1].t) {
      this.applyFrame(frames[frames.length - 1], instruments);
      this.playing = false;
      return false;
    }
    // 二分查找所在区间
    let lo = 0;
    let hi = frames.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].t <= this.cursor) lo = mid;
      else hi = mid;
    }
    const a = frames[lo];
    const b = frames[hi];
    const span = Math.max(1, b.t - a.t);
    const k = (this.cursor - a.t) / span;
    instruments.forEach((inst, i) => {
      const sa = a.instruments[i];
      const sb = b.instruments[i];
      if (!sa || !sb) return;
      inst.setState(lerpState(sa, sb, k));
    });
    return true;
  }

  private applyFrame(f: RecordFrame, instruments: Instrument[]): void {
    instruments.forEach((inst, i) => {
      const s = f.instruments[i];
      if (s) inst.setState({ ...s });
    });
  }
}

function lerpState(a: InstrumentState, b: InstrumentState, k: number): InstrumentState {
  const l = (x: number, y: number) => x + (y - x) * k;
  return {
    yaw: l(a.yaw, b.yaw),
    pitch: l(a.pitch, b.pitch),
    depth: l(a.depth, b.depth),
    roll: l(a.roll, b.roll),
    jaw: l(a.jaw, b.jaw)
  };
}
