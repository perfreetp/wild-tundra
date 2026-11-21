// 验证灯可拖动:改变 store 灯位 -> 场景灯泡与光源位置跟随
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
await send('Page.navigate', { url: 'http://127.0.0.1:5174/' });
await new Promise((r) => setTimeout(r, 6000));
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;

const r = await evalJs(`(async () => {
  const store = window.__store;
  const appScene = window.__appScene;
  // 放一片产生阴影
  store.addTile('square', 0, 0);
  await new Promise(r => setTimeout(r, 300));
  const lamp1 = appScene.lamps.find(l => l.id === 1);
  const before = { bulb: [lamp1.bulb.position.x, lamp1.bulb.position.z], light: [lamp1.light.position.x, lamp1.light.position.z] };
  // 模拟拖动灯到新位置
  store.moveLight(1, 6, 4);
  await new Promise(r => setTimeout(r, 300));
  const after = { bulb: [lamp1.bulb.position.x, lamp1.bulb.position.z], light: [lamp1.light.position.x, lamp1.light.position.z] };
  const hasShadowGen = lamp1.shadow.getShadowMap() !== null;
  return { before, after, shadowGenerator: hasShadowGen, lampCount: appScene.lamps.length };
})()`);
console.log(JSON.stringify(r, null, 2));
console.log('errors:', errs.length ? errs : 'none');
await send('Page.close');
process.exit(0);
