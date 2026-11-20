import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { BuiltWorld } from './sceneBuilder';
import { isTunnelSection } from './sceneBuilder';
import { CameraRig } from './cameraRig';
import { CullingManager } from './culling';
import { DrawCallBudget } from './drawBudget';
import { WeatherSystem } from './weather';
import { initBVHAcceleration } from './bvh';
import type {
  CameraPose,
  LightLevel,
  MaterialTuning,
  PoseSnapshot,
  RenderStats,
  TabId,
  ViewConfig,
  ViewId,
  WeatherConfig,
} from './types';
import { VIEW_IDS } from './types';

initBVHAcceleration();

const DEFAULT_POSE: CameraPose = {
  position: [0, 0, 0],
  lookAt: [1, 0, 0],
  up: [0, 1, 0],
};

export interface EngineCallbacks {
  onStats?: (stats: RenderStats) => void;
  onProgress?: (distance: number) => void;
  onPoses?: (poses: PoseSnapshot) => void;
}

/**
 * 视景渲染引擎：
 * 单个 WebGLRenderer 承载 3 个 PerspectiveCamera；
 * 单视点整幅渲染，三屏同显时按三等分视口分别 setViewport/setScissor 渲染。
 */
export class ViewEngine {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cameras: Record<ViewId, THREE.PerspectiveCamera>;
  private controls: Record<ViewId, OrbitControls>;
  private rig: CameraRig;
  private world: BuiltWorld;
  private culling = new CullingManager();
  private budget = new DrawCallBudget();
  private weather: WeatherSystem;
  private callbacks: EngineCallbacks;

  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private tunnelLights: THREE.PointLight[] = [];

  private container: HTMLElement;
  private resizeObserver: ResizeObserver;
  private rafId = 0;
  private clock = new THREE.Clock();
  private disposed = false;

  private tab: TabId = 'front';
  private activeView: ViewId = 'front';
  private viewConfigs: Record<ViewId, ViewConfig>;
  private weatherConfig: WeatherConfig;
  private lightLevel: LightLevel = 2;
  private routeProgress = 0;
  private autoDrive = true;
  private driveSpeed = 22; // m/s
  private statsTimer = 0;
  private poseTimer = 0;
  private fpsFrames = 0;
  private fpsTimer = 0;
  private fps = 0;

  constructor(
    container: HTMLElement,
    world: BuiltWorld,
    initialViews: Record<ViewId, ViewConfig>,
    weatherConfig: WeatherConfig,
    callbacks: EngineCallbacks = {},
  ) {
    this.container = container;
    this.world = world;
    this.callbacks = callbacks;
    this.rig = new CameraRig(world.centerline);
    this.viewConfigs = structuredClone(initialViews);
    this.weatherConfig = { ...weatherConfig };

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.autoClear = false; // 三视口手动 clear，避免相互覆盖
    this.renderer.info.autoReset = false;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x1b2430);
    this.scene.add(world.group);

    // 灯光：环境半球光 + 方向光 + 跟随列车的隧道点光源
    this.hemiLight = new THREE.HemisphereLight(0xdfe8f2, 0x3a4149, 1);
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(40, 80, 30);
    this.scene.add(this.hemiLight, this.dirLight);
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xfff2d8, 0, 26, 1.8);
      this.scene.add(pl);
      this.tunnelLights.push(pl);
    }

    // 三个视点相机
    this.cameras = {} as Record<ViewId, THREE.PerspectiveCamera>;
    this.controls = {} as Record<ViewId, OrbitControls>;
    for (const id of VIEW_IDS) {
      const cam = new THREE.PerspectiveCamera(
        this.viewConfigs[id].fov,
        container.clientWidth / container.clientHeight,
        this.viewConfigs[id].near,
        this.viewConfigs[id].far,
      );
      this.applyPose(cam, this.viewConfigs[id].pose);
      const ctl = new OrbitControls(cam, this.renderer.domElement);
      ctl.enableDamping = true;
      ctl.dampingFactor = 0.08;
      ctl.target.fromArray(this.viewConfigs[id].pose.lookAt);
      ctl.enabled = false;
      ctl.addEventListener('start', () => this.handleUserInteract(id));
      this.cameras[id] = cam;
      this.controls[id] = ctl;
    }

    this.weather = new WeatherSystem(this.scene, weatherConfig);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);

    this.applyLightLevel(this.lightLevel);
    this.loop();
  }

  // ---------- 外部配置接口 ----------

  setTab(tab: TabId): void {
    this.tab = tab;
    if (tab !== 'triple') this.activeView = tab;
    this.updateControlsState();
  }

  setActiveView(id: ViewId): void {
    this.activeView = id;
    this.updateControlsState();
  }

  setViewConfig(id: ViewId, patch: Partial<ViewConfig>): void {
    Object.assign(this.viewConfigs[id], patch);
    const cam = this.cameras[id];
    if (patch.fov !== undefined) cam.fov = patch.fov;
    if (patch.near !== undefined) cam.near = patch.near;
    if (patch.far !== undefined) cam.far = patch.far;
    if (patch.pose !== undefined) {
      // 幂等保护：引擎自身回传的机位与当前相机一致时不再写回，避免与 OrbitControls 阻尼打架
      const p = patch.pose;
      const samePos =
        Math.abs(cam.position.x - p.position[0]) < 1e-4 &&
        Math.abs(cam.position.y - p.position[1]) < 1e-4 &&
        Math.abs(cam.position.z - p.position[2]) < 1e-4;
      const target = this.controls[id].target;
      const sameTarget =
        Math.abs(target.x - p.lookAt[0]) < 1e-4 &&
        Math.abs(target.y - p.lookAt[1]) < 1e-4 &&
        Math.abs(target.z - p.lookAt[2]) < 1e-4;
      if (!(samePos && sameTarget)) {
        this.applyPose(cam, p);
        target.fromArray(p.lookAt);
      }
    }
    cam.updateProjectionMatrix();
  }

  getViewConfig(id: ViewId): ViewConfig {
    return structuredClone(this.viewConfigs[id]);
  }

  getAllViewConfigs(): Record<ViewId, ViewConfig> {
    return structuredClone(this.viewConfigs);
  }

  setWeather(config: WeatherConfig): void {
    this.weatherConfig = { ...config };
  }

  setLightLevel(level: LightLevel): void {
    this.lightLevel = level;
    this.applyLightLevel(level);
  }

  setMaterials(tuning: MaterialTuning): void {
    const t = this.world.tunnelMaterial;
    const tr = this.world.trainMaterial;
    t.color.set(tuning.tunnelColor);
    t.roughness = tuning.tunnelRoughness;
    tr.color.set(tuning.trainColor);
    tr.roughness = tuning.trainRoughness;
    tr.metalness = tuning.trainMetalness;
  }

  setAutoDrive(on: boolean): void {
    this.autoDrive = on;
  }

  setDriveSpeed(mps: number): number {
    this.driveSpeed = THREE.MathUtils.clamp(mps, 0, 60);
    return this.driveSpeed;
  }

  setRouteProgress(distance: number): void {
    this.routeProgress = THREE.MathUtils.clamp(distance, 0, this.rig.length);
    this.callbacks.onProgress?.(this.routeProgress);
  }

  get routeLength(): number {
    return this.rig.length;
  }

  get currentProgress(): number {
    return this.routeProgress;
  }

  /** 将指定视点（或全部）重新吸附到轨道中心线自动机位 */
  resetRig(id: ViewId | 'all' = 'all'): void {
    const poses = this.rig.getPosesAt(this.routeProgress);
    const targets = id === 'all' ? VIEW_IDS : [id];
    for (const vid of targets) {
      this.viewConfigs[vid].rigMode = true;
      this.viewConfigs[vid].pose = poses[vid];
      this.setViewConfig(vid, { pose: poses[vid], rigMode: true });
    }
  }

  /** 替换世界（加载外部 GLB 模型后） */
  replaceWorld(world: BuiltWorld): void {
    this.scene.remove(this.world.group);
    this.world.dispose();
    this.world = world;
    this.scene.add(world.group);
    this.rig = new CameraRig(world.centerline);
    this.culling.distanceMode = world.distanceMode;
    this.culling.reset();
    this.budget.reset();
    this.routeProgress = 0;
    this.resetRig('all');
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    for (const id of VIEW_IDS) this.controls[id].dispose();
    this.weather.dispose(this.scene);
    this.world.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------- 内部实现 ----------

  private handleUserInteract(id: ViewId): void {
    // 用户手动拖拽 → 脱离自动机位
    this.viewConfigs[id].rigMode = false;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.tab !== 'triple') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const third = rect.width / 3;
    const idx = Math.min(2, Math.floor(x / third)) as 0 | 1 | 2;
    this.setActiveView(VIEW_IDS[idx]);
  };

  private updateControlsState(): void {
    for (const id of VIEW_IDS) {
      const enabled =
        (this.tab === 'triple' && id === this.activeView) || this.tab === id;
      this.controls[id].enabled = enabled;
    }
  }

  private applyPose(cam: THREE.PerspectiveCamera, pose: CameraPose): void {
    cam.position.fromArray(pose.position);
    cam.up.fromArray(pose.up.length ? pose.up : DEFAULT_POSE.up);
    cam.lookAt(
      pose.lookAt[0],
      pose.lookAt[1],
      pose.lookAt[2],
    );
    cam.updateProjectionMatrix();
  }

  private applyLightLevel(level: LightLevel): void {
    // 0–3 档：0 灭灯，仅微弱环境光；3 最大强度
    const hemiTable = [0.08, 0.45, 0.85, 1.25];
    const dirTable = [0, 0.5, 1.1, 1.8];
    const pointTable = [0, 8, 18, 32];
    this.hemiLight.intensity = hemiTable[level];
    this.dirLight.intensity = dirTable[level];
    for (const pl of this.tunnelLights) pl.userData.baseIntensity = pointTable[level];
  }

  private handleResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    for (const id of VIEW_IDS) {
      const cam = this.cameras[id];
      cam.aspect =
        this.tab === 'triple' ? w / 3 / h : w / h;
      cam.updateProjectionMatrix();
    }
  }

  private updateTrainAndRig(delta: number): void {
    if (this.autoDrive) {
      this.routeProgress += this.driveSpeed * delta;
      if (this.routeProgress >= this.rig.length) {
        this.routeProgress = 0; // 循环运行演示
      }
      this.callbacks.onProgress?.(this.routeProgress);
    }

    // 列车沿中心线定位
    const u = this.routeProgress / this.rig.length;
    const p = this.world.centerline.getPointAt(u);
    const t = this.world.centerline.getTangentAt(u).normalize();
    this.world.train.position.copy(p);
    this.world.train.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t);

    // 自动机位的视点跟随中心线
    const poses = this.rig.getPosesAt(this.routeProgress);
    for (const id of VIEW_IDS) {
      if (!this.viewConfigs[id].rigMode) continue;
      this.viewConfigs[id].pose = poses[id];
      const cam = this.cameras[id];
      cam.position.fromArray(poses[id].position);
      cam.up.fromArray(poses[id].up);
      this.controls[id].target.fromArray(poses[id].lookAt);
    }
  }

  private updateTunnelLights(): void {
    const inTunnel = isTunnelSection(this.routeProgress);
    const base = this.tunnelLights[0]?.userData.baseIntensity ?? 0;
    const offsets = [-40, 0, 40, 80];
    this.tunnelLights.forEach((pl, i) => {
      const dist = this.routeProgress + offsets[i];
      if (dist < 0 || dist > this.rig.length) {
        pl.intensity = 0;
        return;
      }
      const lit = inTunnel && isTunnelSection(dist) && base > 0;
      const u = dist / this.rig.length;
      const p = this.world.centerline.getPointAt(u);
      pl.position.set(p.x, p.y + 4.4, p.z);
      pl.intensity = lit ? base : 0;
    });
  }

  private renderView(id: ViewId, x: number, y: number, w: number, h: number): number {
    const cam = this.cameras[id];
    cam.aspect = w / h;
    cam.updateProjectionMatrix();

    // 每个相机独立执行裁剪（视锥 BVH + 射线遮挡 + 距离预算）
    const before = this.renderer.info.render.calls;
    const visible = this.culling.cull(
      cam,
      this.world.chunks,
      this.routeProgress,
      this.budget.viewDistance,
      performance.now(),
    );
    this.lastVisibleCount += visible.size;
    this.lastOcclusionCulled += this.culling.lastOcclusionCulled;

    this.renderer.setViewport(x, y, w, h);
    this.renderer.setScissor(x, y, w, h);
    this.renderer.setScissorTest(true);
    this.renderer.clear();
    this.renderer.render(this.scene, cam);
    // 返回该视口自身的增量绘制调用
    return this.renderer.info.render.calls - before;
  }

  private lastVisibleCount = 0;
  private lastOcclusionCulled = 0;

  /** 执行一遍当前标签页的全部视口渲染，返回总绘制调用 */
  private renderPass(w: number, h: number): number {
    this.lastVisibleCount = 0;
    this.lastOcclusionCulled = 0;
    this.renderer.info.reset();
    let calls = 0;
    if (this.tab === 'triple') {
      const third = Math.floor(w / 3);
      VIEW_IDS.forEach((id, i) => {
        const vw = i === 2 ? w - third * 2 : third;
        calls += this.renderView(id, i * third, 0, vw, h);
      });
    } else {
      calls += this.renderView(this.tab, 0, 0, w, h);
    }
    return calls;
  }

  private loop = (): void => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updateTrainAndRig(delta);
    this.updateTunnelLights();
    this.weather.update(this.weatherConfig, this.cameras[this.activeView], delta);

    for (const id of VIEW_IDS) {
      if (this.viewConfigs[id].rigMode) {
        this.cameras[id].lookAt(this.controls[id].target);
      }
      this.controls[id].update();
      // 回写最新机位供保存/导出
      const cam = this.cameras[id];
      this.viewConfigs[id].pose = {
        position: cam.position.toArray(),
        lookAt: this.controls[id].target.toArray(),
        up: cam.up.toArray(),
      };
    }

    // 2.5Hz 节流回传机位，驱动面板读数与最新保存值
    this.poseTimer += delta;
    if (this.poseTimer >= 0.4) {
      this.poseTimer = 0;
      const snapshot = {} as PoseSnapshot;
      for (const id of VIEW_IDS) snapshot[id] = structuredClone(this.viewConfigs[id].pose);
      this.callbacks.onPoses?.(snapshot);
    }

    // 渲染：三屏同显时做帧内硬预算保证——超限即收窄视距并重渲该帧（最多重试到最低档）
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    let calls = this.renderPass(w, h);
    if (this.tab === 'triple') {
      while (calls > this.budget.hardLimit && this.budget.canClampDown) {
        this.budget.clampDown();
        calls = this.renderPass(w, h);
      }
    }
    this.renderer.setScissorTest(false);
    this.budget.record(calls);

    // 4Hz 上报统计
    this.fpsFrames++;
    this.fpsTimer += delta;
    this.statsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTimer);
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }
    if (this.statsTimer >= 0.25) {
      this.statsTimer = 0;
      this.callbacks.onStats?.({
        drawCalls: calls,
        triangles: this.renderer.info.render.triangles,
        visibleChunks: this.lastVisibleCount,
        totalChunks: this.world.chunks.length,
        occlusionCulled: this.lastOcclusionCulled,
        overBudget: this.budget.overBudget,
        fps: this.fps,
      });
    }
  };
}
