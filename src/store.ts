// 全局状态:步序参数、断面轮廓、剖切角度;负责本地持久化、JSON 导入导出与回放
import { reactive, watch } from 'vue';
import { initManifold, cutStep, solidToData, type MeshData } from './lib/manifold';

export interface StepResult {
  mesh: MeshData;
  volume: number;
}

export interface PersistedState {
  version: 1;
  profile: [number, number][];
  stepLength: number;
  totalSteps: number;
  cutAngle: number;
  tiltAngle: number;
}

const STORAGE_KEY = 'tunnel-excavation-sim:v1';

/** 默认马蹄形隧道断面(宽 10m,高 ~6.6m,逆时针),单位:米 */
export const DEFAULT_PROFILE: [number, number][] = [
  [5, 0],
  [5, 3],
  [4.6, 4.4],
  [3.6, 5.5],
  [2.1, 6.3],
  [0, 6.6],
  [-2.1, 6.3],
  [-3.6, 5.5],
  [-4.6, 4.4],
  [-5, 3],
  [-5, 0],
];

export const store = reactive({
  // 参数
  profile: DEFAULT_PROFILE.map((p) => [...p] as [number, number]),
  stepLength: 2, // 开挖步长 1~5 m
  totalSteps: 8, // 总步数 3~20
  cutAngle: 0, // 剖切平面绕隧道轴线旋转角 0~360°
  tiltAngle: 30, // 剖切平面相对轴线垂面的倾角(旋转生效的前提)
  currentStep: 0,
  playing: false,
  showGhost: true,
  // 计算结果
  manifoldReady: false,
  computing: false,
  steps: [] as StepResult[],
  initialVolume: 0,
  status: '',
  statusError: false,
});

export const totalLength = () => store.stepLength * store.totalSteps;

// ---------- 计算 ----------

let computeToken = 0;
let computeTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCompute(immediate = false): void {
  if (computeTimer) clearTimeout(computeTimer);
  computeTimer = setTimeout(() => runCompute(), immediate ? 0 : 250);
}

async function runCompute(): Promise<void> {
  const token = ++computeToken;
  store.computing = true;
  setStatus('正在计算开挖步序…');
  try {
    await initManifold();
    store.manifoldReady = true;
    const profile = store.profile.map((p) => [...p] as [number, number]);
    const L = totalLength();
    const results: StepResult[] = [];
    for (let i = 0; i <= store.totalSteps; i++) {
      const { solid, volume } = cutStep(
        profile,
        L,
        i,
        store.stepLength,
        store.cutAngle,
        store.tiltAngle,
      );
      results.push({ mesh: solidToData(solid), volume });
      if (token !== computeToken) {
        return; // 参数已变化,放弃本次结果
      }
    }
    store.steps = results;
    store.initialVolume = results[0]?.volume ?? 0;
    if (store.currentStep > store.totalSteps) store.currentStep = store.totalSteps;
    setStatus('');
  } catch (e) {
    setStatus(`计算失败:${e instanceof Error ? e.message : String(e)}`, true);
  } finally {
    if (token === computeToken) store.computing = false;
  }
}

function setStatus(msg: string, error = false): void {
  store.status = msg;
  store.statusError = error;
}

// ---------- 回放 ----------

let playTimer: ReturnType<typeof setInterval> | null = null;

export function play(): void {
  if (store.playing || store.steps.length === 0) return;
  if (store.currentStep >= store.totalSteps) store.currentStep = 0;
  store.playing = true;
  playTimer = setInterval(() => {
    if (store.currentStep >= store.totalSteps) {
      pause();
      return;
    }
    store.currentStep += 1;
  }, 700);
}

export function pause(): void {
  store.playing = false;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

// ---------- 持久化 ----------

function snapshot(): PersistedState {
  return {
    version: 1,
    profile: store.profile.map((p) => [...p] as [number, number]),
    stepLength: store.stepLength,
    totalSteps: store.totalSteps,
    cutAngle: store.cutAngle,
    tiltAngle: store.tiltAngle,
  };
}

export function saveLocal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
  } catch {
    /* 存储不可用时忽略 */
  }
}

export function loadLocal(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return applyState(JSON.parse(raw));
  } catch {
    return false;
  }
}

export function applyState(data: unknown): boolean {
  const d = data as Partial<PersistedState>;
  if (
    !d ||
    !Array.isArray(d.profile) ||
    d.profile.length < 3 ||
    !d.profile.every(
      (p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n)),
    )
  ) {
    setStatus('数据无效:断面轮廓缺失或格式错误', true);
    return false;
  }
  store.profile = d.profile.map((p) => [Number(p[0]), Number(p[1])] as [number, number]);
  store.stepLength = clamp(Number(d.stepLength) || 2, 1, 5);
  store.totalSteps = Math.round(clamp(Number(d.totalSteps) || 8, 3, 20));
  store.cutAngle = clamp(Number(d.cutAngle) || 0, 0, 360);
  store.tiltAngle = clamp(Number(d.tiltAngle ?? 30), 0, 60);
  store.currentStep = 0;
  scheduleCompute(true);
  return true;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ---------- JSON 导出 / 导入 ----------

export function exportJSON(): void {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tunnel-sim-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<void> {
  try {
    const text = await file.text();
    const ok = applyState(JSON.parse(text));
    if (ok) {
      setStatus(`已导入 ${file.name},开始回放`);
      // 导入后按步序回放
      store.currentStep = 0;
      play();
    }
  } catch (e) {
    setStatus(`导入失败:${e instanceof Error ? e.message : String(e)}`, true);
  }
}

// ---------- 监听 ----------

// 参数变化 → 重新计算 + 保存本地
watch(
  () => [store.profile, store.stepLength, store.totalSteps, store.cutAngle, store.tiltAngle],
  () => {
    saveLocal();
    scheduleCompute();
  },
  { deep: true },
);

export async function bootstrap(): Promise<void> {
  loadLocal();
  await runCompute();
}
