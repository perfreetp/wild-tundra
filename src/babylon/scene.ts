import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  SpotLight,
  ShadowGenerator,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  type AbstractMesh,
  PointerEventTypes,
  type PointerInfo,
  EasingFunction,
  CubicEase,
} from '@babylonjs/core';
import {
  type TileState,
  shapeOf,
  findSnap,
  computeFoldTransforms,
  rotY,
  ANGLE_SNAP,
  type SnapCandidate,
} from '../geometry/math';
import { store } from '../state/store';
import { TILE_COLORS } from '../state/colors';
import {
  createTileMeshes,
  disposeTileMeshes,
  setMeshTransform,
  setOverlapVisual,
  matrixToQuaternion,
  TILE_THICKNESS,
  type TileMeshes,
} from './tiles';

interface TileView {
  meshes: TileMeshes;
  state: TileState;
  /** 抖动动画时间累积 */
  shakeT: number;
}

const TABLE_Y = 0;

export class BabylonScene {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  hemi: HemisphericLight;
  lamps: { id: number; light: SpotLight; bulb: Mesh; shadow: ShadowGenerator }[] = [];
  table: Mesh;

  private views = new Map<number, TileView>();
  private pickables: AbstractMesh[] = [];
  private lampPickables: AbstractMesh[] = [];

  /** 当前拖动状态 */
  private dragging:
    | { kind: 'tile'; id: number; pointerId: number; offsetX: number; offsetZ: number; moved: boolean }
    | { kind: 'lamp'; id: number; pointerId: number }
    | { kind: 'rotate'; id: number; pointerId: number; lastAngle: number; accumulated: number }
    | null = null;

  /** 当前吸附预览候选 */
  private snapPreview: SnapCandidate | null = null;
  /** 模板引导幽灵片 */
  private ghost: Mesh | null = null;
  /** 折叠动画:每条连接的视觉折角补间(不污染 store 的真实折角) */
  private foldVisual = new Map<string, number>();
  private foldAnimating = new Set<string>();
  /** 最近一次折叠计算出的世界变换(供世界空间 overlay 同步) */
  private lastTransforms: ReturnType<typeof computeFoldTransforms> | null = null;
  /** 相机是否正在程序化运动(双击回位) */
  private cameraTween = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    // 背景与台面同色系(显式不透明),避免地面边缘外露出刺眼白边
    this.scene.clearColor = Color3.FromHexString('#f3e3c3').toColor4(1);

    // beta 越小越俯视;用较陡的俯视角度,让台面充满整个视野(看不到地面边缘外的背景)
    this.camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 4.2, 11, new Vector3(0, 0, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 4;
    this.camera.upperRadiusLimit = 22;
    this.camera.lowerBetaLimit = 0.12;
    this.camera.upperBetaLimit = Math.PI / 2.4;
    this.camera.wheelPrecision = 20;
    this.camera.pinchPrecision = 40;
    // 禁用相机的键盘输入,保留触摸旋转/缩放模型
    this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');

    this.hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    this.hemi.intensity = 0.85;
    this.hemi.diffuse = Color3.FromHexString('#fffaf0');
    this.hemi.groundColor = Color3.FromHexString('#d8c3a0');

    this.table = this.buildTable();
    this.buildLamps();

    this.bindPointer(canvas);
    this.startRenderLoop();

    // 调试钩子(生产环境无害)
    (window as unknown as { __babylonScene?: Scene }).__babylonScene = this.scene;
  }

  private buildTable(): Mesh {
    // 台面极大,确保在所有允许的相机角度/缩放下方圆内都不会露出地面边缘
    const table = MeshBuilder.CreateGround('table', { width: 400, height: 400, subdivisions: 2 }, this.scene);
    const mat = new StandardMaterial('table-mat', this.scene);
    mat.diffuseColor = Color3.FromHexString('#f3e3c3');
    mat.specularColor = new Color3(0.2, 0.2, 0.2);
    table.material = mat;
    table.receiveShadows = true;
    table.position.y = TABLE_Y - TILE_THICKNESS / 2 - 0.002;
    return table;
  }

  private buildLamps() {
    const defs = store.lights();
    for (const def of defs) {
      // 聚光锥窄、强度温和,只做可拖动的投影灯,避免在台面打出大片过曝白斑
      const spot = new SpotLight(
        `lamp-${def.id}`,
        new Vector3(def.x, 8, def.z),
        new Vector3(0, -1, 0),
        Math.PI / 7,
        3,
        this.scene,
      );
      spot.diffuse = Color3.FromHexString(def.id === 1 ? '#fff3dc' : '#e3f2ff');
      spot.intensity = 0.32;
      spot.range = 40;

      const bulb = MeshBuilder.CreateSphere(`bulb-${def.id}`, { diameter: 0.4, segments: 16 }, this.scene);
      bulb.position.set(def.x, 0.25, def.z);
      const bmat = new StandardMaterial(`bulb-mat-${def.id}`, this.scene);
      bmat.emissiveColor = spot.diffuse;
      bmat.diffuseColor = spot.diffuse;
      bulb.material = bmat;

      const shadow = new ShadowGenerator(2048, spot);
      shadow.useBlurExponentialShadowMap = true;
      shadow.blurKernel = 24;
      shadow.setDarkness(0.28);
      // 限制阴影作用范围,聚焦在台面中心
      shadow.bias = 0.004;

      this.lamps.push({ id: def.id, light: spot, bulb, shadow });
      this.lampPickables.push(bulb);
    }
  }

  // ---------- 片的生命周期 ----------

  syncTiles(tiles: TileState[]) {
    const seen = new Set<number>();
    for (const state of tiles) {
      seen.add(state.id);
      let view = this.views.get(state.id);
      if (!view) {
        view = this.createView(state);
        this.views.set(state.id, view);
      }
      view.state = state;
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        disposeTileMeshes(view.meshes);
        this.views.delete(id);
      }
    }
    this.rebuildPickables();
    this.refreshFoldTransforms();
  }

  private createView(state: TileState): TileView {
    const colors = TILE_COLORS[state.kind];
    const meshes = createTileMeshes(this.scene, state.kind, colors.front, colors.back);
    for (const lamp of this.lamps) lamp.shadow.addShadowCaster(meshes.body);
    const view: TileView = { meshes, state, shakeT: 0 };
    meshes.body.metadata = { tileId: state.id };
    meshes.pickProxy.metadata = { tileId: state.id };
    return view;
  }

  private rebuildPickables() {
    this.pickables = [];
    for (const view of this.views.values()) {
      this.pickables.push(view.meshes.pickProxy, view.meshes.handle);
    }
  }

  // ---------- 每帧:折叠位姿、灯、高亮、抖动 ----------

  private refreshFoldTransforms() {
    const tiles = store.getTiles();
    const conns = store.getConns();
    if (tiles.length === 0) return;
    const rootId = store.rootId();
    const hasRoot = tiles.some((t) => t.id === rootId) ? rootId : tiles[0].id;
    // 折叠动画期间用视觉补间值替代 store 里的目标值(连接任一端 key 都能命中),store 真值不变
    const visualConns = conns.map((c) => {
      const v = this.foldVisual.get(c.a) ?? this.foldVisual.get(c.b);
      return v !== undefined ? { ...c, fold: v } : c;
    });
    const transforms = computeFoldTransforms(tiles, visualConns, hasRoot);
    this.lastTransforms = transforms;
    const mode = store.mode();
    const lifted = store.liftedId();

    for (const view of this.views.values()) {
      const tr = transforms.get(view.state.id);
      if (!tr) continue;
      const isLifted = lifted === view.state.id;
      if (mode === 'flat') {
        // 平铺:y 固定在台面,绕 y 旋转
        setMeshTransform(view.meshes.root, view.state.x, 0, view.state.z, rotY(-view.state.rot));
      } else {
        const liftY = isLifted ? 1.1 : 0;
        setMeshTransform(view.meshes.root, tr.x, tr.y + liftY, tr.z, tr.m);
      }
      // 手柄仅平铺模式且未在折叠时显示
      view.meshes.handle.setEnabled(mode === 'flat' && !isLifted);
    }

    this.syncOverlays();
  }

  /**
   * 发光管/描边管/手柄是世界空间网格,每帧按对应片的世界位姿同步。
   * 平铺:跟随 (x,z) 与绕 y 旋转;折叠:跟随片的世界变换(平移 + 旋转矩阵)。
   */
  private syncOverlays() {
    const mode = store.mode();
    for (const view of this.views.values()) {
      const shape = shapeOf(view.state.kind);
      // 该片的世界旋转矩阵与世界平移
      let worldM: number[];
      let ox: number, oy: number, oz: number;
      if (mode === 'flat') {
        worldM = rotY(-view.state.rot);
        ox = view.state.x; oy = 0; oz = view.state.z;
      } else {
        const tr = this.lastTransforms?.get(view.state.id);
        if (!tr) continue;
        worldM = tr.m;
        ox = tr.x; oy = tr.y; oz = tr.z;
      }
      const q = matrixToQuaternion(worldM);

      for (const ei of shape.straightEdges) {
        const local = shape.edges[ei];
        for (const tube of [view.meshes.edgeGlows.get(ei), view.meshes.brokenOutlines.get(ei)]) {
          if (!tube) continue;
          const midLocal = new Vector3(
            (local.a.x + local.b.x) / 2,
            tube.position.y,
            (local.a.z + local.b.z) / 2,
          );
          tube.rotationQuaternion = q;
          tube.position = new Vector3(
            ox + worldM[0] * midLocal.x + worldM[1] * midLocal.y + worldM[2] * midLocal.z,
            oy + worldM[3] * midLocal.x + worldM[4] * midLocal.y + worldM[5] * midLocal.z,
            oz + worldM[6] * midLocal.x + worldM[7] * midLocal.y + worldM[8] * midLocal.z,
          );
        }
      }

      // 手柄:位于片本地 +x 外侧,跟随同样的世界变换
      const handle = view.meshes.handle;
      if (handle.isEnabled()) {
        const hr = shape.radius + 0.38;
        const local = new Vector3(hr, TILE_THICKNESS / 2 + 0.14, 0);
        handle.rotationQuaternion = q;
        handle.position = new Vector3(
          ox + worldM[0] * local.x + worldM[1] * local.y + worldM[2] * local.z,
          oy + worldM[3] * local.x + worldM[4] * local.y + worldM[5] * local.z,
          oz + worldM[6] * local.x + worldM[7] * local.y + worldM[8] * local.z,
        );
      }
    }
  }

  private updateEdgeHighlights() {
    const mode = store.mode();
    const broken = store.brokenEdges();
    for (const view of this.views.values()) {
      const shape = shapeOf(view.state.kind);
      for (const ei of shape.straightEdges) {
        const glow = view.meshes.edgeGlows.get(ei)!;
        const outline = view.meshes.brokenOutlines.get(ei)!;
        const key = `${view.state.id}:${ei}`;
        outline.setEnabled(broken.includes(key));

        // 吸附预览:整条贴合边亮起
        let glowOn = false;
        if (this.snapPreview && mode === 'flat') {
          if (
            (this.snapPreview.tileId === view.state.id && this.snapPreview.edgeIndex === ei) ||
            (this.snapPreview.otherId === view.state.id && this.snapPreview.otherEdge === ei)
          ) {
            glowOn = true;
          }
        }
        glow.setEnabled(glowOn);
      }
    }
  }

  private updateOverlapAndShake(dt: number) {
    const overlapIds = store.overlapIds();
    for (const view of this.views.values()) {
      const isOverlap = overlapIds.includes(view.state.id);
      setOverlapVisual(view.meshes, isOverlap);
      if (isOverlap) {
        view.shakeT += dt * 40;
        const s = Math.sin(view.shakeT) * 0.03;
        view.meshes.root.position.x += s;
        view.meshes.root.position.z += Math.cos(view.shakeT * 1.3) * 0.03;
      } else {
        view.shakeT = 0;
      }
    }
  }

  private updateLamps() {
    const defs = store.lights();
    for (const def of defs) {
      const lamp = this.lamps.find((l) => l.id === def.id);
      if (!lamp) continue;
      lamp.bulb.position.set(def.x, 0.25, def.z);
      // 与 buildLamps 中的灯高保持一致
      lamp.light.position = new Vector3(def.x, 8, def.z);
    }
  }

  private updateGhost() {
    const hint = store.nextTemplateHint();
    if (!hint || store.mode() !== 'flat') {
      if (this.ghost) {
        this.ghost.dispose();
        this.ghost = null;
      }
      return;
    }
    if (!this.ghost) {
      // 幽灵片:从完整 tile 中取出 body 独立保留,销毁容器与其余子节点(手柄/描边/代理)
      const colors = TILE_COLORS[hint.kind];
      const meshes = createTileMeshes(this.scene, hint.kind, colors.front, colors.back);
      const body = meshes.body;
      body.parent = null; // 先脱离,避免递归销毁时被连带释放
      meshes.root.dispose(false, true);
      const mat = new StandardMaterial('ghost-mat', this.scene);
      mat.diffuseColor = Color3.FromHexString('#ffffff');
      mat.emissiveColor = Color3.FromHexString('#a5d8ff');
      mat.alpha = 0.35;
      body.material = mat;
      this.ghost = body;
    }
    // 引导片呼吸式闪烁
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 350);
    (this.ghost.material as StandardMaterial).alpha = 0.2 + pulse * 0.3;
    setMeshTransform(this.ghost, hint.x, 0.02, hint.z, rotY(-hint.rot));
  }

  // ---------- 指针交互 ----------

  private bindPointer(canvas: HTMLCanvasElement) {
    this.scene.onPointerObservable.add((info) => {
      if (info.type === PointerEventTypes.POINTERDOWN) this.onDown(info as PointerInfo);
      if (info.type === PointerEventTypes.POINTERUP) this.onUp();
      if (info.type === PointerEventTypes.POINTERMOVE) this.onMove();
    });
    // 双击:回到平铺视角
    let lastTap = 0;
    canvas.addEventListener('touchend', () => {
      const now = performance.now();
      if (now - lastTap < 320) this.resetCamera();
      lastTap = now;
    });
    canvas.addEventListener('dblclick', () => this.resetCamera());
  }

  private pickTile(): { id: number; part: 'body' | 'handle' } | null {
    const hit = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) =>
      this.pickables.includes(m),
    );
    if (hit?.hit && hit.pickedMesh?.metadata) {
      const meta = hit.pickedMesh.metadata as { tileId: number };
      const part = hit.pickedMesh.name === 'handle' ? 'handle' : 'body';
      return { id: meta.tileId, part };
    }
    return null;
  }

  private pickLamp(): number | null {
    const hit = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) =>
      this.lampPickables.includes(m),
    );
    if (hit?.hit && hit.pickedMesh) {
      return Number(hit.pickedMesh.name.split('-')[1]);
    }
    return null;
  }

  /** 屏幕坐标 -> 台面 y=0 平面世界坐标 */
  private pointerToTable(): Vector3 | null {
    const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m === this.table);
    return pick?.pickedPoint ?? null;
  }

  private onDown(info: PointerInfo) {
    const event = info.event as PointerEvent;
    const lampId = this.pickLamp();
    if (lampId !== null) {
      this.dragging = { kind: 'lamp', id: lampId, pointerId: event.pointerId };
      this.camera.detachControl();
      return;
    }

    const tileHit = this.pickTile();
    if (!tileHit) return;
    const view = this.views.get(tileHit.id);
    if (!view) return;

    if (store.mode() === 'folded') {
      // 3D 模式:点一片单独拿起,再点放回
      if (store.liftedId() === tileHit.id) {
        store.setLifted(null);
      } else {
        store.setLifted(tileHit.id);
      }
      return;
    }

    if (tileHit.part === 'handle') {
      this.dragging = {
        kind: 'rotate',
        id: tileHit.id,
        pointerId: event.pointerId,
        lastAngle: this.pointerAngleAround(view.state),
        accumulated: 0,
      };
      this.camera.detachControl();
      return;
    }

    // 拖动片:先断开连接
    store.detachTile(tileHit.id);
    const table = this.pointerToTable();
    let offX = 0;
    let offZ = 0;
    if (table) {
      offX = view.state.x - table.x;
      offZ = view.state.z - table.z;
    }
    this.dragging = { kind: 'tile', id: tileHit.id, pointerId: event.pointerId, offsetX: offX, offsetZ: offZ, moved: false };
    this.camera.detachControl();
  }

  private pointerAngleAround(state: TileState): number {
    const table = this.pointerToTable();
    if (!table) return 0;
    return Math.atan2(table.z - state.z, table.x - state.x);
  }

  private onMove() {
    if (!this.dragging) return;
    const table = this.pointerToTable();
    if (!table) return;

    if (this.dragging.kind === 'lamp') {
      store.moveLight(this.dragging.id, table.x, table.z);
      return;
    }

    if (this.dragging.kind === 'rotate') {
      const view = this.views.get(this.dragging.id);
      if (!view) return;
      const angle = this.pointerAngleAround(view.state);
      let delta = angle - this.dragging.lastAngle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.dragging.lastAngle = angle;
      this.dragging.accumulated += delta;
      // 累积到 15° 步进才转一格
      if (Math.abs(this.dragging.accumulated) >= ANGLE_SNAP) {
        const steps = Math.trunc(this.dragging.accumulated / ANGLE_SNAP);
        for (let i = 0; i < Math.abs(steps); i++) {
          store.rotateTile(this.dragging.id, steps > 0 ? 1 : -1);
        }
        this.dragging.accumulated -= steps * ANGLE_SNAP;
      }
      return;
    }

    if (this.dragging.kind === 'tile') {
      const view = this.views.get(this.dragging.id);
      if (!view) return;
      const nx = table.x + this.dragging.offsetX;
      const nz = table.z + this.dragging.offsetZ;
      this.dragging.moved = true;
      const live: TileState = { ...view.state, x: nx, z: nz };
      view.state = live;
      store.updateTile(live);
      // 吸附预览
      this.snapPreview = findSnap(live, store.getTiles().filter((t) => t.id !== live.id));
    }
  }

  private onUp() {
    if (!this.dragging) return;
    if (this.dragging.kind === 'tile') {
      const view = this.views.get(this.dragging.id);
      if (view) {
        const result = store.tryPlace(view.state);
        view.state = result.placed;
      }
      this.snapPreview = null;
    }
    this.dragging = null;
    this.camera.attachControl(this.engine.getRenderingCanvas()!, true);
  }

  // ---------- 折叠动画 ----------

  /** 每条连接的动画代次,新动画开始即作废旧动画,避免快速连点产生多个 rAF */
  private foldGen = new Map<string, number>();

  /**
   * 对一条连接做折叠补间动画。
   * store 里的折角在 foldOnce 时已同步更新为目标值,这里只插值视觉呈现,
   * 因此快速连续点击也能正确累积,且最终与 store 真值一致。
   */
  animateFold(connKeyStr: string, targetFold: number): Promise<void> {
    const conn = store.getConns().find((c) => c.a === connKeyStr || c.b === connKeyStr);
    if (!conn) return Promise.resolve();
    // 统一用连接的 a 端作为内部动画 key,避免传入 b 端时命不中
    const key = conn.a;

    const gen = (this.foldGen.get(key) ?? 0) + 1;
    this.foldGen.set(key, gen);
    this.foldAnimating.add(key);

    // 从当前视觉值(若有)起步
    const fromFold = this.foldVisual.get(key) ?? targetFold;
    if (Math.abs(fromFold - targetFold) < 1e-9) {
      this.foldVisual.delete(key);
      this.foldAnimating.delete(key);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const start = performance.now();
      const duration = 320;
      const ease = new CubicEase();
      ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
      const tick = () => {
        if (this.foldGen.get(key) !== gen) {
          resolve();
          return;
        }
        const t = Math.min(1, (performance.now() - start) / duration);
        const k = ease.ease(t);
        const value = fromFold + (targetFold - fromFold) * k;
        this.foldVisual.set(key, value);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          this.foldVisual.delete(key);
          this.foldAnimating.delete(key);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  resetCamera() {
    if (this.cameraTween) return;
    this.cameraTween = true;
    const cam = this.camera;
    const startAlpha = cam.alpha;
    const startBeta = cam.beta;
    const startRadius = cam.radius;
    const startTarget = cam.target.clone();
    const t0 = performance.now();
    const duration = 500;
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / duration);
      const k = ease.ease(t);
      cam.alpha = startAlpha + (-Math.PI / 2 - startAlpha) * k;
      cam.beta = startBeta + (Math.PI / 4.2 - startBeta) * k;
      cam.radius = startRadius + (11 - startRadius) * k;
      cam.target = Vector3.Lerp(startTarget, new Vector3(0, 0, 0), k);
      if (t < 1) requestAnimationFrame(tick);
      else this.cameraTween = false;
    };
    requestAnimationFrame(tick);
  }

  // ---------- 渲染循环 ----------

  private startRenderLoop() {
    let last = performance.now();
    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.refreshFoldTransforms();
      this.updateEdgeHighlights();
      this.updateOverlapAndShake(dt);
      this.updateLamps();
      this.updateGhost();
      this.scene.render();
    });
  }

  resize() {
    this.engine.resize();
  }

  dispose() {
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }

  /** 导出当前画面为 PNG dataURL(搭法卡片用) */
  captureDataUrl(): string {
    this.scene.render();
    return this.engine.getRenderingCanvas()!.toDataURL('image/png');
  }
}
