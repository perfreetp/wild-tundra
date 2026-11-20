import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';
import type {
  ColorScheme,
  LeakPoint,
  NetworkData,
  Pipe,
  Side,
  SolverResult,
  ViewPreset,
} from '../types';
import {
  PipeIdMaps,
  buildHullGeometry,
  buildIdMaps,
  buildNodeGeometry,
  buildPipeGeometry,
  leakToFields,
  writeNodeVertexState,
  writePipeVertexState,
} from './geometryBuilder';import {
  applySchemeToMaterial,
  createPipeMaterial,
} from './shaders';
import { closestOnPolyline, pipePoints, polylineLength } from '../lib/geometry';

// three-mesh-bvh 注入
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export const VIEW_PRESETS: ViewPreset[] = [
  { id: 'iso', name: '透视全景', position: [260, 220, 300], target: [200, 0, 2] },
  { id: 'top', name: '俯视总览', position: [200, 460, 60], target: [200, 0, 0] },
  { id: 'street', name: '街景巡检', position: [120, 26, 48], target: [200, 0, 4] },
];

interface SideResources {
  group: THREE.Group;
  pipeMesh: THREE.Mesh;
  /** 逐管段不可见网格，持有独立 BVH 供射线拾取 */
  pickGroup: THREE.Group;
  nodeMesh: THREE.Mesh;
  hullGroup: THREE.Group;
  pipeGeos: Map<string, THREE.BufferGeometry>;
  maps: PipeIdMaps;
}

export interface SceneCallbacks {
  onPickPipe: (pipeId: string | null, side: Side) => void;
  onPickNode: (nodeId: string | null) => void;
  onLeakDrag: (leakId: string, t: number) => void;
}

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private raf = 0;
  private container: HTMLElement;
  private cb: SceneCallbacks;

  private material: THREE.ShaderMaterial;
  private hullMaterial: THREE.MeshBasicMaterial;
  private sides: Record<Side, SideResources | null> = {
    supply: null,
    return: null,
  };
  private side: Side = 'supply';
  private labelGroup = new THREE.Group();
  private leakGroup = new THREE.Group();

  private network: NetworkData | null = null;
  private results: Record<Side, SolverResult> | null = null;
  private scheme: ColorScheme | null = null;
  private leaks: LeakPoint[] = [];
  private selectedPipe: string | null = null;
  private showLabels = true;
  private affectedBuildings = new Set<string>();
  private nodePos = new Map<string, [number, number, number]>();

  // 泄漏拖拽
  private draggingLeak: LeakPoint | null = null;
  private dragPlane = new THREE.Plane();
  private downPos = { x: 0, y: 0 };
  private tmpV = new THREE.Vector3();

  // 相机补间
  private camTween: {
    fromP: THREE.Vector3;
    toP: THREE.Vector3;
    fromT: THREE.Vector3;
    toT: THREE.Vector3;
    start: number;
    dur: number;
  } | null = null;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, cb: SceneCallbacks) {
    this.container = container;
    this.cb = cb;
    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x0b1220, 1);
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 4000);
    this.camera.position.set(260, 220, 300);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(200, 0, 2);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;

    this.material = createPipeMaterial();
    this.hullMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    // 场景底座：地面网格 + 环境光
    const grid = new THREE.GridHelper(900, 90, 0x2a3f5f, 0x18243a);
    grid.position.set(200, -0.2, -20);
    this.scene.add(grid);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(120, 260, 160);
    this.scene.add(dir);
    this.scene.add(this.labelGroup);
    this.scene.add(this.leakGroup);

    const dom = this.renderer.domElement;
    // 捕获阶段拦截泄漏标记上的按下事件，阻止 OrbitControls 抢占指针
    dom.addEventListener('pointerdown', this.onCapturePointerDown, true);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.animate();
    // 调试/自动化钩子
    (container as unknown as { __sceneManager: SceneManager }).__sceneManager = this;
  }

  /** 自动化测试钩子（headless 验证用）：当前视图泄漏标记数量 */
  debugCountLeakMarkers(): number {
    return this.leakGroup.children.length;
  }

  /** 自动化测试钩子：管段顶点缓冲中泄漏半径场是否已生效 */
  debugLeakFieldActive(): boolean {
    const res = this.sides[this.side];
    if (!res) return false;
    for (const geo of res.pipeGeos.values()) {
      const attr = geo.getAttribute('aLeakC') as THREE.BufferAttribute | undefined;
      if (attr) for (let i = 0; i < attr.count; i++) if (attr.getX(i) > 0) return true;
    }
    return false;
  }

  /** 自动化测试钩子：首个泄漏标记的屏幕归一化坐标（-1~1） */
  debugLeakMarkerScreen(): { x: number; y: number } | null {
    const marker = this.leakGroup.children[0];
    if (!marker) return null;
    const world = new THREE.Vector3();
    marker.getWorldPosition(world);
    const ndc = world.project(this.camera);
    return { x: ndc.x, y: ndc.y };
  }

  /** 自动化测试钩子：在给定客户端坐标上做泄漏标记命中检测 */
  debugHitLeak(clientX: number, clientY: number): string | null {
    this.setPointer({ clientX, clientY } as PointerEvent);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.leakGroup.children, true);
    if (!hits.length) return null;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData.leakId) obj = obj.parent;
    return (obj?.userData.leakId as string) ?? null;
  }

  // ---------- 数据装载 ----------

  setNetwork(
    network: NetworkData,
    results: Record<Side, SolverResult>,
    scheme: ColorScheme,
    leaks: LeakPoint[],
    side: Side,
    affected: Set<string>,
  ) {
    this.disposeSides();
    this.network = network;
    this.results = results;
    this.scheme = scheme;
    this.leaks = [...leaks];
    this.side = side;
    this.affectedBuildings = new Set(affected);
    this.selectedPipe = null;
    this.nodePos = new Map();
    network.nodes.forEach((n) =>
      this.nodePos.set(n.id, [n.x, n.y, n.z]),
    );
    this.colorMode =
      (this.material.uniforms.uMode.value === 1 ? 'temperature' : 'pressure');
    applySchemeToMaterial(this.material, this.bandsFor(), this.colorMode);

    this.sides.supply = this.buildSide('supply');
    this.sides.return = this.buildSide('return');
    this.scene.add(this.sides.supply.group);
    this.scene.add(this.sides.return.group);
    this.refreshVertexStates();
    this.showSide(side);
    this.rebuildLabels();
    this.rebuildLeakMarkers();
  }

  private colorMode: 'pressure' | 'temperature' = 'pressure';

  private bandsFor() {
    const s = this.scheme!;
    return this.colorMode === 'pressure'
      ? s.pressureBands
      : s.temperatureBands;
  }

  private buildSide(side: Side): SideResources {
    const network = this.network!;
    const pipes = side === 'supply' ? network.supplyPipes : network.returnPipes;
    const maps = buildIdMaps(network, side);
    const group = new THREE.Group();
    group.name = `side-${side}`;
    const hullGroup = new THREE.Group();
    const pickGroup = new THREE.Group();
    pickGroup.name = `pick-${side}`;

    const pipeGeos = new Map<string, THREE.BufferGeometry>();
    for (const pipe of pipes) {
      const built = buildPipeGeometry(
        pipe,
        this.nodePos,
        maps.pipeNumeric.get(pipe.id)!,
      );
      built.geometry.computeBoundsTree();
      pipeGeos.set(pipe.id, built.geometry);

      // 逐管段拾取网格（独立 BVH）：完全透明但可参与射线求交
      // 注意不能用 visible=false —— three-mesh-bvh 的加速 raycast 对可见性处理不可靠
      const pickMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      });
      const pickMesh = new THREE.Mesh(built.geometry, pickMat);
      pickMesh.userData.pipeId = pipe.id;
      pickGroup.add(pickMesh);
    }
    const pipeMesh = new THREE.Mesh(
      mergeGeometries([...pipeGeos.values()].map((g) => g.clone()), false)!,
      this.material,
    );
    pipeMesh.name = `pipes-${side}`;
    pipeMesh.userData.side = side;

    const nodeGeo = buildNodeGeometry(network, maps.nodeNumeric);
    nodeGeo.computeBoundsTree();
    const nodeMesh = new THREE.Mesh(nodeGeo, this.material);
    nodeMesh.name = `nodes-${side}`;
    nodeMesh.userData.side = side;

    group.add(pipeMesh, nodeMesh, pickGroup, hullGroup);
    group.visible = side === this.side;
    return {
      group,
      pipeMesh,
      pickGroup,
      nodeMesh,
      hullGroup,
      pipeGeos,
      maps,
    };
  }

  /** 解算结果/泄漏/色带变化后刷新全部逐顶点属性与描边 */
  refreshVertexStates() {
    if (!this.network || !this.results) return;
    (['supply', 'return'] as Side[]).forEach((side) => {
      const res = this.sides[side];
      if (!res) return;
      const pipes =
        side === 'supply'
          ? this.network!.supplyPipes
          : this.network!.returnPipes;
      const fields = leakToFields(
        this.leaks.filter((l) => l.side === side),
        pipes,
        this.nodePos,
      );
      for (const pipe of pipes) {
        const geo = res.pipeGeos.get(pipe.id)!;
        writePipeVertexState(
          geo,
          pipe,
          this.results![side],
          fields,
          this.nodePos,
        );
      }
      writeNodeVertexState(
        res.nodeMesh.geometry,
        this.network!,
        res.maps.nodeNumeric,
        this.results![side],
        this.affectedBuildings,
      );
      this.rebuildHulls(side);
    });
    this.rebuildLeakMarkers();
  }

  /** 超阈值管段红色描边 hull（含选中管段白色描边） */
  private rebuildHulls(side: Side) {
    const res = this.sides[side];
    if (!res || !this.results) return;
    res.hullGroup.clear();
    const pipes =
      side === 'supply'
        ? this.network!.supplyPipes
        : this.network!.returnPipes;
    for (const pipe of pipes) {
      const pr = this.results[side].pipes[pipe.id];
      const selected = pipe.id === this.selectedPipe;
      if (!pr?.overThreshold && !selected) continue;
      const hullGeo = buildHullGeometry(res.pipeGeos.get(pipe.id)!);
      const mat = this.hullMaterial.clone();
      if (selected) {
        mat.color.set(0xffffff);
        mat.opacity = 0.7;
      }
      const hull = new THREE.Mesh(hullGeo, mat);
      hull.userData.pipeId = pipe.id;
      res.hullGroup.add(hull);
    }
  }

  // ---------- 视图切换 / 色带模式 ----------

  showSide(side: Side) {
    this.side = side;
    (['supply', 'return'] as Side[]).forEach((s) => {
      const r = this.sides[s];
      if (r) r.group.visible = s === side;
    });
    if (this.scheme) {
      applySchemeToMaterial(this.material, this.bandsFor(), this.colorMode);
    }
    this.rebuildLeakMarkers();
    this.rebuildLabels();
  }

  setColorMode(mode: 'pressure' | 'temperature', scheme: ColorScheme) {
    this.scheme = scheme;
    this.colorMode = mode;
    const bands =
      mode === 'pressure' ? scheme.pressureBands : scheme.temperatureBands;
    applySchemeToMaterial(this.material, bands, mode);
  }

  setScheme(scheme: ColorScheme) {
    this.scheme = scheme;
    this.setColorMode(this.colorMode, scheme);
  }

  setResults(
    results: Record<Side, SolverResult>,
    leaks: LeakPoint[],
    affected: Set<string>,
  ) {
    this.results = results;
    this.leaks = [...leaks];
    this.affectedBuildings = new Set(affected);
    this.refreshVertexStates();
  }

  setThresholdChanged() {
    this.refreshVertexStates();
  }

  // ---------- 选择 ----------

  selectPipe(pipeId: string | null) {
    this.selectedPipe = pipeId;
    (['supply', 'return'] as Side[]).forEach((s) => this.rebuildHulls(s));
  }

  /** 节点树联动：飞行定位到节点 */
  focusNode(nodeId: string) {
    const p = this.nodePos.get(nodeId);
    if (!p) return;
    const target = new THREE.Vector3(p[0], p[1], p[2]);
    const offset = new THREE.Vector3(42, 34, 48);
    this.startCamTween(target.clone().add(offset), target, 700);
  }

  focusPipe(pipeId: string) {
    const res = this.sides[this.side];
    if (!res) return;
    const geo = res.pipeGeos.get(pipeId);
    if (!geo) return;
    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox!.getCenter(center);
    this.startCamTween(center.clone().add(new THREE.Vector3(38, 30, 44)), center, 700);
  }

  applyPreset(preset: ViewPreset) {
    this.startCamTween(
      new THREE.Vector3(...preset.position),
      new THREE.Vector3(...preset.target),
      800,
    );
  }

  private startCamTween(
    toP: THREE.Vector3,
    toT: THREE.Vector3,
    dur: number,
  ) {
    this.camTween = {
      fromP: this.camera.position.clone(),
      toP,
      fromT: this.controls.target.clone(),
      toT,
      start: performance.now(),
      dur,
    };
  }

  // ---------- 标签 ----------

  setShowLabels(v: boolean) {
    this.showLabels = v;
    this.rebuildLabels();
  }

  private rebuildLabels() {
    this.labelGroup.clear();
    if (!this.showLabels || !this.network) return;
    const sideOffset = this.side === 'return' ? -4 : 0;
    for (const n of this.network.nodes) {
      if (n.type === 'junction') continue;
      const div = document.createElement('div');
      div.className = 'node-label';
      div.classList.add(n.type);
      if (this.affectedBuildings.has(n.id)) div.classList.add('affected');
      div.textContent = n.name;
      const obj = new CSS2DObject(div);
      obj.position.set(n.x, n.y + sideOffset, n.z + 2.6);
      this.labelGroup.add(obj);
    }
  }

  // ---------- 泄漏标记与拖拽 ----------

  private rebuildLeakMarkers() {
    this.leakGroup.clear();
    for (const lk of this.leaks) {
      if (lk.side !== this.side) continue;
      const pos = this.leakWorldPos(lk);
      if (!pos) continue;
      const marker = new THREE.Group();
      marker.userData.leakId = lk.id;

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 16, 12),
        new THREE.MeshStandardMaterial({
          color: 0xff2a2a,
          emissive: 0x880000,
          emissiveIntensity: 0.9,
        }),
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.18, 10, 28),
        new THREE.MeshBasicMaterial({ color: 0xff6a3c }),
      );
      ring.rotation.x = Math.PI / 2;
      const ring2 = ring.clone();
      ring2.rotation.x = 0;
      // 加大拾取热区：透明不可见的大球，避免小标记难以点中/拖拽
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(5, 12, 10),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      );
      hitSphere.name = 'leak-hit-sphere';
      marker.add(core, ring, ring2, hitSphere);
      marker.position.copy(pos);
      marker.name = 'leak-marker';
      this.leakGroup.add(marker);
    }
  }

  private leakWorldPos(lk: LeakPoint): THREE.Vector3 | null {
    const network = this.network;
    if (!network) return null;
    const pipes =
      lk.side === 'supply' ? network.supplyPipes : network.returnPipes;
    const pipe = pipes.find((p) => p.id === lk.pipeId);
    if (!pipe) return null;
    const pts = pipePoints(pipe, this.nodePos);
    const { total, cum } = polylineLength(pts);
    return pointByT(pts, cum, total, lk.t);
  }

  private onCapturePointerDown = (e: PointerEvent) => {
    const leak = this.hitLeak(e);
    if (!leak) return;
    // 命中泄漏标记：阻止 OrbitControls 抢占指针，并直接进入拖拽态
    e.stopImmediatePropagation();
    e.preventDefault();
    this.downPos = { x: e.clientX, y: e.clientY };
    this.draggingLeak = leak;
    this.controls.enabled = false;
    const p = this.leakWorldPos(leak);
    if (p) {
      const normal = this.camera.up.clone().normalize();
      this.dragPlane.setFromNormalAndCoplanarPoint(normal, p);
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.draggingLeak) return;
    this.downPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.draggingLeak) {
      const leak = this.hitLeak(e);
      this.renderer.domElement.style.cursor = leak ? 'grab' : '';
      return;
    }
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, hit)) return;
    const lk = this.draggingLeak;
    const pipes =
      lk.side === 'supply'
        ? this.network!.supplyPipes
        : this.network!.returnPipes;
    const pipe = pipes.find((p) => p.id === lk.pipeId)!;
    const pts = pipePoints(pipe, this.nodePos);
    const { total, cum } = polylineLength(pts);
    const snap = closestOnPolyline(pts, cum, total, hit);
    lk.t = THREE.MathUtils.clamp(snap.t, 0.02, 0.98);
    this.rebuildLeakMarkers();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.draggingLeak) {
      const lk = this.draggingLeak;
      this.draggingLeak = null;
      this.controls.enabled = true;
      this.cb.onLeakDrag(lk.id, lk.t);
      return;
    }
    const moved =
      Math.abs(e.clientX - this.downPos.x) +
      Math.abs(e.clientY - this.downPos.y);
    if (moved > 5) return; // 拖拽不触发拾取
    this.pick(e);
  };

  private hitLeak(e: PointerEvent): LeakPoint | null {
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.leakGroup.children, true);
    if (!hits.length) return null;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData.leakId) obj = obj.parent;
    const id = obj?.userData.leakId as string | undefined;
    return this.leaks.find((l) => l.id === id) ?? null;
  }

  private pick(e: PointerEvent) {
    const res = this.sides[this.side];
    if (!res) return;
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // 逐管段 BVH 拾取
    const pipeHits: THREE.Intersection[] = [];
    res.pickGroup.children.forEach((m) => {
      const mesh = m as THREE.Mesh;
      const list: THREE.Intersection[] = [];
      mesh.raycast(this.raycaster, list);
      list.forEach((it) => {
        it.object = mesh;
        pipeHits.push(it);
      });
    });
    const nodeHits = this.raycaster.intersectObject(res.nodeMesh, false);
    const bestPipe = pipeHits.sort((a, b) => a.distance - b.distance)[0];
    const bestNode = nodeHits[0];

    // 管段优先：节点球（含建筑基座）体积大，容易遮挡细管。
    // 仅当节点明显更近（差值超过 1.5m）时才判定为点选节点。
    const PICK_PRIORITY_TOLERANCE = 1.5;
    if (
      bestPipe &&
      (!bestNode || bestPipe.distance <= bestNode.distance + PICK_PRIORITY_TOLERANCE)
    ) {
      const pipeId = bestPipe.object.userData.pipeId as string;
      this.selectPipe(pipeId);
      this.cb.onPickPipe(pipeId, this.side);
      this.cb.onPickNode(null);
      return;
    }
    if (bestNode) {
      const geo = res.nodeMesh.geometry as THREE.BufferGeometry;
      const nodeAttr = geo.getAttribute('aNodeId') as THREE.BufferAttribute;
      const a = geo.index ? geo.index.getX(bestNode.face!.a) : bestNode.face!.a;
      const nodeNum = nodeAttr.getX(a);
      if (nodeNum > 0) {
        const nodeId = res.maps.numericToNode.get(nodeNum)!;
        this.cb.onPickNode(nodeId);
        return;
      }
    }
    this.selectPipe(null);
    this.cb.onPickPipe(null, this.side);
    this.cb.onPickNode(null);
  }

  private setPointer(e: PointerEvent) {
    // clientX/Y 与 getBoundingClientRect 同为视口坐标，直接相减得到画布内比例
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // ---------- 主循环 ----------

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();
    this.material.uniforms.uTime.value = t;
    if (this.camTween) {
      const k = THREE.MathUtils.clamp(
        (performance.now() - this.camTween.start) / this.camTween.dur,
        0,
        1,
      );
      const ease = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(
        this.camTween.fromP,
        this.camTween.toP,
        ease,
      );
      this.controls.target.lerpVectors(
        this.camTween.fromT,
        this.camTween.toT,
        ease,
      );
      if (k >= 1) this.camTween = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  // ---------- 资源释放 ----------

  private disposeSides() {
    (['supply', 'return'] as Side[]).forEach((s) => {
      const r = this.sides[s];
      if (!r) return;
      this.scene.remove(r.group);
      r.pipeGeos.forEach((g) => {
        g.disposeBoundsTree?.();
        g.dispose();
      });
      r.nodeMesh.geometry.disposeBoundsTree?.();
      r.nodeMesh.geometry.dispose();
      r.hullGroup.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (m.material as THREE.Material).dispose();
      });
    });
    this.sides.supply = null;
    this.sides.return = null;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onCapturePointerDown, true);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerup', this.onPointerUp);
    this.disposeSides();
    this.material.dispose();
    this.hullMaterial.dispose();
    this.renderer.dispose();
    dom.remove();
    this.labelRenderer.domElement.remove();
  }
}

function pointByT(
  pts: THREE.Vector3[],
  cum: number[],
  total: number,
  t: number,
): THREE.Vector3 {
  const d = t * total;
  for (let i = 1; i < pts.length; i++) {
    if (d <= cum[i] || i === pts.length - 1) {
      const seg = cum[i] - cum[i - 1] || 1e-9;
      const u = THREE.MathUtils.clamp((d - cum[i - 1]) / seg, 0, 1);
      return pts[i - 1].clone().lerp(pts[i], u);
    }
  }
  return pts[pts.length - 1].clone();
}
