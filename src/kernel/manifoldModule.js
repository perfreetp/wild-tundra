// manifold-3d WASM 单例加载器
import Module from 'manifold-3d';
import { setWasmUrl } from 'manifold-3d/lib/wasm.js';
// Vite 会把 wasm 作为静态资源产出 URL
import wasmUrl from 'manifold-3d/manifold.wasm?url';

setWasmUrl(wasmUrl);

let modulePromise = null;

/** 初始化（或获取已初始化的）manifold WASM 模块 */
export function getManifold() {
  if (!modulePromise) {
    modulePromise = Module({ locateFile: () => wasmUrl }).then((m) => {
      m.setup();
      // 让圆管/球的网格密度适中，兼顾布尔速度与观感
      m.setCircularSegments(32);
      return m;
    });
  }
  return modulePromise;
}
