import type { ValidationResult } from "../core/validate";

interface IssuesBarProps {
  validation: ValidationResult;
  shaderError: string | null;
  notes: string[];
  compiling: boolean;
  activeKeyMatches: boolean;
}

export function IssuesBar({ validation, shaderError, notes, compiling, activeKeyMatches }: IssuesBarProps) {
  const invalidEdges = validation.invalidEdgeIds.length;
  const hasIssue = Boolean(shaderError) || !validation.ok;

  return (
    <div className={`issues-bar ${hasIssue ? "has-issue" : "ok"}`} data-testid="issues-bar">
      <span className="issues-dot" />
      {shaderError ? (
        <span className="issues-text" data-testid="issues-text">
          {shaderError}
        </span>
      ) : validation.ok ? (
        <span className="issues-text" data-testid="issues-text">
          {compiling ? "着色器编译中…" : activeKeyMatches ? "校验通过 · 预览已是当前材质" : "校验通过"}
          {notes.length > 0 ? <em className="muted">（{notes.join("；")}）</em> : null}
        </span>
      ) : (
        <span className="issues-text" data-testid="issues-text">
          {validation.issues[0]?.message}
          {validation.issues.length > 1 ? `（共 ${validation.issues.length} 处）` : ""}
        </span>
      )}
      <span className="issues-grow" />
      <span className={`badge ${invalidEdges > 0 ? "bad" : "good"}`} data-testid="invalid-edge-count">
        {invalidEdges > 0 ? `${invalidEdges} 条连线需处理` : "连线全部有效"}
      </span>
      {validation.cyclicEdgeIds.length > 0 ? (
        <span className="badge bad" data-testid="cycle-count">
          环 {validation.cyclicEdgeIds.length}
        </span>
      ) : null}
    </div>
  );
}
