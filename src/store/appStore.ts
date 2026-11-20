import { create } from 'zustand';
import type {
  LightLevel,
  MaterialTuning,
  RenderStats,
  SceneConfig,
  TabId,
  ViewConfig,
  ViewId,
  WeatherConfig,
} from '../engine/types';
import { VIEW_LABELS } from '../engine/types';
import { loadConfigLocal, saveConfigLocal } from '../services/persistence';

function defaultViewConfig(): ViewConfig {
  return {
    fov: 60,
    near: 1,
    far: 1500,
    pose: {
      position: [0, 3.4, 0],
      lookAt: [120, 3.4, 0],
      up: [0, 1, 0],
    },
    rigMode: true,
  };
}

export function defaultViews(): Record<ViewId, ViewConfig> {
  return {
    front: defaultViewConfig(),
    leftFront: defaultViewConfig(),
    rightFront: defaultViewConfig(),
  };
}

export function defaultWeather(): WeatherConfig {
  return {
    rain: false,
    fog: false,
    visibility: 300,
    rainIntensity: 0.5,
  };
}

export function defaultMaterials(): MaterialTuning {
  return {
    tunnelColor: '#9aa0a6',
    tunnelRoughness: 0.92,
    trainColor: '#e8ecf1',
    trainRoughness: 0.35,
    trainMetalness: 0.25,
  };
}

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

interface AppState {
  tab: TabId;
  activeView: ViewId;
  views: Record<ViewId, ViewConfig>;
  weather: WeatherConfig;
  lightLevel: LightLevel;
  materials: MaterialTuning;
  autoDrive: boolean;
  driveSpeed: number;
  routeProgress: number;
  routeLength: number;
  stats: RenderStats | null;
  panelOpen: boolean;
  loadingModel: boolean;
  toasts: ToastMessage[];

  setTab: (tab: TabId) => void;
  setActiveView: (id: ViewId) => void;
  patchView: (id: ViewId, patch: Partial<ViewConfig>) => void;
  patchWeather: (patch: Partial<WeatherConfig>) => void;
  setLightLevel: (level: LightLevel) => void;
  patchMaterials: (patch: Partial<MaterialTuning>) => void;
  setAutoDrive: (on: boolean) => void;
  setDriveSpeed: (mps: number) => void;
  setRouteProgress: (distance: number) => void;
  setRouteLength: (length: number) => void;
  setStats: (stats: RenderStats) => void;
  setPanelOpen: (open: boolean) => void;
  setLoadingModel: (loading: boolean) => void;
  pushToast: (text: string, kind?: ToastMessage['kind']) => void;
  dismissToast: (id: number) => void;
  applyConfig: (config: SceneConfig) => void;
  buildConfig: () => SceneConfig;
  saveLocal: () => void;
}

let toastSeq = 0;

const restored = loadConfigLocal();

export const useAppStore = create<AppState>((set, get) => ({
  tab: 'front',
  activeView: 'front',
  views: restored?.views ?? defaultViews(),
  weather: restored?.weather ?? defaultWeather(),
  lightLevel: restored?.lightLevel ?? 2,
  materials: restored?.materials ?? defaultMaterials(),
  autoDrive: restored?.autoDrive ?? true,
  driveSpeed: restored?.driveSpeed ?? 22,
  routeProgress: restored?.routeProgress ?? 0,
  routeLength: 0,
  stats: null,
  panelOpen: true,
  loadingModel: false,
  toasts: [],

  setTab: (tab) =>
    set({ tab, activeView: tab === 'triple' ? get().activeView : tab }),

  setActiveView: (activeView) => set({ activeView }),

  patchView: (id, patch) =>
    set((s) => ({ views: { ...s.views, [id]: { ...s.views[id], ...patch } } })),

  patchWeather: (patch) =>
    set((s) => ({ weather: { ...s.weather, ...patch } })),

  setLightLevel: (lightLevel) => set({ lightLevel }),

  patchMaterials: (patch) =>
    set((s) => ({ materials: { ...s.materials, ...patch } })),

  setAutoDrive: (autoDrive) => set({ autoDrive }),
  setDriveSpeed: (driveSpeed) => set({ driveSpeed }),
  setRouteProgress: (routeProgress) => set({ routeProgress }),
  setRouteLength: (routeLength) => set({ routeLength }),
  setStats: (stats) => set({ stats }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setLoadingModel: (loadingModel) => set({ loadingModel }),

  pushToast: (text, kind = 'info') => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(() => get().dismissToast(id), 3600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  applyConfig: (config) =>
    set({
      views: config.views,
      weather: config.weather,
      lightLevel: config.lightLevel,
      materials: config.materials,
      autoDrive: config.autoDrive,
      driveSpeed: config.driveSpeed,
      routeProgress: config.routeProgress,
    }),

  buildConfig: () => {
    const s = get();
    return {
      schemaVersion: 1 as const,
      savedAt: new Date().toISOString(),
      routeProgress: s.routeProgress,
      autoDrive: s.autoDrive,
      driveSpeed: s.driveSpeed,
      views: s.views,
      weather: s.weather,
      lightLevel: s.lightLevel,
      materials: s.materials,
    };
  },

  saveLocal: () => {
    const config = get().buildConfig();
    saveConfigLocal(config);
    get().pushToast('场景配置已保存到浏览器本地', 'success');
  },
}));

export { VIEW_LABELS };
