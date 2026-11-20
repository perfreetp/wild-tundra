// 端到端冒烟测试（node 运行，驱动 http://localhost:5199 的真实页面）
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:5199';
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.app-header', { timeout: 15000 });
check('页面启动且 WASM 内核就绪', (await page.$('.boot-loading')) === null);

// ---------- 1. 生成三类基元 ----------
const btns = await page.$$('.primitive-buttons button');
await btns[0].click();
await btns[1].click();
await btns[2].click();
await page.waitForTimeout(300);
check('生成 3 个基元节点', (await page.$$('.tree-node')).length === 3);

// ---------- 2. 参数钳制与 6 方向（每次动作后重新取状态，避免旧快照） ----------
const r2 = await page.evaluate(async () => {
  const find = (t) => Object.values(window.__storeGet().tree.nodes).find((n) => n.type === t);
  const ball = find('ball'), tube = find('tube'), block = find('block');
  window.__storeGet().updateParams(ball.id, { radius: 999 });
  const high = window.__storeGet().tree.nodes[ball.id].params.radius;
  window.__storeGet().updateParams(ball.id, { radius: 1 });
  const low = window.__storeGet().tree.nodes[ball.id].params.radius;
  window.__storeGet().updateParams(tube.id, { wall: 99 });
  const wall = window.__storeGet().tree.nodes[tube.id].params.wall;
  window.__storeGet().updateParams(block.id, { dirs: ['+X', '-X', '+Y', '-Y', '+Z', '-Z'] });
  const dirs = window.__storeGet().tree.nodes[block.id].params.dirs.length;
  return { high, low, wall, dirs };
});
check('球半径钳制到上限 80', r2.high === 80, `got ${r2.high}`);
check('球半径钳制到下限 20', r2.low === 20, `got ${r2.low}`);
check('圆管壁厚不超过 (外径/2-1)=19', r2.wall === 19, `got ${r2.wall}`);
check('连接块 6 方向勾选', r2.dirs === 6);

// ---------- 3. 求值结果存在且体积为正 ----------
await page.waitForTimeout(400);
const vols = await page.evaluate(() =>
  Object.entries(window.__storeGet().geometryResults).map(([id, r]) => ({
    type: window.__storeGet().tree.nodes[id]?.type, volume: r.volume, error: r.error, hasManifold: !!r.manifold,
  })));
check('3 个基元全部求值成功',
  vols.every((v) => v.hasManifold && !v.error && v.volume > 0),
  vols.map((v) => `${v.type}:${v.volume.toFixed(0)}`).join(', '));

// ---------- 4. 三种布尔运算（均使用无祖先关系的实体） ----------
const boolResult = await page.evaluate(async () => {
  const find = (t) => Object.values(window.__storeGet().tree.nodes).find((n) => n.type === t);
  const ball = find('ball'), tube = find('tube'), block = find('block');
  const u = window.__storeGet().createBoolean('union', ball.id, tube.id);
  const d = window.__storeGet().createBoolean('difference', u, block.id);
  // 交集用 d 与新建的独立球，避免祖先关系
  const extraBall = window.__storeGet().addPrimitive('ball');
  const i = window.__storeGet().createBoolean('intersect', d, extraBall);
  await new Promise((r) => setTimeout(r, 600));
  return [u, d, i].map((id) => {
    const r = window.__storeGet().geometryResults[id];
    return { id, has: !!r?.manifold, error: r?.error ?? null, volume: r?.volume ?? 0 };
  });
});
check('并集/差集/交集三个布尔节点均求值成功',
  boolResult.every((b) => b.has && !b.error),
  boolResult.map((b) => `${b.volume.toFixed(0)}${b.error ? '/' + b.error : ''}`).join(', '));

// ---------- 5. 改上游参数触发下游重算（版本递增） ----------
const recompute = await page.evaluate(async () => {
  const ball = Object.values(window.__storeGet().tree.nodes).find((n) => n.type === 'ball');
  const before = window.__storeGet().tree.nodes[ball.id].version;
  window.__storeGet().updateParams(ball.id, { radius: 55 });
  await new Promise((r) => setTimeout(r, 500));
  return { before, after: window.__storeGet().tree.nodes[ball.id].version };
});
check('改上游半径后版本递增触发重算', recompute.after === recompute.before + 1);

// ---------- 6. 静音 ----------
const mute = await page.evaluate(async () => {
  const ball = Object.values(window.__storeGet().tree.nodes).find((n) => n.type === 'ball');
  window.__storeGet().toggleMute(ball.id);
  await new Promise((r) => setTimeout(r, 300));
  const noManifold = !window.__storeGet().geometryResults[ball.id].manifold;
  window.__storeGet().toggleMute(ball.id);
  await new Promise((r) => setTimeout(r, 300));
  const restored = !!window.__storeGet().geometryResults[ball.id].manifold;
  return { noManifold, restored };
});
check('静音基元后求值为空，取消静音后恢复', mute.noManifold && mute.restored);

// ---------- 7. 重排校验：禁止子节点排到父节点之前 ----------
const reorder = await page.evaluate(() => {
  const topOp = Object.values(window.__storeGet().tree.nodes).find((n) => n.parentId == null && n.kind === 'operation');
  const childId = topOp.children[0];
  const rejected = window.__storeGet().reorderNode(childId, topOp.id, 'before') === false;
  // 合法重排：根节点之间 after 重排应成功
  const roots = window.__storeGet().tree.rootIds;
  const accepted = roots.length > 1 ? window.__storeGet().reorderNode(roots[1], roots[0], 'after') : true;
  return { rejected, accepted };
});
check('子节点拖到父节点之前被拒绝，合法同级重排放行', reorder.rejected && reorder.accepted);

// ---------- 8. 干涉检查 ----------
const interference = await page.evaluate(async () => {
  const find = (t) => Object.values(window.__storeGet().tree.nodes).find((n) => n.type === t);
  const ball = find('ball'), tube = find('tube');
  window.__storeGet().updateTransform(tube.id, { position: [0, 0, 0] });
  await new Promise((r) => setTimeout(r, 400));
  window.__storeGet().setSelected([ball.id, tube.id]);
  await new Promise((r) => setTimeout(r, 150)); // 等 React 重渲染，按钮解除 disabled
  document.querySelector('.viewport-toolbar button.primary')?.click();
  await new Promise((r) => setTimeout(r, 300));
  const it = window.__storeGet().interference;
  return { volume: it?.volume, empty: it?.empty, hasGeo: !!it?.geometry };
});
check('干涉检查返回正重叠体积并生成高亮几何',
  interference.hasGeo && !interference.empty && interference.volume > 0,
  `vol=${interference.volume?.toFixed(1)}`);

// ---------- 9. 装配 ----------
const asm = await page.evaluate(() => {
  const root = Object.values(window.__storeGet().tree.nodes).find((n) => n.parentId == null);
  window.__storeGet().addAssemblyItem(root.id, [0, 0, 0]);
  window.__storeGet().addAssemblyItem(root.id, [300, 0, 0]);
  return window.__storeGet().assembly.length;
});
check('装配清单加入 2 项', asm === 2);

// ---------- 10. IndexedDB 存/读 ----------
const idb = await page.evaluate(async () => {
  const beforeCount = Object.keys(window.__storeGet().tree.nodes).length;
  await window.__storeGet().saveProject();
  const ok = await window.__storeGet().loadProject();
  await new Promise((r) => setTimeout(r, 400));
  return { ok, beforeCount, afterCount: Object.keys(window.__storeGet().tree.nodes).length, asm: window.__storeGet().assembly.length };
});
check('IndexedDB 保存并读回工程', idb.ok && idb.afterCount === idb.beforeCount && idb.asm === 2, JSON.stringify(idb));

// ---------- 11. STL / GLB 导出 ----------
const downloads = [];
page.on('download', async (d) => {
  const path = await d.path();
  downloads.push({ filename: d.suggestedFilename(), path, bytes: readFileSync(path).length });
});
await page.evaluate(() => window.__storeGet().setTab('export'));
await page.waitForSelector('.export-actions');
await page.click('text=导出二进制 STL（STLExporter）');
await page.waitForTimeout(600);
await page.click('text=导出 GLB');
await page.waitForTimeout(900);
const stl = downloads.find((d) => d.filename.endsWith('.stl'));
const glb = downloads.find((d) => d.filename.endsWith('.glb'));
check('二进制 STL 已下载且含内容', !!stl && stl.bytes > 512, stl ? `${stl.bytes}B` : '无下载');
check('GLB 已下载且魔数正确',
  !!glb && glb.bytes > 100 && readFileSync(glb.path).subarray(0, 4).toString() === 'glTF',
  glb ? `${glb.bytes}B` : '无下载');
if (stl) check('STL 为二进制（非 ASCII solid 头）', readFileSync(stl.path).subarray(0, 5).toString() !== 'solid');

// ---------- 12. 12 级布尔链深度限制 ----------
const depth = await page.evaluate(async () => {
  Object.keys(window.__storeGet().tree.nodes).forEach((id) => window.__storeGet().deleteNode(id));
  const deepLeaf = window.__storeGet().addPrimitive('ball'); // 链的最深叶子
  let prev = deepLeaf;
  let built = 0;
  for (let k = 0; k < 13; k++) {
    const extra = window.__storeGet().addPrimitive('ball');
    const merged = window.__storeGet().createBoolean('union', prev, extra);
    if (!merged) break;
    prev = merged;
    built++;
  }
  await new Promise((r) => setTimeout(r, 500));
  // 改最深层叶子，触发沿链向上的重算（链长 13 > 12 级上限）
  window.__storeGet().updateParams(deepLeaf, { radius: 30 });
  await new Promise((r) => setTimeout(r, 800));
  return { truncated: window.__storeGet().recompute.truncated, built, total: window.__storeGet().recompute.total };
});
check('超过 12 级布尔链给出截断标记', depth.truncated === true && depth.built === 13, JSON.stringify(depth));

check('运行期无控制台错误', errors.length === 0, errors.slice(0, 3).join(' | '));

await page.screenshot({ path: 'e2e-screenshot.png' });
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
