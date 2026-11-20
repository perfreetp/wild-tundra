import {
  Color,
  HalfFloatType,
  NoToneMapping,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
  type Camera,
  type WebGLRenderTarget,
} from 'three';
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, Pass } from 'postprocessing';
import { effectiveColorTemp } from '../core/color';
import { clamp01 } from '../core/math';
import type { LayerId, ViewState } from '../core/types';
import { buildLayer, type BuiltLayer } from './layers';
import { LayerPass } from './layer-pass';
import { buildPalette, type Palette } from './palette';
import { rgb } from './look';
import { SkyDome } from './sky';
import { getTextures } from './textures';
import { ViewCamera } from './view-camera';
import { FXAAEffect, GradeEffect } from './effects';
import type { LayerLook } from './look';

const LAYER_SCALE: Record<LayerId, number> = {
  far: 0.7,
  mid: 0.85,
  near: 1,
};

/**
 * 雾的逐层参数：
 *  fogScale —— 该层典型的「雾化距离」（米），决定雾在该层内的空间分布
 *  fogWeight —— 该层对滑条强度的敏感度（远景更易被雾吞没）
 */
const FOG_CONFIG: Record<LayerId, { scale: number; weight: number; power: number }> = {
  far: { scale: 5200, weight: 1.45, power: 0.78 },
  mid: { scale: 1400, weight: 1.15, power: 0.95 },
  near: { scale: 420, weight: 0.85, power: 1.05 },
};

const BLEND_CODE = { normal: 0, overlay: 1, screen: 2 } as const;
const ALL_LAYERS: LayerId[] = ['far', 'mid', 'near'];

export interface EngineStats {
  fps: number;
  /** 累计已渲染帧数（0 表示还没有出过画面） */
  framesRendered: number;
  width: number;
  height: number;
  pixelRatio: number;
  drawCalls: number;
}

export interface EngineOptions {
  onStats?: (stats: EngineStats) => void;
  /** 自动化测试需要回读帧缓冲时开启，正常使用关闭以获得更好性能 */
  preserveDrawingBuffer?: boolean;
}

/** 天空背景通道：将天空穹顶画进合成缓冲（最底层） */
class SkyPass extends Pass {
  private skyCamera: Camera;

  constructor(private readonly skyScene: Scene, camera: Camera) {
    super('SkyPass', skyScene, camera);
    this.skyCamera = camera;
    this.needsSwap = false;
  }

  override render(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget | null): void {
    renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer);
    renderer.clear(true, true, false);
    renderer.render(this.skyScene, this.skyCamera);
  }

  setCamera(camera: Camera): void {
    this.skyCamera = camera;
  }
}

export class ViewEngine {
  readonly renderer: WebGLRenderer;
  /** 是否为调试/自动化保留绘制缓冲（允许 readPixels 回读帧内容） */
  readonly preserveBuffer: boolean;
  readonly composer: EffectComposer;
  readonly camera = new ViewCamera();
  readonly sky: SkyDome;

  private readonly skyScene = new Scene();
  private readonly skyPass: SkyPass;
  private readonly aaPass: EffectPass;
  private readonly gradePass: EffectPass;
  private readonly fxaa: FXAAEffect;
  private readonly grade: GradeEffect;
  private readonly bloom: BloomEffect;
  private readonly bloomPass: EffectPass;
  private readonly layers = new Map<LayerId, BuiltLayer>();
  private readonly layerPasses = new Map<LayerId, LayerPass>();
  private readonly palette: Palette = buildPalette(5600, 0);
  private readonly look: LayerLook = {
    night: 0,
    nightColor: new Color(),
    tint: [1, 1, 1],
    haze: 1,
    fogColor: new Color(),
  };
  private readonly fogColor = new Color();

  private raf = 0;
  private disposed = false;
  private lastTime = 0;
  private elapsed = 0;
  private frameCount = 0;
  private fpsTimer = 0;
  private fps = 0;
  private framesRendered = 0;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private qualityScale = 1;
  private qualityCooldown = 0;
  private order: LayerId[] = [...ALL_LAYERS];
  private lastState: ViewState | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly onStats?: (stats: EngineStats) => void;

  constructor(
    private readonly container: HTMLElement,
    canvas: HTMLCanvasElement,
    options: EngineOptions = {},
  ) {
    this.onStats = options.onStats;
    this.preserveBuffer = options.preserveDrawingBuffer ?? false;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: this.preserveBuffer,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.info.autoReset = false;

    const textures = getTextures();
    this.sky = new SkyDome(textures.clouds);
    this.skyScene.add(this.sky.mesh);

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: HalfFloatType,
      multisampling: 0,
      depthBuffer: false,
    });
    this.composer.autoRenderToScreen = false;

    for (const id of ALL_LAYERS) {
      const built = buildLayer(id);
      this.layers.set(id, built);
      this.layerPasses.set(id, new LayerPass(id, built.scene, this.camera.camera, LAYER_SCALE[id]));
    }

    this.skyPass = new SkyPass(this.skyScene, this.camera.camera);
    this.composer.addPass(this.skyPass);
    for (const id of this.order) {
      this.composer.addPass(this.layerPasses.get(id) as LayerPass);
    }

    // 泛光：让信号灯、高光云层与金属轨面有轻微辉光
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.92,
      luminanceSmoothing: 0.22,
      intensity: 0.38,
      mipmapBlur: true,
      radius: 0.72,
      levels: 6,
    });
    this.bloomPass = new EffectPass(this.camera.camera, this.bloom);
    this.composer.addPass(this.bloomPass);

    this.fxaa = new FXAAEffect(1, 1);
    this.aaPass = new EffectPass(this.camera.camera, this.fxaa);
    this.composer.addPass(this.aaPass);

    this.grade = new GradeEffect();
    this.gradePass = new EffectPass(this.camera.camera, this.grade);
    this.gradePass.renderToScreen = true;
    this.composer.addPass(this.gradePass);

    this.resizeObserver = new ResizeObserver(() => {
      // 只关心尺寸本身，避免滚动导致的重复 resize
      this.resize();
    });
    this.resizeObserver.observe(this.container, { box: 'content-box' });
    this.resize();
    this.applyState({
      layers: {
        far: { opacity: 1, blend: 'normal', visible: true },
        mid: { opacity: 1, blend: 'normal', visible: true },
        near: { opacity: 1, blend: 'normal', visible: true },
      },
      order: [...ALL_LAYERS],
      fog: 0.34,
      colorTemp: 5600,
      night: false,
      camera: { pitch: -2, yaw: 0 },
    });
  }

  /** 应用完整视图状态（幂等、可高频调用） */
  applyState(state: ViewState): void {
    this.lastState = state;
    const night = state.night ? 1 : 0;

    this.camera.setAngles(state.camera.pitch, state.camera.yaw);
    this.camera.update();
    this.applyPalette(night, effectiveColorTemp(state.colorTemp, state.night));

    // 图层观感（夜间压暗 + 色温白平衡 + 静态大气透视）
    for (const built of this.layers.values()) built.applyLook(this.look, this.palette);

    // 每层的合成参数
    const nightHaze = 0.55 + 0.45 * night;
    const nightFog = rgb(0.014, 0.024, 0.045);
    for (const id of ALL_LAYERS) {
      const pass = this.layerPasses.get(id);
      if (!pass) continue;
      const layer = state.layers[id];
      const cfg = FOG_CONFIG[id];
      pass.opacity = layer.visible ? layer.opacity : 0;
      pass.blendMode = BLEND_CODE[layer.blend];
      // 滑条越强，雾的距离尺度越短（能见度越低）
      pass.fogDistance = cfg.scale * (1 - 0.86 * state.fog);
      pass.fogPower = cfg.power;
      // 二次曲线：小雾量柔和，大雾量迅速吞没远景
      pass.fogAmount = clamp01(Math.pow(state.fog, 1.55) * cfg.weight);
      pass.fogColor.copy(this.fogColor).lerp(nightFog, night * 0.68);
      pass.nightHaze = nightHaze;
    }

    if (state.order.join(',') !== this.order.join(',')) this.reorder(state.order);

    // 最终调色
    this.grade.exposure = 0.82 + 0.6 * night;
    this.grade.contrast = 1.12 - 0.08 * night;
    this.grade.saturation = 1.14 + 0.02 * night;
    this.grade.vignette = 0.4 + 0.1 * night;
    this.grade.setLift(rgb(0.05, 0.075, 0.13), night * 0.75);
    this.grade.grain = 0.3;
    this.bloom.intensity = 0.34 + 0.42 * night;
  }

  private applyPalette(night: number, colorTemp: number): void {
    buildPalette(colorTemp, night, this.palette);
    this.sky.applyPalette(this.palette);
    this.fogColor.copy(this.palette.fog);
    this.look.night = night;
    this.look.nightColor.copy(this.palette.ground).lerp(rgb(0.02, 0.03, 0.06), 0.7);
    this.look.tint = this.palette.tint;
    this.look.fogColor.copy(this.palette.fog);
  }
  private reorder(order: readonly LayerId[]): void {
    this.order = [...order];
    for (const pass of this.layerPasses.values()) this.composer.removePass(pass);
    let index = 1;
    for (const id of this.order) {
      const pass = this.layerPasses.get(id);
      if (!pass) continue;
      pass.renderToScreen = false;
      this.composer.addPass(pass, index);
      index += 1;
    }
    this.gradePass.renderToScreen = true;
  }

  resize(force = false): void {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = Math.round(Math.min(window.devicePixelRatio || 1, 1.6) * this.qualityScale * 100) / 100;
    if (!force && w === this.width && h === this.height && dpr === this.pixelRatio) return;
    this.width = w;
    this.height = h;
    this.pixelRatio = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.setAspect(w / h);
  }

  start(): void {
    if (this.raf || this.disposed) return;
    this.lastTime = performance.now();
    const loop = (now: number): void => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const delta = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
      this.lastTime = now;
      this.elapsed += delta;
      this.frame(delta);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame(delta: number): void {
    this.sky.update(this.elapsed);
    this.camera.update();
    this.renderer.info.reset();
    this.composer.render(delta);

    this.frameCount += 1;
    this.framesRendered += 1;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.tuneQuality();
      this.onStats?.(this.getStats());
    }
  }

  /**
   * 自适应画质：连续低帧率时降低渲染分辨率上限，恢复后抬回。
   * 每次调整都会重建渲染目标，因此只在跨过阈值时触发（带滞回与冷却）。
   */
  private tuneQuality(): void {
    if (this.preserveBuffer) return;
    this.qualityCooldown += 0.5;
    if (this.qualityCooldown < 2) return;
    let next = this.qualityScale;
    if (this.fps > 0 && this.fps < 26) next = Math.max(0.6, this.qualityScale - 0.15);
    else if (this.fps > 52) next = Math.min(1, this.qualityScale + 0.1);
    if (next === this.qualityScale) return;
    this.qualityScale = next;
    this.qualityCooldown = 0;
    this.resize(true);
  }

  getStats(): EngineStats {
    return {
      framesRendered: this.framesRendered,
      fps: this.fps,
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
      drawCalls: this.renderer.info.render.calls,
    };
  }

  /** 读取当前画面（JPEG data URL），用于导出预览 / 调试截图 */
  snapshot(width = 720): string | null {
    try {
      // 未开启 preserveDrawingBuffer 时，必须在同一个任务内先渲染再读取
      this.composer.render(0);
      const canvas = this.renderer.domElement;
      const scale = Math.min(1, width / Math.max(1, canvas.width));
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(canvas.width * scale));
      off.height = Math.max(1, Math.round(canvas.height * scale));
      const ctx = off.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(canvas, 0, 0, off.width, off.height);
      return off.toDataURL('image/jpeg', 0.75);
    } catch {
      return null;
    }
  }

  /** 当前状态下的估计能见度（公里），用于 HUD */
  visibilityKm(): number {
    const fog = this.lastState?.fog ?? 0.34;
    const cfg = FOG_CONFIG.far;
    const scale = cfg.scale * (1 - 0.86 * fog);
    const amount = clamp01(Math.pow(fog, 1.55) * cfg.weight);
    // 求「远景雾化达到 50%」的距离：amount * (1 - e^-(d/s)^p) = 0.5
    const target = amount <= 1e-3 ? Infinity : 0.5 / amount;
    if (!Number.isFinite(target) || target >= 1) return 99;
    const d = scale * Math.pow(-Math.log(1 - target), 1 / cfg.power);
    return Math.min(99, d / 1000);
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.composer.dispose();
    for (const built of this.layers.values()) built.dispose();
    this.layers.clear();
    this.sky.dispose();
    this.renderer.dispose();
  }
}

/** 检测 WebGL2 可用性，返回错误信息或 null */
export function checkWebGL2(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return '当前浏览器不支持 WebGL2，无法运行多图层合成。请使用最新版 Chrome / Edge / Firefox。';
    return null;
  } catch (error) {
    return `WebGL2 初始化失败：${String(error)}`;
  }
}
