import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto('http://127.0.0.1:4173/?debug=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__railview?.ready === true, { timeout: 30000 });
const measure = async (label, mutate) => {
  await page.evaluate(mutate);
  await page.waitForTimeout(600);
  const stats = await page.evaluate(() => {
    const c = document.getElementById('scene-canvas');
    const gl = c.getContext('webgl2');
    const w = c.width, h = c.height;
    const buf = new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    let sum=0, n=0, dark=0;
    const regions = {};
    const grab = (name, x0,x1,y0,y1) => {
      let s=0,cn=0;
      for (let y=Math.floor(y0*h); y<Math.floor(y1*h); y+=3)
        for (let x=Math.floor(x0*w); x<Math.floor(x1*w); x+=3) {
          const i=((h-1-y)*w+x)*4;
          s += 0.2126*buf[i]+0.7152*buf[i+1]+0.0722*buf[i+2]; cn++;
        }
      regions[name] = +(s/cn).toFixed(1);
    };
    grab('sky', 0.1, 0.9, 0.05, 0.3);
    grab('ground', 0.1, 0.4, 0.65, 0.95);
    grab('track', 0.45, 0.55, 0.6, 0.95);
    for (let i=0;i<buf.length;i+=4){ const l=0.2126*buf[i]+0.7152*buf[i+1]+0.0722*buf[i+2]; sum+=l; n++; if(l<8) dark++; }
    return { mean: +(sum/n).toFixed(1), darkPct: +(100*dark/n).toFixed(1), regions };
  });
  console.log(label, JSON.stringify(stats));
};
await measure('day', () => {
  const api = window.__railview; const s = api.getState(); s.night=false; s.fog=0.34; api.setState(s);
});
await measure('night', () => {
  const api = window.__railview; const s = api.getState(); s.night=true; s.fog=0.34; api.setState(s);
});
await measure('night-clear', () => {
  const api = window.__railview; const s = api.getState(); s.night=true; s.fog=0.05; api.setState(s);
});
await measure('day-fog1', () => {
  const api = window.__railview; const s = api.getState(); s.night=false; s.fog=1; api.setState(s);
});
await browser.close();
