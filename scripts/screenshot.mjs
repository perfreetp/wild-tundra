/**
 * 截图脚本：启动 vite preview（或 dev）并抓取页面截图，
 * 同时收集控制台错误，便于自动化验证。
 *
 * 用法：node scripts/screenshot.mjs [url] [outDir]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/?debug=1';
const outDir = process.argv[3] ?? 'screenshots';
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const errors = [];
const logs = [];
page.on('console', (msg) => {
  logs.push(`${msg.type()}: ${msg.text()}`);
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

const ready = await page
  .waitForFunction(() => window.__railview?.ready === true, { timeout: 30000 })
  .then(() => true)
  .catch(() => false);

// 等待若干帧渲染
await page.waitForTimeout(2500);

await page.screenshot({ path: path.join(outDir, 'desktop-1440.png') });

// 夜间 + 浓雾 + 叠加混合
await page.evaluate(() => {
  const api = window.__railview;
  const state = api.getState();
  state.night = true;
  state.fog = 0.63;
  state.colorTemp = 7300;
  state.layers.mid.blend = 'screen';
  state.layers.mid.opacity = 0.7;
  state.layers.far.opacity = 0.55;
  state.camera.pitch = 6;
  state.camera.yaw = -18;
  api.setState(state);
});
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outDir, 'night-1440.png') });

// 移动端布局（独立浏览器上下文，避免后台标签页的 rAF 节流）
const mobileBrowser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const mobileContext = await mobileBrowser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mobile = await mobileContext.newPage();
mobile.on('pageerror', (err) => errors.push(`mobile pageerror: ${err.message}`));
const mobileUrl = url.includes('?') ? url : `${url}?debug=1`;
await mobile.goto(mobileUrl, { waitUntil: 'networkidle', timeout: 60000 });
await mobile.waitForFunction(() => (window.__railview?.engine?.getStats().framesRendered ?? 0) > 3, { timeout: 40000 }).catch(() => {});
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: path.join(outDir, 'mobile-390.png'), fullPage: false });
await mobile.screenshot({ path: path.join(outDir, 'mobile-390-layers.png'), fullPage: true });
await mobileBrowser.close();

const pixelStats = await page.evaluate(() => {
  const canvas = document.getElementById('scene-canvas');
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  return {
    width: canvas.width,
    height: canvas.height,
    cssWidth: canvas.clientWidth,
    cssHeight: canvas.clientHeight,
    hasContext: Boolean(gl),
  };
});

await writeFile(
  path.join(outDir, 'report.json'),
  JSON.stringify({ ready, errors, pixelStats, logs: logs.slice(0, 80) }, null, 2),
  'utf8',
);

await browser.close();
console.log(JSON.stringify({ ready, errorCount: errors.length, pixelStats }, null, 2));
if (errors.length) {
  console.log('--- errors ---');
  console.log(errors.slice(0, 20).join('\n'));
  process.exitCode = 1;
}
if (!ready) process.exitCode = 1;
