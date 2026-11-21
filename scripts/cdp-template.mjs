// 加载模板,验证幽灵引导片渲染;再放一片验证步骤推进
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

const before = await evalJs(`(() => {
  const store = window.__store;
  store.loadTemplate(store.templates[0]); // 小房子
  return { hint: store.nextTemplateHint(), step: store.templateStep() };
})()`);
console.log('before:', JSON.stringify(before));
await new Promise((r) => setTimeout(r, 1500));
const shot1 = await send('Page.captureScreenshot', { format: 'png' });
const { writeFileSync } = await import('node:fs');
writeFileSync(process.argv[2], Buffer.from(shot1.data, 'base64'));

// 在提示位置放一片,验证步骤推进与幽灵切换
const after = await evalJs(`(() => {
  const store = window.__store;
  const hint = store.nextTemplateHint();
  const t = store.addTile(hint.kind, hint.x, hint.z, hint.rot);
  store.tryPlace(t);
  return { step: store.templateStep(), nextHint: store.nextTemplateHint()?.kind ?? 'done' };
})()`);
console.log('after placing one:', JSON.stringify(after), 'errors:', errs.length ? errs : 'none');
await send('Page.close');
process.exit(0);
