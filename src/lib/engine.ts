import { Engine, WebGPUEngine } from '@babylonjs/core';

export interface EngineResult {
  engine: Engine;
  kind: 'WebGPU' | 'WebGL';
}

/** 优先 WebGPU,不可用时回退 WebGL */
export async function createEngine(canvas: HTMLCanvasElement): Promise<EngineResult> {
  const nav = navigator as Navigator & { gpu?: unknown };
  if (nav.gpu) {
    try {
      const webgpu = new WebGPUEngine(canvas, {
        antialias: true,
        stencil: true,
        adaptToDeviceRatio: true
      });
      await webgpu.initAsync();
      return { engine: webgpu as unknown as Engine, kind: 'WebGPU' };
    } catch (e) {
      console.warn('WebGPU 初始化失败,回退 WebGL:', e);
    }
  }
  return { engine: new Engine(canvas, true, { stencil: true, adaptToDeviceRatio: true }), kind: 'WebGL' };
}
