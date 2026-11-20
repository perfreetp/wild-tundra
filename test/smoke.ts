// 无头冒烟测试:NullEngine 下验证面积计算与剖切平面逻辑
// 运行:node_modules/.bin/esbuild test/smoke.ts --bundle --format=esm --platform=node --outfile=test/smoke.mjs && node test/smoke.mjs
// 平面约定(与 Babylon clipPlane 一致):保留 n·p+d < 0 一侧
import { NullEngine, Scene, Plane } from "@babylonjs/core";
import { buildStationCity } from "../src/lib/model";
import { clippedProjectionArea } from "../src/lib/area";

const scene = new Scene(new NullEngine());
const model = buildStationCity(scene);

let failures = 0;
function check(name: string, actual: number, expected: number, tol = 0.5) {
  const ok = Math.abs(actual - expected) <= tol;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${actual.toFixed(2)}, expect ${expected.toFixed(2)}`);
}

// T4:30x30 底座,40 层,F1 收分系数 1-0.015*(1%3)=0.985 → 29.55 x 29.55
const t4f1 = model.floorMeshes.get("T4-F01")!;
const w = 30 * 0.985;

// 1. 水平剖切 120m(保留 y<120):整层保留 → 投影面积 = footprint
check("T4-F01 @h=120", clippedProjectionArea(t4f1, new Plane(0, 1, 0, -120)), w * w);

// 2. 水平剖切 0m(保留 y<0):整层被裁 → 0
check("T4-F01 @h=0", clippedProjectionArea(t4f1, new Plane(0, 1, 0, 0)), 0);

// 3. 水平剖切穿过楼层中部(保留 y<1.5):底面保留,投影面积仍为 footprint
check("T4-F01 @h=1.5", clippedProjectionArea(t4f1, new Plane(0, 1, 0, -1.5)), w * w);

// 4. 垂直剖切(保留 x>0):T4 在 x=85 完全保留 → 投影到垂直面 = 深 x 高
const h = 3 - 0.12;
check("T4-F01 vertical x>0", clippedProjectionArea(t4f1, new Plane(-1, 0, 0, 0)), w * h);

// 5. 垂直剖切(保留 x<0):T4 被完全裁掉 → 0
check("T4-F01 vertical x<0", clippedProjectionArea(t4f1, new Plane(1, 0, 0, 0)), 0);

// 6. 垂直剖切 45° 穿过站房中心:站房 F1(100x60,收分 0.985,层高 12)被斜切
const sta = model.floorMeshes.get("STA-F01")!;
const rad = Math.PI / 4;
const staArea = clippedProjectionArea(sta, new Plane(Math.cos(rad), 0, Math.sin(rad), 0));
const staW = 100 * 0.985, staD = 60 * 0.985, staH = 12 - 0.12;
// 上界:保留区域在剖切平面内的水平投影宽(取对角线长)x 层高
const diag = Math.sqrt(staW * staW + staD * staD);
const ok6 = staArea > 0 && staArea <= diag * staH + 1e-6;
if (!ok6) failures++;
console.log(`${ok6 ? "PASS" : "FAIL"} STA-F01 vertical 45°: got ${staArea.toFixed(2)}, expect 0 < area <= ${(diag * staH).toFixed(2)}`);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
