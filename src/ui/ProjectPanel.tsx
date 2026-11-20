import { useEffect, useState } from "react";
import type { Project } from "../state/projects";

interface ProjectPanelProps {
  projects: Project[];
  activeId: string | null;
  onSelect: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onRename: (projectId: string, name: string) => void;
  onNoteChange: (projectId: string, note: string) => void;
  onNew: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ProjectPanel(props: ProjectPanelProps) {
  const {
    projects,
    activeId,
    onSelect,
    onDuplicate,
    onDelete,
    onRename,
    onNoteChange,
    onNew,
    onExport,
    onImport,
  } = props;
  const active = projects.find((p) => p.id === activeId) ?? null;
  const [nameDraft, setNameDraft] = useState(active?.name ?? "");

  useEffect(() => {
    setNameDraft(active?.name ?? "");
  }, [active?.id, active?.name]);

  return (
    <aside className="side-panel project-panel" data-testid="project-panel">
      <header className="panel-header">
        <h2>金具方案</h2>
        <p className="panel-sub">{projects.length} 个方案 · 自动保存到本机</p>
      </header>

      <div className="project-actions">
        <button type="button" className="primary-button" onClick={onNew} data-testid="new-project">
          新建方案
        </button>
        <button type="button" className="ghost-button" onClick={onExport} data-testid="export-project">
          导出 JSON
        </button>
        <label className="ghost-button file-button">
          导入
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="project-list">
        {projects.map((project) => {
          const isActive = project.id === activeId;
          return (
            <div
              key={project.id}
              className={`project-item ${isActive ? "active" : ""}`}
              data-testid={`project-${project.id}`}
            >
              <button type="button" className="project-select" onClick={() => onSelect(project.id)}>
                <span className="project-name" data-testid="project-name">
                  {project.name}
                </span>
                <span className="project-meta">
                  {project.graph.nodes.length} 节点 · {project.graph.edges.length} 连线
                </span>
              </button>
              <div className="project-tools">
                <button
                  type="button"
                  title="复制方案"
                  aria-label="复制方案"
                  onClick={() => onDuplicate(project.id)}
                  data-testid={`duplicate-${project.id}`}
                >
                  复制
                </button>
                <button
                  type="button"
                  title="删除方案"
                  aria-label="删除方案"
                  onClick={() => onDelete(project.id)}
                  disabled={projects.length <= 1}
                  data-testid={`remove-${project.id}`}
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {active ? (
        <div className="project-detail">
          <label className="field">
            <span>方案名称</span>
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => onRename(active.id, nameDraft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  (event.target as HTMLInputElement).blur();
                }
              }}
              data-testid="project-name-input"
            />
          </label>
          <label className="field">
            <span>备注（线路 / 杆塔 / 工况）</span>
            <textarea
              rows={3}
              value={active.note}
              onChange={(event) => onNoteChange(active.id, event.target.value)}
              placeholder="例如：500kV 某线 27# 耐张线夹，沿海盐雾 + 工业粉尘"
              data-testid="project-note"
            />
          </label>
        </div>
      ) : null}
    </aside>
  );
}
