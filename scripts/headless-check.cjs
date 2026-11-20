/**
 * 无头浏览器运行时验证（CDP，无需第三方依赖）
 * 启动 Chrome headless -> 打开页面 -> 收集 console/页面异常 -> 验证渲染与交互
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:5173/';
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hnet-chrome-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--no-sandbox',
  `--user-data-dir=${userDir}`,
  '--remote-debugging-port=9222',
  '--window-size=1600,1000',
  'about:blank',
]);

function getJSON(pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port: 9222, path: pathname, method },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(JSON.parse(d)));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let target;
  for (let i = 0; i < 30; i++) {
    try {
      target = await getJSON('/json/new?about:blank', 'PUT');
      break;
    } catch {
      await sleep(300);
    }
  }
  if (!target) throw new Error('Chrome DevTools 未就绪');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleErrors = [];
  const pageErrors = [];

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.description ?? a.value).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');
  // 每次运行清空本地存储，保证与前次运行的状态隔离
  await send('Storage.clearDataForOrigin', { origin: 'http://127.0.0.1:5173', storageTypes: 'local_storage' });
  await send('Page.navigate', { url: URL });
  await sleep(6000); // 等待 React 挂载 + three.js 首帧

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval error');
    return r.result.value;
  };

  const results = {};
  results.title = await evalJs('document.title');
  results.canvasCount = await evalJs('document.querySelectorAll("canvas").length');
  results.webglOk = await evalJs(`(() => {
    const c = document.querySelector("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return !!gl;
  })()`);
  results.treeItems = await evalJs('document.querySelectorAll(".tree-item").length');
  results.labels3d = await evalJs('document.querySelectorAll(".node-label").length');
  results.pipePanelBefore = await evalJs('document.querySelectorAll(".pipe-panel").length');
  results.bandRows = await evalJs('document.querySelectorAll(".band-row").length');
  results.presetBtns = await evalJs('document.querySelectorAll(".preset-btn").length');

  // 模拟点击视口（多点网格尝试，直到命中管段）
  const pickInfo = await evalJs(`(async () => {
    const c = document.querySelector(".viewport canvas");
    const r = c.getBoundingClientRect();
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const tryClick = (fx, fy) => {
      // clientX/Y 是视口坐标：rect.left/top 已是视口内偏移，不能重复叠加
      const opts = { bubbles: true, clientX: r.left + r.width * fx, clientY: r.top + r.height * fy, button: 0, pointerId: 1, pointerType: "mouse" };
      c.dispatchEvent(new PointerEvent("pointerdown", opts));
      c.dispatchEvent(new PointerEvent("pointerup", opts));
    };
    const points = [];
    for (let ix = 0; ix <= 10; ix++) for (let iy = 0; iy <= 8; iy++) {
      points.push([0.08 + ix * 0.084, 0.12 + iy * 0.095]);
    }
    const mgr = document.querySelector(".viewport").__sceneManager;
    const sceneReady = mgr ? 1 : 0;
    let opened = false;
    for (const [fx, fy] of points) {
      tryClick(fx, fy);
      await sleep(60);
      if (document.querySelectorAll(".pipe-panel").length) { opened = true; break; }
    }
    return { opened, tried: points.length, sceneReady };
  })()`);
  results.pickInfo = pickInfo;
  await sleep(600);
  // 重置到全景预设，消除密集拾取可能引起的相机漂移，等待补间结束
  await evalJs(`document.querySelectorAll(".preset-btn")[0].click()`);
  await sleep(1400);
  results.pipePanelAfterPick = await evalJs('document.querySelectorAll(".pipe-panel").length');
  results.pipeTitle = await evalJs('document.querySelector(".pipe-panel .panel-title")?.textContent ?? null');
  results.chartSvgs = await evalJs('document.querySelectorAll(".profile-svg").length');
  results.chartPathPoints = await evalJs('document.querySelectorAll(".profile-svg path").length');
  results.endpointCards = await evalJs('document.querySelectorAll(".endpoint").length');

  // 先在当前（供水）管段弹窗里布置泄漏点，再测视图切换
  const addBtn = await evalJs(`!!document.querySelector(".leak-actions .btn.primary")`);
  results.addLeakButton = addBtn;
  if (addBtn) {
    await evalJs(`document.querySelector(".leak-actions .btn.primary").click()`);
    await sleep(900);
    results.leakCards = await evalJs('document.querySelectorAll(".leak-card").length');
    results.affectedChips = await evalJs('document.querySelectorAll(".affected-chip").length');
    results.leakChipText = await evalJs('document.querySelector(".leak-chip")?.textContent ?? null');
    // 三维泄漏标记（THREE 对象，经 SceneManager 验证）
    results.leakMarkerObjects = await evalJs(`document.querySelector(".viewport").__sceneManager.debugCountLeakMarkers()`);
    // 半径场属性已写入着色缓冲（aLeakC 存在非零值）
    results.leakFieldOnVertices = await evalJs(`document.querySelector(".viewport").__sceneManager.debugLeakFieldActive()`);
    // 调节半径滑杆（React 受控组件需用原生 value setter 再派发 input 事件）
    await evalJs(`const ranges = document.querySelectorAll('.leak-row input[type="range"]');
      const r = ranges[1];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(r, '20');
      r.dispatchEvent(new Event('input', { bubbles: true }));
      r.dispatchEvent(new Event('change', { bubbles: true }));`);
    await sleep(600);
    results.leakRadiusAfterSlider = await evalJs(`[...document.querySelectorAll('.leak-row b')].map(b=>b.textContent).join(',')`);
  }

  // 切换到回水 + 温度模式（供水泄漏标记应隐藏，回水视图正常）
  await evalJs(`[...document.querySelectorAll(".seg button")].find(b => b.textContent.includes("回水")).click()`);
  await sleep(400);
  await evalJs(`[...document.querySelectorAll(".seg button")].find(b => b.textContent.includes("温度")).click()`);
  await sleep(400);
  results.returnTempMode = await evalJs(`[...document.querySelectorAll(".seg button")].filter(b => b.classList.contains("active")).map(b=>b.textContent).join("|")`);
  results.leakMarkerHiddenOnReturn = await evalJs(`document.querySelector(".viewport").__sceneManager.debugCountLeakMarkers()`);

  // 切回供水/压力，泄漏标记应重新出现
  await evalJs(`[...document.querySelectorAll(".seg button")].find(b => b.textContent.includes("供水")).click()`);
  await sleep(300);
  await evalJs(`[...document.querySelectorAll(".seg button")].find(b => b.textContent.includes("压力")).click()`);
  await sleep(300);
  results.leakMarkerBackOnSupply = await evalJs(`document.querySelector(".viewport").__sceneManager.debugCountLeakMarkers()`);

  // 泄漏标记拖拽：先把泄漏标记世界坐标投影到屏幕，pointerdown 命中后沿管拖动
  const dragInfo = await evalJs(`(async () => {
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const c = document.querySelector(".viewport canvas");
    const r = c.getBoundingClientRect();
    const before = JSON.parse(localStorage.getItem("hnet.leaks.v1"))[0].t;

    // 找到泄漏标记的屏幕坐标（标记是视口内唯一的红色球体组）
    const mgr = document.querySelector(".viewport").__sceneManager;
    const screen = mgr.debugLeakMarkerScreen();
    if (!screen) return { before, after: before, moved: 0, reason: "no-marker" };
    const x0 = r.left + (screen.x + 1) / 2 * r.width;
    const y0 = r.top + (1 - screen.y) / 2 * r.height;
    const hitId = mgr.debugHitLeak(x0, y0);
    if (!hitId) return { before, after: before, moved: 0, reason: "hit-miss", screen, x0, y0 };
    const pid = 99;
    const down = { bubbles: true, cancelable: true, clientX: x0, clientY: y0, button: 0, buttons: 1, pointerId: pid, pointerType: "mouse", isPrimary: true };
    c.dispatchEvent(new PointerEvent("pointerdown", down));
    for (let i = 1; i <= 8; i++) {
      c.dispatchEvent(new PointerEvent("pointermove", { ...down, clientX: x0 + i * 14, clientY: y0 - i * 6 }));
      await sleep(30);
    }
    c.dispatchEvent(new PointerEvent("pointerup", { ...down, buttons: 0, clientX: x0 + 112, clientY: y0 - 48 }));
    await sleep(400);
    const after = JSON.parse(localStorage.getItem("hnet.leaks.v1"))[0].t;
    return { before, after, moved: Math.abs(after - before), screen, hitId };
  })()`);
  results.leakDrag = dragInfo;

  // 节点树联动定位
  await evalJs(`document.querySelector(".tree-item").click()`);
  await sleep(500);
  results.treeClickOk = true;

  // 导出 JSON（拦截下载，校验内容结构）
  const exportCheck = await evalJs(`(async () => {
    const blobSpy = [];
    const orig = URL.createObjectURL;
    URL.createObjectURL = (b) => { blobSpy.push(b.size); return "blob:spy"; };
    const revoke = URL.revokeObjectURL; URL.revokeObjectURL = () => {};
    const anchorCalls = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(){ anchorCalls.push(this.download); };
    [...document.querySelectorAll(".dropdown-menu button")][1].click(); // 着色方案
    HTMLAnchorElement.prototype.click = origClick;
    URL.createObjectURL = orig; URL.revokeObjectURL = revoke;
    return { downloads: anchorCalls, blobBytes: blobSpy };
  })()`);
  results.exportCheck = exportCheck;

  // localStorage 持久化
  results.storageKeys = await evalJs('Object.keys(localStorage).filter(k => k.startsWith("hnet"))');

  console.log(JSON.stringify({ results, consoleErrors, pageErrors }, null, 2));

  const fail = [];
  if (consoleErrors.length) fail.push('console.error: ' + consoleErrors.join(' || '));
  if (pageErrors.length) fail.push('未捕获异常: ' + pageErrors.join(' || '));
  if (!results.webglOk) fail.push('WebGL 上下文不可用');
  if (results.treeItems < 10) fail.push('节点树未渲染');
  if (results.bandRows !== 8) fail.push('色带不是 8 级');
  if (!results.pipePanelAfterPick) fail.push(`点选管段未弹出详情 (尝试 ${results.pickInfo?.tried} 个点击点)`);
  if (results.chartSvgs !== 2) fail.push('沿程曲线缺失');
  if (results.exportCheck.downloads.length !== 1) fail.push('导出未触发下载');
  if (!results.leakCards) fail.push('泄漏点未创建');
  if (!results.affectedChips) fail.push('受影响楼栋未标记');
  if (!results.leakMarkerObjects) fail.push('三维泄漏标记未渲染');
  if (!results.leakFieldOnVertices) fail.push('泄漏半径场未写入管面顶点');
  if (results.leakRadiusAfterSlider && !results.leakRadiusAfterSlider.includes('20m')) fail.push('半径滑杆未生效: ' + results.leakRadiusAfterSlider);
  if (results.leakMarkerHiddenOnReturn !== 0) fail.push('回水视图应隐藏供水泄漏标记');
  if (!results.leakMarkerBackOnSupply) fail.push('切回供水后泄漏标记应恢复');
  if (results.leakDrag && results.leakDrag.moved < 0.02) fail.push('泄漏点拖拽未改变 t 位置');

  ws.close();
  chrome.kill();
  if (fail.length) {
    console.error('\n❌ 运行时验证失败:\n - ' + fail.join('\n - '));
    process.exit(1);
  }
  console.log('\n✅ 无头浏览器运行时验证全部通过');
  process.exit(0);
})().catch((e) => {
  chrome.kill();
  console.error(e);
  process.exit(1);
});
