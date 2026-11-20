// 回转体专项流程测试
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('pageerror', e => errors.push(e.message))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, c) => { results.push(c); console.log(c ? '✅' : '❌', n) }

try {
  await page.goto('http://localhost:5188/', { waitUntil: 'networkidle0' })
  await sleep(1000)
  const box = await page.$eval('.stage', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2

  // 画一个偏右的矩形(给左侧转轴留空间)
  const pts = [[cx - 40, cy - 120], [cx + 160, cy - 120], [cx + 160, cy + 120], [cx - 40, cy + 120]]
  for (const [x, y] of pts) { await page.mouse.click(x, y); await sleep(120) }
  await page.mouse.click(pts[0][0] + 6, pts[0][1] + 6); await sleep(400)
  check('轮廓闭合', await page.evaluate(() => !!window.__studio.engine.getState().shape))

  // 切到回转模式
  await page.$$eval('.tbtn', els => els.find(e => e.textContent.includes('回转'))?.click())
  await sleep(300)
  // 开始画转轴
  await page.$$eval('.pbtn.purple', els => els.find(e => e.textContent.includes('转轴'))?.click())
  await sleep(200)
  // 轴放在矩形左侧外(竖轴)
  await page.mouse.click(cx - 150, cy - 150)
  await sleep(200)
  await page.mouse.click(cx - 150, cy + 150)
  await sleep(400)

  const axis = await page.evaluate(() => {
    const s = window.__studio.engine.getState()
    return { valid: s.axisValid, hasAxis: !!s.axis, angle: s.revAngle }
  })
  check('转轴位于轮廓同侧且有效', axis.valid)

  // 角度滑块改到 90°,验证 15° 档
  await page.evaluate(() => {
    const sl = [...document.querySelectorAll('input[type=range]')].find(i => i.max === '360')
    sl.value = '90'; sl.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await sleep(300)
  const ang = await page.evaluate(() => window.__studio.engine.getState().revAngle)
  check('角度可设为 90°', ang === 90)

  // 预览体存在
  const hasPreview = await page.evaluate(() => !!window.__studio.engine.previewMesh)
  check('回转预览实体已生成', hasPreview)

  // 成型
  await page.$$eval('.pbtn.purple', els => els.find(e => e.textContent.includes('回转体'))?.click())
  await sleep(700)
  const built = await page.evaluate(() => {
    const s = window.__studio.engine.getState()
    return { count: s.blocks.length, kind: s.blocks[0]?.kind, vertices: s.blocks[0]?.mesh.getTotalVertices() > 4 }
  })
  check('回转积木建成且类型正确', built.count === 1 && built.kind === 'revolve' && built.vertices)
} catch (e) {
  errors.push('fatal: ' + e.message)
}
console.log(`\n${results.filter(Boolean).length}/${results.length} 通过,错误 ${errors.length}`)
errors.forEach(e => console.log('🚫', e))
await browser.close()
process.exit(results.every(Boolean) && !errors.length ? 0 : 1)
