// CDP 无头浏览器验证:真实加载页面,检查引擎、建路线、播放、导出
const BASE = "http://127.0.0.1:5199/";
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page" && t.url.includes("127.0.0.1:5199"));
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("CDP target not found");
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, e) => {
  ws.onopen = r;
  ws.onerror = e;
});

let msgId = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrors.push("EXCEPTION: " + msg.params.exceptionDetails.text);
  }
};
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.result?.exceptionDetails) {
    throw new Error("Eval failed: " + JSON.stringify(r.result.exceptionDetails));
  }
  return r.result.result.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.reload", { ignoreCache: true });
await sleep(2500); // 等待引擎初始化

const results = [];
function check(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${detail}`);
}

// 1. 引擎与初始 UI
const badge = await evaluate("document.getElementById('engineBadge').textContent");
check("引擎徽标已渲染", /WebGL2|WebGPU/.test(badge), badge);
const canvasSize = await evaluate(
  "JSON.stringify({w: renderCanvas.width, h: renderCanvas.height})"
);
check("画布有尺寸", JSON.parse(canvasSize).w > 0, canvasSize);

// 2. 构建演示路线
const built = await evaluate(`(async () => {
  window.mineCam.buildDemoRoute();
  await new Promise(r => setTimeout(r, 300));
  const s = window.mineCam.store.state;
  const route = s.routes.find(r => r.id === s.activeRouteId);
  const path = window.mineCam.getPaths().get(route.id);
  return JSON.stringify({
    kpCount: route.keyPoints.length,
    firstTime: route.keyPoints[0].time,
    lastTime: route.keyPoints.at(-1).time,
    monotonic: route.keyPoints.every((k,i)=> i===0 || k.time > route.keyPoints[i-1].time),
    fovs: route.keyPoints.map(k=>k.fov),
    duration: path.duration,
    length: path.totalLength,
    signEvents: path.signEvents.length,
    routeTubeMeshes: window.mineCam.getSceneMeshCount("route_"),
    kpSphereMeshes: window.mineCam.getSceneMeshCount("kp_"),
    tlMarkers: document.querySelectorAll('.tl-kp').length,
  });
})()`);
const b = JSON.parse(built);
check("演示路线 8 个关键点", b.kpCount === 8, String(b.kpCount));
check("到达时间首点为 0 且单调", b.firstTime === 0 && b.monotonic);
check("FOV 全部在 45~90", b.fovs.every((f) => f >= 45 && f <= 90), b.fovs.join(","));
check("路径时长>0", b.duration > 0, `${b.duration.toFixed(1)}s`);
check("生成标识牌注视事件", b.signEvents >= 1, `${b.signEvents} 个`);
check("场景生成路线圆管", b.routeTubeMeshes >= 1, `${b.routeTubeMeshes} 个`);
check("场景生成 8 个关键点标记", b.kpSphereMeshes === 8, `${b.kpSphereMeshes} 个`);
check("时间轴关键点标记", b.tlMarkers === 8);

// 3. 三条路线槽位与重命名
const routeInfo = await evaluate(`(() => {
  const s = window.mineCam.store.state;
  return JSON.stringify({ count: s.routes.length, ids: s.routes.map(r=>r.id) });
})()`);
check("3 条路线槽位", JSON.parse(routeInfo).count === 3);

// 4. 播放:seek 到中段并采样
const midFrame = await evaluate(`(async () => {
  const s = window.mineCam.store.state;
  const route = s.routes.find(r => r.id === s.activeRouteId);
  const path = window.mineCam.getPaths().get(route.id);
  const t = path.duration * 0.5;
  window.mineCam.seek(t);
  await new Promise(r => setTimeout(r, 200));
  const fr = path.sampleFrame(t);
  return JSON.stringify({
    fogMid: fr.fogPct, fov: fr.fov, gear: fr.speedGear,
    pos: [fr.position.x, fr.position.y, fr.position.z],
  });
})()`);
const m = JSON.parse(midFrame);
check("中段雾量在 0~60% 之间", m.fogMid > 10 && m.fogMid < 50, `${m.fogMid.toFixed(1)}%`);
check("中段 FOV 合法", m.fov >= 45 && m.fov <= 90);
check("速度档为 1/2/3", [1, 2, 3].includes(m.gear));

// 5. 播放推进与倍速
const playCheck = await evaluate(`(async () => {
  const s = window.mineCam.store.state;
  s.playbackRate = 2;
  window.mineCam.play();
  const t0 = s.playTime;
  await new Promise(r => setTimeout(r, 600));
  const t1 = s.playTime;
  s.playbackRate = 1;
  return JSON.stringify({ advanced: t1 > t0, dt: t1 - t0 });
})()`);
const p = JSON.parse(playCheck);
check("2x 播放时间推进", p.advanced, `Δt=${p.dt.toFixed(2)}`);

// 6. 编辑模式截图(含路线)
await evaluate("window.mineCam.store.silentUpdate ? null : null");
const shot1 = await send("Page.captureScreenshot", { format: "png" });
const fs = await import("node:fs");
fs.writeFileSync(".headless/cdp-edit.png", Buffer.from(shot1.result.data, "base64"));

// 7. 导出:拦截下载,验证内容
const exportCheck = await evaluate(`(async () => {
  const blobs = [];
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = (b) => { blobs.push(b); return origCreate(b); };
  document.getElementById('btnExportJson').click();
  document.getElementById('btnExportTrack').click();
  await new Promise(r => setTimeout(r, 200));
  URL.createObjectURL = origCreate;
  const jsonText = await blobs[0].text();
  const csvText = await blobs[1].text();
  const j = JSON.parse(jsonText);
  return JSON.stringify({
    jsonFormat: j.format,
    jsonRoutes: j.routes.length,
    jsonSettings: j.settings.fogEndPct,
    csvHeader: csvText.split("\\n")[0].split(",").length,
    csvRows: csvText.trim().split("\\n").length,
  });
})()`);
const ex = JSON.parse(exportCheck);
check("route.json 导出格式正确", ex.jsonFormat === "mine-escape-camera-route");
check("route.json 含 3 条路线", ex.jsonRoutes === 3);
check("route.json 含设置(雾 60%)", ex.jsonSettings === 60);
check("轨迹 CSV 13 列", ex.csvHeader === 13);
check("轨迹 CSV 含数据行", ex.csvRows > 50, `${ex.csvRows} 行`);

// 8. 控制台无错误
check("浏览器控制台无错误", consoleErrors.length === 0, consoleErrors.join(" | "));

// 9. 预览模式截图
const shot2 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(".headless/cdp-preview.png", Buffer.from(shot2.result.data, "base64"));

ws.close();
const failed = results.filter((r) => !r.ok);
console.log(`\\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
