import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__railview?.ready === true, { timeout: 30000 });

const snap = async (mutate) => {
  await page.evaluate(mutate);
  await page.waitForTimeout(500);
  return await page.evaluate(() => {
    const c = document.getElementById('scene-canvas');
    const gl = c.getContext('webgl2');
    const w=c.width,h=c.height;
    const buf = new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    // signature: mean R,G,B over region covering mid/far layers
    let r=0,g=0,b=0,n=0;
    for (let y=Math.floor(h*0.35); y<Math.floor(h*0.62); y+=2)
      for (let x=0; x<w; x+=2) {
        const i=((h-1-y)*w+x)*4; r+=buf[i]; g+=buf[i+1]; b+=buf[i+2]; n++;
      }
    return [Math.round(r/n), Math.round(g/n), Math.round(b/n)];
  });
};

const base = (patch) => `(() => { const a=window.__railview; const s=a.getState();
  s.night=false; s.fog=0.05; s.order=['far','mid','near'];
  s.layers.far={opacity:1,blend:'normal',visible:true};
  s.layers.mid={opacity:1,blend:'normal',visible:true};
  s.layers.near={opacity:0.0,blend:'normal',visible:true};
  ${patch}
  a.setState(s); })()`;

const normal = await snap(base(''));
const overlay = await snap(base(`s.layers.mid.blend='overlay';`));
const screen = await snap(base(`s.layers.mid.blend='screen';`));
const halfOp = await snap(base(`s.layers.mid.opacity=0.5;`));
const hidden = await snap(base(`s.layers.mid.visible=false;`));

const dist = (a,b) => Math.round(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));
console.log('normal ', normal);
console.log('overlay', overlay, 'Δ vs normal =', dist(normal, overlay));
console.log('screen ', screen, 'Δ vs normal =', dist(normal, screen));
console.log('mid50% ', halfOp, 'Δ vs normal =', dist(normal, halfOp));
console.log('midden ', hidden);
let ok = true;
const assert = (n, c) => { console.log(c ? '  PASS' : '  FAIL', n); if(!c) ok=false; };
assert('叠加混合与正常不同', dist(normal, overlay) > 2);
assert('滤色混合与正常不同', dist(normal, screen) > 2);
assert('叠加与滤色彼此不同', dist(overlay, screen) > 2);
assert('透明度 0.5 影响输出', dist(normal, halfOp) > 2);
assert('隐藏图层影响输出', dist(normal, hidden) > 2);
await browser.close();
process.exitCode = ok ? 0 : 1;
