// 折叠后从低角度(近乎水平)观察,读取立起片背面的颜色,验证正反异色
const base = 'http://127.0.0.1:9222';
const tabs = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5174/' });
await new Promise((r) => setTimeout(r, 6000));
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;

await evalJs(`(() => {
  const store = window.__store;
  store.addTile('square', 0, 0);
  const b = store.addTile('square', 1.05, 0.03); store.tryPlace(b);
  store.standUp();
  // 折到 90°
  const key = store.getConns()[0].a;
  for (let i = 0; i < 6; i++) store.foldOnce(key, 1);
  // 相机转到几乎水平,从 +x 方向看立起的片
  const cam = window.__babylonScene.activeCamera;
  cam.alpha = 0;      // 从 +x 方向
  cam.beta = Math.PI / 2.05; // 近乎水平
  cam.radius = 6;
  cam.target.set(0.8, 0.4, 0);
})()`);
await new Promise((r) => setTimeout(r, 2500));
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync(process.argv[2], Buffer.from(shot.data, 'base64'));
console.log('saved', process.argv[2]);
await send('Page.close');
process.exit(0);
