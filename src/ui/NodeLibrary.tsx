import { NODE_DEFINITIONS, NODE_KINDS } from "../core/nodeDefs";
import { PORT_TYPE_COLOR, PORT_TYPE_LABEL } from "../core/types";
import type { NodeKind, PortType } from "../core/types";

const CATEGORY_LABEL: Record<string, string> = {
  source: "常量",
  pattern: "程序纹理",
  lighting: "光照响应",
  output: "输出",
};

const CATEGORY_ORDER = ["source", "pattern", "lighting", "output"] as const;

interface NodeLibraryProps {
  onAddNode: (kind: NodeKind) => void;
}

export function NodeLibrary({ onAddNode }: NodeLibraryProps) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: NODE_KINDS.filter((kind) => NODE_DEFINITIONS[kind].category === category),
  }));

  return (
    <aside className="side-panel library-panel" data-testid="node-library">
      <header className="panel-header">
        <h2>节点库</h2>
        <p className="panel-sub">拖动或点击加入画布</p>
      </header>
      <div className="library-scroll">
        {grouped.map(({ category, items }) => (
          <section key={category} className="library-group">
            <h3>{CATEGORY_LABEL[category]}</h3>
            {items.map((kind) => {
              const def = NODE_DEFINITIONS[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  className={`library-item category-${category}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-hme-node", kind);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onAddNode(kind)}
                  data-testid={`library-${kind}`}
                  title={def.summary}
                >
                  <span className="library-name">{def.label}</span>
                  <span className="library-desc">{def.summary}</span>
                  <span className="library-ports">
                    {def.inputs.length > 0 ? (
                      <span className="port-tags">
                        入
                        {def.inputs.map((p) => (
                          <i key={p.id} style={{ background: PORT_TYPE_COLOR[p.type] }} title={PORT_TYPE_LABEL[p.type]} />
                        ))}
                      </span>
                    ) : null}
                    {def.outputs.length > 0 ? (
                      <span className="port-tags">
                        出
                        {def.outputs.map((p) => (
                          <i key={p.id} style={{ background: PORT_TYPE_COLOR[p.type] }} title={PORT_TYPE_LABEL[p.type]} />
                        ))}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
        <div className="legend">
          <h3>端口类型</h3>
          {(["scalar", "vector", "color"] as PortType[]).map((type) => (
            <span key={type} className="legend-item">
              <i style={{ background: PORT_TYPE_COLOR[type] }} />
              {PORT_TYPE_LABEL[type]}
            </span>
          ))}
          <p className="legend-note">仅同类型端口可以相连；会成环的连接会被立即拦截。</p>
        </div>
      </div>
    </aside>
  );
}
