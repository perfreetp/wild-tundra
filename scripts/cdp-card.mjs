// 验证搭法卡片导出:调用 exportBuildCard,拦截下载,确认生成了 PNG dataURL
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

// 搭几片
await evalJs(`(() => {
  const store = window.__store;
  store.addTile('square', 0, 0);
  const b = store.addTile('square', 1.05, 0.03); store.tryPlace(b);
  const t = store.addTile('triangle', 0.05, 1.05); store.tryPlace(t);
})()`);
await new Promise((r) => setTimeout(r, 1500));

// 拦截 a.click 下载,改成把 dataURL 存到 window
await evalJs(`(() => {
  window.__cardUrl = null;
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() { if (this.href && this.href.startsWith('data:')) window.__cardUrl = this.href; };
})()`);

const cardMod = await send('Runtime.evaluate', {
  returnByValue: true,
  awaitPromise: true,
  expression: `(async () => {
    const mod = await import('/src/components/exportCard.ts');
    // 需要 BabylonScene 实例;exportBuildCard 接受 scene,我们从 canvas 所在模块拿不到,
    // 但 window.__babylonScene 是 Scene 不是 BabylonScene。captureDataUrl 在 BabylonScene 上。
    // 这里直接用 scene.render + canvas.toDataURL 模拟验证导出管线。
    const scene = window.__babylonScene;
    scene.render();
    const shot = scene.getEngine().getRenderingCanvas().toDataURL('image/png');
    return { hasShot: shot.startsWith('data:image/png'), shotLen: shot.length };
  })()`,
});
console.log('screenshot pipeline:', JSON.stringify(cardMod.result?.value ?? cardMod.exceptionDetails));

// 真正调用 exportBuildCard:它需要 BabylonScene。检查 App 是否暴露
const real = await send('Runtime.evaluate', {
  returnByValue: true,
  awaitPromise: true,
  expression: `(async () => {
    // 直接复用导出函数,传入一个带 captureDataUrl 的最小对象
    const mod = await import('/src/components/exportCard.ts');
    const fakeScene = { captureDataUrl: () => window.__babylonScene.getEngine().getRenderingCanvas().toDataURL('image/png') };
    await mod.exportBuildCard(fakeScene);
    return { cardGenerated: !!window.__cardUrl, cardPrefix: (window.__cardUrl||'').slice(0,22), cardLen: (window.__cardUrl||'').length };
  })()`,
});
console.log('export card:', JSON.stringify(real.result?.value ?? real.exceptionDetails));
const cardData = await evalJs(`window.__cardUrl`);
console.log('errors:', errors.length ? errors : 'none');
if (cardData) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.argv[2], Buffer.from(cardData.split(',')[1], 'base64'));
  console.log('card written to', process.argv[2]);
}
await send('Page.close');
process.exit(0);
