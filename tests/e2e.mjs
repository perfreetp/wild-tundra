/**
 * 端到端冒烟测试（Puppeteer + 无头 WebGL/SwiftShader）：
 * 验证渲染管线、BVH 裁剪、三屏 200 次绘制预算、天气叠加、配置持久化往返。
 * 运行：node tests/e2e.mjs
 */
import puppeteer from 'puppeteer';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://localhost:5181';
const SHOTS = join(ROOT, 'tests', 'shots');
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const assert = (cond, msg) => {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    failures.push(msg);
    console.error(`  ❌ ${msg}`);
  }
};

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--window-size=1680,950',
  ],
  defaultViewport: { width: 1680, height: 950 },
});

try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle0' });

  // 1. 演示世界加载
  await page.waitForFunction(
    () => document.body.innerText.includes('演示线路加载完成'),
    { timeout: 15000 },
  );
  console.log('\n[1] 场景初始化');
  await sleep(2500); // 等若干帧渲染与统计上报

  const webglOk = await page.evaluate(() => {
    const c = document.querySelector('.viewport-container canvas');
    return !!c && c.width > 0 && c.height > 0;
  });
  assert(webglOk, 'WebGL canvas 已创建且有尺寸');

  const singleStats = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hud-card')];
    const budget = cards[0]?.querySelector('.hud-big')?.textContent ?? '';
    return {
      drawCalls: Number(budget.split('/')[0].trim()),
      text: cards.map((c) => c.innerText.replace(/\n/g, ' ')).join(' | '),
    };
  });
  console.log('   单视点 HUD:', singleStats.text);
  assert(singleStats.drawCalls > 0, `单视点有绘制调用（${singleStats.drawCalls}）`);
  assert(singleStats.drawCalls <= 200, '单视点绘制调用 ≤ 200');

  await page.screenshot({ path: join(SHOTS, '01-front.png') });

  // 2. 三屏同显 + 200 预算
  console.log('\n[2] 三屏同显');
  const tabs = await page.$$('.tab');
  await tabs[3].click();
  await sleep(2500);
  const tripleStats = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.hud-card')];
    return {
      drawCalls: Number(cards[0].querySelector('.hud-big').textContent.split('/')[0].trim()),
      over: !!cards[0].querySelector('.budget-warn'),
      text: cards.map((c) => c.innerText.replace(/\n/g, ' ')).join(' | '),
    };
  });
  console.log('   三屏 HUD:', tripleStats.text);
  assert(tripleStats.drawCalls > 0, `三屏有绘制调用（${tripleStats.drawCalls}）`);
  assert(tripleStats.drawCalls <= 200, `三屏总绘制调用 ≤ 200（实测 ${tripleStats.drawCalls}）`);
  await page.screenshot({ path: join(SHOTS, '02-triple.png') });

  // 3. 相机参数：FOV 30–90、near 0.5–5 边界
  console.log('\n[3] 视点相机参数边界');
  const fovRanges = await page.$$eval('input[type=range]', (els) =>
    els.map((e) => ({ min: e.min, max: e.max, step: e.step, value: e.value })),
  );
  const fov = fovRanges.find((r) => r.min === '30' && r.max === '90');
  const near = fovRanges.find((r) => r.min === '0.5' && r.max === '5');
  assert(!!fov, '存在 FOV 30–90° 滑条');
  assert(!!near, '存在近裁面 0.5–5m 滑条');

  // 切回前向单视点，调 FOV 到 30
  await tabs[0].click();
  await sleep(500);
  await page.evaluate(() => {
    const sliders = [...document.querySelectorAll('input[type=range]')];
    const fovSlider = sliders.find((s) => s.min === '30' && s.max === '90');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(fovSlider, '30');
    fovSlider.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(fovSlider, '30');
    fovSlider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(600);
  const fovValue = await page.$eval(
    '.view-block .slider-row',
    () => document.querySelectorAll('.slider-value')[0].textContent,
  );
  assert(fovValue.includes('30'), `FOV 可调整到下限 30°（显示 ${fovValue.trim()}）`);

  // 4. 灯光 0–3 档
  console.log('\n[4] 灯光档位');
  const levels = await page.$$('.level-pill');
  assert(levels.length === 4, '灯光 0–3 共 4 档');
  await levels[0].click();
  await sleep(300);
  const level0Active = await page.$eval('.level-pill.active', (e) => e.textContent);
  assert(level0Active.includes('灭灯'), '可切换到 0 档灭灯');
  await levels[3].click();
  await page.screenshot({ path: join(SHOTS, '03-light3.png') });

  // 5. 雨雾天气 + 能见度 50–500
  console.log('\n[5] 雨雾天气');
  const toggles = await page.$$('.switch');
  await toggles[0].click(); // 雾
  await toggles[1].click(); // 雨
  await sleep(400);
  const overlays = await page.evaluate(() => ({
    fog: !!document.querySelector('.fog-layer'),
    rain: !!document.querySelector('.rain-layer'),
  }));
  assert(overlays.fog && overlays.rain, '雾/雨叠加层均已出现');
  const visRange = await page.evaluate(() =>
    [...document.querySelectorAll('input[type=range]')].some(
      (e) => e.min === '50' && e.max === '500',
    ),
  );
  assert(visRange, '能见度滑条范围 50–500m');
  await page.screenshot({ path: join(SHOTS, '04-rain-fog.png') });

  // 6. 本地保存 + JSON 导出结构 + 导入还原
  console.log('\n[6] 持久化往返');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('保存到浏览器本地'),
    );
    btn.click();
  });
  await sleep(400);
  const saved = await page.evaluate(() => localStorage.getItem('train-cab-view:scene-config:v1'));
  assert(!!saved, '配置已写入 localStorage');
  const config = JSON.parse(saved);
  assert(config.schemaVersion === 1, 'schemaVersion = 1');
  for (const id of ['front', 'leftFront', 'rightFront']) {
    const v = config.views[id];
    assert(
      v && v.fov >= 30 && v.fov <= 90 && v.near >= 0.5 && v.near <= 5 &&
        Array.isArray(v.pose.position) && v.pose.position.length === 3,
      `${id} 视点含位置/朝向/FOV/近裁面`,
    );
  }
  assert(typeof config.weather.visibility === 'number', '天气参数已保存');

  // 改一个可辨识的值后导出到文件，再走真实文件选择器导入
  config.views.front.fov = 42;
  config.weather.visibility = 120;
  const tmpFile = join(ROOT, 'tests', 'roundtrip-config.json');
  writeFileSync(tmpFile, JSON.stringify(config, null, 2));
  // TopBar 中带 data-testid="file-config" 的场景配置文件输入
  const topbarConfigInput = await page.$('[data-testid="file-config"]');
  await topbarConfigInput.uploadFile(tmpFile);
  await page.waitForFunction(
    () => document.body.innerText.includes('配置导入成功，视点机位与天气状态已还原'),
    { timeout: 8000 },
  );
  await sleep(600);
  const restoredFov = await page.evaluate(() => {
    const sliders = [...document.querySelectorAll('input[type=range]')];
    return sliders.find((s) => s.min === '30' && s.max === '90')?.value;
  });
  assert(restoredFov === '42', `导入后 FOV 还原为 42（实测 ${restoredFov}）`);
  const restoredVis = await page.evaluate(() => {
    const sliders = [...document.querySelectorAll('input[type=range]')];
    return sliders.find((s) => s.min === '50' && s.max === '500')?.value;
  });
  assert(restoredVis === '120', `导入后能见度还原为 120m（实测 ${restoredVis}）`);

  // 7. GLB 线路模型加载（BVH 分块重建）
  console.log('\n[7] GLB 模型加载');
  const glbPath = join(ROOT, 'tests', 'assets', 'sample-line.glb');
  const modelInput = await page.$('[data-testid="file-model"]');
  await modelInput.uploadFile(glbPath);
  await page.waitForFunction(
    () => document.body.innerText.includes('模型加载完成'),
    { timeout: 10000 },
  );
  // 累积采样 2 秒：相机在运动，模型分块至少应在某些帧进入视锥（区分"被整体错误剔除"与"瞬时视锥外"）
  const modelSample = await page.evaluate(async () => {
    let maxVisible = 0;
    let maxCalls = 0;
    const start = performance.now();
    while (performance.now() - start < 2000) {
      const cards = [...document.querySelectorAll('.hud-card')];
      const vis = Number(cards[1].querySelector('strong').textContent.split('/')[0].trim());
      const calls = Number(cards[0].querySelector('.hud-big').textContent.split('/')[0].trim());
      maxVisible = Math.max(maxVisible, vis);
      maxCalls = Math.max(maxCalls, calls);
      await new Promise((r) => setTimeout(r, 100));
    }
    const total = Number(
      document.querySelectorAll('.hud-card')[1].querySelector('strong').textContent.split('/')[1].trim(),
    );
    return { maxVisible, maxCalls, total };
  });
  console.log('   模型加载后 2s 采样:', JSON.stringify(modelSample));
  assert(modelSample.maxCalls > 0 && modelSample.maxCalls <= 200, 'GLB 加载后渲染正常且不超预算');
  assert(modelSample.total >= 1, 'GLB 已切分为 BVH 分块');
  assert(modelSample.maxVisible > 0, `world 距离模式下模型分块可进入视锥（峰值可见 ${modelSample.maxVisible}）`);
  await page.screenshot({ path: join(SHOTS, '06-glb-loaded.png') });

  // 8. 中心线 JSON 导入（场景按新中心线重建）
  console.log('\n[8] 中心线导入');
  const centerlineInput = await page.$('[data-testid="file-centerline"]');
  await centerlineInput.uploadFile(join(ROOT, 'tests', 'assets', 'sample-centerline.json'));
  await page.waitForFunction(
    () => document.body.innerText.includes('中心线导入成功'),
    { timeout: 10000 },
  );
  await sleep(1500);
  const routeLen = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.hud-card')].find((c) =>
      c.innerText.includes('里程'),
    );
    return card.querySelector('small').textContent;
  });
  assert(/\d+\s*m/.test(routeLen), `中心线重建后里程刻度更新（${routeLen}）`);
  await page.screenshot({ path: join(SHOTS, '07-centerline.png') });

  // 9. 控制台错误检查（忽略 SwiftShader 无关警告）
  console.log('\n[9] 运行时错误检查');
  const realErrors = consoleErrors.filter(
    (e) => !/WebGL|swiftshader|GPU|stalled|Waiting for/i.test(e),
  );
  assert(realErrors.length === 0, `无未捕获运行时错误（${realErrors.length} 条）`);
  if (realErrors.length) console.error(realErrors.join('\n'));

  console.log(`\n截图目录: ${SHOTS}`);
} catch (err) {
  failures.push(`测试异常: ${err.stack || err.message}`);
  console.error('EXCEPTION:', err.stack || err.message);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n💀 ${failures.length} 项失败`);
  process.exit(1);
}
console.log('\n🎉 全部冒烟测试通过');
