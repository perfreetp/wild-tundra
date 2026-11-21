import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { BabylonScene } from './babylon/scene';
import { store } from './state/store';
import { TileLibrary } from './components/TileLibrary';
import { Toolbar } from './components/Toolbar';
import { FoldPanel } from './components/FoldPanel';
import { ReplayPanel } from './components/ReplayPanel';
import { TemplatePanel } from './components/TemplatePanel';
import { exportBuildCard } from './components/exportCard';
import { TILE_COLORS } from './state/colors';
import type { TileKind } from './geometry/math';

export default function App() {
  let canvasRef: HTMLCanvasElement | undefined;
  const [scene, setScene] = createSignal<BabylonScene | null>(null);
  const [toast, setToast] = createSignal<string | null>(null);

  onMount(() => {
    const s = new BabylonScene(canvasRef!);
    setScene(s);
    // 调试/自动化测试钩子:暴露同一实例,避免动态 import 产生模块副本
    (window as unknown as { __store?: typeof store; __appScene?: BabylonScene }).__store = store;
    (window as unknown as { __appScene?: BabylonScene }).__appScene = s;

    // 同步 store 里的片到场景
    createEffect(() => {
      const tiles = store.getTiles();
      s.syncTiles(tiles);
    });

    const onResize = () => s.resize();
    window.addEventListener('resize', onResize);
    onCleanup(() => {
      window.removeEventListener('resize', onResize);
      s.dispose();
    });
  });

  // 片库拖到台面:屏幕坐标 -> 台面坐标 -> 新增片
  const dropToTable = (kind: TileKind, clientX: number, clientY: number) => {
    const s = scene();
    if (!s || !canvasRef) return;
    const rect = canvasRef.getBoundingClientRect();
    // 借助 Babylon 的拾取:临时设置指针坐标
    const savedX = s.scene.pointerX;
    const savedY = s.scene.pointerY;
    s.scene.pointerX = clientX - rect.left;
    s.scene.pointerY = clientY - rect.top;
    const pick = s.scene.pick(s.scene.pointerX, s.scene.pointerY, (m) => m.name === 'table');
    s.scene.pointerX = savedX;
    s.scene.pointerY = savedY;
    const p = pick?.pickedPoint;
    if (!p) {
      showToast('请拖到台面上哦');
      return;
    }
    const tile = store.addTile(kind, p.x, p.z);
    // 立刻尝试吸附
    store.tryPlace(tile);
    showToast(`放好一片${TILE_COLORS[kind].name}`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  return (
    <div class="app">
      <TileLibrary onDropToTable={dropToTable} />

      <main class="stage">
        <Toolbar onExport={() => exportBuildCard(scene())} />
        <div class="canvas-wrap">
          <canvas id="babylon-canvas" ref={canvasRef} touch-action="none" />
          <div class="stage-hint">
            {store.mode() === 'flat'
              ? '拖动磁力片 · 拖蓝色手柄旋转 · 双击回正视角'
              : '单指转动模型看背面 · 点一片拿起来 · 双击回到平铺视角'}
          </div>
          {toast() && <div class="toast">{toast()}</div>}
        </div>
      </main>

      <aside class="right-panel">
        <TemplatePanel />
        <FoldPanel scene={scene} />
        <ReplayPanel />
      </aside>
    </div>
  );
}
