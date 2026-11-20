import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { GeneratedShader } from "../core/generate";

export interface PreviewLight {
  /** 方位角（弧度，绕 Y 轴）。 */
  azimuth: number;
  /** 仰角（弧度，0 = 地平线，PI/2 = 正上方）。 */
  elevation: number;
}

export interface CompileStats {
  /** 最近一次成功切换材质的耗时（毫秒）。 */
  lastCompileMs: number;
  /** 累计编译次数。 */
  totalCompiles: number;
  /** 最近 30 次编译耗时。 */
  recent: number[];
  /** 最近一次编译失败原因。 */
  lastError: string | null;
  /** 被队列合并（跳过）的请求数。 */
  coalesced: number;
}

export interface ViewportSample {
  r: number;
  g: number;
  b: number;
  coverage: number;
}

export interface PreviewSample {
  width: number;
  height: number;
  sphere: ViewportSample;
  plane: ViewportSample;
}

/** 参数停止变化多久后才编译：拖动期间不发编译，避免主线程被反复阻塞。 */
const IDLE_SETTLE_MS = 110;

const SPHERE_LAYER = 0x1;
const PLANE_LAYER = 0x2;
const SPHERE_BG = { r: 16, g: 22, b: 30 };
const PLANE_BG = { r: 18, g: 20, b: 26 };

export function lightVector(light: PreviewLight): Vector3 {
  const cosEl = Math.cos(light.elevation);
  return new Vector3(
    cosEl * Math.cos(light.azimuth),
    Math.sin(light.elevation),
    cosEl * Math.sin(light.azimuth),
  ).normalize();
}

/**
 * 一个引擎 + 一个画布 + 左右两个视口：左球体、右平面。
 * 每帧两个相机依次渲染，所以两个预览天然同步。
 */
export class MaterialPreview {
  private engine: Engine;
  private scene: Scene;
  private sphereMesh: Mesh;
  private planeMesh: Mesh;
  private sphereCamera: ArcRotateCamera;
  private planeCamera: ArcRotateCamera;
  private material: ShaderMaterial | null = null;
  private currentKey = "";
  private latest: GeneratedShader | null = null;
  /** 队列空闲时的回调，供 React 侧同步“已上屏”状态。 */
  onIdle: (() => void) | null = null;
  private draining = false;
  private light: PreviewLight = { azimuth: -Math.PI * 0.4, elevation: Math.PI * 0.3 };
  private roughnessScale = 1;
  private exposure = 1;
  private lightIntensity = 2.6;
  private disposed = false;
  private readonly stats: CompileStats = {
    lastCompileMs: 0,
    totalCompiles: 0,
    recent: [],
    lastError: null,
    coalesced: 0,
  };
  private renderLoopStarted = false;
  private readonly canvas: HTMLCanvasElement;

  /**
   * @param host 预览的容器元素。引擎会在其中自行创建 canvas —— React StrictMode
   * 下组件会挂载两次，复用同一个 canvas 会复用到已失效的 WebGL 上下文。
   */
  constructor(host: HTMLElement) {
    // 引擎独占这一层，React 不会在这里渲染任何子节点，双方不会互相改动 DOM
    const canvas = document.createElement("canvas");
    canvas.className = "preview-canvas";
    canvas.dataset.testid = "preview-canvas";
    host.appendChild(canvas);
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: false,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.063, 0.086, 0.118, 1);
    this.scene.autoClear = true;
    this.scene.autoClearDepthAndStencil = true;

    this.sphereCamera = new ArcRotateCamera(
      "sphereCamera",
      -Math.PI / 2 + 0.62,
      1.16,
      4.15,
      Vector3.Zero(),
      this.scene,
    );
    this.sphereCamera.fov = 0.7;
    this.sphereCamera.minZ = 0.1;
    this.sphereCamera.maxZ = 100;
    this.sphereCamera.viewport = new Viewport(0, 0, 0.5, 1);
    this.sphereCamera.layerMask = SPHERE_LAYER;

    this.planeCamera = new ArcRotateCamera(
      "planeCamera",
      Math.PI / 2 + 0.16,
      1.42,
      4.35,
      new Vector3(0, 0.02, 0),
      this.scene,
    );
    this.planeCamera.fov = 0.7;
    this.planeCamera.minZ = 0.1;
    this.planeCamera.maxZ = 100;
    this.planeCamera.viewport = new Viewport(0.5, 0, 0.5, 1);
    this.planeCamera.layerMask = PLANE_LAYER;

    this.scene.activeCameras = [this.sphereCamera, this.planeCamera];
    this.scene.activeCamera = this.sphereCamera;

    this.sphereMesh = CreateSphere("hmeSphere", { diameter: 2, segments: 64 }, this.scene);
    this.sphereMesh.layerMask = SPHERE_LAYER;
    this.sphereMesh.isPickable = false;

    this.planeMesh = CreateGround(
      "hmePlate",
      { width: 2.6, height: 2.6, subdivisions: 2 },
      this.scene,
    );
    // Ground 默认在 XZ 平面、法线 +Y；绕 X 轴 +90° 后法线朝 +Z，正对平面相机
    this.planeMesh.rotation.x = Math.PI / 2;
    this.planeMesh.layerMask = PLANE_LAYER;
    this.planeMesh.isPickable = false;
  }

  start(): void {
    if (this.renderLoopStarted || this.disposed) return;
    this.renderLoopStarted = true;
    this.engine.runRenderLoop(() => {
      if (!this.disposed) this.scene.render();
    });
  }

  resize(): void {
    if (this.disposed) return;
    this.engine.resize();
  }

  setLight(light: PreviewLight): void {
    this.light = { ...light };
    this.material?.setVector3("uLightDir", lightVector(this.light));
  }

  setRoughnessScale(value: number): void {
    this.roughnessScale = clamp(value, 0.2, 2.4);
    this.material?.setFloat("uRoughnessScale", this.roughnessScale);
  }

  setExposure(value: number): void {
    this.exposure = clamp(value, 0.4, 2.4);
    this.material?.setFloat("uExposure", this.exposure);
  }

  setLightIntensity(value: number): void {
    this.lightIntensity = clamp(value, 0.4, 6);
    this.material?.setFloat("uLightIntensity", this.lightIntensity);
  }

  /** 同步相机轨道，用于「视角」拖动模式。 */
  orbit(deltaAlpha: number, deltaBeta = 0, deltaRadius = 0): void {
    this.sphereCamera.alpha += deltaAlpha;
    this.planeCamera.alpha += deltaAlpha;
    this.sphereCamera.beta = clamp(this.sphereCamera.beta + deltaBeta, 0.2, Math.PI - 0.2);
    this.planeCamera.beta = clamp(this.planeCamera.beta + deltaBeta, 0.2, Math.PI - 0.2);
    const factor = Math.exp(deltaRadius);
    this.sphereCamera.radius = clamp(this.sphereCamera.radius * factor, 2.6, 8);
    this.planeCamera.radius = clamp(this.planeCamera.radius * factor, 2.6, 8);
  }

  getStats(): CompileStats {
    return { ...this.stats, recent: [...this.stats.recent] };
  }

  getMaterialKey(): string {
    return this.currentKey;
  }

  /**
   * 请求应用新源码。
   *
   * 连续拖动参数时会产生一串源码，这里按「稳定后编译」处理：
   * 1. 每次都只保留最新源码，排队等待的中间版本直接作废并计入合并数；
   * 2. 请求后要等 IDLE_SETTLE_MS 内没有新请求，才真正触发 GPU 编译。
   *    这样拖动过程中画面保持上一版材质（仍是 60fps），松手后一次性编译到最新，
   *    对不支持并行编译的软件渲染尤为重要。
   * 返回的 promise 在队列彻底空闲时 resolve，那时 currentKey 一定对应最新源码。
   */
  requestShader(shader: GeneratedShader): Promise<number> {
    if (this.disposed) return Promise.resolve(0);
    if (this.latest && this.latest.key !== shader.key) this.stats.coalesced += 1;
    this.latest = shader;
    this.lastRequestAt = performance.now();
    const settled = new Promise<number>((resolve) => {
      this.idleResolvers.push(resolve);
    });
    this.pump();
    return settled;
  }

  private lastRequestAt = 0;

  private pump(): void {
    if (this.draining || this.disposed) return;
    if (!this.latest) {
      this.resolveIdle();
      return;
    }
    if (this.pendingTimer !== null) return;
    this.draining = true;
    void this.runQueue();
  }

  private pendingTimer: number | null = null;

  private async runQueue(): Promise<void> {
    try {
      while (!this.disposed) {
        const target = this.latest;
        if (!target) break;
        if (target.key === this.currentKey) {
          this.latest = null;
          break;
        }
        // 等参数停止变化：窗口内又有新请求就继续等（中间版本自然作废）
        const quiet = IDLE_SETTLE_MS + clamp(this.stats.lastCompileMs * 0.5, 0, 200);
        const remaining = quiet - (performance.now() - this.lastRequestAt);
        if (remaining > 0) {
          await this.waitForQuiet(remaining);
          continue;
        }
        const next = this.latest;
        if (!next) break;
        if (next.key !== target.key) this.stats.coalesced += 1;
        if (next.key === this.currentKey) {
          this.latest = null;
          break;
        }
        this.latest = null;
        try {
          await this.applyShader(next);
        } catch {
          // applyShader 已记录错误；继续处理后续请求
        }
      }
    } finally {
      this.draining = false;
    }
    if (this.latest && this.latest.key !== this.currentKey) this.pump();
    else this.resolveIdle();
  }

  private waitForQuiet(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.pendingTimer = window.setTimeout(() => {
        this.pendingTimer = null;
        resolve();
      }, ms);
    });
  }

  private idleResolvers: ((value: number) => void)[] = [];

  private resolveIdle(): void {
    if (this.idleResolvers.length === 0) return;
    const resolvers = this.idleResolvers;
    this.idleResolvers = [];
    for (const resolve of resolvers) resolve(this.stats.lastCompileMs);
    this.onIdle?.();
  }

  /** 真正构建并等待一个材质就绪，就绪后才替换旧材质。 */
  private applyShader(shader: GeneratedShader): Promise<number> {
    const started = performance.now();
    const material = new ShaderMaterial(
      `hme-${shader.key}`,
      this.scene,
      { vertexSource: shader.vertexSource, fragmentSource: shader.fragmentSource },
      {
        attributes: shader.attributes,
        uniforms: shader.uniforms,
        needAlphaBlending: false,
        needAlphaTesting: false,
      },
      false,
    );
    material.backFaceCulling = true;
    material.setVector3("uLightDir", lightVector(this.light));
    material.setFloat("uLightIntensity", this.lightIntensity);
    material.setFloat("uRoughnessScale", this.roughnessScale);
    material.setFloat("uExposure", this.exposure);

    return this.waitUntilReady(material, started).then(
      () => {
        if (this.disposed) {
          material.dispose();
          return 0;
        }
        const previous = this.material;
        this.sphereMesh.material = material;
        this.planeMesh.material = material;
        this.material = material;
        this.currentKey = shader.key;
        if (previous) previous.dispose();
        const elapsed = performance.now() - started;
        this.stats.lastCompileMs = elapsed;
        this.stats.totalCompiles += 1;
        this.stats.recent = [...this.stats.recent, elapsed].slice(-30);
        this.stats.lastError = null;
        return elapsed;
      },
      (error: unknown) => {
        material.dispose();
        const message = error instanceof Error ? error.message : String(error);
        this.stats.lastError = message;
        throw error;
      },
    );
  }

  private waitUntilReady(material: ShaderMaterial, started: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 6000;
      const tick = () => {
        if (this.disposed) {
          resolve();
          return;
        }
        // isReady 会驱动 Babylon 创建 Effect；成功时返回 true
        const ready = material.isReady(this.sphereMesh);
        const effect = material.getEffect();
        if (ready) {
          const error = effect?.getCompilationError?.() ?? "";
          if (error.trim()) reject(new Error(firstLine(error)));
          else resolve();
          return;
        }
        const error = effect?.getCompilationError?.() ?? "";
        const allFallbacks = effect?.allFallbacksProcessed?.() ?? true;
        if (error.trim() && allFallbacks) {
          reject(new Error(firstLine(error)));
          return;
        }
        if (performance.now() - started > timeoutMs) {
          reject(new Error("着色器编译超时（>6s）"));
          return;
        }
        // 8ms 轮询：把等待让给渲染循环，避免编译期间掉帧
        window.setTimeout(tick, 8);
      };
      tick();
    });
  }

  /**
   * 立即渲染一帧并采样左右视口的平均颜色。
   * 直接读默认帧缓冲：readPixels 前显式解绑 FBO，否则 Babylon 残留的
   * 绑定会让采样读到空白。
   */
  sampleViewports(): PreviewSample {
    if (this.disposed) {
      return {
        width: 0,
        height: 0,
        sphere: { r: 0, g: 0, b: 0, coverage: 0 },
        plane: { r: 0, g: 0, b: 0, coverage: 0 },
      };
    }
    this.scene.render();
    this.engine.flushFramebuffer();
    const gl = (this.engine as unknown as { _gl: WebGLRenderingContext | undefined })._gl;
    if (!gl) {
      return {
        width: 0,
        height: 0,
        sphere: { r: 0, g: 0, b: 0, coverage: 0 },
        plane: { r: 0, g: 0, b: 0, coverage: 0 },
      };
    }
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    // 读到默认帧缓冲，否则拿到的是离屏 FBO 的空白
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      width,
      height,
      sphere: this.sampleRegion(gl, 0, 0, Math.floor(width / 2), height, SPHERE_BG),
      plane: this.sampleRegion(gl, Math.floor(width / 2), 0, Math.floor(width / 2), height, PLANE_BG),
    };
  }

  private sampleRegion(
    gl: WebGLRenderingContext,
    x: number,
    y: number,
    width: number,
    height: number,
    background: { r: number; g: number; b: number },
  ): ViewportSample {
    // 读取整个视口（不能缩小读取框，否则只采到角落里的一小块背景），
    // 再按步长在 CPU 侧抽样统计。
    const readW = Math.max(1, Math.floor(width));
    const readH = Math.max(1, Math.floor(height));
    const data = new Uint8Array(readW * readH * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(x, y, readW, readH, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const stride = 4;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    let covered = 0;
    for (let row = 0; row < readH; row += stride) {
      for (let col = 0; col < readW; col += stride) {
        const i = (row * readW + col) * 4;
        const pr = data[i];
        const pg = data[i + 1];
        const pb = data[i + 2];
        const distance =
          Math.abs(pr - background.r) + Math.abs(pg - background.g) + Math.abs(pb - background.b);
        if (distance > 26) {
          covered++;
          r += pr;
          g += pg;
          b += pb;
        }
        count++;
      }
    }
    if (covered === 0) return { r: 0, g: 0, b: 0, coverage: 0 };
    return { r: r / covered, g: g / covered, b: b / covered, coverage: covered / count };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.engine.stopRenderLoop();
    this.material?.dispose();
    this.scene.dispose();
    this.engine.dispose();
    this.canvas.remove();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function firstLine(text: string): string {
  return text.split("\n").find((line) => line.trim().length > 0) ?? text;
}
