// 全局数据模型与状态管理

export type SpeedGear = 1 | 2 | 3;

export interface KeyPoint {
  id: string;
  /** 巷道网络节点 id(关键点吸附在网络折线上的节点处) */
  nodeId: string;
  /** 到达时间(秒),整段时间轴单调递增 */
  time: number;
  /** 注视点:网络节点 id;null 表示沿路径切线方向 */
  lookAtNodeId: string | null;
  /** 视场角(度),限制 45~90 */
  fov: number;
  /** 速度档位:1 慢 / 2 中 / 3 快 */
  speed: SpeedGear;
}

export interface Route {
  id: string;
  name: string;
  color: [number, number, number];
  keyPoints: KeyPoint[];
}

export type EditTool = "add" | "select" | "gaze";

export interface AppSettings {
  /** 头部微摆幅度(度),0~2 */
  headSwayDeg: number;
  /** 终点雾量百分比,默认 60 */
  fogEndPct: number;
  /** 圆角半径(m),固定需求 2m,保留可调便于演示 */
  filletRadius: number;
  /** 标识牌注视停留时长(秒) */
  signDwellSec: number;
}

export interface AppState {
  routes: Route[];
  activeRouteId: string;
  selectedKPId: string | null;
  tool: EditTool;
  playing: boolean;
  /** 预览倍速 0.5 / 1 / 2 */
  playbackRate: number;
  /** 当前预览时间(秒) */
  playTime: number;
  settings: AppSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  headSwayDeg: 1.0,
  fogEndPct: 60,
  filletRadius: 2,
  signDwellSec: 0.5,
};

let idCounter = 0;
export function uid(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

type Listener = () => void;

class Store {
  state: AppState;
  private listeners = new Set<Listener>();

  constructor(initial: AppState) {
    this.state = initial;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** 以可变方式修改 state,修改结束后统一通知 */
  update(mutator: (s: AppState) => void): void {
    mutator(this.state);
    this.emit();
  }

  /** 高频更新(播放帧)不触发 UI 全量渲染 */
  silentUpdate(mutator: (s: AppState) => void): void {
    mutator(this.state);
  }

  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  get activeRoute(): Route {
    const r = this.state.routes.find((x) => x.id === this.state.activeRouteId);
    if (!r) throw new Error("active route missing");
    return r;
  }

  get selectedKP(): KeyPoint | null {
    const r = this.activeRoute;
    return r.keyPoints.find((k) => k.id === this.state.selectedKPId) ?? null;
  }
}

export const ROUTE_COLORS: [number, number, number][] = [
  [0.2, 0.85, 1.0], // 1 号:青蓝
  [1.0, 0.62, 0.15], // 2 号:橙
  [0.45, 1.0, 0.4], // 3 号:绿
];

export function createInitialState(): AppState {
  const routes: Route[] = [1, 2, 3].map((i) => ({
    id: `route_${i}`,
    name: `${i} 号避灾路线`,
    color: ROUTE_COLORS[i - 1],
    keyPoints: [],
  }));
  return {
    routes,
    activeRouteId: routes[0].id,
    selectedKPId: null,
    tool: "add",
    playing: false,
    playbackRate: 1,
    playTime: 0,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export const store = new Store(createInitialState());

/** FOV 合法区间 */
export const FOV_MIN = 45;
export const FOV_MAX = 90;
/** 头摆幅度合法区间 */
export const SWAY_MIN = 0;
export const SWAY_MAX = 2;

export function clampFov(v: number): number {
  return Math.min(FOV_MAX, Math.max(FOV_MIN, v));
}

/** 速度档位对应的基准行进速度(m/s),用于自动推算到达时间 */
export const GEAR_SPEED: Record<SpeedGear, number> = {
  1: 1.2,
  2: 2.0,
  3: 3.2,
};
