// 核心算法冒烟测试：node test/smoke.mjs
import Module from 'manifold-3d';
import { marchingTets, repairWithManifold, sampleValues } from '../src/reconCore.ts';
import { makeDemoVolume } from '../src/demoVolume.ts';

let failures = 0;
function check(name, cond, extra = '') {
  const ok = !!cond;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
  if (!ok) failures++;
}

const vol = makeDemoVolume();
const [nx, ny, nz] = vol.dims;
console.log(`体数据 ${nx}x${ny}x${nz}, 范围 [${vol.min}, ${vol.max}]`);

// 1. marching tetrahedra
const t0 = performance.now();
const raw = marchingTets(vol.dims, vol.data, 20, 200);
const t1 = performance.now();
check('marching tets 产出非空网格', raw.positions.length > 0 && raw.indices.length > 0);
check('索引数量为 3 的倍数', raw.indices.length % 3 === 0);
check('索引均在顶点范围内', raw.indices.every((i) => i < raw.positions.length / 3));
const nVert = raw.positions.length / 3;
check('顶点坐标在体数据范围内(含1体素padding)',
  raw.positions.every((p, i) => p >= -1 && p <= [nx, ny, nz][i % 3]));
console.log(`  原始网格: ${nVert} 顶点, ${raw.indices.length / 3} 三角形, ${(t1 - t0).toFixed(0)} ms`);

// 2. manifold 修复 + 去小块
const M = await Module();
M.setup();
const { mesh, components, repaired } = await repairWithManifold(M, raw);
check('manifold 修复成功', repaired);
check('修复后只剩 1 个连通分量（噪点小块被清除）', components === 1, `components=${components}`);
check('修复后网格非空', mesh.indices.length > 0);

// 验证修复结果是合法流形（能被 Manifold 接受且体积合理）
const m2 = new M.Mesh({ numProp: 3, vertProperties: mesh.positions, triVerts: mesh.indices });
const man2 = new M.Manifold(m2);
check('修复结果仍是流形', !man2.isEmpty());
const volume = man2.volume();
const expect = (4 / 3) * Math.PI * 34 * 28 * 38; // 椭球理论体积
check('体积接近椭球理论值', Math.abs(volume - expect) / expect < 0.3,
  `体积=${volume.toFixed(0)}, 理论=${expect.toFixed(0)}`);
man2.delete();

// 3. CT 值采样
const values = sampleValues(vol.dims, vol.data, mesh.positions);
check('采样值数量与顶点数一致', values.length === mesh.positions.length / 3);
check('采样值在体数据值域内', values.every((v) => v >= vol.min && v <= vol.max));
const inBand = values.filter((v) => v >= -50 && v <= 250).length / values.length;
check('大部分表面顶点采样值接近阈值带', inBand > 0.9, `${(inBand * 100).toFixed(1)}%`);

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
