// 剖切状态与视角的本地持久化 + JSON 导入导出
import { writable, get } from "svelte/store";
import { DEFAULT_STATE, type SectionState } from "./types";

const STORAGE_KEY = "station-city-section-state-v1";

export const sectionState = writable<SectionState>(loadFromLocal());

function loadFromLocal(): SectionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return sanitize(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** 校验并补全外部数据,避免导入损坏的 JSON 导致崩溃 */
export function sanitize(input: unknown): SectionState {
  const s = (typeof input === "object" && input !== null ? input : {}) as Partial<SectionState>;
  const clamp = (v: unknown, min: number, max: number, dflt: number) =>
    typeof v === "number" && isFinite(v) ? Math.min(max, Math.max(min, v)) : dflt;
  let camera: SectionState["camera"] = null;
  if (s.camera && typeof s.camera === "object") {
    const c = s.camera as Partial<import("./types").CameraState>;
    if (
      typeof c.alpha === "number" && typeof c.beta === "number" &&
      typeof c.radius === "number" && Array.isArray(c.target) && c.target.length === 3
    ) {
      camera = {
        alpha: c.alpha, beta: c.beta, radius: c.radius,
        target: [Number(c.target[0]), Number(c.target[1]), Number(c.target[2])],
      };
    }
  }
  return {
    clipHeight: clamp(s.clipHeight, 0, 120, DEFAULT_STATE.clipHeight),
    direction: s.direction === "vertical" ? "vertical" : "horizontal",
    clipAngle: clamp(s.clipAngle, 0, 180, DEFAULT_STATE.clipAngle),
    viewMode: s.viewMode === "top" ? "top" : "orbit",
    camera,
    selectedFloorId: typeof s.selectedFloorId === "string" ? s.selectedFloorId : null,
  };
}

/** 订阅变化,自动写入 localStorage(在应用启动时调用一次) */
export function startAutoPersist(): void {
  sectionState.subscribe((s) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* 隐私模式等场景下静默失败 */
    }
  });
}

/** 导出当前状态为 JSON 文件下载 */
export function exportState(): void {
  const data = {
    app: "station-city-section-viewer",
    version: 1,
    exportedAt: new Date().toISOString(),
    state: get(sectionState),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `section-state-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 从导入的 JSON 文本还原状态;返回错误信息或 null */
export function importState(jsonText: string): string | null {
  try {
    const parsed = JSON.parse(jsonText);
    const raw = parsed && typeof parsed === "object" && "state" in parsed ? parsed.state : parsed;
    sectionState.set(sanitize(raw));
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "JSON 解析失败";
  }
}
