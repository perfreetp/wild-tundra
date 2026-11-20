import { useState } from 'react';
import { useStore, isDescendant } from '../state/store.js';
import { PRIMITIVE_TYPES, BOOL_OPS } from '../kernel/primitives.js';

const TYPE_ICON = { ball: '🔵', tube: '🟢', block: '🟧' };

export default function HistoryTree() {
  const tree = useStore((s) => s.tree);
  const selectedIds = useStore((s) => s.selectedIds);
  const setSelected = useStore((s) => s.setSelected);
  const reorderNode = useStore((s) => s.reorderNode);
  const recomputeAll = useStore((s) => s.recomputeAll);
  const deleteNode = useStore((s) => s.deleteNode);
  const [dragId, setDragId] = useState(null);
  const [dropHint, setDropHint] = useState(null); // { targetId, position }

  const onDragStart = (id) => (e) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (targetId) => (e) => {
    if (!dragId) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = (e.clientY - rect.top) / rect.height;
    let position;
    if (offset < 0.28) position = 'before';
    else if (offset > 0.72) position = 'after';
    else position = 'inside';
    setDropHint({ targetId, position });
  };
  const onDrop = (targetId) => (e) => {
    e.preventDefault();
    const hint = dropHint ?? { targetId, position: 'inside' };
    reorderNode(dragId, hint.targetId, hint.position);
    setDragId(null);
    setDropHint(null);
  };

  return (
    <aside className="history-panel">
      <div className="panel-head">
        <h3>历史树</h3>
        <div>
          <button className="mini" onClick={recomputeAll} title="忽略 12 级上限，全量重算">全量重算</button>
          {selectedIds.length === 1 && (
            <button className="mini danger" onClick={() => deleteNode(selectedIds[0])}>删除</button>
          )}
        </div>
      </div>
      <div className="tree-scroll">
        {tree.rootIds.length === 0 && <p className="tip pad">还没有节点，从左侧参数面板生成基元开始。</p>}
        {tree.rootIds.map((id) => (
          <TreeNode
            key={id}
            id={id}
            depth={0}
            selectedIds={selectedIds}
            onSelect={setSelected}
            dragId={dragId}
            dropHint={dropHint}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={() => { setDragId(null); setDropHint(null); }}
          />
        ))}
      </div>
      <p className="tip pad">
        拖拽规则：拖到节点中部=成为其子节点；上/下边缘=同级重排。子节点禁止排到父节点之前。
      </p>
    </aside>
  );
}

function TreeNode(props) {
  const {
    id, depth, selectedIds, onSelect, dragId, dropHint,
    onDragStart, onDragOver, onDrop, onDragEnd,
  } = props;
  const node = useStore((s) => s.tree.nodes[id]);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const toggleMute = useStore((s) => s.toggleMute);
  const renameNode = useStore((s) => s.renameNode);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);

  if (!node) return null;
  const selected = selectedIds.includes(id);
  const icon = node.kind === 'operation' ? '⚙️' : TYPE_ICON[node.type];
  const opLabel = node.kind === 'operation' ? BOOL_OPS[node.params.op] : PRIMITIVE_TYPES[node.type];
  const isHintHere = dropHint?.targetId === id;
  const nodes = useStore.getState().tree.nodes;
  // 视觉预警：inside 不能指向自身后代；before/after 不能越过自己的父节点
  const forbidden =
    dragId && isHintHere &&
    (dropHint.position === 'inside'
      ? isDescendant(nodes, id, dragId)
      : !!nodes[dragId]?.parentId && isDescendant(nodes, id, nodes[dragId].parentId));

  return (
    <div className="tree-node-wrap">
      <div
        className={`tree-node ${selected ? 'selected' : ''} ${node.muted ? 'muted' : ''} ${dragId === id ? 'dragging' : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        draggable
        onDragStart={onDragStart(id)}
        onDragOver={onDragOver(id)}
        onDrop={onDrop(id)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.shiftKey
            ? (selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].slice(-2))
            : [id]);
        }}
      >
        {isHintHere && dropHint.position === 'before' && <div className={`drop-line top ${forbidden ? 'bad' : ''}`} />}
        {isHintHere && dropHint.position === 'inside' && <div className={`drop-inside ${forbidden ? 'bad' : ''}`} />}
        <span className="twisty" onClick={(e) => { e.stopPropagation(); toggleCollapse(id); }}>
          {node.children.length ? (node.collapsed ? '▶' : '▼') : '·'}
        </span>
        <span className="node-icon">{icon}</span>
        {editing ? (
          <input
            className="rename-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { renameNode(id, draft.trim() || node.name); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { renameNode(id, draft.trim() || node.name); setEditing(false); }
              if (e.key === 'Escape') { setDraft(node.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="node-name" onDoubleClick={(e) => { e.stopPropagation(); setDraft(node.name); setEditing(true); }}>
            {node.name}
          </span>
        )}
        <span className="node-type">{opLabel}</span>
        <span className="node-actions">
          <button
            className={`icon-btn ${node.muted ? 'active' : ''}`}
            title={node.muted ? '取消静音' : '静音（求值时跳过/透传）'}
            onClick={(e) => { e.stopPropagation(); toggleMute(id); }}
          >{node.muted ? '🔇' : '🔈'}</button>
        </span>
        {isHintHere && dropHint.position === 'after' && <div className={`drop-line bottom ${forbidden ? 'bad' : ''}`} />}
      </div>
      {!node.collapsed && node.children.map((cid) => (
        <TreeNode key={cid} {...props} id={cid} depth={depth + 1} />
      ))}
    </div>
  );
}
