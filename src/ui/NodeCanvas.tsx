import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NODE_DEFINITIONS } from "../core/nodeDefs";
import type { GraphEdge, GraphNode, MaterialGraph, PortDef, PortType } from "../core/types";
import { PORT_TYPE_COLOR } from "../core/types";

const NODE_WIDTH = 214;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 24;
const PAD_BOTTOM = 12;
const CANVAS_W = 4000;
const CANVAS_H = 2400;

export interface PendingLink {
  fromNode: string;
  fromPort: string;
  type: PortType;
  startX: number;
  startY: number;
  pointerX: number;
  pointerY: number;
}

interface NodeCanvasProps {
  graph: MaterialGraph;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onConnect: (fromNode: string, fromPort: string, toNode: string, toPort: string) => boolean;
  onDisconnect: (edgeId: string) => void;
  onDropNode: (kind: GraphNode["kind"], x: number, y: number) => void;
  invalidEdgeIds: string[];
  cyclicEdgeIds: string[];
  reachableNodeIds: string[];
  /** 是否允许删除（至少要保留输出节点）。 */
  canDeleteNode: (nodeId: string) => boolean;
  /** 最近一次被拒绝的连接尝试，用于在画布上常驻提示。 */
  rejection: { text: string; at: number } | null;
}

type DragState =
  | { kind: "node"; nodeId: string; offsetX: number; offsetY: number; moved: boolean }
  | { kind: "link"; link: PendingLink };

function nodeHeight(node: GraphNode): number {
  const def = NODE_DEFINITIONS[node.kind];
  const rows = Math.max(def.inputs.length, def.outputs.length);
  return HEADER_HEIGHT + rows * ROW_HEIGHT + PAD_BOTTOM;
}

export function portPosition(
  node: GraphNode,
  direction: "input" | "output",
  portId: string,
): { x: number; y: number } {
  const def = NODE_DEFINITIONS[node.kind];
  const list = direction === "input" ? def.inputs : def.outputs;
  const index = Math.max(0, list.findIndex((p) => p.id === portId));
  return {
    x: direction === "input" ? node.x : node.x + NODE_WIDTH,
    y: node.y + HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2,
  };
}

export function edgePath(ax: number, ay: number, bx: number, by: number): string {
  const dx = Math.max(46, Math.abs(bx - ax) * 0.45);
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
}

const CATEGORY_COLOR: Record<string, string> = {
  source: "#7c9cbf",
  pattern: "#b98ac4",
  lighting: "#6fb7a1",
  output: "#e0a458",
};

export function NodeCanvas(props: NodeCanvasProps) {
  const {
    graph,
    selectedNodeId,
    onSelectNode,
    onMoveNode,
    onDeleteNode,
    onConnect,
    onDisconnect,
    onDropNode,
    invalidEdgeIds,
    cyclicEdgeIds,
    reachableNodeIds,
    canDeleteNode,
    rejection,
  } = props;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [pending, setPending] = useState<PendingLink | null>(null);
  const [pan, setPan] = useState({ x: 24, y: 20 });
  const [zoom, setZoom] = useState(0.9);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ nodeId: string; portId: string } | null>(null);
  const panRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const panStateRef = useRef(pan);
  panStateRef.current = pan;

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const invalid = useMemo(() => new Set(invalidEdgeIds), [invalidEdgeIds]);
  const cyclic = useMemo(() => new Set(cyclicEdgeIds), [cyclicEdgeIds]);
  const reachable = useMemo(() => new Set(reachableNodeIds), [reachableNodeIds]);

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const current = panStateRef.current;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - current.x) / zoomRef.current,
      y: (clientY - rect.top - current.y) / zoomRef.current,
    };
  }, []);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const startNodeDrag = (event: React.PointerEvent, node: GraphNode) => {
    if (event.button !== 0) return;
    const point = toCanvas(event.clientX, event.clientY);
    dragRef.current = {
      kind: "node",
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
      moved: false,
    };
    onSelectNode(node.id);
    event.stopPropagation();
  };

  const startLinkDrag = (event: React.PointerEvent, node: GraphNode, port: PortDef) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    const anchor = portPosition(node, "output", port.id);
    const point = toCanvas(event.clientX, event.clientY);
    const link: PendingLink = {
      fromNode: node.id,
      fromPort: port.id,
      type: port.type,
      startX: anchor.x,
      startY: anchor.y,
      pointerX: point.x,
      pointerY: point.y,
    };
    dragRef.current = { kind: "link", link };
    setPending(link);
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.kind === "node") {
        const point = toCanvas(event.clientX, event.clientY);
        drag.moved = true;
        onMoveNode(drag.nodeId, point.x - drag.offsetX, point.y - drag.offsetY);
        return;
      }
      const point = toCanvas(event.clientX, event.clientY);
      const link = { ...drag.link, pointerX: point.x, pointerY: point.y };
      dragRef.current = { kind: "link", link };
      setPending(link);
      const target = (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.closest(
        "[data-input-port]",
      ) as HTMLElement | null;
      if (target && target.dataset.portType === link.type) {
        setDropTarget({ nodeId: target.dataset.nodeId ?? "", portId: target.dataset.portId ?? "" });
      } else {
        setDropTarget(null);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      setDropTarget(null);
      if (drag.kind !== "link") return;
      setPending(null);
      const target = (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.closest(
        "[data-input-port]",
      ) as HTMLElement | null;
      if (!target) return;
      const toNode = target.dataset.nodeId ?? "";
      const toPort = target.dataset.portId ?? "";
      if (!toNode || !toPort) return;
      onConnect(drag.link.fromNode, drag.link.fromPort, toNode, toPort);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onConnect, onMoveNode, toCanvas]);

  // 平移：在空白处按下指针
  const onViewportPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if (event.target !== event.currentTarget && (event.target as HTMLElement).dataset.pan !== "true") return;
    panRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    onSelectNode(null);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!panRef.current.active) return;
      setPan({
        x: panRef.current.originX + (event.clientX - panRef.current.startX),
        y: panRef.current.originY + (event.clientY - panRef.current.startY),
      });
    };
    const onUp = () => {
      panRef.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // 缩放
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const factor = Math.exp(-event.deltaY * 0.0015);
      setZoom((prevZoom) => {
        const nextZoom = Math.min(1.8, Math.max(0.3, prevZoom * factor));
        setPan((prevPan) => ({
          x: mouseX - ((mouseX - prevPan.x) * nextZoom) / prevZoom,
          y: mouseY - ((mouseY - prevPan.y) * nextZoom) / prevZoom,
        }));
        return nextZoom;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Delete / Backspace 删除选中节点
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedNodeId) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNodeId, onDeleteNode]);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData("application/x-hme-node") as GraphNode["kind"];
    if (!kind || !(kind in NODE_DEFINITIONS)) return;
    const point = toCanvas(event.clientX, event.clientY);
    onDropNode(kind, point.x - NODE_WIDTH / 2, point.y - 20);
  };

  const zoomToFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el || graph.nodes.length === 0) {
      setPan({ x: 24, y: 20 });
      setZoom(1);
      return;
    }
    const rect = el.getBoundingClientRect();
    const minX = Math.min(...graph.nodes.map((n) => n.x));
    const minY = Math.min(...graph.nodes.map((n) => n.y));
    const maxX = Math.max(...graph.nodes.map((n) => n.x + NODE_WIDTH));
    const maxY = Math.max(...graph.nodes.map((n) => n.y + nodeHeight(n)));
    const padding = 56;
    const scale = Math.min(
      1.15,
      Math.max(
        0.3,
        Math.min(
          (rect.width - padding * 2) / Math.max(1, maxX - minX),
          (rect.height - padding * 2) / Math.max(1, maxY - minY),
        ),
      ),
    );
    setZoom(scale);
    setPan({
      x: (rect.width - (maxX - minX) * scale) / 2 - minX * scale,
      y: (rect.height - (maxY - minY) * scale) / 2 - minY * scale,
    });
  }, [graph.nodes]);

  // 切换方案或首次渲染时自动适配画布，避免节点落在可视区外
  const graphSignature = graph.nodes.map((n) => n.id).join(",");
  const fittedSignatureRef = useRef("");
  useEffect(() => {
    if (!graphSignature || fittedSignatureRef.current === graphSignature) return;
    fittedSignatureRef.current = graphSignature;
    const handle = window.setTimeout(() => zoomToFit(), 0);
    return () => window.clearTimeout(handle);
  }, [graphSignature, zoomToFit]);

  const canAccept = (port: PortDef) => (pending ? port.type === pending.type : true);

  return (
    <div className="canvas-shell">
      <div className="canvas-toolbar">
        <button type="button" className="ghost-button" onClick={zoomToFit} data-testid="canvas-fit">
          适应画布
        </button>
        <span className="canvas-zoom">{Math.round(zoom * 100)}%</span>
        <span className="canvas-hint">
          从左侧拖入节点 · 拖输出端口到同类型输入端口 · 点连线可断开 · Delete 删除节点
        </span>
        <span className="canvas-count">
          {graph.nodes.length} 节点 / {graph.edges.length} 连线
        </span>
      </div>
      <div
        ref={viewportRef}
        className={`canvas-viewport ${panRef.current.active ? "panning" : ""}`}
        onPointerDown={onViewportPointerDown}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        data-testid="canvas-viewport"
      >
        <div
          className="canvas-world"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          <svg className="canvas-edges" width={CANVAS_W} height={CANVAS_H} data-testid="canvas-edges">
            {graph.edges.map((edge) => {
              const from = nodeById.get(edge.fromNode);
              const to = nodeById.get(edge.toNode);
              if (!from || !to) return null;
              const a = portPosition(from, "output", edge.fromPort);
              const b = portPosition(to, "input", edge.toPort);
              const isInvalid = invalid.has(edge.id);
              const isCyclic = cyclic.has(edge.id);
              const d = edgePath(a.x, a.y, b.x, b.y);
              return (
                <g key={edge.id} className="edge-group">
                  <path
                    d={d}
                    className="edge-hit"
                    onPointerEnter={() => setHoverEdge(edge.id)}
                    onPointerLeave={() => setHoverEdge((prev) => (prev === edge.id ? null : prev))}
                    onClick={() => onDisconnect(edge.id)}
                    data-testid={`edge-${edge.id}`}
                    data-edge-id={edge.id}
                  />
                  <path
                    d={d}
                    className={`edge-line ${isInvalid ? "invalid" : ""} ${hoverEdge === edge.id ? "hover" : ""}`}
                    stroke={isInvalid ? "#ef5350" : edgeColor(edge, graph)}
                    data-testid={`edge-line-${edge.id}`}
                  />
                  {isCyclic ? (
                    <g transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2})`} className="edge-flag">
                      <circle r={10} />
                      <text y={3.5} textAnchor="middle">
                        环
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
            {pending ? (
              <path
                d={edgePath(pending.startX, pending.startY, pending.pointerX, pending.pointerY)}
                className="edge-pending"
                stroke={PORT_TYPE_COLOR[pending.type]}
              />
            ) : null}
          </svg>

          {graph.nodes.map((node) => {
            const def = NODE_DEFINITIONS[node.kind];
            const height = nodeHeight(node);
            const isSelected = node.id === selectedNodeId;
            const isOrphan = !reachable.has(node.id) && node.kind !== "output";
            return (
              <div
                key={node.id}
                className={`node-card ${isSelected ? "selected" : ""} ${isOrphan ? "orphan" : ""}`}
                style={{ left: node.x, top: node.y, width: NODE_WIDTH, height }}
                data-testid={`node-${node.id}`}
                data-node-kind={node.kind}
                onPointerDown={(event) => startNodeDrag(event, node)}
              >
                <div className="node-header" style={{ borderLeftColor: CATEGORY_COLOR[def.category] }}>
                  <span className="node-title">{def.label}</span>
                  <span className="node-id">{node.id}</span>
                  {canDeleteNode(node.id) ? (
                    <button
                      type="button"
                      className="node-delete"
                      title="删除节点"
                      aria-label="删除节点"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                <div className="node-body">
                  {Array.from({ length: Math.max(def.inputs.length, def.outputs.length) }).map((_, row) => {
                    const input: PortDef | undefined = def.inputs[row];
                    const output: PortDef | undefined = def.outputs[row];
                    const isTarget = dropTarget?.nodeId === node.id && dropTarget.portId === input?.id;
                    const compatible = input ? canAccept(input) : false;
                    return (
                      <div className="node-row" key={row} style={{ height: ROW_HEIGHT }}>
                        <span className="port-slot left">
                          {input ? (
                            <span
                              className={`port-dot ${pending ? (compatible ? "compatible" : "incompatible") : ""} ${
                                isTarget ? "drop-target" : ""
                              }`}
                              style={{ background: PORT_TYPE_COLOR[input.type] }}
                              data-input-port="true"
                              data-node-id={node.id}
                              data-port-id={input.id}
                              data-port-type={input.type}
                              title={`${input.label}（${typeLabel(input.type)}）`}
                            />
                          ) : null}
                        </span>
                        <span className="port-label left">{input?.label ?? ""}</span>
                        <span className="port-spacer" />
                        <span className="port-label right">{output?.label ?? ""}</span>
                        <span className="port-slot right">
                          {output ? (
                            <span
                              className="port-dot output"
                              style={{ background: PORT_TYPE_COLOR[output.type] }}
                              onPointerDown={(event) => startLinkDrag(event, node, output)}
                              data-output-port="true"
                              data-node-id={node.id}
                              data-port-id={output.id}
                              data-port-type={output.type}
                              title={`${output.label}（${typeLabel(output.type)}）`}
                            />
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {pending ? (
        <div className="canvas-link-tip" data-testid="link-tip">
          正在连接：{typeLabel(pending.type)} · 只能接到同类型输入端口
        </div>
      ) : rejection ? (
        <div className="canvas-link-tip rejected" data-testid="link-rejected">
          {rejection.text}
        </div>
      ) : null}
    </div>
  );
}

function typeLabel(type: PortType): string {
  return type === "scalar" ? "标量" : type === "vector" ? "向量" : "颜色";
}

function edgeColor(edge: GraphEdge, graph: MaterialGraph): string {
  const target = graph.nodes.find((n) => n.id === edge.toNode);
  if (!target) return "#6b7c8f";
  const def = NODE_DEFINITIONS[target.kind];
  const port = def.inputs.find((p) => p.id === edge.toPort);
  return port ? PORT_TYPE_COLOR[port.type] : "#6b7c8f";
}
