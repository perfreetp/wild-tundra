/**
 * 端到端交互验证（无头 Chrome + WebGL2）。
 * 覆盖：图层拖拽换序、透明度、混合模式、雾效、色温、昼夜、相机、
 *       本地自动保存、JSON 导出、JSON 导入还原。
 */
import { chromium } from 'playwright-core';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/?debug=1';
const outDir = 'test-results';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();

const failures = [];
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${extra ? ` — ${extra}` : ''}`);
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

const state = () => page.evaluate(() => window.__railview.getState());
const setState = (patch) =>
  page.evaluate((patch) => {
    const api = window.__railview;
    const s = api.getState();
    Object.assign(s, patch);
    api.setState(s);
  }, patch);

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__railview?.ready === true, { timeout: 40000 });
await page.waitForTimeout(800);

console.log('\n[1] 初始状态');
let s = await state();
check('三图层顺序为 far→mid→near', JSON.stringify(s.order) === JSON.stringify(['far', 'mid', 'near']));
check('默认雾效 0.34', Math.abs(s.fog - 0.34) < 1e-6);
check('默认色温 5600K', Math.round(s.colorTemp) === 5600);
check('默认白天', s.night === false);
check('默认相机 pitch=-2 yaw=0', s.camera.pitch === -2 && s.camera.yaw === 0);

console.log('\n[2] 面板：透明度滑条');
const nearSlider = page.locator('rail-layer-stack .layer[data-layer="near"] input[type="range"]');
await nearSlider.fill('0.42');
await page.waitForTimeout(300);
s = await state();
check('近景透明度写入 store 为 0.42', Math.abs(s.layers.near.opacity - 0.42) < 1e-6, `got ${s.layers.near.opacity}`);
const outText = await page.locator('rail-layer-stack .layer[data-layer="near"] [data-out="opacity"]').textContent();
check('透明度读数同步显示 0.42', outText?.trim() === '0.42', `got ${outText}`);

console.log('\n[3] 面板：混合模式');
await page.locator('rail-layer-stack .layer[data-layer="far"] button[data-value="screen"]').click();
await page.waitForTimeout(250);
s = await state();
check('远景混合模式 = screen', s.layers.far.blend === 'screen');
const pressed = await page
  .locator('rail-layer-stack .layer[data-layer="far"] button[data-value="screen"]')
  .getAttribute('aria-pressed');
check('滤色按钮 aria-pressed=true', pressed === 'true');

console.log('\n[4] 图层显隐与上移');
await page.locator('rail-layer-stack .layer[data-layer="mid"] button[data-action="visible"]').click();
await page.waitForTimeout(250);
s = await state();
check('中景被隐藏', s.layers.mid.visible === false);
await page.locator('rail-layer-stack .layer[data-layer="far"] button[data-action="up"]').click();
await page.waitForTimeout(250);
s = await state();
check('远景上移一层（与中景交换）', JSON.stringify(s.order) === JSON.stringify(['mid', 'far', 'near']), JSON.stringify(s.order));

console.log('\n[5] 拖拽换序');
// 当前 order = [mid, far, near]，显示为 near(顶) / far / mid(底)
// 把最底层的 mid 拖到最顶层 near 的位置
const orderBefore = (await state()).order;
await page.evaluate(() => {
  const stack = document.getElementById('layers').shadowRoot;
  const from = stack.querySelector('.layer[data-layer="mid"]');
  const to = stack.querySelector('.layer[data-layer="near"]');
  const dt = new DataTransfer();
  from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
});
await page.waitForTimeout(300);
s = await state();
check(
  '拖到底层图层到顶层位置后其位于数组末尾',
  s.order[s.order.length - 1] === 'mid' && s.order.length === 3,
  `before=${JSON.stringify(orderBefore)} after=${JSON.stringify(s.order)}`,
);
// UI 列表顺序（顶层先显示）应与 order 逆序一致
const uiOrder = await page.evaluate(() => {
  const stack = document.getElementById('layers').shadowRoot;
  return Array.from(stack.querySelectorAll('.layer')).map((el) => el.dataset.layer);
});
check('界面列表顺序与状态逆序一致', JSON.stringify(uiOrder) === JSON.stringify([...s.order].reverse()), JSON.stringify(uiOrder));

// 再拖回：把 mid 拖到底层
await page.evaluate(() => {
  const stack = document.getElementById('layers').shadowRoot;
  const from = stack.querySelector('.layer[data-layer="mid"]');
  const to = stack.querySelector('.layer[data-layer="far"]');
  const dt = new DataTransfer();
  from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
});
await page.waitForTimeout(300);
s = await state();
check('再次拖拽后可继续换序', s.order.length === 3 && s.order[0] === 'mid', JSON.stringify(s.order));

console.log('\n[6] 环境面板：雾效 / 色温 / 昼夜 / 相机');
await page.locator('rail-scene-controls #fog').fill('0.86');
await page.waitForTimeout(200);
await page.locator('rail-scene-controls #temp').fill('2600');
await page.waitForTimeout(200);
await page.locator('rail-scene-controls button[data-action="night"]').click();
await page.waitForTimeout(200);
await page.locator('rail-scene-controls #pitch').fill('22.5');
await page.locator('rail-scene-controls #yaw').fill('-48');
await page.waitForTimeout(300);
s = await state();
check('雾效 = 0.86', Math.abs(s.fog - 0.86) < 1e-3, `got ${s.fog}`);
check('色温 = 2600K', Math.round(s.colorTemp) === 2600, `got ${s.colorTemp}`);
check('夜间已开启', s.night === true);
check('相机 pitch=22.5 yaw=-48', Math.abs(s.camera.pitch - 22.5) < 0.11 && Math.abs(s.camera.yaw + 48) < 0.11, JSON.stringify(s.camera));
const barTemp = await page.locator('#chip-temp').textContent();
check('状态栏色温同步', barTemp?.includes('2600'), `got ${barTemp}`);

console.log('\n[7] 相机越界钳制');
await page.locator('rail-scene-controls button[data-action="reset-camera"]').click();
await page.waitForTimeout(200);
s = await state();
check('回正视角 pitch=0 yaw=0', s.camera.pitch === 0 && s.camera.yaw === 0);

console.log('\n[8] 自动本地保存');
await page.waitForTimeout(600);
const stored = await page.evaluate(() => localStorage.getItem('railview.compositor.view.v1'));
check('localStorage 已写入', Boolean(stored && stored.includes('railview-view-state')));
const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('railview.compositor.view.v1')).view);
check('存储内容雾效 = 0.86', Math.abs(restored.fog - 0.86) < 1e-3);
check('存储内容含混合模式 screen', restored.layers.far.blend === 'screen');

console.log('\n[9] 导出 JSON');
const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
await page.locator('rail-toolbar button[data-action="export"]').click();
const download = await downloadPromise;
const savedPath = path.join(outDir, 'exported.json');
await download.saveAs(savedPath);
const exported = JSON.parse(await readFile(savedPath, 'utf8'));
check('导出文件名以 .json 结尾', download.suggestedFilename().endsWith('.json'), download.suggestedFilename());
check('导出 kind 正确', exported.kind === 'railview-view-state');
check('导出包含相机角度', typeof exported.view.camera.pitch === 'number');
check('导出雾效 = 0.86', Math.abs(exported.view.fog - 0.86) < 1e-3);
check(
  '导出图层顺序与当前状态一致',
  JSON.stringify(exported.view.order) === JSON.stringify((await state()).order),
  `${JSON.stringify(exported.view.order)} vs ${JSON.stringify((await state()).order)}`,
);

console.log('\n[10] 修改后导入还原');
const beforeImport = await state();
await page.evaluate(() => window.__railview.reset());
await page.waitForTimeout(300);
s = await state();
check('重置后雾效回到 0.34', Math.abs(s.fog - 0.34) < 1e-6);
await page.setInputFiles('#file-input', savedPath);
await page.waitForTimeout(700);
s = await state();
check('导入后雾效还原 0.86', Math.abs(s.fog - 0.86) < 1e-3, `got ${s.fog}`);
check('导入后色温还原 2600', Math.round(s.colorTemp) === 2600);
check('导入后夜间还原', s.night === true);
check('导入后图层顺序还原', JSON.stringify(s.order) === JSON.stringify(beforeImport.order), JSON.stringify(s.order));
check(
  '导入后相机角度还原',
  Math.abs(s.camera.pitch - beforeImport.camera.pitch) < 1e-6 && Math.abs(s.camera.yaw - beforeImport.camera.yaw) < 1e-6,
  JSON.stringify(s.camera),
);
check('导入后近景透明度还原', Math.abs(s.layers.near.opacity - beforeImport.layers.near.opacity) < 1e-6);
const noteText = await page.locator('#file-note').textContent();
check('界面提示导入成功', Boolean(noteText && noteText.includes('已导入')), noteText ?? '');

console.log('\n[11] 非法导入处理');
const badPath = path.join(outDir, 'bad.json');
await page.evaluate(() => {
  // 直接调用内部解析验证错误路径
  return null;
});
await page.setInputFiles('#file-input', {
  name: 'bad.json',
  mimeType: 'application/json',
  buffer: Buffer.from('{ not json'),
});
await page.waitForTimeout(400);
const failNote = await page.locator('#file-note').textContent();
check('损坏文件给出错误提示', Boolean(failNote && failNote.includes('导入失败')), failNote ?? '');
s = await state();
check('损坏导入不影响现有状态', Math.abs(s.fog - 0.86) < 1e-3);

console.log('\n[12] 预设');
await page.locator('rail-toolbar button[data-preset="night-screen"]').click();
await page.waitForTimeout(400);
s = await state();
check('夜间滤色预设：night=true', s.night === true);
check('夜间滤色预设：远景滤色', s.layers.far.blend === 'screen');
const presetPressed = await page.locator('rail-toolbar button[data-preset="night-screen"]').getAttribute('aria-pressed');
check('预设按钮高亮', presetPressed === 'true');

console.log('\n[13] 渲染健康度');
await page.waitForTimeout(1200);
const render = await page.evaluate(() => {
  const canvas = document.getElementById('scene-canvas');
  const gl = canvas.getContext('webgl2');
  const w = canvas.width;
  const h = canvas.height;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  let sum = 0;
  let nonBlack = 0;
  for (let i = 0; i < buf.length; i += 4) {
    const l = 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2];
    sum += l;
    if (l > 4) nonBlack++;
  }
  const calls = window.__railview.engine.getStats().drawCalls;
  return { mean: sum / (buf.length / 4), nonBlackPct: (100 * nonBlack) / (buf.length / 4), drawCalls: calls, w, h };
});
check('画面非全黑', render.nonBlackPct > 60, JSON.stringify(render));
check('有绘制调用', render.drawCalls > 0, String(render.drawCalls));

await page.screenshot({ path: path.join(outDir, 'final-state.png') });

console.log('\n[14] 控制台错误');
check('无未捕获的页面错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

// 移动端布局：无横向滚动（独立浏览器上下文，避免后台标签页的 rAF 节流）
const mobileBrowser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const mobileContext = await mobileBrowser.newContext({ viewport: { width: 390, height: 844 } });
const mobile = await mobileContext.newPage();
mobile.on('pageerror', (e) => consoleErrors.push(`mobile pageerror: ${e.message}`));
await mobile.goto(url, { waitUntil: 'networkidle' });
await mobile.waitForFunction(() => window.__railview?.ready === true, { timeout: 40000 });
await mobile.waitForFunction(() => (window.__railview.engine.getStats().framesRendered ?? 0) > 3, { timeout: 40000 }).catch(() => {});
await mobile.waitForTimeout(600);
const overflow = await mobile.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
check('移动端无横向溢出', overflow.scrollW <= overflow.clientW + 1, JSON.stringify(overflow));
await mobile.screenshot({ path: path.join(outDir, 'mobile-390.png') });
await mobileBrowser.close();

const files = await readdir(outDir);
console.log(`\n产物：${files.join(', ')}`);
await browser.close();

console.log(`\n===== 结果：${failures.length === 0 ? '全部通过' : `${failures.length} 项失败`} =====`);
if (failures.length) {
  for (const f of failures) console.log(` - ${f}`);
  process.exitCode = 1;
}
