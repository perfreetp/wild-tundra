// 模拟点击折叠面板的 +/- 按钮,验证 UI -> store -> 渲染链路
const base = 'http://127.0.0.1:9222';
const tabs = await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
};
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
})()`);
await new Promise((r) => setTimeout(r, 800));

// 用真实鼠标事件派发,每次让出帧,验证按钮 -> store 累积
await evalJs(`(async () => {
  const click = (sel) => {
    const btn = [...document.querySelectorAll('.fold-controls .btn')].find((b) => b.textContent.trim() === sel);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  for (let i = 0; i < 3; i++) {
    click('+');
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 40));
  }
})()`);
await new Promise((r) => setTimeout(r, 500));
const result = await evalJs(`(() => {
  const store = window.__store;
  return { after3ClicksDeg: Math.round(store.getConns()[0].fold * 180 / Math.PI), angleText: document.querySelector('.fold-angle')?.textContent };
})()`);
await evalJs(`(() => {
  const btn = [...document.querySelectorAll('.fold-controls .btn')].find((b) => b.textContent.trim() === '−');
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
})()`);
await new Promise((r) => setTimeout(r, 500));
const afterMinus = await evalJs(`Math.round(window.__store.getConns()[0].fold * 180 / Math.PI)`);
console.log(JSON.stringify({ ...result, afterMinusDeg: afterMinus }, null, 2));
console.log('errors:', errors.length ? errors : 'none');
await send('Page.close');
process.exit(0);
