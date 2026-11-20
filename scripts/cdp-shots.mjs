// 截取预览播放早/中/晚三个时刻 + 编辑模式,验证矿灯与雾效递进
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = await import("node:fs");

const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = list.find((t) => t.type === "page" && t.url.includes("5199"));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  }
};
const send = (method, params = {}) => {
  const i = ++id;
  ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise((res) => pend.set(i, res));
};
const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result.result.value;
};
await send("Page.enable");
await send("Page.reload", { ignoreCache: true });
await sleep(2500);
await ev("window.mineCam.buildDemoRoute()");
await sleep(300);

const duration = await ev(`window.mineCam.getPaths().get(window.mineCam.store.state.activeRouteId).duration`);
const shots = [
  ["edit", null],
  ["early", duration * 0.1],
  ["mid", duration * 0.5],
  ["late", duration * 0.92],
];
for (const [name, t] of shots) {
  if (t === null) {
    await ev("window.mineCam.store.update(s => { s.playing = false; })");
  } else {
    await ev(`window.mineCam.seek(${t})`);
  }
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`.headless/frame-${name}.png`, Buffer.from(shot.result.data, "base64"));
  console.log("saved", name);
}
const fog = await ev(`(async () => {
  const p = window.mineCam.getPaths().get(window.mineCam.store.state.activeRouteId);
  return JSON.stringify([0.1, 0.5, 0.92].map(k => +p.sampleFrame(p.duration*k).fogPct.toFixed(1)));
})()`);
console.log("fog progression:", fog);
ws.close();
