// 诊断：检查 marching tets 输出的边流形性
import { marchingTets } from '../src/reconCore.ts';
import { makeDemoVolume } from '../src/demoVolume.ts';

const vol = makeDemoVolume();
const raw = marchingTets(vol.dims, vol.data, 20, 200);
const nVert = raw.positions.length / 3;
console.log(`顶点 ${nVert}, 三角形 ${raw.indices.length / 3}`);

// 统计无向边使用次数
const edgeCount = new Map();
const idx = raw.indices;
for (let t = 0; t < idx.length; t += 3) {
  for (let e = 0; e < 3; e++) {
    const a = idx[t + e], b = idx[t + ((e + 1) % 3)];
    const key = a < b ? a * nVert + b : b * nVert + a;
    edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
  }
}
let bad = 0, boundary = 0;
for (const [, c] of edgeCount) {
  if (c === 1) boundary++;
  else if (c !== 2) bad++;
}
console.log(`边界边(1次): ${boundary}, 非流形边(>2次): ${bad}, 总边数: ${edgeCount.size}`);

// 定向一致性：每条有向边 (a→b) 应只出现一次，反向边 (b→a) 也必须存在
const dirCount = new Map();
for (let t = 0; t < idx.length; t += 3) {
  for (let e = 0; e < 3; e++) {
    const a = idx[t + e], b = idx[t + ((e + 1) % 3)];
    const key = a * nVert + b;
    dirCount.set(key, (dirCount.get(key) ?? 0) + 1);
  }
}
let sameDir = 0, unpaired = 0;
for (const [key, c] of dirCount) {
  if (c > 1) sameDir++;
  const a = Math.floor(key / nVert), b = key % nVert;
  if (!dirCount.has(b * nVert + a)) unpaired++;
}
console.log(`同向重复边: ${sameDir}, 无反向配对的边: ${unpaired}`);

// 检查重合顶点
const posMap = new Map();
let dup = 0;
for (let i = 0; i < nVert; i++) {
  const k = `${raw.positions[i * 3].toFixed(4)},${raw.positions[i * 3 + 1].toFixed(4)},${raw.positions[i * 3 + 2].toFixed(4)}`;
  if (posMap.has(k)) dup++;
  else posMap.set(k, i);
}
console.log(`重合顶点: ${dup}`);

// 检查退化三角形
let degen = 0;
for (let t = 0; t < idx.length; t += 3) {
  const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
  if (a === b || b === c || a === c) { degen++; continue; }
  const ax = raw.positions[a*3], ay = raw.positions[a*3+1], az = raw.positions[a*3+2];
  const bx = raw.positions[b*3], by = raw.positions[b*3+1], bz = raw.positions[b*3+2];
  const cx = raw.positions[c*3], cy = raw.positions[c*3+1], cz = raw.positions[c*3+2];
  const ux = bx-ax, uy = by-ay, uz = bz-az, vx = cx-ax, vy = cy-ay, vz = cz-az;
  const nx2 = uy*vz-uz*vy, ny2 = uz*vx-ux*vz, nz2 = ux*vy-uy*vx;
  if (nx2*nx2 + ny2*ny2 + nz2*nz2 < 1e-12) degen++;
}
console.log(`退化三角形: ${degen}`);
