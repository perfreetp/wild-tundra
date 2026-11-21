// 验证:1) 拖动已连接片 -> 黄色断开描边;2) 重叠 -> overlapIds 红色信号
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

const r1 = await evalJs(`(() => {
  const store = window.__store;
  const a = store.addTile('square', 0, 0);
  const b = store.addTile('square', 1.05, 0.03);
  store.tryPlace(b);
  const connsBefore = store.getConns().length;
  // 模拟拖动开始:detachTile
  store.detachTile(b.id);
  return {
    connsBefore,
    connsAfterDetach: store.getConns().length,
    brokenEdges: store.brokenEdges(),
  };
})()`);
console.log('断开贴合:', JSON.stringify(r1, null, 2));

const r2 = await evalJs(`(() => {
  const store = window.__store;
  // 硬放一片在已有片内部,触发重叠(无吸附路径)
  const over = store.addTile('square', 0.2, 0.2);
  store.tryPlace(over);
  return { overlapSignal: store.overlapIds(), tileCount: store.getTiles().length };
})()`);
console.log('重叠红色信号:', JSON.stringify(r2, null, 2));
await new Promise((r) => setTimeout(r, 700));
const r3 = await evalJs(`(() => ({ overlapCleared: window.__store.overlapIds().length === 0 }))()`);
console.log('抖动后自动清除:', JSON.stringify(r3));
console.log('errors:', errs.length ? errs : 'none');
await send('Page.close');
process.exit(0);
