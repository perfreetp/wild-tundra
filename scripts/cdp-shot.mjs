// 注入拼好的片,然后用 CDP 截图保存
const base = 'http://127.0.0.1:9222';
const target = process.argv[2];
const outPath = process.argv[3];
const tabs = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
};
await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: target });
await new Promise((r) => setTimeout(r, 6000));

const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

const mode = process.argv[4] ?? 'flat';
await evalJs(`(() => {
  const store = window.__store;
  const a = store.addTile('square', 0, 0);
  const b = store.addTile('square', 1.05, 0.03); store.tryPlace(b);
  const c = store.addTile('square', 2.05, 0.03); store.tryPlace(c);
  const tri = store.addTile('triangle', 0.05, 1.05); store.tryPlace(tri);
  const hex = store.addTile('hexagon', -1.6, 0.4); store.tryPlace(hex);
  const sec = store.addTile('sector', 2.2, 1.2); store.tryPlace(sec);
  if ('${mode}' === 'folded') {
    store.standUp();
    for (let i = 0; i < 4; i++) store.foldOnce(store.getConns()[0].a, 1);
  }
})()`);
await new Promise((r) => setTimeout(r, 3000));

const diag = await evalJs(`(() => {
  const scene = window.__babylonScene;
  return {
    storeTiles: window.__store.getTiles().length,
    storeConns: window.__store.getConns().length,
    sceneMeshes: scene ? scene.meshes.length : -1,
  };
})()`);
console.log('DIAG:', JSON.stringify(diag));

const shot = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
console.log('saved', outPath, 'errors:', errors.length ? errors : 'none');
await send('Page.close');
process.exit(0);
