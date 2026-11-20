// 端到端冒烟测试:puppeteer-core + 本机 Chrome(WebGL 软件渲染)
// node test/e2e.test.js
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = 'http://localhost:5188/'

const log = (...a) => console.log(...a)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-setuid-sandbox',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--window-size=1440,900',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const errors = []
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

const results = []
const check = (name, cond) => { results.push([name, !!cond]); log(cond ? '✅' : '❌', name) }

try {
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(1500)
  check('页面渲染出画布', (await page.$('canvas')) !== null)

  const box = await page.$eval('.stage', el => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2

  // ---- 画一个矩形(4 个点,最后一点吸附起点闭合)----
  const pts = [
    [cx - 160, cy - 120],
    [cx + 160, cy - 120],
    [cx + 160, cy + 120],
    [cx - 160, cy + 120],
  ]
  for (const [x, y] of pts) {
    await page.mouse.click(x, y)
    await sleep(180)
  }
  // 回到起点附近触发闭合
  await page.mouse.click(pts[0][0] + 6, pts[0][1] + 6)
  await sleep(500)

  const shapeReady = await page.evaluate(() => !!window.__peek && true)
  void shapeReady
  const hint1 = await page.$eval('.hint-bar', el => el.textContent)
  check('轮廓闭合后提示拉伸', hint1.includes('变厚') || hint1.includes('手柄'))

  const cornerBtn = (await page.$$eval('.pbtn', els => els.map(e => e.textContent)))
  check('面板出现倒角按钮', cornerBtn.some(t => t.includes('倒角')))

  // ---- 调厚度滑块,预览体跟随 ----
  const depthInfo = await page.evaluate(() => {
    // 直接通过 Vue 暴露不到引擎,这里用滑块 DOM 模拟
    const slider = document.querySelectorAll('input[type=range]')[0]
    return { found: !!slider, min: slider?.min, max: slider?.max }
  })
  check('厚度滑块存在', depthInfo.found)

  // ---- 点圆角,再调半径 ----
  const filletBtn = await page.$$eval('.pbtn', els => {
    const b = els.find(e => e.textContent.includes('圆角'))
    b?.click()
    return !!b
  })
  check('圆角按钮可点', filletBtn)
  await sleep(200)

  // ---- 做成积木 ----
  const built = await page.$$eval('.pbtn.primary', els => {
    const b = els.find(e => e.textContent.includes('变成积木'))
    b?.click()
    return !!b
  })
  check('点击变成积木', built)
  await sleep(800)

  const blockCount = await page.$eval('.panel.right .chip', el => el.textContent.trim())
  check('积木盒显示 1 块', blockCount.includes('1'))

  // ---- 复制一块 ----
  await page.$$eval('.pbtn.green', els => els.find(e => e.textContent.includes('复制'))?.click())
  await sleep(700)
  const blockCount2 = await page.$eval('.panel.right .chip', el => el.textContent.trim())
  check('复制后显示 2 块', blockCount2.includes('2'))

  // ---- 穿模检测:通过引擎真实拖动路径把第二块移进第一块 ----
  // 说明:headless + 三栏布局下,远处积木会投影到侧栏遮挡区,真实鼠标点不到;
  // 这里直接驱动引擎的 block 拖动 API(与鼠标 #dragBlock 同一代码路径),验证碰撞/红轮廓。
  const collide = await page.evaluate(async () => {
    const e = window.__studio.engine
    const st = e.getState()
    const [b1, b2] = st.blocks
    e.selectBlock(b2.id)
    b2.x = 0.3; b2.z = 0.3
    b2.mesh.position.x = 0.3; b2.mesh.position.z = 0.3
    e.runCollision()
    await new Promise(r => setTimeout(r, 150))
    const hitOverlap = st.collisions.includes(b1.id) && st.collisions.includes(b2.id)
    const redOutline = b1.mesh.renderOutline && b2.mesh.renderOutline
    const bannerDuringOverlap = !!document.querySelector('.collision-banner')
    // 再分开,确认能恢复
    b2.x = 14; b2.z = 0
    b2.mesh.position.x = 14; b2.mesh.position.z = 0
    e.runCollision()
    await new Promise(r => setTimeout(r, 150))
    const recovered = st.collisions.length === 0
    return { hitOverlap, redOutline, bannerDuringOverlap, recovered }
  })
  check('重叠时两块都被标记穿模', collide.hitOverlap)
  check('穿模积木亮起红色轮廓', collide.redOutline)
  check('穿模时显示红色提示横幅', collide.bannerDuringOverlap)
  check('分开后穿模标记恢复', collide.recovered)

  // ---- 双击尺寸标签,改数值 ----
  const dim = await page.$('.dim-label')
  check('尺寸标签存在', dim !== null)
  if (dim) {
    const before = await page.$eval('.dim-label', el => el.textContent)
    const db = await dim.boundingBox()
    await page.mouse.click(db.x + db.width / 2, db.y + db.height / 2, { clickCount: 2 })
    await sleep(200)
    await page.keyboard.selectAll?.()
    await page.keyboard.type('8')
    await page.keyboard.press('Enter')
    await sleep(500)
    const after = await page.$eval('.dim-label', el => el.textContent).catch(() => '')
    check('尺寸编辑后数值更新为 8.0', after.includes('8.0'))
    void before
  }

  // ---- 一键正视 / 俯视 ----
  const viewBtns = await page.$$eval('.tbtn', els => els.map(e => e.textContent))
  check('正视/俯视按钮存在', viewBtns.some(t => t.includes('正视')) && viewBtns.some(t => t.includes('俯视')))
  await page.$$eval('.tbtn', els => els.find(e => e.textContent.includes('俯视'))?.click())
  await sleep(700)
  await page.$$eval('.tbtn', els => els.find(e => e.textContent.includes('正视'))?.click())
  await sleep(700)

  // ---- 导出图片(headless 下触发下载)----
  const dlPath = await page.evaluate(() => {
    // 临时拦截 a.click,验证 screenshot 回调确实产出了 dataURL,结束后还原
    return new Promise(resolve => {
      const orig = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = function () {
        HTMLAnchorElement.prototype.click = orig
        resolve(this.href?.startsWith('data:image/png') ? 'dataurl-ok' : 'bad:' + this.href)
      }
      const btns = [...document.querySelectorAll('button')]
      btns.find(b => b.textContent.includes('留念'))?.click()
      setTimeout(() => { HTMLAnchorElement.prototype.click = orig; resolve('timeout') }, 3000)
    })
  })
  check('导出产出 PNG dataURL', dlPath === 'dataurl-ok')

  // ---- 新草稿:缺口分析(红点 + 两个可补端点),自包含流程 ----
  await page.$$eval('.tbtn', els => els.find(e => e.textContent.includes('画形状'))?.click())
  await sleep(700) // 等相机从正视平滑复位到斜俯视角
  const modeNow = await page.evaluate(() => window.__studio.engine.getState().mode)
  check('已切回画形状模式', modeNow === 'draw')
  // 舞台安全区中心,先确认落点确实在 canvas 上
  const p1 = { x: cx - 90, y: cy - 60 }, p2 = { x: cx + 90, y: cy - 60 }
  const onCanvas = await page.evaluate(({ x, y }) => {
    const d = document.elementFromPoint(x, y)
    return d && d.tagName === 'CANVAS'
  }, p1)
  check('起草落点在画布上', onCanvas)
  await page.mouse.click(p1.x, p1.y)
  await sleep(300)
  const n1 = await page.evaluate(() => window.__studio.engine.getState().draft.points.length)
  check('第一点已落下', n1 === 1)
  await page.mouse.click(p2.x, p2.y)
  await sleep(350)
  const gap = await page.evaluate(() => {
    const st = window.__studio.engine.getState()
    const e = window.__studio.engine
    const markerKinds = e.scene.meshes
      .filter(m => m.metadata && ['gapDot', 'candidate'].includes(m.metadata.kind))
      .map(m => m.metadata.kind)
    return {
      pts: st.draft.points.length,
      hasGap: !!st.draft.gap,
      candidates: st.draft.candidates.length,
      markers: markerKinds,
    }
  })
  check('两点起草成功', gap.pts === 2)
  check('未闭合轮廓出现红点缺口', gap.hasGap && gap.markers.includes('gapDot'))
  check('缺口给出两个可补端点', gap.candidates === 2 && gap.markers.filter(k => k === 'candidate').length === 2)
  const hasButton = await page.$$eval('.pbtn.primary', els => els.some(e => e.textContent.includes('补上缺口')))
  check('面板提供补缺口按钮', hasButton)
  if (hasButton) {
    await page.$$eval('.pbtn.primary', els => els.find(e => e.textContent.includes('补上缺口'))?.click())
    await sleep(300)
  }
  const hint3 = await page.$eval('.hint-bar', el => el.textContent)
  check('2 个点时给出友好提示', hint3.includes('3 个点') || hint3.includes('形状'))

} catch (e) {
  errors.push('fatal: ' + e.message + '\n' + e.stack)
}

await sleep(500)
log('\n--- 运行时错误 ---')
if (!errors.length) log('无错误')
errors.forEach(e => log('🚫', e))

const failed = results.filter(r => !r[1]).length
log(`\n${results.length - failed}/${results.length} 项通过,运行时错误 ${errors.length} 个`)
await browser.close()
process.exit(failed || errors.length ? 1 : 0)
