import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { params, scheduleSave, saveVersion } from './store.js';
import { createStreetScene } from './three/createScene.js';
import ControlPanel from './components/ControlPanel.jsx';
import VersionsPanel from './components/VersionsPanel.jsx';

export default function App() {
  let canvas;
  let api;
  const [tab, setTab] = createSignal('control');

  onMount(() => {
    api = createStreetScene(canvas, params, {
      onPeopleMoved: () => scheduleSave(),
    });
    // 初始状态存为第一个版本
    saveVersion(true);
  });

  onCleanup(() => api?.dispose());

  // 参数变化 → 同步到 three.js 场景
  createEffect(() => {
    if (!api) return;
    // 逐个读取以建立依赖
    const { elevation, azimuth } = params;
    void elevation; void azimuth;
    api.applySun();
  });
  createEffect(() => {
    if (!api) return;
    const { mapSize, bias, normalBias, kernel } = params;
    void mapSize; void bias; void normalBias; void kernel;
    api.applyShadowQuality();
  });
  createEffect(() => {
    if (!api) return;
    const { groundRough, wallRough } = params;
    void groundRough; void wallRough;
    api.applyMaterials();
  });
  createEffect(() => {
    if (!api) return;
    params.lamps.forEach((l) => void l);
    api.applyLamps();
  });

  return (
    <div class="app">
      <div class="viewport">
        <canvas ref={canvas} />
        <div class="viewport-tip">🖱️ 拖动旋转视角 · 滚轮缩放 · 直接拖动小人</div>
      </div>
      <aside class="sidebar">
        <h1>🌞 太阳影子小街区</h1>
        <div class="tabs">
          <button classList={{ active: tab() === 'control' }} onClick={() => setTab('control')}>
            🎛️ 控制
          </button>
          <button classList={{ active: tab() === 'versions' }} onClick={() => setTab('versions')}>
            📼 版本对比
          </button>
        </div>
        {tab() === 'control' ? <ControlPanel /> : <VersionsPanel />}
      </aside>
    </div>
  );
}
