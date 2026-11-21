// 模拟拖动接近:直接驱动场景的 snapPreview,验证整条边发光提示
const base = 'http://127.0.0.1:9222';
const tabs = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const errs = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown') errs.push(msg.params.exceptionDetails.text);
};
await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5174/' });
await new Promise((r) => setTimeout(r, 6000));
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;

// 放一片 base,再放一片靠近(在吸附半径内但未放下),用 findSnap 得到候选,手动置给场景 snapPreview
await evalJs(`(() => {
  const store = window.__store;
  store.addTile('square', 0, 0);
  const moving = store.addTile('square', 1.1, 0.08);
  // 通过几何库求候选
  const { findSnap } = window.__geom || {};
  return { movingId: moving.id };
})()`);

// 直接在页面里动态 import 几何库求 snap,再反射设置场景私有字段
const r = await evalJs(`(async () => {
  const geom = await import('/src/geometry/math.ts');
  const store = window.__store;
  const moving = store.getTiles()[1];
  const others = store.getTiles().filter(t => t.id !== moving.id);
  const snap = geom.findSnap(moving, others);
  const appScene = window.__appScene;
  // snapPreview 在 BabylonScene 包装类上
  appScene.snapPreview = snap;
  return snap ? { found: true, edge: snap.edgeIndex, other: snap.otherEdge } : { found: false };
})()`);
console.log('吸附候选:', JSON.stringify(r));
await new Promise((res) => setTimeout(res, 800));
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync(process.argv[2], Buffer.from(shot.data, 'base64'));
console.log('saved', process.argv[2], 'errors:', errs.length ? errs : 'none');
await send('Page.close');
process.exit(0);
