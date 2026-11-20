// 截图验证：空闲 / 压入凹陷 / 线框叠加 三态
import { writeFileSync } from 'node:fs'

const BASE = 'http://127.0.0.1:5176/'
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const { spawn } = await import('node:child_process')
const proc = spawn(edge, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=9346',
  '--user-data-dir=C:/Users/Administrator/AppData/Local/Temp/edge-cdp-profile-14',
  '--window-size=1280,860',
  'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let tabs = null
for (let i = 0; i < 40; i++) {
  try {
    tabs = await (await fetch('http://127.0.0.1:9346/json')).json()
    if (tabs.length) break
  } catch {}
  await sleep(250)
}
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pend = new Map()
const send = (m, p = {}) =>
  new Promise((res) => {
    const mid = ++id
    pend.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method: m, params: p }))
  })
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m.result)
    pend.delete(m.id)
  }
}
await send('Runtime.enable')
await send('Page.enable')
await send('Page.navigate', { url: BASE })
const ev = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value
for (let i = 0; i < 60; i++) {
  await sleep(400)
  if (!(await ev('!!document.querySelector(".loading-mask")'))) break
}
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false })
await sleep(600)

const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`scripts/shot-${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('saved', name)
}

// 1. 空闲态
await shot('idle')

// 2. 压入凹陷（沿法线深入并保持）
await ev(`(async () => {
  const vp = window.__viewport;
  const sp = vp.getOrganSphere();
  vp.setProbePosition(sp.center[0] + sp.radius * 1.2, sp.center[1], sp.center[2]);
  await new Promise(r => setTimeout(r, 150));
  const c = vp.getContact();
  const n = [c.normal.x, c.normal.y, c.normal.z];
  const surf = [c.point.x, c.point.y, c.point.z];
  for (let i = 1; i <= 10; i++) {
    const off = 0.6 * sp.radius - (i / 10) * 1.0 * sp.radius;
    vp.setProbePosition(surf[0] + n[0]*off, surf[1] + n[1]*off, surf[2] + n[2]*off);
    await new Promise(r => setTimeout(r, 120));
  }
})()`)
await sleep(800)
await shot('pressed')

// 3. 开启线框
await ev(`document.querySelector('.switch').click()`)
await sleep(500)
await shot('wireframe')

// 4. 软档深压，观察更大凹陷与残影
await ev(`[...document.querySelectorAll('.segmented button')][0].click()`)
await ev(`(async () => {
  const vp = window.__viewport;
  const sp = vp.getOrganSphere();
  const c = vp.getContact();
  const n = [c.normal.x, c.normal.y, c.normal.z];
  const surf = [c.point.x, c.point.y, c.point.z];
  for (let i = 1; i <= 8; i++) {
    const off = -0.1 * sp.radius - (i / 8) * 0.35 * sp.radius;
    vp.setProbePosition(surf[0] + n[0]*off, surf[1] + n[1]*off, surf[2] + n[2]*off);
    await new Promise(r => setTimeout(r, 130));
  }
})()`)
await sleep(900)
await shot('soft-deep')

ws.close()
proc.kill()
console.log('done')
