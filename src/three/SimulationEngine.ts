import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  KernelSize,
  BlendFunction,
} from 'postprocessing';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useSimStore } from '../store';
import {
  LIGHTING_PRESETS,
  TUNNEL_ENTRY_Z,
  TUNNEL_EXIT_Z,
} from '../presets';
import type { CameraParams, SceneObject } from '../types';
import {
  applyLightingPreset,
  buildScene,
  createObjectRoot,
  type SceneRefs,
} from './SceneBuilder';
import { LensDistortionEffect } from '../effects/LensDistortionEffect';
import { RollingShutterEffect } from '../effects/RollingShutterEffect';
import { GridOverlayEffect } from '../effects/GridOverlayEffect';
import { ExposureEffect } from '../effects/ExposureEffect';

const CRUISE_MIN_Z = -360;
const CRUISE_MAX_Z = 20;

export class SimulationEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private refs: SceneRefs;

  private distortion: LensDistortionEffect;
  private rolling: RollingShutterEffect;
  private grid: GridOverlayEffect;
  private exposure: ExposureEffect;
  private bloom: BloomEffect;

  private transform: TransformControls;
  /** 相机近场补光：模拟近距环境反射，避免前景路面夜间死黑 */
  private fillLight: THREE.PointLight;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private camZ = CRUISE_MAX_Z;
  private lastCamZ = CRUISE_MAX_Z;
  private currentParams: CameraParams;
  private storeUnsub: () => void;
  private prevObjectCount = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    const state = useSimStore.getState();
    this.currentParams = { ...state.params };

    // ---------- 渲染器 ----------
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      preserveDrawingBuffer: true, // 支持截图导出
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // 色调映射交给 ExposureEffect
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ---------- 相机 ----------
    this.camera = new THREE.PerspectiveCamera(
      this.currentParams.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, this.currentParams.cameraHeight, this.camZ);
    this.camera.rotation.order = 'YXZ';

    // ---------- 场景 ----------
    this.refs = buildScene(state.objects);
    this.prevObjectCount = state.objects.length;

    // 相机近场补光（不投影，强度按光照预设动态调节）
    this.fillLight = new THREE.PointLight(0xbcd2ff, 0, 30, 2);
    this.camera.add(this.fillLight);
    this.refs.scene.add(this.camera);

    // ---------- 后处理管线 ----------
    // 使用 postprocessing 官方默认的 UnsignedByte + sRGB 工作流；
    // 背景/雾颜色在 SceneBuilder 中按该工作流显式转换，避免深色被提亮
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.refs.scene, this.camera));

    // Pass 1：夜间眩光（bloom 按光源强度触发）→ 曝光/动态范围
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.LARGE,
      mipmapBlur: true,
      luminanceThreshold: this.currentParams.glareThreshold,
      luminanceSmoothing: 0.12,
      intensity: this.currentParams.glareIntensity,
      radius: 0.82,
    });
    this.exposure = new ExposureEffect(
      this.currentParams.exposureStops,
      this.currentParams.dynamicRange,
    );
    this.composer.addPass(
      new EffectPass(this.camera, this.bloom, this.exposure),
    );

    // Pass 2：镜头畸变 → 滚动快门 → 标定网格（在最终成像坐标空间操作）
    this.distortion = new LensDistortionEffect(
      this.signedDistortion(this.currentParams),
      this.camera.aspect,
    );
    this.rolling = new RollingShutterEffect(
      this.currentParams.rollingShutterTilt,
    );
    this.grid = new GridOverlayEffect(this.currentParams.gridStep);
    const pass2 = new EffectPass(
      this.camera,
      this.distortion,
      this.rolling,
      this.grid,
    );
    this.composer.addPass(pass2);

    // ---------- 场景编辑（拾取 + 变换控制） ----------
    this.transform = new TransformControls(this.camera, this.renderer.domElement);
    this.transform.setMode('translate');
    this.transform.setSize(0.85);
    // 车辆与车道线只能在地面平面（XZ）上移动，避免被拖到空中或地下
    this.transform.showY = false;
    this.transform.addEventListener('dragging-changed', (e) => {
      const dragging = (e as unknown as { value: boolean }).value;
      if (dragging) {
        useSimStore.getState().setCruising(false);
      } else {
        this.syncTransformBack();
      }
    });
    // r169 起 TransformControls 不再是 Object3D：控件本体只负责事件监听，
    // getHelper() 返回的可视 gizmo 才加入场景
    this.refs.scene.add(this.transform.getHelper());

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('resize', this.onResize);

    this.applyAllParams(this.currentParams);

    // 订阅 store：参数与场景对象变化
    this.storeUnsub = useSimStore.subscribe((s, prev) => {
      if (s.params !== prev.params) {
        this.onParamsChanged(prev.params, s.params);
      }
      if (s.objects !== prev.objects) {
        this.onObjectsChanged(prev.objects, s.objects);
      }
    });

    this.clock.start();
    this.loop();
  }

  // ---------------------------------------------------------------- 参数同步

  private signedDistortion(p: CameraParams) {
    if (p.distortionMode === 'off') return 0;
    // 桶形为正（画面外鼓），枕形为负
    const k = p.distortionAmount * 0.85;
    return p.distortionMode === 'barrel' ? k : -k;
  }

  private onParamsChanged(prev: CameraParams, next: CameraParams) {
    this.currentParams = next;
    this.applyAllParams(next);
    if (prev.timeOfDay !== next.timeOfDay) {
      applyLightingPreset(
        this.refs,
        LIGHTING_PRESETS[next.timeOfDay],
      );
    }
  }

  /** 近场补光强度：白天关闭，黄昏微弱，夜间增强 */
  private updateFillLight() {
    const t = this.currentParams.timeOfDay;
    const target = t === 'day' ? 0 : t === 'dusk' ? 2.5 : 7;
    this.fillLight.intensity = THREE.MathUtils.lerp(
      this.fillLight.intensity,
      target,
      0.08,
    );
    // 隧道内补光再压暗
    this.fillLight.position.set(0, -0.5, -2);
  }

  private applyAllParams(p: CameraParams) {
    if (Math.abs(this.camera.fov - p.fov) > 0.01) {
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
    }
    this.distortion.setAmount(this.signedDistortion(p));
    this.distortion.setAspect(this.camera.aspect);
    this.rolling.setTilt(p.rollingShutterTilt);
    this.grid.setStep(p.gridStep);
    this.grid.blendMode.blendFunction = p.gridEnabled
      ? BlendFunction.SET
      : BlendFunction.SKIP;
    this.exposure.setStops(p.exposureStops);
    this.exposure.setDynamicRange(p.dynamicRange);

    this.bloom.luminanceMaterial.threshold = p.glareThreshold;
    this.bloom.intensity = p.glareEnabled ? p.glareIntensity : 0;
  }

  // ---------------------------------------------------------------- 场景对象

  private onObjectsChanged(prev: SceneObject[], next: SceneObject[]) {
    // 新增
    for (const obj of next) {
      if (!this.refs.objectRoots.has(obj.id)) {
        const root = createObjectRoot(
          obj,
          this.refs.vehicleHeadlights,
          this.refs.emissiveMaterials,
        );
        this.refs.objectRoots.set(obj.id, root);
        this.refs.scene.add(root);
        // 新对象的自发光/灯光需重新套用当前光照预设
        applyLightingPreset(
          this.refs,
          LIGHTING_PRESETS[this.currentParams.timeOfDay],
        );
      }
    }
    // 删除
    for (const obj of prev) {
      if (!next.find((n) => n.id === obj.id)) {
        const root = this.refs.objectRoots.get(obj.id);
        if (root) {
          this.refs.scene.remove(root);
          this.refs.objectRoots.delete(obj.id);
          this.refs.vehicleHeadlights.delete(obj.id);
        }
        if (this.transform.object?.name === obj.id) this.transform.detach();
      }
    }
    // 位置/朝向/属性变化（面板输入）
    for (const obj of next) {
      const old = prev.find((p) => p.id === obj.id);
      const root = this.refs.objectRoots.get(obj.id);
      if (!root || !old) continue;

      // 颜色 / 车道线尺寸变化 → 重建该对象
      if (
        old.color !== obj.color ||
        old.length !== obj.length ||
        old.width !== obj.width
      ) {
        this.refs.scene.remove(root);
        this.refs.objectRoots.delete(obj.id);
        this.refs.vehicleHeadlights.delete(obj.id);
        if (this.transform.object?.name === obj.id) this.transform.detach();
        const rebuilt = createObjectRoot(
          obj,
          this.refs.vehicleHeadlights,
          this.refs.emissiveMaterials,
        );
        this.refs.objectRoots.set(obj.id, rebuilt);
        this.refs.scene.add(rebuilt);
        applyLightingPreset(
          this.refs,
          LIGHTING_PRESETS[this.currentParams.timeOfDay],
        );
        continue;
      }

      const [x, y, z] = obj.position;
      if (
        root.position.x !== x ||
        root.position.y !== y ||
        root.position.z !== z ||
        root.rotation.y !== obj.rotationY
      ) {
        root.position.set(x, y, z);
        root.rotation.y = obj.rotationY;
      }
    }
    this.prevObjectCount = next.length;
  }

  private syncTransformBack() {
    const obj = this.transform.object;
    if (!obj) return;
    const id = obj.name;
    useSimStore.getState().updateObject(id, {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotationY: obj.rotation.y,
    });
  }

  // ---------------------------------------------------------------- 拾取

  private onPointerDown = (e: PointerEvent) => {
    if (this.transform.dragging || e.button !== 0) return;
    // 点中了变换手柄时不要触发场景拾取
    if (this.transform.axis !== null) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const roots = [...this.refs.objectRoots.values()];
    const hits = this.raycaster.intersectObjects(roots, true);
    if (hits.length === 0) {
      this.transform.detach();
      useSimStore.getState().select(null);
      return;
    }
    // 向上找到对象根节点
    let node: THREE.Object3D | null = hits[0].object;
    while (node && !this.refs.objectRoots.has(node.name)) node = node.parent;
    if (!node) return;
    this.transform.attach(node);
    useSimStore.getState().select(node.name);
  };

  setTransformMode(mode: 'translate' | 'rotate') {
    this.transform.setMode(mode);
    // 平移锁定地面平面；旋转模式恢复完整手柄（主要使用绕 Y 轴环）
    this.transform.showY = mode === 'rotate';
  }

  // ---------------------------------------------------------------- 巡航与渲染循环

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const store = useSimStore.getState();

    // 相机沿道路巡航（模拟车辆行驶，经过隧道产生明暗过渡）
    if (store.cruising && !this.transform.dragging) {
      this.camZ -= store.cruiseSpeed * dt;
      if (this.camZ < CRUISE_MIN_Z) this.camZ = CRUISE_MAX_Z;
    }
    this.lastCamZ = this.camera.position.z;
    this.camera.position.set(
      0,
      this.currentParams.cameraHeight,
      this.camZ,
    );
    this.camera.rotation.set(
      THREE.MathUtils.degToRad(this.currentParams.cameraPitch),
      0,
      0,
    );

    // 隧道内：压制环境光与阳光，形成入口暗、出口亮的过渡
    this.updateTunnelLighting();
    this.updateFillLight();

    // 阴影相机跟随
    this.refs.sun.target.position.set(0, 0, this.camZ);
    this.refs.sun.position.set(
      LIGHTING_PRESETS[this.currentParams.timeOfDay].sunPosition[0],
      LIGHTING_PRESETS[this.currentParams.timeOfDay].sunPosition[1],
      this.camZ + LIGHTING_PRESETS[this.currentParams.timeOfDay].sunPosition[2],
    );

    // 滚动快门运动流（相机前向运动 + 轻微横向抖动）
    const dz = this.lastCamZ - this.camZ;
    const lateralJitter = store.cruising
      ? Math.sin(performance.now() * 0.004) * 0.0006
      : 0;
    this.rolling.setMotion(
      lateralJitter,
      0,
      THREE.MathUtils.clamp(dz * 0.004, 0, 0.012),
    );

    this.composer.render(dt);
  };

  private tunnelFactor = 1;

  private updateTunnelLighting() {
    // 相机处于隧道内部的程度 0(外部) → 1(深处)，带 12m 线性过渡
    const fade = 12;
    let f = 0;
    if (this.camZ < TUNNEL_ENTRY_Z + fade && this.camZ > TUNNEL_EXIT_Z - fade) {
      if (this.camZ > TUNNEL_ENTRY_Z) {
        f = (TUNNEL_ENTRY_Z + fade - this.camZ) / fade;
      } else if (this.camZ < TUNNEL_EXIT_Z) {
        f = (this.camZ - (TUNNEL_EXIT_Z - fade)) / fade;
      } else {
        f = 1;
      }
    }
    f = THREE.MathUtils.clamp(f, 0, 1);
    this.tunnelFactor = THREE.MathUtils.lerp(this.tunnelFactor, f, 0.08);

    const preset = LIGHTING_PRESETS[this.currentParams.timeOfDay];
    const t = this.tunnelFactor;
    this.refs.hemi.intensity =
      preset.hemiIntensity *
      THREE.MathUtils.lerp(1, preset.tunnelInteriorLevel * 2.2, t);
    this.refs.sun.intensity =
      preset.sunIntensity * THREE.MathUtils.lerp(1, 0.02, t);

    // 夜间眩光按光源强度动态触发：隧道灯/路灯点亮区域 bloom 更强
    if (this.currentParams.glareEnabled) {
      const nightBoost = 0.35 + preset.artificialLightScale * 0.9;
      const target =
        this.currentParams.glareIntensity *
        THREE.MathUtils.lerp(nightBoost, 0.55, t);
      this.bloom.intensity = THREE.MathUtils.lerp(
        this.bloom.intensity,
        target,
        0.1,
      );
    }
  }

  // ---------------------------------------------------------------- 工具方法

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.distortion.setAspect(this.camera.aspect);
    this.grid.setSize(
      w * this.renderer.getPixelRatio(),
      h * this.renderer.getPixelRatio(),
    );
  };

  /** 当前相机沿道路的 Z 坐标（HUD 显示隧道状态用） */
  get cameraZ() {
    return this.camZ;
  }

  /** 直接传送相机到指定 Z 坐标（测试与演示用） */
  teleportCamera(z: number) {
    this.camZ = z;
  }

  /** 导出当前成像画面 PNG */
  captureScreenshot(): string {
    this.composer.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.storeUnsub();
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    // 注意：three r169 的 TransformControls.dispose() 存在 bug
    // （基类 Controls 没有 traverse 方法），需手动断开事件并释放 helper 资源
    this.transform.detach();
    this.transform.disconnect();
    this.transform.getHelper().traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.refs.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
