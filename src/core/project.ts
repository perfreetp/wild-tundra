import { buildPlanCurve, fitProfileToTerrain } from "./alignment.ts";
import { createTerrain } from "./terrain.ts";
import type { Project, PlanPoint, ProfilePoint } from "./types.ts";

export const FILE_FORMAT = "rail-terrain-studio";
export const FILE_VERSION = 1;

export function createDefaultProject(): Project {
  const terrain = createTerrain();
  const plan: PlanPoint[] = [
    { id: "P1", x: -430, z: 300, radius: 0 },
    { id: "P2", x: -300, z: 130, radius: 900 },
    { id: "P3", x: -60, z: 20, radius: 1200 },
    { id: "P4", x: 170, z: -30, radius: 1000 },
    { id: "P5", x: 420, z: -120, radius: 0 },
  ];
  const planCurve = buildPlanCurve(plan);
  // 用控制点自身的坐标调优纵断面：先拟合地形，再整体抬升，制造填挖交替。
  // 贴合地形拟合（限坡 25‰），再整体上抬一个常数值以形成填挖交替；
  // 常数平移不改变任何坡段的坡度，因此不会破坏限坡结果。
  const fit = fitProfileToTerrain(terrain, planCurve, 7, 0.0, 0.0235);
  const lift = 1.1;
  const profile: ProfilePoint[] = fit.map((p) => ({
    ...p,
    y: Math.round((p.y + lift) * 10) / 10,
  }));
  return {
    name: "示例线路",
    terrain,
    plan,
    profile,
    settings: { ballastWidth: 4.4, maxGradePermille: 25 },
  };
}

export interface SerializedProject {
  format: string;
  version: number;
  name: string;
  exportedAt: string;
  settings: { ballastWidth: number; maxGradePermille?: number };
  terrain: {
    nx: number;
    nz: number;
    cell: number;
    originX: number;
    originZ: number;
    /** 千分位整数的米制高程，压缩体积但保持 1mm 精度 */
    heightsMm: number[];
  };
  plan: PlanPoint[];
  profile: ProfilePoint[];
}

export function serializeProject(p: Project): SerializedProject {
  const heightsMm = new Array<number>(p.terrain.heights.length);
  for (let i = 0; i < heightsMm.length; i++) {
    heightsMm[i] = Math.round(p.terrain.heights[i] * 1000);
  }
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    name: p.name,
    exportedAt: new Date().toISOString(),
    settings: { ballastWidth: p.settings.ballastWidth, maxGradePermille: p.settings.maxGradePermille },
    terrain: {
      nx: p.terrain.nx,
      nz: p.terrain.nz,
      cell: p.terrain.cell,
      originX: p.terrain.originX,
      originZ: p.terrain.originZ,
      heightsMm,
    },
    plan: p.plan.map((q) => ({ id: q.id, x: round2(q.x), z: round2(q.z), radius: Math.round(q.radius) })),
    profile: p.profile.map((q) => ({ id: q.id, s: round2(q.s), y: round2(q.y) })),
  };
}

export function deserializeProject(raw: unknown): Project {
  if (!raw || typeof raw !== "object") throw new Error("文件内容不是有效的 JSON 对象");
  const obj = raw as Partial<SerializedProject>;
  if (obj.format !== FILE_FORMAT) throw new Error(`无法识别的文件格式：${String(obj.format)}`);
  if (typeof obj.version !== "number" || obj.version > FILE_VERSION) {
    throw new Error(`文件版本 ${obj.version} 高于当前支持的版本 ${FILE_VERSION}`);
  }
  const t = obj.terrain;
  if (!t || !Array.isArray(t.heightsMm)) throw new Error("文件缺少地形数据");
  const { nx, nz, cell, originX, originZ } = t;
  if (![nx, nz, cell].every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new Error("地形网格参数无效");
  }
  if (t.heightsMm.length !== nx * nz) {
    throw new Error(`地形高度数量不符：期望 ${nx * nz}，实际 ${t.heightsMm.length}`);
  }
  const heights = new Float32Array(t.heightsMm.length);
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    const h = t.heightsMm[i] / 1000;
    heights[i] = h;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  const plan = (obj.plan ?? []).map((q, i) => ({
    id: typeof q.id === "string" && q.id ? q.id : `P${i + 1}`,
    x: num(q.x),
    z: num(q.z),
    radius: Math.max(0, num(q.radius ?? 0)),
  }));
  if (plan.length < 2) throw new Error("平面控制点少于 2 个，无法构成线路");
  const profile = (obj.profile ?? [])
    .map((q, i) => ({
      id: typeof q.id === "string" && q.id ? q.id : `V${i + 1}`,
      s: num(q.s),
      y: num(q.y),
    }))
    .sort((a, b) => a.s - b.s);
  if (profile.length < 2) throw new Error("纵断面控制点少于 2 个");

  return {
    name: typeof obj.name === "string" ? obj.name : "导入线路",
    terrain: {
      nx, nz, cell, originX: num(originX), originZ: num(originZ),
      heights, minH, maxH,
    },
    plan,
    profile,
    settings: {
      ballastWidth: clampNum(num((obj.settings as any)?.ballastWidth ?? 4.4), 3.0, 8.0),
      maxGradePermille: clampNum(num((obj.settings as any)?.maxGradePermille ?? 25), 3, 80),
    },
  };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error("文件中存在非数值坐标");
  return n;
}
function clampNum(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function downloadProject(p: Project, filename: string) {
  const data = serializeProject(p);
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 本地草稿（自动保存到浏览器） */
const LOCAL_KEY = "rail-terrain-studio:draft:v1";

export function saveLocal(p: Project) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(serializeProject(p)));
    return true;
  } catch {
    return false;
  }
}

export function loadLocal(): Project | null {
  try {
    const txt = localStorage.getItem(LOCAL_KEY);
    if (!txt) return null;
    return deserializeProject(JSON.parse(txt));
  } catch {
    return null;
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* noop */
  }
}
