// 全局状态：历史树、选择集、重算调度、装配、工程持久化
import { create } from 'zustand';
import {
  BOOL_OPS,
  BALL_RADIUS_MIN,
  BALL_RADIUS_MAX,
  TUBE_OUTER_DIAMETERS,
  TUBE_WALL_MIN,
} from '../kernel/primitives.js';
import { Evaluator, collectRecomputeOrder } from '../kernel/evaluator.js';
import {
  STORES,
  idbPut,
  idbGetAll,
  idbDelete,
  idbGet,
  serializeProject,
  deserializeProject,
} from '../kernel/idb.js';

export const MAX_BOOL_CHAIN = 12;
const DEFAULT_PROJECT_ID = 'default-project';

let idCounter = 1;
function nextId(prefix) {
  // Date.now 在该运行环境可用（非 workflow 脚本环境）
  return `${prefix}_${Date.now().toString(36)}_${idCounter++}`;
}

function defaultTransform() {
  return { position: [0, 0, 0], rotation: [0, 0, 0] };
}

function defaultParams(type) {
  if (type === 'ball') return { radius: 40 };
  if (type === 'tube') {
    return {
      outerDiameter: TUBE_OUTER_DIAMETERS[2],
      wall: TUBE_WALL_MIN * 2,
      length: 120,
    };
  }
  return { size: 30, armSize: 14, armLength: 40, dirs: ['+X'] };
}

function makeNode(kind, type, name) {
  return {
    id: nextId(kind === 'primitive' ? 'prm' : 'op'),
    kind, // 'primitive' | 'operation'
    type, // primitive: ball/tube/block ; operation: 'bool'
    name,
    params: kind === 'primitive' ? defaultParams(type) : { op: 'union' },
    transform: defaultTransform(),
    children: [],
    parentId: null,
    muted: false,
    collapsed: false,
    version: 1,
  };
}

const yieldToEventLoop = () => new Promise((r) => setTimeout(r, 0));

export const useStore = create((set, get) => ({
  tree: { rootIds: [], nodes: {} },
  selectedIds: [],
  // 每个节点最近一次求值结果（manifold 实体、体积、错误、版本）
  geometryResults: {},
  // 重算状态
  recompute: { active: false, done: 0, total: 0, visible: false, truncated: false, elapsedMs: 0 },
  recomputeDirty: false,
  // 干涉检查结果
  interference: null,
  // 装配页：[{ id, nodeId, position:[x,y,z] }]
  assembly: [],
  // 视图模式
  tab: 'model', // model | assembly | export
  // 布尔拖拽模式
  dragBooleanMode: false,
  // 全局提示
  toast: null,

  showToast(message, kind = 'info') {
    set({ toast: { message, kind, at: Date.now() } });
    setTimeout(() => {
      if (get().toast?.at === Date.now()) return;
      set({ toast: null });
    }, 3200);
  },

  setTab(tab) {
    set({ tab });
  },

  toggleDragBooleanMode() {
    set((s) => ({ dragBooleanMode: !s.dragBooleanMode }));
  },

  // ---------- 节点创建 ----------
  addPrimitive(type) {
    const node = makeNode('primitive', type, defaultName(type));
    set((s) => {
      const nodes = { ...s.tree.nodes, [node.id]: node };
      return {
        tree: { ...s.tree, nodes, rootIds: [...s.tree.rootIds, node.id] },
        selectedIds: [node.id],
      };
    });
    get().scheduleRecompute(node.id);
    return node.id;
  },

  /**
   * 用布尔运算合并两个节点，生成新的 operation 父节点
   * a 为被拖入方（差集时为被减实体），b 为操作数
   */
  createBoolean(op, idA, idB) {
    const s = get();
    if (idA === idB) {
      s.showToast('不能对同一节点做布尔运算', 'error');
      return null;
    }
    const a = s.tree.nodes[idA];
    const b = s.tree.nodes[idB];
    if (!a || !b) return null;
    if (isDescendant(s.tree.nodes, idA, idB) || isDescendant(s.tree.nodes, idB, idA)) {
      s.showToast('存在祖先/后代关系的节点不能做布尔运算', 'error');
      return null;
    }
    const opNode = makeNode('operation', 'bool', `${BOOL_OPS[op]} ${a.name} + ${b.name}`);
    opNode.params = { op };
    opNode.children = [idA, idB];

    set((st) => {
      const nodes = { ...st.tree.nodes };
      nodes[opNode.id] = opNode;
      nodes[idA] = { ...a, parentId: opNode.id };
      nodes[idB] = { ...b, parentId: opNode.id };
      const rootIds = st.tree.rootIds
        .filter((id) => id !== idA && id !== idB)
        .concat(opNode.id);
      return {
        tree: { nodes, rootIds },
        selectedIds: [opNode.id],
      };
    });
    get().scheduleRecompute(opNode.id);
    return opNode.id;
  },

  // ---------- 参数 / 变换编辑 ----------
  updateParams(id, patch) {
    set((s) => {
      const n = s.tree.nodes[id];
      if (!n) return {};
      const params = clampParams(n.type, { ...n.params, ...patch });
      const nodes = { ...s.tree.nodes, [id]: { ...n, params, version: n.version + 1 } };
      return { tree: { ...s.tree, nodes } };
    });
    get().scheduleRecompute(id);
  },

  updateTransform(id, patch) {
    set((s) => {
      const n = s.tree.nodes[id];
      if (!n) return {};
      const transform = {
        position: patch.position ? [...patch.position] : n.transform.position,
        rotation: patch.rotation ? [...patch.rotation] : n.transform.rotation,
      };
      const nodes = { ...s.tree.nodes, [id]: { ...n, transform, version: n.version + 1 } };
      return { tree: { ...s.tree, nodes } };
    });
    get().scheduleRecompute(id);
  },

  renameNode(id, name) {
    set((s) => {
      const n = s.tree.nodes[id];
      if (!n) return {};
      const nodes = { ...s.tree.nodes, [id]: { ...n, name } };
      return { tree: { ...s.tree, nodes } };
    });
  },

  toggleMute(id) {
    set((s) => {
      const n = s.tree.nodes[id];
      if (!n) return {};
      const nodes = { ...s.tree.nodes, [id]: { ...n, muted: !n.muted, version: n.version + 1 } };
      return { tree: { ...s.tree, nodes } };
    });
    get().scheduleRecompute(id);
  },

  toggleCollapse(id) {
    set((s) => {
      const n = s.tree.nodes[id];
      if (!n) return {};
      const nodes = { ...s.tree.nodes, [id]: { ...n, collapsed: !n.collapsed } };
      return { tree: { ...s.tree, nodes } };
    });
  },

  setSelected(ids) {
    set({ selectedIds: ids, interference: ids.length === 2 ? get().interference : null });
  },

  /**
   * 历史树拖拽重排。
   * targetId: 落点节点；position: 'before' | 'after' | 'inside'
   * 规则：禁止把子节点拖到它的父节点之前（会破坏依赖顺序）
   */
  reorderNode(dragId, targetId, position) {
    const s = get();
    if (dragId === targetId) return false;
    const nodes = s.tree.nodes;
    const drag = nodes[dragId];
    if (!drag || !nodes[targetId]) return false;

    // 不能拖进自己的后代里
    if (position === 'inside' && isDescendant(nodes, targetId, dragId)) {
      s.showToast('禁止拖入自身的子节点', 'error');
      return false;
    }
    // 禁止子节点排到父节点之前
    const dragParent = drag.parentId;
    if (
      (position === 'before' || position === 'after') &&
      dragParent &&
      isDescendant(nodes, targetId, dragParent)
    ) {
      s.showToast('禁止把子节点重排到父节点之前', 'error');
      return false;
    }

    set((st) => {
      const next = structuredClone(st.tree);
      const n = next.nodes;
      // 从旧位置摘除
      detachFromParent(next, dragId);
      const moving = n[dragId];

      if (position === 'inside') {
        const target = n[targetId];
        target.children.push(dragId);
        moving.parentId = targetId;
      } else {
        const target = n[targetId];
        const newParentId = target.parentId;
        const siblings = newParentId ? n[newParentId].children : next.rootIds;
        const idx = siblings.indexOf(targetId);
        siblings.splice(position === 'before' ? idx : idx + 1, 0, dragId);
        moving.parentId = newParentId;
      }
      moving.version += 1;
      return { tree: next };
    });
    get().scheduleRecompute(dragId);
    return true;
  },

  deleteNode(id) {
    set((s) => {
      const next = structuredClone(s.tree);
      const collect = [id];
      const all = [];
      while (collect.length) {
        const cur = collect.pop();
        all.push(cur);
        collect.push(...(next.nodes[cur]?.children ?? []));
      }
      detachFromParent(next, id);
      for (const d of all) delete next.nodes[d];
      return {
        tree: next,
        selectedIds: s.selectedIds.filter((x) => !all.includes(x)),
        assembly: s.assembly.filter((a) => !all.includes(a.nodeId)),
      };
    });
  },

  // ---------- 重算调度 ----------
  // Evaluator 跨重算复用缓存：版本未变的节点直接命中，不重复做布尔
  async scheduleRecompute(changedId) {
    const s = get();
    if (s.recompute.active) {
      // 已有重算在跑：标记脏，跑完后整体再来一轮
      set({ recomputeDirty: true });
      return;
    }
    let { order, truncated } = collectRecomputeOrder(
      get().tree.nodes,
      changedId,
      MAX_BOOL_CHAIN
    );
    // 过滤掉已删除节点
    order = order.filter((id) => get().tree.nodes[id]);
    if (order.length === 0) return;

    const startedAt = performance.now();
    set({
      recompute: { active: true, done: 0, total: order.length, visible: false, truncated, elapsedMs: 0 },
    });

    const evaluator = new Evaluator(get().tree.nodes);
    const results = { ...get().geometryResults };

    for (let i = 0; i < order.length; i++) {
      // 分帧让出事件循环，保证 >800ms 时进度条可以绘制
      if (i > 0 && i % 2 === 0) await yieldToEventLoop();
      const id = order[i];
      const node = get().tree.nodes[id];
      if (!node) continue;
      let r;
      try {
        r = evaluator.evaluate(id);
      } catch (err) {
        r = { manifold: null, volume: 0, error: String(err?.message ?? err) };
      }
      results[id] = { ...r, version: node.version };
      set((st) => ({
        geometryResults: results,
        recompute: {
          ...st.recompute,
          done: i + 1,
          // 单次重算超过 800ms 才显示进度条
          visible: st.recompute.visible || performance.now() - startedAt > 800,
        },
      }));
    }

    const elapsed = performance.now() - startedAt;
    set((st) => ({
      recompute: { ...st.recompute, active: false, visible: false, elapsedMs: elapsed },
    }));
    if (truncated) {
      get().showToast(`布尔链超过 ${MAX_BOOL_CHAIN} 级，超出部分未自动重算`, 'warn');
    }
    if (get().recomputeDirty) {
      set({ recomputeDirty: false });
      get().scheduleRecompute(changedId);
    }
  },

  /** 全量重算（手动触发，忽略 12 级上限） */
  async recomputeAll() {
    const all = Object.keys(get().tree.nodes);
    if (!all.length) return;
    const startedAt = performance.now();
    set({
      recompute: { active: true, done: 0, total: all.length, visible: false, truncated: false, elapsedMs: 0 },
    });
    const evaluator = new Evaluator(get().tree.nodes);
    const results = {};
    for (let i = 0; i < all.length; i++) {
      if (i > 0 && i % 2 === 0) await yieldToEventLoop();
      const id = all[i];
      const node = get().tree.nodes[id];
      try {
        results[id] = { ...evaluator.evaluate(id), version: node.version };
      } catch (err) {
        results[id] = { manifold: null, volume: 0, error: String(err?.message ?? err), version: node.version };
      }
      set((st) => ({
        geometryResults: { ...results },
        recompute: {
          ...st.recompute,
          done: i + 1,
          visible: st.recompute.visible || performance.now() - startedAt > 800,
        },
      }));
    }
    set((st) => ({
      recompute: { ...st.recompute, active: false, visible: false, elapsedMs: performance.now() - startedAt },
    }));
  },

  // ---------- 干涉检查 ----------
  setInterference(result) {
    set({ interference: result });
  },
  clearInterference() {
    set({ interference: null });
  },

  // ---------- 装配 ----------
  addAssemblyItem(nodeId, position = [0, 0, 0]) {
    set((s) => ({
      assembly: [
        ...s.assembly,
        { id: nextId('asm'), nodeId, position: [...position] },
      ],
    }));
  },
  updateAssemblyItem(itemId, patch) {
    set((s) => ({
      assembly: s.assembly.map((a) =>
        a.id === itemId ? { ...a, ...patch, position: patch.position ? [...patch.position] : a.position } : a
      ),
    }));
  },
  removeAssemblyItem(itemId) {
    set((s) => ({ assembly: s.assembly.filter((a) => a.id !== itemId) }));
  },

  // ---------- 工程持久化 ----------
  async saveProject(name = '默认工程') {
    const s = get();
    const record = {
      id: DEFAULT_PROJECT_ID,
      name,
      ...serializeProject({ tree: s.tree, assembly: s.assembly }),
    };
    await idbPut(STORES.PROJECTS, record);
    s.showToast('工程已保存到 IndexedDB', 'ok');
    return record.id;
  },

  async loadProject(id = DEFAULT_PROJECT_ID) {
    const record = await idbGet(STORES.PROJECTS, id);
    if (!record) {
      get().showToast('IndexedDB 中没有已保存的工程', 'warn');
      return false;
    }
    const data = deserializeProject(record);
    set({
      tree: data.tree,
      assembly: data.assembly,
      selectedIds: [],
      interference: null,
    });
    // 整体重算一次
    const roots = data.tree.rootIds;
    if (roots.length) get().scheduleRecompute(roots[0]);
    get().showToast('工程已从 IndexedDB 读回', 'ok');
    return true;
  },

  async listProjects() {
    return idbGetAll(STORES.PROJECTS);
  },

  async deleteProject(id) {
    await idbDelete(STORES.PROJECTS, id);
  },
}));

function defaultName(type) {
  const base = { ball: '球节点', tube: '圆管柱', block: '连接块' }[type] ?? '节点';
  const n = Object.values(useStore.getState().tree.nodes).filter((x) => x.type === type).length + 1;
  return `${base} ${n}`;
}

function clampParams(type, params) {
  if (type === 'ball') {
    params.radius = Math.min(BALL_RADIUS_MAX, Math.max(BALL_RADIUS_MIN, Number(params.radius) || 40));
  }
  if (type === 'tube') {
    if (!TUBE_OUTER_DIAMETERS.includes(params.outerDiameter)) {
      params.outerDiameter = TUBE_OUTER_DIAMETERS[2];
    }
    const maxWall = params.outerDiameter / 2 - 1;
    params.wall = Math.min(maxWall, Math.max(TUBE_WALL_MIN, Number(params.wall) || 4));
    params.length = Math.max(4, Number(params.length) || 120);
  }
  if (type === 'block') {
    params.size = Math.max(4, Number(params.size) || 30);
    params.armSize = Math.max(2, Number(params.armSize) || 14);
    params.armLength = Math.max(0, Number(params.armLength) || 40);
    if (!Array.isArray(params.dirs)) params.dirs = [];
  }
  return params;
}

/** nodeId 是否为 ancestorId 的后代（含相等） */
export function isDescendant(nodes, nodeId, ancestorId) {
  if (nodeId === ancestorId) return true;
  let cur = nodes[nodeId];
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = nodes[cur.parentId];
  }
  return false;
}

function detachFromParent(tree, id) {
  const node = tree.nodes[id];
  if (node.parentId == null) {
    tree.rootIds = tree.rootIds.filter((x) => x !== id);
  } else {
    const parent = tree.nodes[node.parentId];
    parent.children = parent.children.filter((x) => x !== id);
  }
  node.parentId = null;
}
