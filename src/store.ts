import { create } from 'zustand';
import type { CameraParams, CameraPreset, SceneObject } from './types';
import { DEFAULT_PARAMS } from './presets';

const STORAGE_KEY = 'vcs.cameraPresets.v1';

export function loadPresets(): CameraPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CameraPreset[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function savePresets(presets: CameraPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

let idSeq = 1;
export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${idSeq++}`;
}

interface SimState {
  params: CameraParams;
  presets: CameraPreset[];
  objects: SceneObject[];
  selectedId: string | null;
  /** 自动巡航（车辆沿道路行驶，用于动态观察隧道明暗过渡） */
  cruising: boolean;
  cruiseSpeed: number;

  updateParams: (patch: Partial<CameraParams>) => void;
  resetParams: () => void;
  applyPreset: (p: CameraPreset) => void;
  saveCurrentAsPreset: (name: string) => void;
  deletePreset: (id: string) => void;
  exportPresetFile: (id: string | null) => void;
  importPresetFile: (file: File) => Promise<string | null>;

  addObject: (obj: SceneObject) => void;
  updateObject: (id: string, patch: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  select: (id: string | null) => void;
  setCruising: (v: boolean) => void;
  setCruiseSpeed: (v: number) => void;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const defaultObjects: SceneObject[] = [
  {
    id: 'veh-default-1',
    type: 'vehicle',
    name: '前车 A',
    position: [0, 0, -25],
    rotationY: 0,
    color: 0xc0392b,
  },
  {
    id: 'veh-default-2',
    type: 'vehicle',
    name: '对向车 B',
    position: [-3.5, 0, -55],
    rotationY: Math.PI,
    color: 0x2c6fbb,
  },
  {
    id: 'lane-default-1',
    type: 'lane',
    name: '虚线车道线',
    position: [-1.75, 0.02, -60],
    rotationY: 0,
    length: 120,
    width: 0.15,
  },
];

export const useSimStore = create<SimState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  presets: loadPresets(),
  objects: defaultObjects,
  selectedId: null,
  cruising: true,
  cruiseSpeed: 12,

  updateParams: (patch) =>
    set((s) => ({ params: { ...s.params, ...patch } })),
  resetParams: () => set({ params: { ...DEFAULT_PARAMS } }),

  applyPreset: (p) => set({ params: { ...p.params } }),

  saveCurrentAsPreset: (name) => {
    const preset: CameraPreset = {
      id: nextId('preset'),
      name: name.trim() || `配置 ${get().presets.length + 1}`,
      savedAt: Date.now(),
      params: structuredClone(get().params),
    };
    const presets = [...get().presets, preset];
    savePresets(presets);
    set({ presets });
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id);
    savePresets(presets);
    set({ presets });
  },

  exportPresetFile: (id) => {
    const target =
      id != null ? get().presets.find((p) => p.id === id) : undefined;
    const payload = target ?? {
      id: nextId('preset'),
      name: '当前相机参数',
      savedAt: Date.now(),
      params: get().params,
    };
    download(
      `camera-config-${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
  },

  importPresetFile: async (file) => {
    const text = await file.text();
    const data = JSON.parse(text) as CameraPreset;
    if (!data || typeof data !== 'object' || !data.params) {
      throw new Error('配置文件格式不正确：缺少 params 字段');
    }
    const merged: CameraPreset = {
      id: nextId('preset'),
      name: data.name || file.name.replace(/\.json$/i, ''),
      savedAt: Date.now(),
      params: { ...DEFAULT_PARAMS, ...data.params },
    };
    const presets = [...get().presets, merged];
    savePresets(presets);
    set({ presets, params: merged.params });
    return merged.name;
  },

  addObject: (obj) =>
    set((s) => ({ objects: [...s.objects, obj], selectedId: obj.id })),
  updateObject: (id, patch) =>
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    })),
  removeObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  select: (id) => set({ selectedId: id }),
  setCruising: (v) => set({ cruising: v }),
  setCruiseSpeed: (v) => set({ cruiseSpeed: v }),
}));
