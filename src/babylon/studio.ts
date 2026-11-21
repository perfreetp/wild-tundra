import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import "@babylonjs/core/Culling/ray";

import { buildCorridor, type Corridor } from "../core/corridor";
import { rasterizeCorridor, rasterStats, type CorridorRaster } from "../core/raster";
import { sampleTerrain } from "../core/terrain";
import { constrainPlanPoint, fitProfileToTerrain } from "../core/alignment";
import type { Project } from "../core/types";
import { TRACK } from "../core/types";
import { buildTerrainMesh, buildMarkers, type TerrainView } from "./sceneBuild";
import { buildTrackMeshes, type TrackMeshes } from "./track";
import { clamp } from "../core/math";

export type DisplayMode = "both" | "terrain" | "track";

export interface DragInfo {
  kind: "plan" | "profile" | null;
  id: string | null;
}

export interface StudioStats {
  fillArea: number;
  cutArea: number;
  fillCells: number;
  cutCells: number;
  maxFill: number;
  maxCut: number;
  maxToe: number;
  fillVolume: number;
  cutVolume: number;
  maxFillDepth: number;
  maxCutDepth: number;
  length: number;
}

export interface StudioCallbacks {
  onCorridor: (payload: {
    corridor: Corridor;
    raster: CorridorRaster;
    stats: StudioStats;
    selected: DragInfo;
  }) => void;
  onSelect: (info: DragInfo) => void;
}

interface Handle {
  kind: "plan" | "profile";
  id: string;
  node: TransformNode;
  knob: Mesh;
  meshes: Mesh[];
}

type DragState =
  | {
      kind: "plan";
      index: number;
      id: string;
      planeY: number;
      grabOffsetX: number;
      grabOffsetZ: number;
    }
  | {
      kind: "profile";
      index: number;
      id: string;
      startPointerY: number;
      startValue: number;
      scale: number;
    }
  | null;

export class Studio {
  engine!: WebGPUEngine;
  scene!: Scene;
  camera!: ArcRotateCamera;

  private canvas: HTMLCanvasElement;
  private overlay: HTMLElement;
  private terrainView!: TerrainView;
  private trackView!: TrackMeshes;
  private markersRoot: Mesh | null = null;
  private markerDefs: { s: number; label: string; pos: Vector3 }[] = [];
  private labelEls: { el: HTMLElement; pos: Vector3 }[] = [];
  private planHandles: Handle[] = [];
  private profileHandles: Handle[] = [];
  private planHandlesRoot!: TransformNode;
  private profileHandlesRoot!: TransformNode;
  private corridor!: Corridor;
  private raster!: CorridorRaster;
  private project!: Project;
  private selected: DragInfo = { kind: null, id: null };
  private callbacks: StudioCallbacks;
  private displayMode: DisplayMode = "both";
  private showZones = true;
  private showHandles = true;
  private drag: DragState = null;
  private stats: StudioStats = {
    fillArea: 0, cutArea: 0, fillCells: 0, cutCells: 0, maxFill: 0, maxCut: 0,
    maxToe: 0, fillVolume: 0, cutVolume: 0, maxFillDepth: 0, maxCutDepth: 0, length: 0,
  };
  private disposed = false;
  private hovered: Handle | null = null;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, callbacks: StudioCallbacks) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.callbacks = callbacks;
  }

  async init(project: Project) {
    this.project = project;
    const engine = new WebGPUEngine(this.canvas, {
      antialias: true,
      adaptToDeviceRatio: true,
      stencil: true,
    });
    await engine.initAsync();
    this.engine = engine;

    const scene = new Scene(engine);
    this.scene = scene;
    scene.clearColor = new Color4(0.055, 0.071, 0.094, 1);
    engine.runRenderLoop(() => {
      this.updateLabels();
      scene.render();
    });

    this.onResize = () => engine.resize();
    window.addEventListener("resize", this.onResize);

    const cam = new ArcRotateCamera(
      "camera",
      -Math.PI / 2 - 0.6,
      0.9,
      420,
      new Vector3(0, 30, 0),
      scene
    );
    cam.lowerRadiusLimit = 40;
    cam.upperRadiusLimit = 2400;
    cam.wheelPrecision = 0.25;
    cam.pinchPrecision = 40;
    cam.panningSensibility = 14;
    cam.upperBetaLimit = Math.PI / 2 - 0.035;
    cam.lowerBetaLimit = 0.05;
    cam.minZ = 1.5;
    cam.maxZ = 7000;
    cam.useNaturalPinchZoom = true;
    cam.inertia = 0.72;
    cam.attachControl(true);
    this.camera = cam;

    const hemi = new HemisphericLight("hemi", new Vector3(-0.5, 1, 0.35), scene);
    hemi.intensity = 0.4;
    hemi.diffuse = new Color3(0.74, 0.84, 1);
    hemi.groundColor = new Color3(0.3, 0.29, 0.27);

    this.terrainView = buildTerrainMesh(scene, project.terrain);
    this.planHandlesRoot = new TransformNode("planHandles", scene);
    this.profileHandlesRoot = new TransformNode("profileHandles", scene);

    this.rebuildAll();
    this.applyDisplayMode();
    this.installPointerHandlers();
    this.focusOnAlignment();
    if (import.meta.env.DEV) (window as any).__studio = this;
    return this;
  }

  private onResize = () => {};

  getProject(): Project {
    return this.project;
  }

  getCorridor(): Corridor {
    return this.corridor;
  }

  getStats(): StudioStats {
    return this.stats;
  }

  getSelected(): DragInfo {
    return this.selected;
  }

  // ------------------------------------------------------------------
  // 公共编辑接口
  // ------------------------------------------------------------------

  setSettings(partial: Partial<Project["settings"]>) {
    Object.assign(this.project.settings, partial);
    this.rebuildAll();
  }

  setRadius(id: string, radius: number) {
    const p = this.project.plan.find((q) => q.id === id);
    if (!p) return;
    p.radius = Math.max(0, radius);
    this.rebuildAll();
  }

  setPlanPoint(id: string, x: number, z: number) {
    const idx = this.project.plan.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const c = constrainPlanPoint(this.project.plan, idx, x, z, this.project.terrain);
    this.project.plan[idx].x = c.x;
    this.project.plan[idx].z = c.z;
    this.rebuildAll();
  }

  setProfilePoint(id: string, s: number, y: number) {
    const idx = this.project.profile.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const total = this.corridor.plan.length || 1;
    const p = this.project.profile[idx];
    p.y = clamp(y, -100, 600);
    if (idx > 0 && idx < this.project.profile.length - 1) {
      const lo = this.project.profile[idx - 1].s + 5;
      const hi = this.project.profile[idx + 1].s - 5;
      p.s = clamp(s, Math.min(lo, hi), Math.max(lo, hi));
    } else {
      p.s = clamp(s, 0, total);
    }
    this.rebuildAll();
  }

  addPlanPoint(): string | null {
    const plan = this.project.plan;
    let bestIdx = 1;
    let bestLen = -1;
    for (let i = 0; i < plan.length - 1; i++) {
      const d = Math.hypot(plan[i + 1].x - plan[i].x, plan[i + 1].z - plan[i].z);
      if (d > bestLen) { bestLen = d; bestIdx = i + 1; }
    }
    if (bestLen < 60) return null;
    const a = plan[bestIdx - 1];
    const b = plan[bestIdx];
    const x = (a.x + b.x) / 2;
    const z = (a.z + b.z) / 2;
    const id = nextIdIn(plan, "P");
    plan.splice(bestIdx, 0, { id, x, z, radius: 800 });
    this.rebuildAll();
    this.select({ kind: "plan", id });
    return id;
  }

  removePlanPoint(id: string): boolean {
    const plan = this.project.plan;
    const idx = plan.findIndex((p) => p.id === id);
    if (idx <= 0 || idx >= plan.length - 1) return false;
    plan.splice(idx, 1);
    this.selected = { kind: null, id: null };
    this.rebuildAll();
    this.callbacks.onSelect(this.selected);
    return true;
  }

  addProfilePoint(): string | null {
    const prof = this.project.profile;
    if (prof.length < 2) return null;
    let bestIdx = 1;
    let bestLen = -1;
    for (let i = 0; i < prof.length - 1; i++) {
      const d = Math.abs(prof[i + 1].s - prof[i].s);
      if (d > bestLen) { bestLen = d; bestIdx = i + 1; }
    }
    if (bestLen < 12) return null;
    const a = prof[bestIdx - 1];
    const b = prof[bestIdx];
    const id = nextIdIn(prof, "V");
    prof.splice(bestIdx, 0, { id, s: (a.s + b.s) / 2, y: (a.y + b.y) / 2 });
    this.rebuildAll();
    this.select({ kind: "profile", id });
    return id;
  }

  removeProfilePoint(id: string): boolean {
    const prof = this.project.profile;
    if (prof.length <= 2) return false;
    const idx = prof.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    prof.splice(idx, 1);
    this.selected = { kind: null, id: null };
    this.rebuildAll();
    this.callbacks.onSelect(this.selected);
    return true;
  }

  fitProfileToGround() {
    const pts = fitProfileToTerrain(
      this.project.terrain,
      this.corridor.plan,
      Math.max(4, this.project.profile.length),
      0,
      // 控制点间坡度允许 3% 的余量，抵消按控制点重算坡段时的舍入
      (this.project.settings.maxGradePermille / 1000) * 0.94
    );
    this.project.profile = pts;
    this.rebuildAll();
  }

  setDisplayMode(mode: DisplayMode) {
    this.displayMode = mode;
    this.applyDisplayMode();
  }

  setShowZones(show: boolean) {
    this.showZones = show;
    this.terrainView.setShowZones(show && this.displayMode !== "track");
  }

  setHandlesVisible(show: boolean) {
    this.showHandles = show;
    this.applyDisplayMode();
  }

  setProject(project: Project) {
    const terrainChanged = project.terrain !== this.project.terrain;
    this.project = project;
    this.selected = { kind: null, id: null };
    if (terrainChanged) {
      this.terrainView.dispose();
      this.terrainView = buildTerrainMesh(this.scene, project.terrain);
    }
    this.rebuildAll();
    this.applyDisplayMode();
    this.callbacks.onSelect(this.selected);
  }

  focusOnAlignment() {
    const c = this.corridor;
    if (!c || c.stations.length === 0) return;
    const mid = c.stations[Math.floor(c.stations.length / 2)];
    // 取线路整体包围盒中心，按线路长度和最大坡脚范围设定取景
    let cx = 0, cz = 0, cy = 0;
    for (const st of c.stations) { cx += st.x; cz += st.z; cy += st.formY; }
    const n = c.stations.length;
    cx /= n; cz /= n; cy /= n;
    this.camera.setTarget(new Vector3(cx, cy + 6, cz));
    this.camera.radius = clamp(c.plan.length * 0.46, 150, 620);
    this.camera.alpha = -Math.PI / 2 - 0.62;
    this.camera.beta = 0.78;
  }

  resize() {
    this.engine?.resize();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener("resize", this.onResize);
    for (const l of this.labelEls) l.el.remove();
    this.labelEls = [];
    this.engine?.dispose();
  }

  // ------------------------------------------------------------------
  // 重建
  // ------------------------------------------------------------------

  private rebuildAll() {
    this.rebuildCorridor();
    this.rebuildHandles();
    this.emit();
  }

  private rebuildCorridor() {
    const p = this.project;
    const prevRoot = this.trackView?.root;
    this.corridor = buildCorridor(p.terrain, p.plan, p.profile, p.settings);
    this.raster = rasterizeCorridor(p.terrain, this.corridor);
    const rs = rasterStats(this.raster);
    this.stats = {
      fillArea: rs.fillArea,
      cutArea: rs.cutArea,
      fillCells: rs.fillCells,
      cutCells: rs.cutCells,
      maxFill: rs.maxFill,
      maxCut: rs.maxCut,
      maxToe: this.corridor.maxToe,
      fillVolume: this.corridor.fillVolume,
      cutVolume: this.corridor.cutVolume,
      maxFillDepth: this.corridor.maxFillDepth,
      maxCutDepth: this.corridor.maxCutDepth,
      length: this.corridor.plan.length,
    };

    this.trackView = buildTrackMeshes(this.scene, this.corridor, p.settings.ballastWidth);
    prevRoot?.dispose(false, true);

    this.terrainView.update(this.corridor, this.raster, this.showZones && this.displayMode !== "track");

    if (this.markersRoot) {
      this.markersRoot.dispose(false, true);
      this.markersRoot = null;
    }
    const markers = buildMarkers(this.scene, this.corridor, p.terrain, 100);
    this.markersRoot = markers.root;
    this.markerDefs = markers.markers;
    this.syncMarkerLabels();
  }

  private syncMarkerLabels() {
    const needed = this.markerDefs.length;
    while (this.labelEls.length > needed) {
      this.labelEls.pop()?.el.remove();
    }
    while (this.labelEls.length < needed) {
      const el = document.createElement("div");
      el.className = "scene-label";
      this.overlay.appendChild(el);
      this.labelEls.push({ el, pos: new Vector3() });
    }
    for (let i = 0; i < needed; i++) {
      this.labelEls[i].el.textContent = this.markerDefs[i].label;
      this.labelEls[i].pos = this.markerDefs[i].pos;
    }
  }

  private updateLabels() {
    if (this.labelEls.length === 0) return;
    const scene = this.scene;
    const cam = scene.activeCamera as ArcRotateCamera | null;
    if (!cam) return;
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    if (w <= 0 || h <= 0) return;
    const viewport = cam.viewport.toGlobal(w, h);
    const tc = scene.getTransformMatrix();
    // overlay 与 canvas 是同一 stage 内的绝对定位兄弟节点，
    // 需要把屏幕坐标换算成相对 stage 左上角的位置。
    const canvasRect = this.canvas.getBoundingClientRect();
    const overlayRect = this.overlay.getBoundingClientRect();
    const offX = canvasRect.left - overlayRect.left;
    const offY = canvasRect.top - overlayRect.top;
    const sx = this.canvas.clientWidth / w;
    const sy = this.canvas.clientHeight / h;
    const visible = this.displayMode !== "terrain" && this.showHandles;
    const tmp = new Vector3();
    for (const item of this.labelEls) {
      if (!visible) {
        item.el.style.display = "none";
        continue;
      }
      Vector3.ProjectToRef(item.pos, Matrix.IdentityReadOnly, tc, viewport, tmp);
      const x = tmp.x;
      const y = tmp.y;
      const dist = Vector3.Distance(cam.globalPosition, item.pos);
      const onScreen = tmp.z > 0 && tmp.z < 1 && x > -80 && x < w + 80 && y > -60 && y < h + 60;
      if (!onScreen) {
        item.el.style.display = "none";
        continue;
      }
      const fade = clamp(1.25 - dist / 1500, 0.18, 1);
      item.el.style.display = "block";
      item.el.style.opacity = String(fade);
      item.el.style.transform = `translate(-50%, -50%) translate(${offX + x * sx}px, ${offY + y * sy}px)`;
    }
  }

  // ------------------------------------------------------------------
  // 控制手柄
  // ------------------------------------------------------------------

  private rebuildHandles() {
    for (const h of this.planHandles) h.node.dispose(false, true);
    for (const h of this.profileHandles) h.node.dispose(false, true);
    this.planHandles = [];
    this.profileHandles = [];

    const scene = this.scene;
    const plan = this.project.plan;
    plan.forEach((p, i) => {
      const ground = sampleTerrain(this.project.terrain, p.x, p.z);
      const s = this.corridor.plan.controlStations[i] ?? 0;
      const formY = this.corridor.profile.evalY(s) - TRACK.railToFormation;
      const baseY = Math.max(ground, formY);
      const node = new TransformNode(`planHandle_${p.id}`, scene);
      node.parent = this.planHandlesRoot;
      node.position.set(p.x, baseY, p.z);

      const stem = CreateCylinder(
        `stem_${p.id}`,
        { height: 8, diameterTop: 0.28, diameterBottom: 0.5, tessellation: 8 },
        scene
      );
      stem.parent = node;
      stem.position.y = 4;

      const knob = CreateSphere(`knob_${p.id}`, { diameter: 4.4, segments: 12 }, scene);
      knob.parent = node;
      knob.position.y = 8.6;

      const base = CreateCylinder(
        `planBase_${p.id}`,
        { height: 0.35, diameter: 3.0, tessellation: 18 },
        scene
      );
      base.parent = node;
      base.position.y = 0.18;

      const mat = new StandardMaterial(`planMat_${p.id}`, scene);
      mat.disableLighting = true;
      mat.emissiveColor = HANDLE_PLAN;
      mat.alpha = 0.96;
      for (const m of [stem, knob, base]) {
        m.material = mat;
        m.metadata = { kind: "plan", id: p.id };
        m.isPickable = true;
        m.renderingGroupId = 1;
      }
      this.planHandles.push({ kind: "plan", id: p.id, node, knob, meshes: [stem, knob, base] });
    });

    for (const pp of this.project.profile) {
      const st = this.stationAt(pp.s);
      if (!st) continue;
      // 节点放在控制点高程上；立杆向下延伸到地面，便于判断归属
      const node = new TransformNode(`profHandle_${pp.id}`, scene);
      node.parent = this.profileHandlesRoot;
      node.position.set(st.x, pp.y, st.z);
      const poleLen = Math.max(1.2, pp.y - st.formY + 1.6);

      const pole = CreateCylinder(
        `profPole_${pp.id}`,
        { height: poleLen, diameter: 0.24, tessellation: 8 },
        scene
      );
      pole.parent = node;
      pole.position.y = -poleLen / 2;

      const knob = CreateBox(`profKnob_${pp.id}`, { size: 2.4 }, scene);
      knob.parent = node;
      knob.rotation.y = Math.PI / 4;

      const mat = new StandardMaterial(`profMat_${pp.id}`, scene);
      mat.disableLighting = true;
      mat.emissiveColor = HANDLE_PROFILE;
      for (const m of [pole, knob]) {
        m.material = mat;
        m.metadata = { kind: "profile", id: pp.id };
        m.isPickable = true;
        m.renderingGroupId = 1;
      }
      this.profileHandles.push({
        kind: "profile", id: pp.id, node, knob, meshes: [pole, knob],
      });
    }
    this.applyHandleStyles();
  }

  private stationAt(s: number) {
    const stations = this.corridor.stations;
    if (stations.length === 0) return null;
    if (s <= stations[0].s) return stations[0];
    const last = stations[stations.length - 1];
    if (s >= last.s) return last;
    let lo = 0;
    let hi = stations.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (stations[mid].s < s) lo = mid + 1;
      else hi = mid;
    }
    return stations[lo];
  }

  private applyHandleStyles() {
    for (const h of this.planHandles) {
      const active = this.selected.kind === "plan" && this.selected.id === h.id;
      const hover = this.hovered === h;
      for (const m of h.meshes) {
        const mat = m.material as StandardMaterial;
        mat.emissiveColor = active ? HANDLE_PLAN_ACTIVE : hover ? HANDLE_PLAN_HOVER : HANDLE_PLAN;
      }
      h.knob.scaling.setAll(active ? 1.25 : hover ? 1.12 : 1);
    }
    for (const h of this.profileHandles) {
      const active = this.selected.kind === "profile" && this.selected.id === h.id;
      const hover = this.hovered === h;
      for (const m of h.meshes) {
        const mat = m.material as StandardMaterial;
        mat.emissiveColor = active
          ? HANDLE_PROFILE_ACTIVE
          : hover
          ? HANDLE_PROFILE_HOVER
          : HANDLE_PROFILE;
      }
      h.knob.scaling.setAll(active ? 1.25 : hover ? 1.12 : 1);
    }
  }

  // ------------------------------------------------------------------
  // 指针交互
  // ------------------------------------------------------------------

  private installPointerHandlers() {
    const scene = this.scene;

    scene.onPointerObservable.add((pi) => {
      const evt = pi.event as PointerEvent;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        const hit = this.pickHandle(scene.pointerX, scene.pointerY);
        if (hit) {
          this.beginDrag(hit, scene.pointerX, scene.pointerY, evt);
          this.camera.detachControl();
          evt.preventDefault();
          return;
        }
        // 点击空白处取消选择
        const pickedTerrain = scene.pick(scene.pointerX, scene.pointerY, (m) =>
          m.name === "terrain" || m.parent === this.trackView?.root
        );
        if (pickedTerrain?.hit) this.select({ kind: null, id: null });
      } else if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (this.drag) {
          this.updateDrag(scene.pointerX, scene.pointerY);
          evt.preventDefault();
          return;
        }
        const hit = this.pickHandle(scene.pointerX, scene.pointerY);
        if (hit !== this.hovered) {
          this.hovered = hit;
          this.applyHandleStyles();
          this.canvas.style.cursor = hit ? "grab" : "default";
        }
      } else if (pi.type === PointerEventTypes.POINTERUP) {
        if (this.drag) {
          this.drag = null;
          this.camera.attachControl(true);
          this.canvas.style.cursor = this.hovered ? "grab" : "default";
          this.rebuildAll();
        }
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      if (this.drag && this.drag.kind === "plan") {
        // 控制点跟随拖动后的位置
        const h = this.planHandles.find((x) => x.id === (this.drag as any).id);
        if (h) {
          const p = this.project.plan.find((q) => q.id === h.id);
          if (p) {
            const ground = sampleTerrain(this.project.terrain, p.x, p.z);
            const idx = this.project.plan.findIndex((q) => q.id === h.id);
            const s = this.corridor.plan.controlStations[idx] ?? 0;
            const formY = this.corridor.profile.evalY(s) - TRACK.railToFormation;
            h.node.position.set(p.x, Math.max(ground, formY), p.z);
          }
        }
      }
    });
  }

  private pickHandle(x: number, y: number): Handle | null {
    const pick = this.scene.pick(x, y, (m) =>
      !!(m.metadata && ((m.metadata as any).kind === "plan" || (m.metadata as any).kind === "profile"))
    );
    if (!pick?.hit || !pick.pickedMesh?.metadata) return null;
    const meta = pick.pickedMesh.metadata as { kind: "plan" | "profile"; id: string };
    const list = meta.kind === "plan" ? this.planHandles : this.profileHandles;
    return list.find((h) => h.id === meta.id) ?? null;
  }

  private beginDrag(h: Handle, px: number, py: number, evt: PointerEvent) {
    this.select({ kind: h.kind, id: h.id });
    if (h.kind === "plan") {
      const idx = this.project.plan.findIndex((p) => p.id === h.id);
      const p = this.project.plan[idx];
      const groundPoint = this.rayYPlane(px, py, h.node.position.y);
      this.drag = {
        kind: "plan",
        index: idx,
        id: h.id,
        planeY: h.node.position.y,
        grabOffsetX: groundPoint ? groundPoint.x - p.x : 0,
        grabOffsetZ: groundPoint ? groundPoint.z - p.z : 0,
      };
      void evt;
    } else {
      const idx = this.project.profile.findIndex((p) => p.id === h.id);
      // 用屏幕纵向尺度换算世界 Y 位移，保证拖动跟手
      const origin = h.node.position.clone();
      const a = this.projectPoint(origin);
      const b = this.projectPoint(origin.add(new Vector3(0, 10, 0)));
      const screenDelta = a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 40;
      this.drag = {
        kind: "profile",
        index: idx,
        id: h.id,
        startPointerY: py,
        startValue: this.project.profile[idx].y,
        scale: 10 / Math.max(screenDelta, 6),
      };
    }
    this.canvas.style.cursor = "grabbing";
  }

  private updateDrag(px: number, py: number) {
    const drag = this.drag;
    if (!drag) return;
    if (drag.kind === "plan") {
      const p = this.rayYPlane(px, py, drag.planeY);
      if (!p) return;
      const idx = drag.index;
      const target = constrainPlanPoint(
        this.project.plan,
        idx,
        p.x - drag.grabOffsetX,
        p.z - drag.grabOffsetZ,
        this.project.terrain
      );
      this.project.plan[idx].x = target.x;
      this.project.plan[idx].z = target.z;
      this.rebuildCorridorOnly();
    } else {
      const dy = (drag.startPointerY - py) * drag.scale;
      const prof = this.project.profile;
      prof[drag.index].y = clamp(drag.startValue + dy, -100, 600);
      this.rebuildCorridorOnly();
    }
  }

  /** 拖动过程中的轻量重建：只更新走廊、轨道与分区，不重建手柄。 */
  private rebuildCorridorOnly() {
    const p = this.project;
    const prevRoot = this.trackView?.root;
    this.corridor = buildCorridor(p.terrain, p.plan, p.profile, p.settings);
    this.raster = rasterizeCorridor(p.terrain, this.corridor);
    const rs = rasterStats(this.raster);
    this.stats = {
      ...this.stats,
      fillArea: rs.fillArea, cutArea: rs.cutArea, fillCells: rs.fillCells, cutCells: rs.cutCells,
      maxFill: rs.maxFill, maxCut: rs.maxCut, maxToe: this.corridor.maxToe,
      fillVolume: this.corridor.fillVolume, cutVolume: this.corridor.cutVolume,
      maxFillDepth: this.corridor.maxFillDepth, maxCutDepth: this.corridor.maxCutDepth,
      length: this.corridor.plan.length,
    };
    this.trackView = buildTrackMeshes(this.scene, this.corridor, p.settings.ballastWidth);
    prevRoot?.dispose(false, true);
    // 拖动过程中只重建轨道与路基网格，地形开挖留到拖动结束再整体结算，
    // 保证操作跟手。
    this.terrainView.update(
      this.corridor,
      this.raster,
      this.showZones && this.displayMode !== "track",
      true
    );
    this.applyDisplayMode();
    if (this.drag?.kind === "profile") {
      const h = this.profileHandles.find((x) => x.id === this.drag!.id);
      const st = this.stationAt(this.project.profile[this.drag.index].s);
      if (h && st) {
        h.node.position.set(st.x, this.project.profile[this.drag.index].y, st.z);
      }
    }
    this.emit();
  }

  private rayYPlane(px: number, py: number, y: number): Vector3 | null {
    const ray = this.scene.createPickingRay(px, py, null, this.camera);
    if (Math.abs(ray.direction.y) < 1e-5) return null;
    const t = (y - ray.origin.y) / ray.direction.y;
    if (t <= 0) return null;
    return ray.origin.add(ray.direction.scale(t));
  }

  private projectPoint(v: Vector3): { x: number; y: number } | null {
    const scene = this.scene;
    const cam = scene.activeCamera;
    if (!cam) return null;
    const p = Vector3.Project(v, Matrix.IdentityReadOnly, scene.getTransformMatrix(), cam.viewport.toGlobal(
      this.engine.getRenderWidth(), this.engine.getRenderHeight()
    ));
    return { x: p.x, y: p.y };
  }

  select(info: DragInfo) {
    this.selected = info;
    this.applyHandleStyles();
    this.callbacks.onSelect(info);
  }

  private applyDisplayMode() {
    if (!this.trackView) return;
    const mode = this.displayMode;
    this.terrainView.setDisplayMode(mode === "track" ? "hidden" : "solid");
    this.terrainView.setShowZones(mode !== "track" && this.showZones);
    const showTrack = mode !== "terrain";
    this.trackView.root.setEnabled(showTrack);
    if (this.markersRoot) this.markersRoot.setEnabled(showTrack);
    this.planHandlesRoot.setEnabled(showTrack && this.showHandles);
    this.profileHandlesRoot.setEnabled(showTrack && this.showHandles);
    for (const l of this.labelEls) if (!showTrack) l.el.style.display = "none";
  }

  private emit() {
    this.callbacks.onCorridor({
      corridor: this.corridor,
      raster: this.raster,
      stats: this.stats,
      selected: this.selected,
    });
  }
}

const HANDLE_PLAN = new Color3(0.94, 0.62, 0.18);
const HANDLE_PLAN_HOVER = new Color3(1.0, 0.74, 0.32);
const HANDLE_PLAN_ACTIVE = new Color3(1.0, 0.42, 0.14);
const HANDLE_PROFILE = new Color3(0.36, 0.78, 1.0);
const HANDLE_PROFILE_HOVER = new Color3(0.55, 0.87, 1.0);
const HANDLE_PROFILE_ACTIVE = new Color3(1.0, 0.86, 0.32);

function nextIdIn<T extends { id: string }>(list: T[], prefix: string): string {
  const used = new Set(list.map((x) => x.id));
  let i = 1;
  while (used.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}
