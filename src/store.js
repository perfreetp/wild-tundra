import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';

// 小人的身高(米),用来估算影长
export const PERSON_HEIGHT = 1.2;

export const PRESETS = {
  noon: { label: '☀️ 正午', elevation: 75, azimuth: 180 },
  evening: { label: '🌇 傍晚', elevation: 12, azimuth: 275 },
};

const DEFAULTS = {
  // 太阳
  elevation: 45, // 高度角 10~80
  azimuth: 150, // 方位角 0~360
  // 阴影质量
  mapSize: 1024, // 512 ~ 2048
  bias: 0, // 阴影偏移(治阴影痤疮)
  normalBias: 0.05, // 法线偏移
  kernel: 4, // 软阴影采样核半径
  // 材质粗糙度
  groundRough: 0.8,
  wallRough: 0.6,
  // 路灯开关(点光源,立方体贴图阴影)
  lamps: [true, true],
  // 调试视图: none | shadowmap | cascades | depth
  debugView: 'none',
  debugCascade: 0, // 查看哪一级级联的阴影贴图
};

export const [params, setParams] = createStore(structuredClone(DEFAULTS));

// ---------- 版本管理 ----------

const STORAGE_KEY = 'shadow-street-versions-v1';

function loadVersions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 忽略损坏的存档 */ }
  return [];
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-30)));
  } catch (e) { /* 存储满就算了 */ }
}

export const [versions, setVersions] = createSignal(loadVersions());
// 对比的两个版本 id
export const [compareIds, setCompareIds] = createSignal([null, null]);

export function snapshotParams() {
  return structuredClone({ ...params, lamps: [...params.lamps] });
}

// 理论影长: L = h / tan(高度角)
export function shadowLength(p) {
  return PERSON_HEIGHT / Math.tan((p.elevation * Math.PI) / 180);
}

let saveTimer = null;
// 每次调整后(防抖 0.8s)自动保存一个版本
export function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveVersion(), 800);
}

export function saveVersion(force = false) {
  const snap = snapshotParams();
  const list = versions();
  const last = list[list.length - 1];
  if (!force && last && JSON.stringify(last.params) === JSON.stringify(snap)) return;
  const v = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    name: `v${list.length + 1}`,
    time: Date.now(),
    params: snap,
    shadowLen: shadowLength(snap),
  };
  const next = [...list, v].slice(-30);
  setVersions(next);
  persist(next);
}

export function applyVersion(v) {
  setParams({ ...structuredClone(v.params), lamps: [...v.params.lamps] });
  // 应用版本本身也算一次调整,会经防抖再存一个新版本(内容相同则自动跳过)
  scheduleSave();
}

export function deleteVersion(id) {
  const next = versions().filter((v) => v.id !== id);
  setVersions(next);
  persist(next);
  const [a, b] = compareIds();
  setCompareIds([a === id ? null : a, b === id ? null : b]);
}

export function clearVersions() {
  setVersions([]);
  persist([]);
  setCompareIds([null, null]);
}

export function toggleCompare(id) {
  const [a, b] = compareIds();
  if (a === id) setCompareIds([null, b]);
  else if (b === id) setCompareIds([a, null]);
  else if (a === null) setCompareIds([id, b]);
  else if (b === null) setCompareIds([a, id]);
  else setCompareIds([b, id]); // 两个都满了,替换较旧的 A
}

export function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  setParams({ elevation: p.elevation, azimuth: p.azimuth });
  scheduleSave();
}
