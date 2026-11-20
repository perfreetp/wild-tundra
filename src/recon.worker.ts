/// <reference lib="webworker" />
import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import type { InitMsg, ReconMsg, ReconResult, WorkerOutMsg } from './types';
import { marchingTets, repairWithManifold, sampleValues, type ManifoldModule } from './reconCore';

// ---------- 体数据状态 ----------
let dims: [number, number, number] = [0, 0, 0];
let volume: Float32Array | null = null;

// ---------- manifold-3d 初始化（WASM 只加载一次） ----------
let manifoldReady: Promise<ManifoldModule> | null = null;
function getManifold(): Promise<ManifoldModule> {
  if (!manifoldReady) {
    manifoldReady = Module({ locateFile: () => wasmUrl }).then((m) => {
      m.setup();
      return m;
    });
  }
  return manifoldReady;
}

// ---------- 消息处理 ----------

self.onmessage = async (ev: MessageEvent<InitMsg | ReconMsg>) => {
  const msg = ev.data;
  if (msg.type === 'init') {
    dims = msg.dims;
    volume = msg.data;
    // 提前加载 WASM，缩短首次重建等待
    void getManifold();
    return;
  }

  const t0 = performance.now();
  try {
    if (!volume) throw new Error('体数据未初始化');
    const { thresholdMin, thresholdMax } = msg.params;

    const raw = marchingTets(dims, volume, thresholdMin, thresholdMax);
    const M = await getManifold();
    const { mesh, components, repaired } = await repairWithManifold(M, raw);
    const values = sampleValues(dims, volume, mesh.positions);

    const result: ReconResult = {
      positions: mesh.positions,
      indices: mesh.indices,
      values,
      triCount: mesh.indices.length / 3,
      timeMs: performance.now() - t0,
      components,
      repaired,
    };
    const out: WorkerOutMsg = { type: 'result', id: msg.id, result };
    (self as unknown as Worker).postMessage(out, [
      result.positions.buffer,
      result.indices.buffer,
      result.values.buffer,
    ]);
  } catch (e) {
    const out: WorkerOutMsg = { type: 'error', id: msg.id, message: (e as Error).message };
    (self as unknown as Worker).postMessage(out);
  }
};
