import type { ReconParams, ReconResult, VolumeData, WorkerOutMsg } from './types';

/**
 * 重建 Worker 客户端：体数据只传一次（拷贝），之后每次重建只发阈值参数。
 */
export class ReconClient {
  private worker: Worker;
  private reqId = 0;
  private pending = new Map<number, { resolve: (r: ReconResult) => void; reject: (e: Error) => void }>();

  constructor() {
    this.worker = new Worker(new URL('./recon.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev: MessageEvent<WorkerOutMsg>) => {
      const msg = ev.data;
      const p = this.pending.get(msg.id);
      if (!p) return; // 过期请求
      this.pending.delete(msg.id);
      if (msg.type === 'result') p.resolve(msg.result);
      else p.reject(new Error(msg.message));
    };
  }

  /** 初始化体数据（拷贝一份传入 Worker，主线程保留原数据用于切片显示） */
  init(volume: VolumeData): void {
    const copy = volume.data.slice();
    this.worker.postMessage({ type: 'init', dims: volume.dims, data: copy }, [copy.buffer]);
  }

  reconstruct(params: ReconParams): Promise<ReconResult> {
    const id = ++this.reqId;
    return new Promise<ReconResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type: 'reconstruct', id, params });
    });
  }

  /** 丢弃所有未完成的请求（参数变化时调用，旧结果直接忽略） */
  invalidatePending(): void {
    this.reqId++;
    for (const [, p] of this.pending) p.reject(new Error('stale'));
    this.pending.clear();
  }

  dispose(): void {
    this.worker.terminate();
  }
}
