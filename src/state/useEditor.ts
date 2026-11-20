import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEdge, addNode, moveNode, removeEdge, removeNode, updateParam } from "../core/graph";
import { builtInPresets, type MaterialPreset } from "../core/presets";
import type { MaterialGraph, NodeKind, ParamValue } from "../core/types";
import { checkConnection, validateGraph, type ValidationResult } from "../core/validate";
import {
  cloneGraphDeep,
  cloneProject,
  loadState,
  newId,
  saveState,
  type Project,
} from "./projects";

export interface Toast {
  id: number;
  tone: "ok" | "warn" | "error";
  text: string;
}

export interface EditorState {
  projects: Project[];
  activeId: string | null;
}

const EMPTY_VALIDATION: ValidationResult = {
  ok: true,
  issues: [],
  cyclicEdgeIds: [],
  invalidEdgeIds: [],
  reachableNodeIds: [],
};

function projectFromPreset(preset: MaterialPreset, name = preset.name): Project {
  const now = Date.now();
  return {
    id: newId(),
    name,
    note: preset.description,
    graph: cloneGraphDeep(preset.graph),
    previewRoughness: preset.previewRoughness,
    createdAt: now,
    updatedAt: now,
    presetId: preset.id,
  };
}

function initialState(): EditorState {
  const stored = loadState();
  if (stored && stored.projects.length > 0) {
    const activeId =
      stored.activeProjectId && stored.projects.some((p) => p.id === stored.activeProjectId)
        ? stored.activeProjectId
        : stored.projects[0].id;
    return { projects: stored.projects, activeId };
  }
  const presets = builtInPresets();
  const seeded = presets.slice(0, 2).map((preset) => projectFromPreset(preset));
  return { projects: seeded, activeId: seeded[0].id };
}

let toastSeed = 0;

export function useEditor() {
  const [state, setState] = useState<EditorState>(initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rejection, setRejection] = useState<{ text: string; at: number } | null>(null);
  const stateRef = useRef(state);
  const saveTimer = useRef<number | null>(null);

  // setState 的 updater 由 React 延后执行，副作用（toast、选中）不能依赖它，
  // 所以这里用 ref 保存最新状态，所有改动同步计算后再提交。
  const commit = useCallback((next: EditorState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const active = useMemo(
    () => state.projects.find((p) => p.id === state.activeId) ?? null,
    [state.projects, state.activeId],
  );
  const activeRef = useRef(active);
  activeRef.current = active;

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    toastSeed += 1;
    const id = toastSeed;
    setToasts((prev) => [...prev.slice(-2), { id, tone, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  // 防抖持久化，避免拖动节点时每个 pointermove 都写 localStorage；
  // 页面隐藏 / 卸载时同步落盘，防止刚复制完就刷新的场景丢数据。
  const persistNow = useCallback(() => {
    saveState({
      version: 2,
      projects: stateRef.current.projects,
      activeProjectId: stateRef.current.activeId,
    });
  }, []);

  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(persistNow, 250);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [state.projects, state.activeId, persistNow]);

  useEffect(() => {
    const flush = () => persistNow();
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", flush);
      persistNow();
    };
  }, [persistNow]);

  const validation = useMemo(
    () => (active ? validateGraph(active.graph) : EMPTY_VALIDATION),
    [active],
  );

  const mutateActive = useCallback(
    (mutator: (project: Project) => Project) => {
      const current = activeRef.current;
      if (!current) return;
      const updated = mutator(current);
      if (updated === current) return;
      const prev = stateRef.current;
      commit({
        ...prev,
        projects: prev.projects.map((p) => (p.id === current.id ? { ...updated, updatedAt: Date.now() } : p)),
      });
    },
    [commit],
  );

  const setGraph = useCallback(
    (graph: MaterialGraph) => mutateActive((project) => ({ ...project, graph })),
    [mutateActive],
  );

  const addNodeAt = useCallback(
    (kind: NodeKind, x: number, y: number) => {
      const current = activeRef.current;
      if (!current) return;
      const { graph, node } = addNode(current.graph, kind, x, y);
      mutateActive((project) => ({ ...project, graph }));
      setSelectedNodeId(node.id);
    },
    [mutateActive],
  );

  const moveNodeTo = useCallback(
    (nodeId: string, x: number, y: number) => {
      mutateActive((project) => ({ ...project, graph: moveNode(project.graph, nodeId, x, y) }));
    },
    [mutateActive],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      mutateActive((project) => ({ ...project, graph: removeNode(project.graph, nodeId) }));
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
    },
    [mutateActive],
  );

  const setParam = useCallback(
    (nodeId: string, key: string, value: ParamValue) => {
      mutateActive((project) => ({ ...project, graph: updateParam(project.graph, nodeId, key, value) }));
    },
    [mutateActive],
  );

  const connect = useCallback(
    (fromNode: string, fromPort: string, toNode: string, toPort: string): boolean => {
      const current = activeRef.current;
      if (!current) return false;
      const check = checkConnection(current.graph, { fromNode, fromPort, toNode, toPort });
      if (!check.ok) {
        const prefix = check.code === "cycle" ? "已阻止成环 · " : "";
        const text = `${prefix}${check.message}`;
        setRejection({ text, at: Date.now() });
        pushToast(text, "error");
        return false;
      }
      setRejection(null);
      mutateActive((project) => ({
        ...project,
        graph: addEdge(project.graph, { fromNode, fromPort, toNode, toPort }, check.replacesEdgeId),
      }));
      return true;
    },
    [mutateActive, pushToast],
  );

  const disconnect = useCallback(
    (edgeId: string) => {
      mutateActive((project) => ({ ...project, graph: removeEdge(project.graph, edgeId) }));
      // 断开后清掉上一次的拒绝提示，随后由全量校验重新给出结论
      setRejection(null);
    },
    [mutateActive],
  );

  const setPreviewRoughness = useCallback(
    (value: number) => mutateActive((project) => ({ ...project, previewRoughness: value })),
    [mutateActive],
  );

  const patchProject = useCallback(
    (projectId: string, patch: Partial<Project>) => {
      const prev = stateRef.current;
      if (!prev.projects.some((p) => p.id === projectId)) return;
      commit({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, ...patch, updatedAt: Date.now() } : p,
        ),
      });
    },
    [commit],
  );

  const renameProject = useCallback(
    (projectId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      patchProject(projectId, { name: trimmed });
    },
    [patchProject],
  );

  const setNote = useCallback(
    (projectId: string, note: string) => patchProject(projectId, { note }),
    [patchProject],
  );

  const selectProject = useCallback(
    (projectId: string) => {
      const prev = stateRef.current;
      if (!prev.projects.some((p) => p.id === projectId)) return;
      commit({ ...prev, activeId: projectId });
      setSelectedNodeId(null);
    },
    [commit],
  );

  const activate = useCallback(
    (project: Project) => {
      const prev = stateRef.current;
      commit({ projects: [...prev.projects, project], activeId: project.id });
      setSelectedNodeId(null);
    },
    [commit],
  );

  const createFromPreset = useCallback(
    (preset: MaterialPreset) => {
      const project = projectFromPreset(preset);
      activate(project);
      pushToast(`已新建方案「${project.name}」`);
    },
    [activate, pushToast],
  );

  const duplicateProject = useCallback(
    (projectId: string) => {
      const prev = stateRef.current;
      const source = prev.projects.find((p) => p.id === projectId);
      if (!source) return;
      const copy = cloneProject(source);
      commit({ projects: [...prev.projects, copy], activeId: copy.id });
      setSelectedNodeId(null);
      pushToast(`已复制为「${copy.name}」`);
    },
    [commit, pushToast],
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      const prev = stateRef.current;
      if (prev.projects.length <= 1) {
        pushToast("至少要保留一个方案", "warn");
        return;
      }
      const projects = prev.projects.filter((p) => p.id !== projectId);
      if (projects.length === prev.projects.length) return;
      const activeId = prev.activeId === projectId ? projects[0].id : prev.activeId;
      commit({ projects, activeId });
      setSelectedNodeId(null);
    },
    [commit, pushToast],
  );

  const importGraph = useCallback(
    (graph: MaterialGraph, name: string, note = "") => {
      const project: Project = {
        id: newId(),
        name,
        note,
        graph: cloneGraphDeep(graph),
        previewRoughness: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      activate(project);
    },
    [activate],
  );

  return {
    state,
    active,
    validation,
    toasts,
    pushToast,
    rejection,
    selectedNodeId,
    setSelectedNodeId,
    setGraph,
    addNodeAt,
    moveNodeTo,
    deleteNode,
    setParam,
    connect,
    disconnect,
    setPreviewRoughness,
    renameProject,
    setNote,
    selectProject,
    createFromPreset,
    duplicateProject,
    deleteProject,
    importGraph,
  };
}

export type EditorApi = ReturnType<typeof useEditor>;
