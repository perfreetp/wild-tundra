import { useEffect, useRef } from 'react';
import { ViewEngine } from '../engine/viewEngine';
import { buildDemoWorld, type BuiltWorld } from '../engine/sceneBuilder';
import { useAppStore } from '../store/appStore';
import type { SceneConfig, ViewId } from '../engine/types';
import { VIEW_IDS } from '../engine/types';

/** 模块级引擎桥：供非组件模块（顶栏加载/导入按钮等）访问当前引擎与世界 */
export const engineBridge = {
  engineRef: { current: null as ViewEngine | null },
  worldRef: { current: null as BuiltWorld | null },
};

/**
 * 3D 视口：持有 ViewEngine 生命周期，
 * 负责把 zustand 状态同步进引擎，并把引擎统计/里程回写到 store。
 */
export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewEngine | null>(null);
  const worldRef = useRef<BuiltWorld | null>(null);

  const tab = useAppStore((s) => s.tab);
  const activeView = useAppStore((s) => s.activeView);
  const views = useAppStore((s) => s.views);
  const weather = useAppStore((s) => s.weather);
  const lightLevel = useAppStore((s) => s.lightLevel);
  const materials = useAppStore((s) => s.materials);
  const autoDrive = useAppStore((s) => s.autoDrive);
  const driveSpeed = useAppStore((s) => s.driveSpeed);
  const routeProgress = useAppStore((s) => s.routeProgress);
  const setRouteLength = useAppStore((s) => s.setRouteLength);
  const pushToast = useAppStore((s) => s.pushToast);

  // 引擎初始化（仅一次）
  useEffect(() => {
    if (!containerRef.current) return;
    const world = buildDemoWorld();
    worldRef.current = world;
    engineBridge.worldRef.current = world;

    const engine = new ViewEngine(
      containerRef.current,
      world,
      useAppStore.getState().views,
      useAppStore.getState().weather,
      {
        onStats: (stats) => useAppStore.getState().setStats(stats),
        onProgress: (distance) => {
          useAppStore.setState({ routeProgress: distance });
        },
        onPoses: (poses) => {
          // 仅回写 pose，保留 store 中的 fov/near 等用户可调参数
          const current = useAppStore.getState().views;
          const views = { ...current };
          for (const id of VIEW_IDS) {
            views[id] = { ...views[id], pose: poses[id] };
          }
          useAppStore.setState({ views });
        },
      },
    );
    engineRef.current = engine;
    engineBridge.engineRef.current = engine;

    engine.setLightLevel(useAppStore.getState().lightLevel);
    engine.setMaterials(useAppStore.getState().materials);
    engine.setAutoDrive(useAppStore.getState().autoDrive);
    engine.setDriveSpeed(useAppStore.getState().driveSpeed);
    engine.setRouteProgress(useAppStore.getState().routeProgress);
    setRouteLength(engine.routeLength);
    pushToast('演示线路加载完成，已沿轨道中心线自动生成三个视点', 'success');

    return () => {
      engine.dispose();
      engineRef.current = null;
      worldRef.current = null;
      engineBridge.engineRef.current = null;
      engineBridge.worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setTab(tab);
  }, [tab]);

  useEffect(() => {
    engineRef.current?.setActiveView(activeView);
  }, [activeView]);

  // 视点参数同步（FOV / near / far / 机位 / rigMode）
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    (Object.keys(views) as ViewId[]).forEach((id) => {
      engine.setViewConfig(id, views[id]);
    });
  }, [views]);

  useEffect(() => {
    engineRef.current?.setWeather(weather);
  }, [weather]);

  useEffect(() => {
    engineRef.current?.setLightLevel(lightLevel);
  }, [lightLevel]);

  useEffect(() => {
    engineRef.current?.setMaterials(materials);
  }, [materials]);

  useEffect(() => {
    engineRef.current?.setAutoDrive(autoDrive);
  }, [autoDrive]);

  useEffect(() => {
    engineRef.current?.setDriveSpeed(driveSpeed);
  }, [driveSpeed]);

  // 滑块驱动里程：仅在非自动行驶时生效，避免与引擎回写竞争
  const lastManualProgress = useRef(routeProgress);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || autoDrive) return;
    if (Math.abs(routeProgress - lastManualProgress.current) > 0.5) {
      engine.setRouteProgress(routeProgress);
    }
    lastManualProgress.current = routeProgress;
  }, [routeProgress, autoDrive]);

  return <div ref={containerRef} className="viewport-container" />;
}

/** 用导入的配置还原视点与天气状态 */
export function applyImportedConfig(config: SceneConfig): void {
  useAppStore.getState().applyConfig(config);
  const engine = engineBridge.engineRef.current;
  if (engine) {
    engine.setRouteProgress(config.routeProgress);
    (Object.keys(config.views) as ViewId[]).forEach((id) => {
      engine.setViewConfig(id, config.views[id]);
    });
  }
}
