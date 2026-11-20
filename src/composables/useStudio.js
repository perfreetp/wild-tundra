// ============================================================
// useStudio.js — Vue 响应式状态(UI 面板与 Babylon 引擎之间的桥梁)
// 引擎持有真正的 mesh / 几何数据,这里只放界面需要的镜像状态
// ============================================================
import { reactive } from 'vue'

let engine = null

export const state = reactive({
  mode: 'draw',                 // draw | extrude | revolve | move
  hint: '在网格上点一下,开始画你的形状吧!',

  // 起草中的轮廓
  draft: {
    points: [],                 // [{x,z}]
    preview: null,              // 指针预览点
    gap: null,                  // { mx, mz } 缺口红点位置
    candidates: [],             // 两个可补端点 [{x,z,role}]
    constraint: null,           // 当前预览边的 h/v 约束
    edgeConstraints: [],        // 已确认边的约束 ['h',null,...]
  },

  // 已闭合的工作草图
  shape: null,                  // { points, corners:{i:{type,r}}, dims:{edge:len} }
  selectedCorner: -1,
  cornerMode: 'none',           // none | chamfer | fillet
  cornerRadius: 0.3,
  applyAll: false,

  // 实体参数
  depth: 1,
  revAngle: 360,
  axis: null,                   // { ax, az, bx, bz }
  axisValid: false,

  // 积木
  blocks: [],                   // { id, name, kind, color, x, z, depth, revAngle }
  selectedId: null,
  collisions: [],               // 穿模的积木 id
  blockCount: 0,

  // HTML 覆盖层标签(每帧由引擎投影更新)
  labels: [],                   // { id, x, y, text, kind, edgeIndex?, editable }
  exporting: false,
})

export function setEngine(e) { engine = e }

const wrap = fn => (...args) => engine?.[fn](...args)

export const actions = {
  setMode: wrap('setMode'),
  addPointAtPreview: wrap('addPointAtPreview'),
  undoPoint: wrap('undoPoint'),
  clearDraft: wrap('clearDraft'),
  finishDraft: wrap('finishDraft'),
  closeGapWith: wrap('closeGapWith'),
  selectCorner: i => { state.selectedCorner = i; engine?.syncCornerPanel() },
  setCornerMode: wrap('setCornerMode'),
  setCornerRadius: wrap('setCornerRadius'),
  applyCornerToAll: wrap('applyCornerToAll'),
  setDepth: wrap('setDepth'),
  setRevAngle: wrap('setRevAngle'),
  startAxisPick: wrap('startAxisPick'),
  clearAxis: wrap('clearAxis'),
  buildExtrude: wrap('buildExtrude'),
  buildRevolve: wrap('buildRevolve'),
  selectBlock: wrap('selectBlock'),
  duplicateSelected: wrap('duplicateSelected'),
  deleteSelected: wrap('deleteSelected'),
  editDimension: wrap('editDimension'),
  focusView: wrap('focusView'),
  exportImage: wrap('exportImage'),
}

export const BLOCK_COLORS = [
  { name: '草莓红', diffuse: '#ef6f6c', spec: '#ffb3b0' },
  { name: '橙子橙', diffuse: '#f5a04a', spec: '#ffd2a3' },
  { name: '柠檬黄', diffuse: '#f6cf5b', spec: '#fff0b8' },
  { name: '草地绿', diffuse: '#7cc36e', spec: '#c4ecc0' },
  { name: '天空蓝', diffuse: '#5fb8e8', spec: '#b8e4fa' },
  { name: '葡萄紫', diffuse: '#a58ae0', spec: '#d8cbf7' },
  { name: '蜜桃粉', diffuse: '#f49ac2', spec: '#fcd6e8' },
  { name: '薄荷青', diffuse: '#5ec9b8', spec: '#b8f0e7' },
]
