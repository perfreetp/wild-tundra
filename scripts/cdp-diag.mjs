// 诊断：closestPointToPoint 的阈值行为与探针接触判定
const BASE = 'http://127.0.0.1:5176/'

async function main() {
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  const { spawn } = await import('node:child_process')
  const proc = spawn(edge, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--remote-debugging-port=9343',
    '--user-data-dir=C:/Users/Administrator/AppData/Local/Temp/edge-cdp-profile-11',
    'about:blank',
  ], { stdio: 'ignore' })
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let tabs = null
  for (let i = 0; i < 40; i++) {
    try {
      tabs = await (await fetch('http://127.0.0.1:9343/json')).json()
      if (tabs.length) break
    } catch {}
    await sleep(250)
  }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pend = new Map()
  const send = (m, p = {}) => new Promise((res) => {
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

  const diag = await ev(`(async () => {
    const vp = window.__viewport;
    const sphere = vp.getOrganSphere();
    const out = { sphere, steps: [] };
    // 探针从很远逐步移动到器官中心，记录每步 contact
    for (let f = 2.0; f >= -0.2; f -= 0.15) {
      const x = sphere.center[0] + sphere.radius * f;
      vp.setProbePosition(x, sphere.center[1], sphere.center[2]);
      await new Promise((r) => setTimeout(r, 140));
      const c = vp.getContact();
      const dbg = vp.getContactDebug();
      out.steps.push({
        f: +f.toFixed(2),
        probe: [+x.toFixed(3), sphere.center[1], sphere.center[2]],
        active: c.active,
        depth: +c.depth.toFixed(4),
        face: c.faceIndex,
        ray: dbg.ray ? { d: +dbg.ray.distance.toFixed(3), f: dbg.ray.faceIndex } : null,
      });
    }
    return JSON.stringify(out);
  })()`)
  const d = JSON.parse(diag)
  console.log('sphere =', JSON.stringify(d.sphere))
  for (const s of d.steps) console.log(JSON.stringify(s))
  ws.close()
  proc.kill()
}
main().catch((e) => {
  console.error(e)
  process.exit(2)
})
