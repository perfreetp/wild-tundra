import type { MaterialGraph } from "../core/types";

/** 一个「金具方案」= 一张节点图 + 预览参数。 */
export interface Project {
  id: string;
  name: string;
  /** 方案备注：线路、杆塔号、工况等。 */
  note: string;
  graph: MaterialGraph;
  /** 预览面板的粗糙度缩放。 */
  previewRoughness: number;
  createdAt: number;
  updatedAt: number;
  /** 来自哪个预设，便于列表标注。 */
  presetId?: string;
}

export interface PersistedState {
  version: 2;
  projects: Project[];
  activeProjectId: string | null;
}

export const STORAGE_KEY = "hme.projects.v2";

let counter = 0;

export function newId(prefix = "p"): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${counter}_${random}`;
}

export function cloneProject(project: Project, name?: string): Project {
  const now = Date.now();
  return {
    ...project,
    id: newId(),
    name: name ?? nextCopyName(project.name),
    graph: cloneGraphDeep(project.graph),
    createdAt: now,
    updatedAt: now,
  };
}

export function nextCopyName(name: string): string {
  const trimmed = name.trim();
  const match = /^(.*?)\s*副本(?:\s*(\d+))?$/.exec(trimmed);
  if (!match) return `${trimmed} 副本`;
  const next = match[2] ? Number(match[2]) + 1 : 2;
  return `${match[1]} 副本 ${next}`;
}

export function cloneGraphDeep(graph: MaterialGraph): MaterialGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      params: Object.fromEntries(
        Object.entries(node.params).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
      ),
    })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

/* ------------------------------------------------------------------ */
/* 持久化                                                              */
/* ------------------------------------------------------------------ */

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(storage: StorageLike | null = defaultStorage()): PersistedState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.projects)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(
  state: PersistedState,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // 隐私模式等场景下忽略
  }
}
