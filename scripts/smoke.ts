/**
 * 解算器冒烟测试（Node 侧，不依赖浏览器/DOM）
 * 运行：npx esbuild scripts/smoke.ts --bundle --platform=node --format=esm | node
 */
import assert from 'node:assert';
import { createSampleNetwork } from '../src/lib/sample';
import { solveNetwork, samplePipeProfile, nodePositionMap, leakFlow } from '../src/lib/solver';
import { computeAffectedBuildings, validateTopology } from '../src/lib/topology';
import type { LeakPoint } from '../src/types';

const network = createSampleNetwork();
const nodePos = nodePositionMap(network);

// 1) 拓扑完整性
const warnings = validateTopology(network);
assert.deepEqual(warnings, [], `拓扑告警应为空: ${warnings.join('; ')}`);
console.log(`✓ 拓扑完整：${network.nodes.length} 节点，${network.supplyPipes.length} 供水管段`);

// 2) 无泄漏基准解算
const base = solveNetwork(network, [], 120);
const supply = base.supply;
const root = network.nodes.find((n) => n.type === 'source')!;
assert.ok(Math.abs(supply.nodePressure[root.id] - 1.0) < 1e-9, '热源压力应为 1.0 MPa');

// 所有节点压力有定义且沿程递减
let prevMin = Infinity;
let allCovered = true;
for (const n of network.nodes) {
  const p = supply.nodePressure[n.id];
  if (typeof p !== 'number' || Number.isNaN(p)) allCovered = false;
  assert.ok(p > 0 && p <= 1.05, `${n.id} 压力越界: ${p}`);
}
assert.ok(allCovered, '所有节点必须有压力解');
console.log('✓ 全部节点压力解有效且在物理区间 (0, 1.05] MPa');

// 管段流量守恒：每个节点出流汇总 = 楼栋需求之和
const totalDemand = network.nodes
  .filter((n) => n.type === 'building')
  .reduce((s, n) => s + (n.demand ?? 0), 0);
const rootPipe = supply.pipes['P0'];
assert.ok(Math.abs(rootPipe.flow - totalDemand) < 1e-6, `热源出口流量 ${rootPipe.flow} 应等于总需求 ${totalDemand}`);
console.log(`✓ 流量守恒：热源出口 ${rootPipe.flow.toFixed(1)} m³/h = 楼栋总需求 ${totalDemand} m³/h`);

// 流速合理性（热水管网一般 0.3~3 m/s）
for (const pr of Object.values(supply.pipes)) {
  assert.ok(pr.velocity < 4, `流速异常: ${pr.pipeId} ${pr.velocity}`);
}
console.log('✓ 全部管段流速 < 4 m/s');

// 3) 沿程 0.5m 采样
const profile = samplePipeProfile(supply, network.supplyPipes[0], nodePos, 0.5);
const len = supply.pipes[network.supplyPipes[0].id].length;
assert.ok(Math.abs(profile[0].distance) < 1e-6, '采样起点距离为 0');
assert.ok(Math.abs(profile[profile.length - 1].distance - len) < 0.6, '采样终点≈管长');
assert.ok(profile.length >= Math.floor(len / 0.5), '采样密度达到 0.5m');
// 压力单调
for (let i = 1; i < profile.length; i++) {
  assert.ok(profile[i].pressure <= profile[i - 1].pressure + 1e-12, '供水压力应单调下降');
}
console.log(`✓ 沿程采样：${len.toFixed(1)}m 管段 ${profile.length} 点，压力单调下降`);

// 4) 回水视图
const ret = base.return;
assert.ok(ret.nodePressure[root.id] === 0.25, '回水热源压力 0.25 MPa');
for (const n of network.nodes) {
  const p = ret.nodePressure[n.id];
  assert.ok(p >= 0.25 - 1e-9, `${n.id} 回水压力不应低于热源`);
}
console.log('✓ 回水压力场：叶节点压力 ≥ 热源 0.25 MPa');

// 5) 泄漏场景：拆分管段 + 附加出流 + 受影响楼栋
const leak: LeakPoint = {
  id: 'LK1',
  pipeId: 'P6', // N2 -> N6 南支，下游含 B3/B4/B5/B6
  side: 'supply',
  t: 0.5,
  radius: 10,
};
const leaky = solveNetwork(network, [leak], 120);
const affected = computeAffectedBuildings(network, [leak]);
const expected = new Set(['B3', 'B4', 'B5', 'B6']);
assert.deepEqual(new Set([...affected].sort()), new Set([...expected].sort()),
  `受影响楼栋应为 B3-B6，实际: ${[...affected].join(',')}`);
console.log(`✓ 受影响楼栋拓扑判定正确：${[...affected].sort().join('、')}`);

// 泄漏增加系统总流量
const rootFlowLeak = leaky.supply.pipes['P0'].flow;
assert.ok(rootFlowLeak > rootPipe.flow, '泄漏后热源流量应增大');
assert.ok(Math.abs((rootFlowLeak - rootPipe.flow) - leakFlow(10)) < 1e-6, '流量增量应等于泄漏出流');
console.log(`✓ 泄漏附加出流：${leakFlow(10).toFixed(1)} m³/h，热源流量同步增大`);

// 泄漏管段存在分段采样折点
const leakProfile = samplePipeProfile(leaky.supply,
  network.supplyPipes.find((p) => p.id === 'P6')!, nodePos, 0.5);
assert.ok(leakProfile.length > 10, '泄漏管段仍可正常采样');
console.log(`✓ 泄漏管段沿程采样 ${leakProfile.length} 点正常`);

// 6) 超阈值标记
const strict = solveNetwork(network, [], 10);
const overCount = Object.values(strict.supply.pipes).filter((p) => p.overThreshold).length;
assert.ok(overCount > 0, '阈值收紧到 10 Pa/m 时应出现超限管段');
console.log(`✓ 超阈值描边判定：阈值 10 Pa/m 时 ${overCount} 条管段超限`);

console.log('\n全部冒烟测试通过 ✅');
