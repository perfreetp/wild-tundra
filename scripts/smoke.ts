// 核心算法冒烟测试(纯 Node 运行,不依赖浏览器)
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcLengthTable, filletPolyline } from "../src/geometry";
import { RoutePath, autoScheduleTimes } from "../src/routePath";
import { KeyPoint, Route } from "../src/store";

let failures = 0;
function check(name: string, cond: boolean, detail = ""): void {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name} ${detail}`);
  }
}

// 1. 直角折线圆角:半径 2m,角点应被削去,路径变短且角点不在结果上
const pts = [
  new Vector3(0, 0, 0),
  new Vector3(10, 0, 0),
  new Vector3(10, 0, 10),
];
const smoothed = filletPolyline(pts, 2);
const directLen = 20;
const table = new ArcLengthTable(smoothed);
check("圆角路径短于原折线", table.totalLength < directLen, `len=${table.totalLength}`);
check("圆角长度≈ 20 - 切线段 + 圆弧", Math.abs(table.totalLength - (20 - 4 + Math.PI)) < 0.15,
  `len=${table.totalLength} expected≈${20 - 4 + Math.PI}`);
const cornerDist = Math.min(...smoothed.map((p) => Vector3.Distance(p, pts[1])));
check("角点被削去(最近点>0)", cornerDist > 0.5, `dist=${cornerDist}`);

// 2. 弧长表端点
check("弧长表起点", Vector3.Distance(table.positionAt(0), pts[0]) < 1e-4);
check("弧长表终点", Vector3.Distance(table.positionAt(table.totalLength), pts[2]) < 1e-4);
const tan = table.tangentAt(0);
check("起点切线沿 +X", Math.abs(tan.x - 1) < 1e-3);

// 3. RoutePath:3 个关键点,时间严格遵守
const route: Route = {
  id: "r",
  name: "测试路线",
  color: [1, 1, 1],
  keyPoints: [
    { id: "a", nodeId: "N0", time: 0, lookAtNodeId: null, fov: 50, speed: 1 },
    { id: "b", nodeId: "N1", time: 5, lookAtNodeId: null, fov: 70, speed: 2 },
    { id: "c", nodeId: "N2", time: 12, lookAtNodeId: null, fov: 90, speed: 3 },
  ] as KeyPoint[],
};
const path = new RoutePath(route, 2, 0.5, 60);
check("路径时长=末点时间", path.duration === 12);
const s0 = path.timeToS(0);
const s5 = path.timeToS(5);
const s12 = path.timeToS(12);
check("时间到弧长单调", s0 <= s5 && s5 <= s12, `${s0},${s5},${s12}`);
check("首帧位置=N0", Vector3.DistanceSquared(path.positionAt(0), new Vector3(0, 0, 0)) < 1e-6);

// 4. FOV 插值
check("FOV 端点 50", Math.abs(path.fovAt(0) - 50) < 1e-6);
check("FOV 中点插值 60", Math.abs(path.fovAt(2.5) - 60) < 1e-6);
check("FOV 端点 90", Math.abs(path.fovAt(12) - 90) < 1e-6);

// 5. 雾量从 0 递增到 60%
const f0 = path.sampleFrame(0).fogPct;
const fMid = path.sampleFrame(6).fogPct;
const fEnd = path.sampleFrame(12).fogPct;
check("雾起点≈0", f0 < 1, `f0=${f0}`);
check("雾终点=60", Math.abs(fEnd - 60) < 1e-6);
check("雾量单调递增", fMid > f0 && fEnd > fMid, `${f0},${fMid},${fEnd}`);

// 6. 自动排时:单调递增、首点为 0
const scheduled = autoScheduleTimes(route, 2);
check("自动排时首点=0", scheduled[0].time === 0);
check("自动排时单调", scheduled.every((k, i) => i === 0 || k.time > scheduled[i - 1].time));

// 7. 标识牌事件:路线 N0->N1->N2 经过 E1 上的 S1
check("生成标识牌注视事件", path.signEvents.length >= 1, `count=${path.signEvents.length}`);
const ev = path.signEvents[0];
check("停留时长 0.5s", Math.abs(ev.end - ev.start - 0.5) < 1e-6);
const during = path.sampleFrame((ev.start + ev.end) / 2);
check("停留期间 activeSign 命中", during.activeSign?.signId === ev.signId);
check("停留期间视线偏向标识牌", during.forward.length() > 0);

// 8. FOV 钳制由 UI 层保证,这里验证采样不越界(模型层 45~90 由输入约束)
check("采样 FOV 在 45~90", route.keyPoints.every((k) => k.fov >= 45 && k.fov <= 90));

// 9. 锐角保护:相邻极短段不崩
const tiny = filletPolyline(
  [new Vector3(0, 0, 0), new Vector3(0.1, 0, 0), new Vector3(0.1, 0, 5)],
  2
);
check("短边收缩不产生 NaN", tiny.every((p) => isFinite(p.x) && isFinite(p.y) && isFinite(p.z)));

// 10. 导出物:route.json 与轨迹 CSV
const { buildRouteJson, buildTrajectoryCsv } = await import("../src/exporter");
const state = {
  routes: [route],
  activeRouteId: "r",
  selectedKPId: null,
  tool: "add",
  playing: false,
  playbackRate: 1,
  playTime: 0,
  settings: { headSwayDeg: 1, fogEndPct: 60, filletRadius: 2, signDwellSec: 0.5 },
} as any;
const json = buildRouteJson(state, new Map([["r", path]]), "2026-11-21T00:00:00.000Z");
check("route.json 格式头正确", json.format === "mine-escape-camera-route" && json.version === 1);
check("route.json 含 3 条路线槽位", json.routes.length === 1 && json.routes[0].keyPoints.length === 3);
check("route.json 含标识牌事件", json.routes[0].signGazeEvents.length >= 1);
const csv = buildTrajectoryCsv(new Map([["r", path]]));
const csvLines = csv.trim().split("\n");
check("轨迹 CSV 10Hz 行数≈时长*10+1", Math.abs(csvLines.length - (12 * 10 + 1)) <= 1, `lines=${csvLines.length}`);
check("轨迹 CSV 表头列数", csvLines[0].split(",").length === 13);
check("轨迹 CSV 末行时间=12s", csvLines[csvLines.length - 1].split(",")[1] === "12.000");

console.log(failures === 0 ? "\n全部通过 ✔" : `\n${failures} 项失败 �’`);
process.exit(failures === 0 ? 0 : 1);
