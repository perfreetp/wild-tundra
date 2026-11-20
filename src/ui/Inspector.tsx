import { NODE_DEFINITIONS } from "../core/nodeDefs";
import type { GraphEdge, GraphNode, MaterialGraph, ParamDef, ParamValue } from "../core/types";
import { PORT_TYPE_COLOR, PORT_TYPE_LABEL } from "../core/types";

interface InspectorProps {
  node: GraphNode | null;
  graph: MaterialGraph;
  onParamChange: (nodeId: string, key: string, value: ParamValue) => void;
  onDeleteNode: (nodeId: string) => void;
  onDisconnect: (edgeId: string) => void;
  canDelete: boolean;
  /** 已在预览中生效的节点（其代码已进入着色器）。 */
  activeNodeIds?: string[];
}

export function Inspector({
  node,
  graph,
  onParamChange,
  onDeleteNode,
  onDisconnect,
  canDelete,
  activeNodeIds = [],
}: InspectorProps) {
  if (!node) {
    return (
      <aside className="side-panel inspector-panel" data-testid="inspector">
        <header className="panel-header">
          <h2>节点参数</h2>
        </header>
        <div className="inspector-empty">
          <p>选中画布上的节点以调整参数。</p>
          <p className="muted">参数一改，右侧着色器源码会立即重新生成。</p>
        </div>
      </aside>
    );
  }

  const def = NODE_DEFINITIONS[node.kind];
  const incoming = new Map<string, GraphEdge>();
  for (const edge of graph.edges) if (edge.toNode === node.id) incoming.set(edge.toPort, edge);
  const active = activeNodeIds.includes(node.id);

  return (
    <aside className="side-panel inspector-panel" data-testid="inspector">
      <header className="panel-header">
        <h2>{def.label}</h2>
        <p className="panel-sub">
          {node.id} · {active ? "已参与着色器" : "未连接到输出"}
        </p>
      </header>
      <div className="inspector-scroll" data-testid="inspector-scroll">
        <p className="node-summary">{def.summary}</p>

        {def.params.length > 0 ? (
          <section className="param-group">
            <h3>参数</h3>
            {def.params.map((param) => (
              <ParamField
                key={param.key}
                param={param}
                value={node.params[param.key] ?? param.default}
                onChange={(value) => onParamChange(node.id, param.key, value)}
              />
            ))}
          </section>
        ) : null}

        {def.inputs.length > 0 ? (
          <section className="port-group">
            <h3>输入端口</h3>
            {def.inputs.map((port) => {
              const edge = incoming.get(port.id);
              const source = edge ? graph.nodes.find((n) => n.id === edge.fromNode) : null;
              return (
                <div key={port.id} className="port-row">
                  <span className="port-badge" style={{ background: PORT_TYPE_COLOR[port.type] }} />
                  <span className="port-name">
                    {port.label}
                    <em>{PORT_TYPE_LABEL[port.type]}</em>
                  </span>
                  {edge && source ? (
                    <button
                      type="button"
                      className="link-chip"
                      onClick={() => onDisconnect(edge.id)}
                      title="点击断开这条连线"
                      data-testid={`disconnect-${edge.id}`}
                    >
                      ← {NODE_DEFINITIONS[source.kind].label} · 断开
                    </button>
                  ) : (
                    <span className="muted small">未连接</span>
                  )}
                </div>
              );
            })}
          </section>
        ) : null}

        {def.outputs.length > 0 ? (
          <section className="port-group">
            <h3>输出端口</h3>
            {def.outputs.map((port) => {
              const outgoing = graph.edges.filter((e) => e.fromNode === node.id && e.fromPort === port.id);
              return (
                <div key={port.id} className="port-row">
                  <span className="port-badge" style={{ background: PORT_TYPE_COLOR[port.type] }} />
                  <span className="port-name">
                    {port.label}
                    <em>{PORT_TYPE_LABEL[port.type]}</em>
                  </span>
                  <span className="muted small">{outgoing.length ? `连接 ${outgoing.length} 处` : "未使用"}</span>
                </div>
              );
            })}
          </section>
        ) : null}

        {canDelete ? (
          <button
            type="button"
            className="danger-button"
            onClick={() => onDeleteNode(node.id)}
            data-testid="delete-node"
          >
            删除此节点
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function ParamField({
  param,
  value,
  onChange,
}: {
  param: ParamDef;
  value: ParamValue;
  onChange: (value: ParamValue) => void;
}) {
  if (param.kind === "number") {
    const numeric = Number(value);
    return (
      <label className="param-field">
        <span className="param-label">
          {param.label}
          <em>{formatNumber(numeric)}</em>
        </span>
        <input
          type="range"
          min={param.min ?? 0}
          max={param.max ?? 1}
          step={param.step ?? 0.01}
          value={numeric}
          onChange={(event) => onChange(Number(event.target.value))}
          data-testid={`param-${param.key}`}
        />
        {param.hint ? <span className="param-hint">{param.hint}</span> : null}
      </label>
    );
  }

  if (param.kind === "color") {
    return (
      <label className="param-field">
        <span className="param-label">{param.label}</span>
        <span className="color-row">
          <input
            type="color"
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            data-testid={`param-${param.key}`}
          />
          <code>{String(value)}</code>
        </span>
      </label>
    );
  }

  if (param.kind === "vector3") {
    const vector = Array.isArray(value) ? value : [0, 0, 0];
    return (
      <div className="param-field">
        <span className="param-label">{param.label}</span>
        <div className="vector-row">
          {["X", "Y", "Z"].map((axis, index) => (
            <label key={axis}>
              <span>{axis}</span>
              <input
                type="number"
                step={0.01}
                value={Number(vector[index] ?? 0)}
                onChange={(event) => {
                  const next = [0, 1, 2].map((i) => Number(vector[i] ?? 0));
                  next[index] = Number(event.target.value);
                  onChange(next);
                }}
                data-testid={`param-${param.key}-${axis.toLowerCase()}`}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (param.kind === "select") {
    return (
      <label className="param-field">
        <span className="param-label">{param.label}</span>
        <select
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          data-testid={`param-${param.key}`}
        >
          {(param.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="param-field switch-field">
      <span className="param-label">{param.label}</span>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
        data-testid={`param-${param.key}`}
      />
    </label>
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
