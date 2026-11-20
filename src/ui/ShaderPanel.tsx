import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedShader } from "../core/generate";

interface ShaderPanelProps {
  shader: GeneratedShader | null;
  generateMs: number;
  activeKey: string;
  selectedNodeId: string | null;
  /** 由外层决定当前是否显示（右侧标签页）。 */
}

type Tab = "fragment" | "vertex";

export function ShaderPanel({ shader, generateMs, activeKey, selectedNodeId }: ShaderPanelProps) {
  const [tab, setTab] = useState<Tab>("fragment");
  const [highlightNode, setHighlightNode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const source = shader ? (tab === "fragment" ? shader.fragmentSource : shader.vertexSource) : "";
  const lines = useMemo(() => (source ? source.split("\n") : []), [source]);
  const range = shader && selectedNodeId ? shader.nodeLineRanges[selectedNodeId] : undefined;

  // 选中节点后自动滚到对应代码
  useEffect(() => {
    if (!range || !highlightNode) return;
    const el = scrollRef.current?.querySelector(`[data-line="${range.start}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [range, highlightNode]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const stats = useMemo(() => {
    if (!shader) return null;
    return {
      lines: shader.fragmentSource.split("\n").length,
      nodes: shader.reachableNodeIds.length,
      key: shader.key,
    };
  }, [shader]);

  const body = (
    <div className={`code-panel open ${expanded ? "expanded" : ""}`} data-testid="code-panel">
      <div className="code-meta-row">
        {stats ? (
          <>
            <span data-testid="code-lines">{stats.lines} 行</span>
            <span>{stats.nodes} 节点</span>
            <span>生成 {generateMs.toFixed(1)} ms</span>
            <span
              className={activeKey === shader?.key ? "active-key" : "stale-key"}
              data-testid="code-key-state"
            >
              {activeKey === shader?.key ? "与预览一致" : "等待编译"}
            </span>
          </>
        ) : (
          <span className="muted">暂无可用代码</span>
        )}
      </div>
      <div className="code-tabs">
        <button
          type="button"
          className={tab === "fragment" ? "active" : ""}
          onClick={() => setTab("fragment")}
          data-testid="code-toggle"
        >
          片元 GLSL
        </button>
        <button
          type="button"
          className={tab === "vertex" ? "active" : ""}
          onClick={() => setTab("vertex")}
          data-testid="tab-vertex"
        >
          顶点 GLSL
        </button>
        <span className="code-grow" />
        <button
          type="button"
          className="ghost-button small"
          onClick={() => setExpanded((prev) => !prev)}
          data-testid="code-expand"
          title={expanded ? "收起" : "全宽查看"}
        >
          {expanded ? "收起" : "全宽"}
        </button>
        <button type="button" className="ghost-button small" onClick={copy} data-testid="code-copy">
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <div className="code-flags">
        <label className="code-check">
          <input
            type="checkbox"
            checked={highlightNode}
            onChange={(event) => setHighlightNode(event.target.checked)}
            data-testid="highlight-toggle"
          />
          高亮选中节点
        </label>
        {range && highlightNode ? (
          <span className="muted small">
            第 {range.start}–{range.end} 行
          </span>
        ) : null}
      </div>
      <div className="code-scroll" ref={scrollRef} data-testid="code-scroll">
        {lines.length === 0 ? (
          <p className="code-empty">当前节点图还不能生成着色器。</p>
        ) : (
          <ol className="code-lines">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const inRange =
                tab === "fragment" && highlightNode && range
                  ? lineNumber >= range.start && lineNumber <= range.end
                  : false;
              return (
                <li key={lineNumber} className={inRange ? "highlight" : ""} data-line={lineNumber}>
                  <span className="line-text">{line || " "}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );

  if (!expanded) return body;
  return (
    <>
      <div className="code-backdrop" onClick={() => setExpanded(false)} />
      <div className="code-expanded-wrap">{body}</div>
    </>
  );
}
