// 极简 CDP 客户端:导航到目标页,收集 console 与异常
const base = 'http://127.0.0.1:9222';
const target = process.argv[2];

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

const logs = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
    logs.push(`[console.${msg.params.type}] ${text}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    logs.push(`[EXCEPTION] ${d.text} ${d.exception?.description ?? ''}`);
  }
};

await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: target });
await new Promise((r) => setTimeout(r, 9000));
// 触发一次 resize 确保渲染
await send('Runtime.evaluate', { expression: 'window.dispatchEvent(new Event("resize"))' });
await new Promise((r) => setTimeout(r, 1500));
const res = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    canvas: !!document.getElementById('babylon-canvas'),
    gl: (()=>{const c=document.getElementById('babylon-canvas');return !!(c && (c.getContext('webgl2')||c.getContext('webgl')));})(),
    tileCards: document.querySelectorAll('.tile-card').length,
    buttons: document.querySelectorAll('.btn').length,
    bodyText: document.body.innerText.slice(0,120)
  })`,
  returnByValue: true,
});
console.log('PAGE STATE:', res.result.value);
console.log('--- LOGS (' + logs.length + ') ---');
console.log(logs.join('\n') || '(no console output)');
await send('Page.close');
process.exit(0);
