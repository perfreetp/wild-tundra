// 通过 CDP 无头加载页面，捕获 console / 页面异常，验证 Worker 初始化与渲染帧
const BASE = 'http://127.0.0.1:5176/'

async function main() {
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  const { spawn } = await import('node:child_process')
  const proc = spawn(edge, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9333',
    '--user-data-dir=C:/Users/Administrator/AppData/Local/Temp/edge-cdp-profile',
    'about:blank',
  ], { stdio: 'ignore' })

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let tabs = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9333/json')
      tabs = await res.json()
      if (Array.isArray(tabs) && tabs.length) break
    } catch {}
    await sleep(250)
  }
  if (!tabs) throw new Error('CDP endpoint not reachable')
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

  const logs = []
  const exceptions = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result)
      pending.delete(msg.id)
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const a = msg.params.args?.map((x) => x.value ?? x.description ?? '').join(' ')
      logs.push(`[${msg.params.type}] ${a}`)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.exception?.description ?? JSON.stringify(msg.params.exceptionDetails))
    }
  }

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: BASE })

  // 等待应用初始化：loading mask 消失 + canvas 存在
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value
  let ok = false
  let state = ''
  for (let i = 0; i < 60; i++) {
    await sleep(500)
    state = await evalJs(`(() => {
      const loading = !!document.querySelector('.loading-mask');
      const canvas = document.querySelectorAll('canvas').length;
      const fps = document.querySelector('.hud-panel')?.innerText || '';
      const bones = document.querySelector('.left-panel')?.innerText.match(/虚拟骨骼[\\s\\S]*?(\\d+)/)?.[1] || '';
      return JSON.stringify({ loading, canvas, fps: fps.replace(/\\s+/g, ' '), bones });
    })()`)
    const s = JSON.parse(state)
    if (!s.loading && s.canvas >= 1) {
      ok = true
      break
    }
  }

  console.log('INIT_OK =', ok)
  console.log('FINAL_STATE =', state)
  console.log('EXCEPTIONS =', exceptions.length)
  exceptions.slice(0, 10).forEach((e) => console.log('  !', e.split('\n')[0]))
  console.log('CONSOLE_LOGS =', logs.length)
  logs.slice(0, 10).forEach((l) => console.log('  ', l))

  ws.close()
  proc.kill()
  process.exit(ok && exceptions.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('HARNESS_ERROR', e)
  process.exit(2)
})
