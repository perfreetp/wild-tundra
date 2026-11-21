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
await evalJs(`(() => { window.__store.addTile('square', 0, 0); window.__store.addTile('square', 1.1, 0.08); })()`);
const r = await evalJs(`(async () => {
  try {
    const geom = await import('/src/geometry/math.ts');
    const store = window.__store;
    const appScene = window.__appScene;
    const scene = window.__babylonScene;
    const moving = store.getTiles()[1];
    const snap = geom.findSnap(moving, store.getTiles().filter(t=>t.id!==moving.id));
    appScene.snapPreview = snap;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    const views = appScene.views;
    const viewInfo = [...views.entries()].map(([vid, v]) => ({
      id: vid,
      stateId: v.state.id,
      glowEdges: [...v.meshes.edgeGlows.entries()].map(([ei, g]) => ({ ei, enabled: g.isEnabled() })),
    }));
    return { snapTile: snap.tileId, snapEdge: snap.edgeIndex, other: snap.otherId, otherEdge: snap.otherEdge, views: viewInfo };
  } catch (e) { return { exception: e.message, stack: e.stack?.slice(0, 300) }; }
})()`);
console.log(JSON.stringify(r, null, 2));
await send('Page.close');
process.exit(0);
