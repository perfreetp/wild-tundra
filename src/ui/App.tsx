import { useCallback, useEffect, useRef, useState } from "react";
import { blankPreset, builtInPresets, type MaterialPreset } from "../core/presets";
import type { MaterialGraph, NodeKind } from "../core/types";
import { NodeCanvas } from "./NodeCanvas";
import { NodeLibrary } from "./NodeLibrary";
import { Inspector } from "./Inspector";
import { PreviewPanel } from "./PreviewPanel";
import { ShaderPanel } from "./ShaderPanel";
import { IssuesBar } from "./IssuesBar";
import { ProjectPanel } from "./ProjectPanel";
import { PresetBar } from "./PresetBar";
import { findFreePosition } from "../core/graph";
import { useEditor } from "../state/useEditor";
import { usePreview } from "../preview/usePreview";
import type { GeneratedShader } from "../core/generate";

const CUSTOM_PRESET_KEY = "hme.customPresets.v1";

type RightTab = "inspector" | "code" | "projects";

function loadCustomPresets(): MaterialPreset[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MaterialPreset[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((preset) => preset && preset.id && preset.graph && Array.isArray(preset.graph.nodes));
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: MaterialPreset[]): void {
  try {
    window.localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(presets));
  } catch {
    // 配额或隐私模式下忽略
  }
}

export function App() {
  const editor = useEditor();
  const { state, active, validation, toasts, pushToast, selectedNodeId, setSelectedNodeId } = editor;
  const graph: MaterialGraph = active?.graph ?? { nodes: [], edges: [] };
  const previewHostRef = useRef<HTMLDivElement | null>(null);
  const preview = usePreview(graph, previewHostRef);

  const [light, setLight] = useState({ azimuth: -Math.PI * 0.4, elevation: Math.PI * 0.3 });
  const [roughness, setRoughness] = useState(active?.previewRoughness ?? 1);
  const [exposure, setExposure] = useState(1);
  const [customPresets, setCustomPresets] = useState<MaterialPreset[]>(() =>
    typeof window === "undefined" ? [] : loadCustomPresets(),
  );
  const [showLibrary, setShowLibrary] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("inspector");

  useEffect(() => {
    if (!active) return;
    setRoughness(active.previewRoughness);
    preview.setRoughnessScale(active.previewRoughness);
    // 只跟随方案切换，不跟随每次参数微调
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  useEffect(() => {
    preview.setLight(light.azimuth, light.elevation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [light.azimuth, light.elevation]);

  useEffect(() => {
    preview.setRoughnessScale(roughness);
  }, [preview, roughness]);

  useEffect(() => {
    preview.setExposure(exposure);
  }, [preview, exposure]);

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const generated = preview.status.generated;
  const shader = generated.ok ? (generated as GeneratedShader) : null;

  // 拒绝提示在 6 秒后自动消失，避免一直占着画布
  const [rejection, setRejection] = useState<{ text: string; at: number } | null>(null);
  useEffect(() => {
    if (!editor.rejection) {
      setRejection(null);
      return;
    }
    setRejection(editor.rejection);
    const handle = window.setTimeout(() => setRejection(null), 6000);
    return () => window.clearTimeout(handle);
  }, [editor.rejection]);

  const addNode = useCallback(
    (kind: NodeKind) => {
      const spot = findFreePosition(graph, kind);
      editor.addNodeAt(kind, spot.x, spot.y);
      setRightTab("inspector");
    },
    [editor, graph],
  );

  const canDelete = useCallback(
    (nodeId: string) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      return Boolean(node) && node!.kind !== "output";
    },
    [graph.nodes],
  );

  const applyPreset = (preset: MaterialPreset) => {
    editor.createFromPreset(preset);
    setRoughness(preset.previewRoughness);
    preview.setRoughnessScale(preset.previewRoughness);
  };

  const savePreset = (name: string) => {
    if (!active) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const preset: MaterialPreset = {
      id: `custom-${Date.now().toString(36)}`,
      name: trimmed,
      description: active.note || "用户保存的预设",
      graph: cloneGraphForPreset(active.graph),
      previewRoughness: active.previewRoughness,
    };
    const next = [...customPresets, preset];
    setCustomPresets(next);
    saveCustomPresets(next);
    pushToast(`已保存预设「${trimmed}」`);
  };

  const presets = [...builtInPresets(), blankPreset(), ...customPresets];

  const exportProject = () => {
    if (!active) return;
    const payload = { kind: "hme-project", version: 2, project: active };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.name.replace(/[\\/:*?"<>|]/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProject = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        kind?: string;
        graph?: MaterialGraph;
        project?: { graph: MaterialGraph; name: string; note?: string };
      };
      const graphIn = parsed.project?.graph ?? parsed.graph;
      if (!graphIn || !Array.isArray(graphIn.nodes)) {
        pushToast("文件格式不对：缺少节点图", "error");
        return;
      }
      const name = parsed.project?.name ?? file.name.replace(/\.json$/i, "");
      editor.importGraph(graphIn, `${name}（导入）`, parsed.project?.note ?? "");
      pushToast("已导入方案");
    } catch {
      pushToast("无法解析该 JSON 文件", "error");
    }
  };

  const sampleText = preview.sample
    ? `球体 RGB ${fmt(preview.sample.sphere)} · 平面 RGB ${fmt(preview.sample.plane)}`
    : "";

  const activeKeyMatches = Boolean(shader && preview.status.activeKey === shader.key);
  const statusLine = !preview.ready
    ? "等待 WebGL"
    : generated.ok
      ? preview.status.compiling
        ? "正在编译新材质"
        : `材质已就绪 · 累计编译 ${preview.status.stats.totalCompiles} 次`
      : `生成失败：${generated.reason}`;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">金具</span>
          <div>
            <h1>输电金具表面防腐材质编辑器</h1>
            <p>热镀锌 · 锌层破损 · 污秽积灰 · 锈蚀 —— 节点式材质草稿与双视口预览</p>
          </div>
        </div>
        <div className="header-stats">
          <Stat label="生成" value={`${preview.status.generateMs.toFixed(1)} ms`} />
          <Stat
            label="上屏"
            value={preview.status.settledMs ? `${preview.status.settledMs.toFixed(0)} ms` : "—"}
            title="从图变化到新材质真正渲染出来的总耗时"
          />
          <Stat label="总编译" value={String(preview.status.stats.totalCompiles)} dataId="compile-count" />
          <Stat
            label="队列合并"
            value={String(preview.status.stats.coalesced)}
            title="连续拖动参数时被合并掉的中间源码数量"
          />
        </div>
      </header>

      <div className="toolbar-row">
        <PresetBar presets={presets} onApply={applyPreset} onSaveAsPreset={savePreset} />
      </div>

      <main className="workspace">
        {showLibrary ? <NodeLibrary onAddNode={addNode} /> : null}
        <section className="center-column">
          <div className="canvas-header">
            <button
              type="button"
              className="ghost-button small"
              onClick={() => setShowLibrary((prev) => !prev)}
              data-testid="toggle-library"
            >
              {showLibrary ? "隐藏节点库" : "显示节点库"}
            </button>
            <span className="canvas-title" data-testid="active-project-name">
              {active?.name ?? "未选择方案"}
            </span>
            <button
              type="button"
              className="ghost-button small"
              onClick={() => preview.measure()}
              data-testid="sample-viewports"
            >
              采样双视口
            </button>
          </div>
          <NodeCanvas
            graph={graph}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) setRightTab("inspector");
            }}
            onMoveNode={editor.moveNodeTo}
            onDeleteNode={editor.deleteNode}
            onConnect={editor.connect}
            onDisconnect={editor.disconnect}
            onDropNode={editor.addNodeAt}
            invalidEdgeIds={validation.invalidEdgeIds}
            cyclicEdgeIds={validation.cyclicEdgeIds}
            reachableNodeIds={validation.reachableNodeIds}
            canDeleteNode={canDelete}
            rejection={rejection}
          />
          <PreviewPanel
            hostRef={previewHostRef}
            light={light}
            onLightChange={setLight}
            roughness={roughness}
            onRoughnessChange={(value) => {
              setRoughness(value);
              editor.setPreviewRoughness(value);
            }}
            exposure={exposure}
            onExposureChange={setExposure}
            ready={preview.ready}
            statusLine={statusLine}
            compileMs={preview.status.stats.lastCompileMs + preview.status.generateMs}
            compiling={preview.status.compiling}
            sampleText={sampleText}
          />
          <IssuesBar
            validation={validation}
            shaderError={generated.ok ? null : generated.reason}
            notes={shader?.notes ?? []}
            compiling={preview.status.compiling}
            activeKeyMatches={activeKeyMatches}
          />
        </section>

        <div className="right-column">
          <div className="right-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={rightTab === "inspector" ? "active" : ""}
              aria-selected={rightTab === "inspector"}
              onClick={() => setRightTab("inspector")}
              data-testid="tab-inspector"
            >
              节点参数
            </button>
            <button
              type="button"
              role="tab"
              className={rightTab === "code" ? "active" : ""}
              aria-selected={rightTab === "code"}
              onClick={() => setRightTab("code")}
              data-testid="tab-code"
            >
              着色器代码
            </button>
            <button
              type="button"
              role="tab"
              className={rightTab === "projects" ? "active" : ""}
              aria-selected={rightTab === "projects"}
              onClick={() => setRightTab("projects")}
              data-testid="tab-projects"
            >
              方案
            </button>
          </div>
          <div className="right-body">
            {rightTab === "inspector" ? (
              <Inspector
                node={selectedNode}
                graph={graph}
                onParamChange={editor.setParam}
                onDeleteNode={editor.deleteNode}
                onDisconnect={editor.disconnect}
                canDelete={selectedNode ? selectedNode.kind !== "output" : false}
                activeNodeIds={shader?.reachableNodeIds ?? []}
              />
            ) : null}
            {rightTab === "code" ? (
              <ShaderPanel
                shader={shader}
                generateMs={preview.status.generateMs}
                activeKey={preview.status.activeKey}
                selectedNodeId={selectedNodeId}
              />
            ) : null}
            {rightTab === "projects" ? (
              <ProjectPanel
                projects={state.projects}
                activeId={state.activeId}
                onSelect={editor.selectProject}
                onDuplicate={editor.duplicateProject}
                onDelete={(id) => {
                  if (state.projects.length <= 1) {
                    pushToast("至少要保留一个方案", "warn");
                    return;
                  }
                  editor.deleteProject(id);
                }}
                onRename={editor.renameProject}
                onNoteChange={editor.setNote}
                onNew={() => applyPreset(blankPreset())}
                onExport={exportProject}
                onImport={importProject}
              />
            ) : null}
          </div>
        </div>
      </main>

      <div className="toast-stack" data-testid="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`} data-testid="toast">
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  title,
  dataId,
}: {
  label: string;
  value: string;
  title?: string;
  dataId?: string;
}) {
  return (
    <span className="header-stat" title={title} data-testid={dataId}>
      <em>{label}</em>
      <b>{value}</b>
    </span>
  );
}

function fmt(sample: { r: number; g: number; b: number }): string {
  return `${Math.round(sample.r)},${Math.round(sample.g)},${Math.round(sample.b)}`;
}

function cloneGraphForPreset(graph: MaterialGraph): MaterialGraph {
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
