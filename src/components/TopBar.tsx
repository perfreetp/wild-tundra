import { useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { engineBridge } from './Viewport';
import { exportConfigFile, importConfigFile } from '../services/persistence';
import {
  loadLineModel,
  parseCenterline,
  serializeCenterline,
} from '../services/modelLoader';
import { buildDemoWorld } from '../engine/sceneBuilder';
import type { BuiltWorld } from '../engine/sceneBuilder';
import type { TabId, ViewId } from '../engine/types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'front', label: '前向视点' },
  { id: 'leftFront', label: '左前视点' },
  { id: 'rightFront', label: '右前视点' },
  { id: 'triple', label: '三屏同显' },
];

export function TopBar() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const setPanelOpen = useAppStore((s) => s.setPanelOpen);
  const loadingModel = useAppStore((s) => s.loadingModel);
  const setLoadingModel = useAppStore((s) => s.setLoadingModel);
  const pushToast = useAppStore((s) => s.pushToast);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const saveLocal = useAppStore((s) => s.saveLocal);

  const modelInputRef = useRef<HTMLInputElement>(null);
  const centerlineInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  const swapWorld = (world: BuiltWorld, message: string) => {
    const engine = engineBridge.engineRef.current;
    if (!engine) throw new Error('引擎尚未就绪');
    engine.replaceWorld(world);
    engineBridge.worldRef.current = world;
    useAppStore.getState().setRouteLength(engine.routeLength);
    pushToast(message, 'success');
  };

  /** 加载 GLB/GLTF 线路模型：保留演示中心线与列车，静态场景替换为模型分块 */
  const handleModelFile = async (file: File) => {
    setLoadingModel(true);
    try {
      const url = URL.createObjectURL(file);
      const loaded = await loadLineModel(url);
      URL.revokeObjectURL(url);
      const oldWorld = engineBridge.worldRef.current;
      if (!oldWorld) throw new Error('引擎尚未就绪');

      const group = new THREE.Group();
      group.name = 'loaded-world';
      group.add(loaded.group);
      group.add(oldWorld.train);
      group.add(oldWorld.contactWire);

      const previousDispose = oldWorld.dispose;
      const world: BuiltWorld = {
        ...oldWorld,
        group,
        chunks: loaded.chunks,
        distanceMode: 'world',
        dispose: () => {
          // 先释放加载模型的几何/材质（可能是材质数组）
          for (const d of loaded.disposables) {
            d.geometry.dispose();
            if (Array.isArray(d.material)) d.material.forEach((m) => m.dispose());
            else d.material?.dispose();
          }
          // 再释放沿用自旧世界的列车、接触线等共享资源
          previousDispose();
        },
      };
      swapWorld(
        world,
        `模型加载完成：${loaded.chunks.length} 个 BVH 分块，已重新生成三视点机位`,
      );
    } catch (err) {
      pushToast(`模型加载失败：${(err as Error).message}`, 'error');
    } finally {
      setLoadingModel(false);
      if (modelInputRef.current) modelInputRef.current.value = '';
    }
  };

  /** 导入中心线 JSON：按新中心线重建整套演示场景 */
  const handleCenterlineFile = async (file: File) => {
    try {
      const text = await file.text();
      const curve = parseCenterline(JSON.parse(text));
      const rebuilt = buildDemoWorld(curve);
      swapWorld(rebuilt, '中心线导入成功，已按新中心线重建场景与三视点');
    } catch (err) {
      pushToast(`中心线导入失败：${(err as Error).message}`, 'error');
    } finally {
      if (centerlineInputRef.current) centerlineInputRef.current.value = '';
    }
  };

  /** 导入场景配置：还原视点机位、相机参数与天气状态 */
  const handleConfigImport = async (file: File) => {
    try {
      const config = await importConfigFile(file);
      useAppStore.getState().applyConfig(config);
      const engine = engineBridge.engineRef.current;
      if (engine) {
        engine.setRouteProgress(config.routeProgress);
        (Object.keys(config.views) as ViewId[]).forEach((id) =>
          engine.setViewConfig(id, config.views[id]),
        );
      }
      pushToast('配置导入成功，视点机位与天气状态已还原', 'success');
    } catch (err) {
      pushToast(`配置导入失败：${(err as Error).message}`, 'error');
    } finally {
      if (configInputRef.current) configInputRef.current.value = '';
    }
  };

  const exportCenterline = () => {
    const world = engineBridge.worldRef.current;
    if (!world) return;
    const data = serializeCenterline(world.centerline);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centerline.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">🚆</span>
        <span className="brand-name">列车驾驶视景渲染</span>
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          className="btn"
          onClick={() => modelInputRef.current?.click()}
          disabled={loadingModel}
          title="加载 .glb / .gltf 线路三维模型"
        >
          {loadingModel ? '加载中…' : '加载模型'}
        </button>
        <button
          className="btn"
          onClick={() => centerlineInputRef.current?.click()}
          title="导入 {points:[[x,y,z]...]} 格式中心线 JSON"
        >
          中心线
        </button>
        <button className="btn" onClick={exportCenterline} title="导出当前中心线 JSON">
          导出中心线
        </button>
        <span className="divider" />
        <button className="btn" onClick={saveLocal} title="保存视点与天气到浏览器本地">
          保存本地
        </button>
        <button
          className="btn"
          onClick={() => exportConfigFile(buildConfig())}
          title="导出场景配置 JSON 用于分享"
        >
          导出配置
        </button>
        <button
          className="btn"
          onClick={() => configInputRef.current?.click()}
          title="导入配置 JSON 并还原视点与天气"
        >
          导入配置
        </button>
        <span className="divider" />
        <button
          className="btn icon-btn"
          onClick={() => setPanelOpen(!panelOpen)}
          title={panelOpen ? '收起配置面板' : '展开配置面板'}
        >
          {panelOpen ? '▶|' : '|◀'}
        </button>
      </div>

      <input
        ref={modelInputRef}
        data-testid="file-model"
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        hidden
        onChange={(e) => e.target.files?.[0] && void handleModelFile(e.target.files[0])}
      />
      <input
        ref={centerlineInputRef}
        data-testid="file-centerline"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => e.target.files?.[0] && void handleCenterlineFile(e.target.files[0])}
      />
      <input
        ref={configInputRef}
        data-testid="file-config"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => e.target.files?.[0] && void handleConfigImport(e.target.files[0])}
      />
    </header>
  );
}
