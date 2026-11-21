const base = 'http://127.0.0.1:9222';
const tabs = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } };
await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5174/' });
await new Promise((r) => setTimeout(r, 6000));
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
await evalJs(`(() => {
  const store = window.__store;
  store.addTile('square', 0, 0);
  const b = store.addTile('square', 1.05, 0.03); store.tryPlace(b);
  store.standUp();
  window.__key = store.getConns()[0].a;
})()`);
const r = await evalJs(`(() => {
  const store = window.__store;
  const k = window.__key;
  const log = [];
  for (let i = 0; i < 5; i++) {
    const v = store.foldOnce(k, 1);
    log.push(v === null ? null : Math.round(v*180/Math.PI));
  }
  return { key: k, steps: log, actual: Math.round(store.getConns()[0].fold*180/Math.PI) };
})()`);
console.log(JSON.stringify(r, null, 2));
await send('Page.close');
process.exit(0);
