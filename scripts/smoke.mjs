// 冒烟测试:验证 manifold 布尔剖切逻辑(在 Node 中直接运行,不经过 Vite)
import Module from 'manifold-3d';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const wasm = await Module();
wasm.setup();
const { Manifold } = wasm;

const rawProfile = [
  [-5, 0], [-5, 3], [-4.6, 4.4], [-3.6, 5.5], [-2.1, 6.3],
  [0, 6.6], [2.1, 6.3], [3.6, 5.5], [4.6, 4.4], [5, 3], [5, 0],
];

// 与 src/lib/manifold.ts 中 ensureCCW 相同的逻辑
function ensureCCW(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  return area >= 0 ? pts : [...pts].reverse();
}
const profile = ensureCCW(rawProfile);
const stepLength = 2, totalSteps = 8, cutAngle = 45, tiltAngle = 30;
const L = stepLength * totalSteps;

let maxR = 1;
for (const [x, y] of profile) maxR = Math.max(maxR, Math.abs(x), Math.abs(y));
const S = (maxR * 2 + L) * 4;

const prism = Manifold.extrude(profile, L);
const v0 = prism.volume();
console.log('初始体积:', v0.toFixed(2), '(理论值 ≈ 断面面积 × 长度)');

let prev = Infinity;
let ok = true;
for (let i = 0; i <= totalSteps; i++) {
  let remaining, vol;
  if (i === 0) {
    vol = v0;
  } else {
    const cutter = Manifold.cube([S, S, S])
      .translate([-S / 2, -S / 2, -S])
      .rotate([0, tiltAngle, 0])
      .rotate([0, 0, cutAngle])
      .translate([0, 0, i * stepLength]);
    remaining = Manifold.difference(prism, cutter);
    vol = remaining.volume();
    const mesh = remaining.getMesh();
    if (mesh.numVert === 0 && i < totalSteps) { console.error(`步 ${i}: 网格为空`); ok = false; }
    cutter.delete();
    remaining.delete();
  }
  if (vol > prev + 1e-6) { console.error(`步 ${i}: 体积回升 ${prev} -> ${vol}`); ok = false; }
  console.log(`步 ${i}: 剩余体积 ${vol.toFixed(2)} m³ (${(vol / v0 * 100).toFixed(1)}%)`);
  prev = vol;
}

// 垂直剖切(tilt=0)时,体积应严格线性递减
console.log('\n--- tilt=0 线性校验 ---');
for (let i = 0; i <= totalSteps; i += totalSteps) {
  const cutter = Manifold.cube([S, S, S])
    .translate([-S / 2, -S / 2, -S])
    .rotate([0, 0, 0])
    .rotate([0, 0, 90])
    .translate([0, 0, i * stepLength]);
  const rem = i === 0 ? null : Manifold.difference(prism, cutter);
  const vol = i === 0 ? v0 : rem.volume();
  const expect = v0 * (1 - i / totalSteps);
  console.log(`步 ${i}: ${vol.toFixed(2)} vs 期望 ${expect.toFixed(2)} 误差 ${(Math.abs(vol - expect) / v0 * 100).toFixed(3)}%`);
  if (Math.abs(vol - expect) / v0 > 0.01) { console.error('线性校验失败'); ok = false; }
  cutter.delete();
  rem?.delete();
}

prism.delete();
console.log(ok ? '\nSMOKE TEST PASSED' : '\nSMOKE TEST FAILED');
process.exit(ok ? 0 : 1);
