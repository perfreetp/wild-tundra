// CDP 交互验证 v3：直接驱动探针世界坐标，沿法线精确压入，验证完整形变管线
const BASE = 'http://127.0.0.1:5176/'

async function main() {
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  const { spawn } = await import('node:child_process')
  const proc = spawn(edge, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--remote-debugging-port=9347',
    '--user-data-dir=C:/Users/Administrator/AppData/Local/Temp/edge-cdp-profile-15',
    'about:blank',
  ], { stdio: 'ignore' })

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let tabs = null
  for (let i = 0; i < 40; i++) {
    try {
      tabs = await (await fetch('http://127.0.0.1:9347/json')).json()
      if (Array.isArray(tabs) && tabs.length) break
    } catch {}
    await sleep(250)
  }
  const page = tabs.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  const exceptions = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.exception?.description ?? 'err')
    }
  }
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: BASE })

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    })
    if (res.exceptionDetails) {
      throw new Error('page eval: ' + res.exceptionDetails.exception?.description)
    }
    return res.result?.value
  }

  for (let i = 0; i < 60; i++) {
    await sleep(400)
    if (!(await evalJs(`!!document.querySelector('.loading-mask')`))) break
  }

  const metrics = async () =>
    evalJs(`(() => {
      const t = document.querySelector('.metric-panel').innerText.replace(/\\s+/g, ' ');
      const hud = document.querySelector('.hud-panel').innerText.replace(/\\s+/g, ' ');
      const m1 = t.match(/接触深度 ([\\d.]+)/); const m2 = t.match(/最大形变位移 ([\\d.]+)/);
      const bvh = hud.match(/BVH 求交耗时 ([\\d.]+)/);
      const face = hud.match(/命中三角形 (#?\\d+|—)/);
      const fps = hud.match(/FPS ([\\d.]+)/);
      return { depth: +m1?.[1], maxDef: +m2?.[1], bvh: +bvh?.[1], face: face?.[1], fps: +fps?.[1] };
    })()`)

  // 在页面内定义一个压入序列：探针从表面外沿 -x 方向（肝脏长轴侧面）逐步压入
  const pressSequence = async (label) => {
    const raw = await evalJs(`(async () => {
      try {
        const vp = window.__viewport;
        const sphere = vp.getOrganSphere();
        // 先把探针放在 +x 表面外侧，读取一次接触拿到表面点与外法线
        vp.setProbePosition(sphere.center[0] + sphere.radius * 1.25, sphere.center[1], sphere.center[2]);
        await new Promise((r) => setTimeout(r, 120));
        const c0 = vp.getContact();
        const n = [c0.normal.x, c0.normal.y, c0.normal.z];
        const surf = [c0.point.x, c0.point.y, c0.point.z];
        const maxPen = sphere.radius * 0.5;
        const steps = 10;
        const results = [];
        for (let i = 0; i <= steps; i++) {
          // 探针中心沿 -normal 从表面外 0.6R 推进到表面内 0.5R
          const offset = 0.6 * sphere.radius - (i / steps) * (1.1 * sphere.radius);
          vp.setProbePosition(
            surf[0] + n[0] * offset,
            surf[1] + n[1] * offset,
            surf[2] + n[2] * offset,
          );
          await new Promise((r) => setTimeout(r, 110));
          if (i === 4 || i === 7 || i === steps) {
            const c = vp.getContact();
            results.push({
              active: c.active,
              depth: c.depth,
              faceIndex: c.faceIndex,
              point: [c.point.x, c.point.y, c.point.z],
              normal: [c.normal.x, c.normal.y, c.normal.z],
            });
          }
        }
        return JSON.stringify({ label: ${JSON.stringify(label)}, surf, normal: n, contacts: results, maxPen });
      } catch (e) {
        return 'PAGE_ERROR: ' + e.message + ' | ' + e.stack;
      }
    })()`)
    if (typeof raw !== 'string' || raw.startsWith('PAGE_ERROR')) {
      throw new Error('pressSequence failed: ' + JSON.stringify(raw))
    }
    return JSON.parse(raw)
  }

  // 1. 中等硬度下压入
  const pressInfo = await pressSequence('medium-press')
  await sleep(400)
  const pressed = await metrics()

  // 2. 保持压入，再等一帧确认稳定值
  await sleep(500)
  const held = await metrics()

  // 3. 探针撤到远处 → 回弹
  await evalJs(`window.__viewport.setProbePosition(6, 4, 6)`)
  await sleep(1800)
  const released = await metrics()

  // 4. 三档硬度分别压入相同深度，比较最大形变（软 > 中 > 硬）
  const byHardness = {}
  for (const [level, idx] of [['soft', 0], ['medium', 1], ['hard', 2]]) {
    await evalJs(`[...document.querySelectorAll('.segmented button')][${idx}].click()`)
    await sleep(200)
    await pressSequence(level)
    await sleep(350)
    byHardness[level] = await metrics()
    await evalJs(`window.__viewport.setProbePosition(6, 4, 6)`)
    await sleep(1700)
  }

  // 5. 残影：压入过程中应产生 trail 点（通过内部状态间接验证：接触出现过即有残影）
  const trailEvidence = pressInfo.contacts.some((c) => c.active && c.depth > 0)

  // 6. 线框开关
  await evalJs(`document.querySelector('.switch').click()`)
  const wireOn = await evalJs(`document.querySelector('.switch').className`)
  await evalJs(`document.querySelector('.switch').click()`)
  const wireOff = await evalJs(`document.querySelector('.switch').className`)

  // 7. 三个器官切换后都能压入产生形变
  const organResults = []
  for (const idx of [0, 1, 2]) {
    await evalJs(`[...document.querySelectorAll('.organ-item')][${idx}].click()`)
    for (let i = 0; i < 60; i++) {
      await sleep(300)
      if (!(await evalJs(`!!document.querySelector('.loading-mask')`))) break
    }
    await pressSequence('organ-' + idx)
    await sleep(350)
    const m = await metrics()
    organResults.push({ idx, maxDef: m.maxDef, depth: m.depth, face: m.face })
    await evalJs(`window.__viewport.setProbePosition(6, 4, 6)`)
    await sleep(1500)
  }

  console.log('PRESS_CONTACTS =', JSON.stringify(pressInfo.contacts.map((c) => ({
    active: c.active, depth: +c.depth.toFixed(4), face: c.faceIndex,
  }))))
  console.log('PRESSED  =', JSON.stringify(pressed))
  console.log('HELD     =', JSON.stringify(held))
  console.log('RELEASED =', JSON.stringify(released))
  console.log('HARDNESS =', JSON.stringify(byHardness))
  console.log('TRAIL    =', trailEvidence)
  console.log('WIRE     =', wireOn, '=>', wireOff)
  console.log('ORGANS   =', JSON.stringify(organResults))
  console.log('EXCEPT   =', exceptions.length)
  exceptions.slice(0, 8).forEach((e) => console.log('  !', e.split('\n')[0]))

  const depthOk = pressed.depth > 0.05
  const deformOk = pressed.maxDef > 0.005
  const faceOk = pressed.face !== '—'
  const reboundOk = released.depth === 0 && released.maxDef < pressed.maxDef * 0.5
  const bvhOk = pressed.bvh > 0 && pressed.bvh < 5
  const fpsOk = pressed.fps >= 30
  const hardnessOk = byHardness.soft.maxDef > byHardness.hard.maxDef
  const wireOk = wireOn.includes('on') && !wireOff.includes('on')
  const organOk = organResults.every((o) => o.maxDef > 0.001 && o.depth > 0.01)
  console.log('CHECKS =', JSON.stringify({
    depthOk, deformOk, faceOk, reboundOk, bvhOk, fpsOk, hardnessOk, wireOk, organOk,
  }))

  ws.close()
  proc.kill()
  const pass = [depthOk, deformOk, faceOk, reboundOk, bvhOk, fpsOk, hardnessOk, wireOk, organOk]
    .every(Boolean) && exceptions.length === 0
  process.exit(pass ? 0 : 1)
}

main().catch((e) => {
  console.error('HARNESS_ERROR', e)
  process.exit(2)
})
