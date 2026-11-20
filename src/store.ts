import { create } from 'zustand';
import type {
  ColorMode,
  ColorScheme,
  LeakPoint,
  NetworkData,
  PipeSelection,
  Side,
  SolverResult,
} from './types';
import { createSampleNetwork } from './lib/sample';
import { DEFAULT_SCHEME } from './lib/scheme';
import { solveNetwork } from './lib/solver';
import { storage, UIPrefs } from './lib/storage';
import { computeAffectedBuildings } from './lib/topology';

interface State {
  network: NetworkData;
  scheme: ColorScheme;
  leaks: LeakPoint[];
  results: Record<Side, SolverResult>;
  side: Side;
  colorMode: ColorMode;
  showLabels: boolean;
  selection: PipeSelection | null;
  selectedNode: string | null;
  affectedBuildings: Set<string>;
  /** 节点树定位请求（自增序号驱动 SceneManager 飞行） */
  focusNonce: { nodeId: string; nonce: number } | null;
  toast: string | null;

  setNetwork: (n: NetworkData) => void;
  setSide: (s: Side) => void;
  setColorMode: (m: ColorMode) => void;
  toggleLabels: () => void;
  setScheme: (s: ColorScheme) => void;
  updateThreshold: (v: number) => void;
  updateBand: (
    mode: ColorMode,
    index: number,
    patch: Partial<{ min: number; color: string }>,
  ) => void;
  addLeak: (pipeId: string, side: Side, t?: number) => void;
  updateLeak: (id: string, patch: Partial<LeakPoint>) => void;
  removeLeak: (id: string) => void;
  selectPipe: (sel: PipeSelection | null) => void;
  selectNode: (id: string | null) => void;
  requestFocusNode: (id: string) => void;
  showToast: (msg: string) => void;
  resetAll: () => void;
}

let leakSeq = 1;

function recalc(
  network: NetworkData,
  leaks: LeakPoint[],
  threshold: number,
): Record<Side, SolverResult> {
  return solveNetwork(network, leaks, threshold);
}

const savedUI = storage.loadUI();
const savedNetwork = storage.loadNetwork();
const savedScheme = storage.loadScheme();
const savedLeaks = storage.loadLeaks();

const initialNetwork = savedNetwork ?? createSampleNetwork();
const initialScheme = savedScheme ?? DEFAULT_SCHEME;
const initialLeaks = savedLeaks;
const initialResults = recalc(
  initialNetwork,
  initialLeaks,
  initialScheme.lossThreshold,
);

function persist(network: NetworkData, scheme: ColorScheme, leaks: LeakPoint[], ui: UIPrefs) {
  storage.saveNetwork(network);
  storage.saveScheme(scheme);
  storage.saveLeaks(leaks);
  storage.saveUI(ui);
}

export const useStore = create<State>((set, get) => ({
  network: initialNetwork,
  scheme: initialScheme,
  leaks: initialLeaks,
  results: initialResults,
  side: savedUI?.side ?? 'supply',
  colorMode: savedUI?.colorMode ?? 'pressure',
  showLabels: savedUI?.showLabels ?? true,
  selection: null,
  selectedNode: null,
  affectedBuildings: computeAffectedBuildings(initialNetwork, initialLeaks),
  focusNonce: null,
  toast: null,

  setNetwork: (n) => {
    const { scheme, side, colorMode, showLabels } = get();
    const results = recalc(n, [], scheme.lossThreshold);
    set({
      network: n,
      leaks: [],
      results,
      selection: null,
      selectedNode: null,
      affectedBuildings: new Set(),
    });
    persist(n, scheme, [], { side, colorMode, showLabels });
    get().showToast(`管网已装载：${n.nodes.length} 节点 / ${n.supplyPipes.length} 供水管段`);
  },

  setSide: (s) => {
    const { scheme, colorMode, showLabels } = get();
    set({ side: s, selection: null });
    persist(get().network, scheme, get().leaks, {
      side: s,
      colorMode,
      showLabels,
    });
  },

  setColorMode: (m) => {
    const { scheme, side, showLabels } = get();
    set({ colorMode: m });
    persist(get().network, scheme, get().leaks, { side, colorMode: m, showLabels });
  },

  toggleLabels: () => {
    const v = !get().showLabels;
    const { scheme, side, colorMode } = get();
    set({ showLabels: v });
    persist(get().network, scheme, get().leaks, { side, colorMode, showLabels: v });
  },

  setScheme: (s) => {
    const results = recalc(get().network, get().leaks, s.lossThreshold);
    set({ scheme: s, results, affectedBuildings: computeAffectedBuildings(get().network, get().leaks) });
    storage.saveScheme(s);
  },

  updateThreshold: (v) => {
    const scheme = { ...get().scheme, lossThreshold: v };
    const results = recalc(get().network, get().leaks, v);
    set({ scheme, results });
    storage.saveScheme(scheme);
  },

  updateBand: (mode, index, patch) => {
    const scheme = { ...get().scheme };
    const key = mode === 'pressure' ? 'pressureBands' : 'temperatureBands';
    scheme[key] = scheme[key].map((b, i) =>
      i === index ? { ...b, ...patch } : b,
    );
    set({ scheme });
    storage.saveScheme(scheme);
  },

  addLeak: (pipeId, side, t = 0.5) => {
    const id = `LK${leakSeq++}`;
    const leak: LeakPoint = { id, pipeId, side, t, radius: 8 };
    const leaks = [...get().leaks, leak];
    const results = recalc(get().network, leaks, get().scheme.lossThreshold);
    set({
      leaks,
      results,
      affectedBuildings: computeAffectedBuildings(get().network, leaks),
    });
    const { colorMode, showLabels } = get();
    persist(get().network, get().scheme, leaks, { side, colorMode, showLabels });
  },

  updateLeak: (id, patch) => {
    const leaks = get().leaks.map((l) =>
      l.id === id ? { ...l, ...patch } : l,
    );
    const results = recalc(get().network, leaks, get().scheme.lossThreshold);
    set({
      leaks,
      results,
      affectedBuildings: computeAffectedBuildings(get().network, leaks),
    });
    const { side, colorMode, showLabels } = get();
    persist(get().network, get().scheme, leaks, { side, colorMode, showLabels });
  },

  removeLeak: (id) => {
    const leaks = get().leaks.filter((l) => l.id !== id);
    const results = recalc(get().network, leaks, get().scheme.lossThreshold);
    set({
      leaks,
      results,
      affectedBuildings: computeAffectedBuildings(get().network, leaks),
    });
    const { side, colorMode, showLabels } = get();
    persist(get().network, get().scheme, leaks, { side, colorMode, showLabels });
  },

  selectPipe: (sel) => set({ selection: sel }),
  selectNode: (id) => set({ selectedNode: id }),

  requestFocusNode: (id) =>
    set({
      focusNonce: {
        nodeId: id,
        nonce: (get().focusNonce?.nonce ?? 0) + 1,
      },
    }),

  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 3200);
  },

  resetAll: () => {
    const network = createSampleNetwork();
    const scheme = DEFAULT_SCHEME;
    const results = recalc(network, [], scheme.lossThreshold);
    set({
      network,
      scheme,
      leaks: [],
      results,
      selection: null,
      selectedNode: null,
      affectedBuildings: new Set(),
      side: 'supply',
      colorMode: 'pressure',
    });
    persist(network, scheme, [], {
      side: 'supply',
      colorMode: 'pressure',
      showLabels: true,
    });
    get().showToast('已恢复示例管网与默认色带');
  },
}));
