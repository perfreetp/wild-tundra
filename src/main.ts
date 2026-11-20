import './style.css';
import {
  HalfFloatType,
  LinearFilter,
  MeshBasicMaterial,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import {
  CopyPass,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';
import { MASK_LAYER, TunnelScene } from './scene/TunnelScene';
import { Metering } from './metering/Metering';
import { AutoExposure } from './exposure/AutoExposure';
import { ExposureEffect } from './post/ExposureEffect';
import { HighlightSuppressionEffect } from './post/HighlightSuppressionEffect';
import { CurveChart } from './ui/CurveChart';
import { HistogramView } from './ui/HistogramView';
import { FrameExporter } from './export/FrameExporter';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------------------------------------------------------------- 渲染器与合成链

const canvas = $<HTMLCanvasElement>('view');
const renderer = new WebGLRenderer({
  canvas,
  antialias: false,
  preserveDrawingBuffer: true, // 导出序列帧需要
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const world = new TunnelScene();
const { scene, camera } = world;

const composer = new EffectComposer(renderer, {
  frameBufferType: HalfFloatType,
  multisampling: 4,
});
composer.addPass(new RenderPass(scene, camera));

// 把 HDR 场景拷贝出来供测光回读
const hdrBuffer = new WebGLRenderTarget(1, 1, {
  type: HalfFloatType,
  minFilter: LinearFilter,
  magFilter: LinearFilter,
  depthBuffer: false,
});
const savePass = new CopyPass(hdrBuffer);
composer.addPass(savePass);

const exposureEffect = new ExposureEffect();
composer.addPass(new EffectPass(camera, exposureEffect));

const suppressionEffect = new HighlightSuppressionEffect();
const suppressionPass = new EffectPass(camera, suppressionEffect);
composer.addPass(suppressionPass);

composer.addPass(new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })));

// 灯带高光遮罩 RT（半分辨率）
const maskRT = new WebGLRenderTarget(2, 2, {
  minFilter: LinearFilter,
  magFilter: LinearFilter,
  depthBuffer: true,
});
const maskMaterial = new MeshBasicMaterial({ color: 0xffffff, fog: false });
suppressionEffect.setMask(maskRT.texture);

// ---------------------------------------------------------------- 功能模块

const metering = new Metering(renderer);
const autoExposure = new AutoExposure();
const chart = new CurveChart($('curve'));
const histogram = new HistogramView($('histogram'));
const exporter = new FrameExporter();

// ---------------------------------------------------------------- UI 状态与事件

// 调试：?z=-60 可指定车辆初始位置
const startZ = Number(new URLSearchParams(location.search).get('z'));
if (Number.isFinite(startZ) && new URLSearchParams(location.search).has('z')) {
  world.car.position.z = startZ;
  for (let i = 0; i < 20; i++) world.update(2, 0, false); // 让跟随相机就位
}

let running = true;
let speedKmh = 60;

const speedSlider = $<HTMLInputElement>('speed');
speedSlider.addEventListener('input', () => {
  speedKmh = Number(speedSlider.value);
  $('speed-val').textContent = speedSlider.value;
  $('hud-speed').textContent = `${speedSlider.value} km/h`;
});

$('playpause').addEventListener('click', () => {
  running = !running;
  $('playpause').textContent = running ? '暂停' : '继续';
});
$('reset-car').addEventListener('click', () => world.resetCar());

const targetSlider = $<HTMLInputElement>('target');
function setTargetBrightness(v: number): void {
  autoExposure.targetBrightness = v;
  chart.target = v;
  targetSlider.value = v.toFixed(2);
  $('target-val').textContent = v.toFixed(2);
}
targetSlider.addEventListener('input', () => setTargetBrightness(Number(targetSlider.value)));
chart.onTargetChange = (v) => setTargetBrightness(v);

const durationSlider = $<HTMLInputElement>('duration');
durationSlider.addEventListener('input', () => {
  autoExposure.transitionDuration = Number(durationSlider.value);
  $('duration-val').textContent = Number(durationSlider.value).toFixed(1);
});

$('supp-enabled').addEventListener('change', (e) => {
  suppressionPass.enabled = (e.target as HTMLInputElement).checked;
});
const suppSlider = $<HTMLInputElement>('supp-strength');
suppSlider.addEventListener('input', () => {
  suppressionEffect.strength = Number(suppSlider.value);
  $('supp-val').textContent = Number(suppSlider.value).toFixed(2);
});

const expStatus = $('exp-status');
function updateExportStatus(): void {
  const mode = exporter.hasDirectory ? '写入所选目录' : '浏览器逐帧下载';
  expStatus.textContent = exporter.exporting
    ? `导出中：已导出 ${exporter.savedCount} 帧（${mode}）`
    : `未在导出。已导出 ${exporter.savedCount} 帧。未选目录时将逐帧触发浏览器下载。`;
}

$('pick-dir').addEventListener('click', async () => {
  if (!FrameExporter.directoryPickerSupported) {
    expStatus.textContent = '当前浏览器不支持目录选择（需 Chrome/Edge），将使用逐帧下载。';
    return;
  }
  await exporter.pickDirectory();
  updateExportStatus();
});

$('export-toggle').addEventListener('click', () => {
  exporter.exporting = !exporter.exporting;
  if (exporter.exporting) exporter.reset();
  $('export-toggle').textContent = exporter.exporting ? '停止导出' : '开始导出';
  updateExportStatus();
});

$<HTMLInputElement>('exp-interval').addEventListener('change', (e) => {
  const v = Math.max(1, Math.min(120, Number((e.target as HTMLInputElement).value) || 10));
  (e.target as HTMLInputElement).value = String(v);
  exporter.interval = v;
});

// ---------------------------------------------------------------- 尺寸自适应

function resize(): void {
  const vp = $('viewport');
  const w = Math.max(1, vp.clientWidth);
  const h = Math.max(1, vp.clientHeight);
  renderer.setSize(w, h);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const mw = Math.max(2, w >> 1);
  const mh = Math.max(2, h >> 1);
  maskRT.setSize(mw, mh);
  suppressionEffect.setTexel(1 / mw, 1 / mh);
}
new ResizeObserver(resize).observe($('viewport'));
resize();

// ---------------------------------------------------------------- 主循环

let last = performance.now();
let elapsed = 0;
let frame = 0;

function loop(now: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (running) elapsed += dt;

  world.update(dt, speedKmh, running);

  // 1) 渲染灯带遮罩（仅 MASK_LAYER，白色覆盖材质）
  const oldBackground = scene.background;
  scene.background = null;
  scene.overrideMaterial = maskMaterial;
  camera.layers.set(MASK_LAYER);
  renderer.setRenderTarget(maskRT);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  renderer.render(scene, camera);
  camera.layers.set(0);
  scene.overrideMaterial = null;
  scene.background = oldBackground;
  renderer.setRenderTarget(null);

  // 2) 主合成链：场景 → 曝光 → 过曝抑制 → ACES 色调映射
  composer.render(dt);

  // 3) 测光 + 自适应曝光（每 3 帧一次）
  if (running && frame % 3 === 0) {
    metering.measure(savePass.texture);
    autoExposure.update(dt * 3, metering.meanLuminance);
    exposureEffect.exposure = autoExposure.exposure;
  }
  frame++;

  // 4) 曲线与直方图
  const ev = autoExposure.ev;
  if (running) chart.push(elapsed, ev, metering.meanLuminance * autoExposure.exposure);
  chart.draw();
  histogram.draw(metering.histogram, metering.meanBin);

  // 5) HUD
  $('hud-zone').textContent = world.zone();
  $('measured').textContent = metering.meanLuminance.toFixed(3);
  $('exposure').textContent = `${autoExposure.exposure.toFixed(2)}×`;
  $('ev').textContent = `${ev >= 0 ? '+' : ''}${ev.toFixed(2)}`;

  // 6) 序列帧导出
  if (exporter.exporting) {
    void exporter.maybeCapture(canvas, ev).then((saved) => {
      if (saved) updateExportStatus();
    });
  }
}
requestAnimationFrame(loop);
