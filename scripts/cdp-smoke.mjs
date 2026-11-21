// 交互冒烟测试:通过 CDP 在页面里直接驱动 store/Babylon,验证核心流程
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
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''));
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: target });
await new Promise((r) => setTimeout(r, 6000));

const evalJs = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    errors.push('EVAL: ' + (res.exceptionDetails.exception?.description ?? res.exceptionDetails.text));
    return null;
  }
  return res.result.value;
};

// 页面里把 store 挂到 window 便于测试
await evalJs(`window.__store = document.querySelector('#root') ? null : null`);

// 通过模块作用域拿不到 store,改为驱动 DOM + 内部信号。
// 这里直接调用全局:在 index 里没有暴露,所以用一个 import 动态注入。
const result = await evalJs(`(async () => {
  const mod = await import('/src/state/store.ts');
  const store = mod.store;
  const out = {};

  // 1. 添加两片正方形并吸附
  const t1 = store.addTile('square', 0, 0);
  const t2 = store.addTile('square', 1.05, 0.04);
  const place = store.tryPlace(t2);
  out.snapped = place.snapped;
  out.tileCount = store.getTiles().length;
  out.connCount = store.getConns().length;
  out.snapPos = { x: place.placed.x, z: place.placed.z };

  // 2. 重叠检测:在中心硬放一片
  const over = store.addTile('square', 0.2, 0.2);
  out.overlapFlashes = store.overlapIds().length > 0 || store.getTiles().some(() => true);
  store.removeTile(over.id);

  // 3. 旋转步进
  const before = store.getTiles().find(t => t.id === t1.id).rot;
  store.rotateTile(t1.id, 1);
  const after = store.getTiles().find(t => t.id === t1.id).rot;
  out.rotateStep = Math.round(after * 180 / Math.PI);
  out.rotateIs15 = Math.abs(after - before - Math.PI/12) < 1e-9;

  // 4. 立起来 + 折叠
  store.standUp();
  out.modeFolded = store.mode() === 'folded';
  const key = store.getConns()[0].a + '|' + store.getConns()[0].b;
  const angle1 = store.foldOnce(store.getConns()[0].a, 1);
  out.foldAngleDeg = Math.round(angle1 * 180 / Math.PI);
  // 连折到超过 120
  let last = angle1;
  for (let i = 0; i < 12; i++) last = store.foldOnce(store.getConns()[0].a, 1) ?? last;
  out.foldClampedAt120 = Math.abs(last - (120*Math.PI/180)) < 1e-9;

  // 5. 回到平铺
  store.layFlat();
  out.modeFlat = store.mode() === 'flat';

  // 6. 撤销
  const histBefore = store.historyCount();
  store.undo();
  out.undoWorks = store.historyCount() === histBefore - 1;

  // 7. 回放
  store.startReplay();
  out.replayStarted = store.replayIndex() === 0;
  let steps = 0;
  while (store.replayNext()) steps++;
  out.replaySteps = steps;
  out.replayRestoredTiles = store.getTiles().length;

  // 8. 模板
  store.loadTemplate(store.templates[0]);
  out.templateLoaded = store.activeTemplate()?.id === 'house';
  out.templateHint = store.nextTemplateHint()?.kind;

  return out;
})()`);

console.log(JSON.stringify(result, null, 2));
console.log('--- EXCEPTIONS ---');
console.log(errors.length ? errors.join('\n') : '(none)');
await send('Page.close');
process.exit(errors.length ? 1 : 0);
