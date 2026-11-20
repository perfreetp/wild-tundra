// Babylon 场景:WebGPU 引擎(自动回退 WebGL2)、巷道网络、路线渲染、拾取与第一人称运镜

import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { AppState, store } from "../store";
import {
  TUNNEL,
  nodePosition,
  signForward,
  signWorldPosition,
} from "../tunnel";
import { RoutePath } from "../routePath";

type PickCallback = (nodeId: string) => void;

interface MeshMeta {
  kind: "node" | "kp" | "sign";
  nodeId?: string;
  kpId?: string;
}

/** EXP2 雾在参考距离 25m 处达到给定能见度百分比时的密度换算 */
const FOG_REF_DISTANCE = 25;
function fogDensity(pct: number): number {
  if (pct <= 0) return 0;
  const visibility = 1 - pct / 100;
  return Math.sqrt(-Math.log(Math.max(0.01, visibility))) / FOG_REF_DISTANCE;
}

export class SceneManager {
  readonly engine: Engine;
  readonly scene: Scene;
  private editCamera: ArcRotateCamera;
  private fpvCamera: UniversalCamera;
  private headlight: SpotLight;
  private keyLight!: DirectionalLight;
  private ambient!: HemisphericLight;
  private nodeMeshes = new Map<string, Mesh>();
  private routeMeshes: Mesh[] = [];
  private kpMeshes = new Map<string, Mesh>();
  private gazeLines: Mesh[] = [];
  private onNodePick: PickCallback | null = null;
  private canvas: HTMLCanvasElement;
  private mode: "edit" | "preview" = "edit";

  private constructor(canvas: HTMLCanvasElement, engine: Engine) {
    this.canvas = canvas;
    this.engine = engine;
    const scene = new Scene(engine);
    this.scene = scene;
    scene.clearColor = new Color4(0.02, 0.025, 0.03, 1);

    // 雾:EXP2,编辑模式下保持极轻微薄雾
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.05, 0.055, 0.06);
    scene.fogDensity = fogDensity(3);

    this.editCamera = new ArcRotateCamera(
      "editCam",
      -Math.PI / 2.4,
      Math.PI / 3.2,
      95,
      new Vector3(30, 6, 26),
      scene
    );
    this.editCamera.wheelPrecision = 6;
    this.editCamera.lowerRadiusLimit = 6;
    this.editCamera.upperRadiusLimit = 220;
    this.editCamera.attachControl(canvas, true);

    this.fpvCamera = new UniversalCamera("fpvCam", new Vector3(0, 1.7, 0), scene);
    this.fpvCamera.minZ = 0.05;
    this.fpvCamera.fov = (60 * Math.PI) / 180;

    this.ambient = new HemisphericLight("ambient", new Vector3(0.2, 1, 0.3), scene);
    this.ambient.intensity = 0.85;
    this.ambient.groundColor = new Color3(0.06, 0.06, 0.07);

    // 编辑模式顶光;预览模式关闭,只留矿灯
    this.keyLight = new DirectionalLight(
      "keyLight",
      new Vector3(-0.4, -1, -0.3),
      scene
    );
    this.keyLight.intensity = 0.7;
    this.keyLight.diffuse = new Color3(0.9, 0.95, 1);

    // 矿灯:锥形聚光,跟随视线
    this.headlight = new SpotLight(
      "headlamp",
      new Vector3(0, 1.7, 0),
      new Vector3(0, 0, 1),
      Math.PI / 8, // 锥角约 22.5°
      32, // 聚光指数:越大光斑越集中、边缘越软
      scene
    );
    this.headlight.intensity = 2.2;
    this.headlight.range = 35;
    this.headlight.diffuse = new Color3(1, 0.95, 0.82);

    this.buildEnvironment();
    this.bindPicking();

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", this.handleResize);
  }

  static async Create(canvas: HTMLCanvasElement): Promise<SceneManager> {
    let engine: Engine;
    if (await WebGPUEngine.IsSupportedAsync) {
      const gpu = new WebGPUEngine(canvas, { antialias: true, stencil: true });
      await gpu.initAsync();
      engine = gpu as unknown as Engine;
    } else {
      engine = new Engine(canvas, true, { stencil: true }, true);
    }
    return new SceneManager(canvas, engine);
  }

  get engineName(): string {
    return this.engine instanceof WebGPUEngine ? "WebGPU" : "WebGL2";
  }

  setNodePickCallback(cb: PickCallback | null): void {
    this.onNodePick = cb;
  }

  private handleResize = (): void => {
    this.engine.resize();
  };

  // ---------- 环境搭建 ----------

  private buildEnvironment(): void {
    const scene = this.scene;

    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 220, height: 160, subdivisions: 4 },
      scene
    );
    ground.position.set(30, -0.6, 26);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.08, 0.08, 0.085);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;

    // 巷道:沿每条边生成圆管,关闭背面剔除使管内可见
    const tunnelMat = new StandardMaterial("tunnelMat", scene);
    tunnelMat.diffuseColor = new Color3(0.22, 0.2, 0.18);
    tunnelMat.emissiveColor = new Color3(0.08, 0.072, 0.062);
    tunnelMat.specularColor = new Color3(0.03, 0.03, 0.03);
    tunnelMat.backFaceCulling = false;

    for (const edge of TUNNEL.edges) {
      const a = nodePosition(edge.a);
      const b = nodePosition(edge.b);
      const tube = MeshBuilder.CreateTube(
        `tunnel_${edge.id}`,
        {
          path: [a, b],
          radius: 2.4,
          tessellation: 12,
          updatable: false,
        },
        scene
      );
      tube.material = tunnelMat;
      tube.isPickable = false;
    }

    // 节点标记球
    const nodeMat = new StandardMaterial("nodeMat", scene);
    nodeMat.emissiveColor = new Color3(0.35, 0.8, 1.0);
    nodeMat.disableLighting = true;
    for (const node of TUNNEL.nodes) {
      const sphere = MeshBuilder.CreateSphere(
        `node_${node.id}`,
        { diameter: 1.2, segments: 12 },
        scene
      );
      sphere.position = nodePosition(node.id);
      sphere.material = nodeMat;
      sphere.metadata = { kind: "node", nodeId: node.id } satisfies MeshMeta;
      this.nodeMeshes.set(node.id, sphere);
    }

    // 避灾标识牌:发光绿底 + 动态纹理文字
    for (const sign of TUNNEL.signs) {
      const plane = MeshBuilder.CreatePlane(
        `sign_${sign.id}`,
        { width: 3.2, height: 1.1 },
        scene
      );
      const tex = new DynamicTexture(
        `signTex_${sign.id}`,
        { width: 512, height: 192 },
        scene,
        false
      );
      this.drawSignTexture(tex, sign.label);
      const mat = new StandardMaterial(`signMat_${sign.id}`, scene);
      mat.emissiveTexture = tex;
      mat.disableLighting = true;
      mat.backFaceCulling = false;
      plane.material = mat;
      const pos = signWorldPosition(sign);
      plane.position = pos;
      plane.lookAt(pos.add(signForward(sign)));
      plane.metadata = { kind: "sign" } satisfies MeshMeta;
      plane.isPickable = false;
    }
  }

  private drawSignTexture(tex: DynamicTexture, label: string): void {
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "#0c5c2e";
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = "#9dffb0";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 176);
    ctx.fillStyle = "#eaffef";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 96);
    tex.update();
  }

  private bindPicking(): void {
    this.scene.onPointerObservable.add((info) => {
      if (this.mode !== "edit") return;
      if (info.type === PointerEventTypes.POINTERTAP) {
        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (m) => (m.metadata as MeshMeta | undefined)?.kind === "node"
        );
        if (pick?.hit && pick.pickedMesh) {
          const meta = pick.pickedMesh.metadata as MeshMeta;
          if (meta.nodeId) this.onNodePick?.(meta.nodeId);
        }
      } else if (info.type === PointerEventTypes.POINTERMOVE) {
        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (m) => (m.metadata as MeshMeta | undefined)?.kind === "node"
        );
        this.canvas.style.cursor = pick?.hit ? "pointer" : "default";
      }
    });
  }

  // ---------- 路线与关键点渲染 ----------

  refreshRoutes(state: AppState, paths: Map<string, RoutePath>): void {
    this.routeMeshes.forEach((m) => m.dispose());
    this.routeMeshes = [];
    this.kpMeshes.forEach((m) => m.dispose());
    this.kpMeshes.clear();
    this.gazeLines.forEach((m) => m.dispose());
    this.gazeLines = [];

    for (const route of state.routes) {
      const path = paths.get(route.id);
      if (!path || path.keyPointCount < 2) continue;
      const color = Color3.FromArray(route.color);

      const tube = MeshBuilder.CreateTube(
        `route_${route.id}`,
        { path: path.sampled, radius: 0.14, tessellation: 8 },
        this.scene
      );
      const mat = new StandardMaterial(`routeMat_${route.id}`, this.scene);
      mat.emissiveColor = color;
      mat.disableLighting = true;
      tube.material = mat;
      tube.isPickable = false;
      const isActive = route.id === state.activeRouteId;
      tube.visibility = this.mode === "preview" ? 0 : isActive ? 1 : 0.55;
      this.routeMeshes.push(tube);

      for (const kp of route.keyPoints) {
        const kpMesh = MeshBuilder.CreateSphere(
          `kp_${kp.id}`,
          { diameter: 0.85, segments: 14 },
          this.scene
        );
        kpMesh.position = nodePosition(kp.nodeId);
        const kpMat = new StandardMaterial(`kpMat_${kp.id}`, this.scene);
        kpMat.emissiveColor = isActive ? color : new Color3(0.7, 0.7, 0.7);
        kpMat.disableLighting = true;
        kpMesh.material = kpMat;
        kpMesh.metadata = { kind: "kp", kpId: kp.id } satisfies MeshMeta;
        kpMesh.visibility = this.mode === "preview" ? 0 : 1;
        this.kpMeshes.set(kp.id, kpMesh);
      }
    }

    this.updateSelection(state);
    this.updateGazeMarkers(state);
  }

  updateSelection(state: AppState): void {
    for (const [id, mesh] of this.kpMeshes) {
      const mat = mesh.material as StandardMaterial;
      mesh.scaling.setAll(id === state.selectedKPId ? 1.5 : 1);
      if (id === state.selectedKPId) {
        mat.emissiveColor = new Color3(1, 0.85, 0.1);
      }
    }
  }

  private updateGazeMarkers(state: AppState): void {
    this.gazeLines.forEach((m) => m.dispose());
    this.gazeLines = [];
    const kp = state.routes
      .find((r) => r.id === state.activeRouteId)
      ?.keyPoints.find((k) => k.id === state.selectedKPId);
    if (!kp || !kp.lookAtNodeId) return;
    const from = nodePosition(kp.nodeId);
    const to = nodePosition(kp.lookAtNodeId);
    const line = MeshBuilder.CreateTube(
      "gazeLine",
      {
        path: [from.add(new Vector3(0, 0.6, 0)), to.add(new Vector3(0, 0.6, 0))],
        radius: 0.05,
        tessellation: 6,
      },
      this.scene
    );
    const mat = new StandardMaterial("gazeMat", this.scene);
    mat.emissiveColor = new Color3(1, 0.4, 0.9);
    mat.disableLighting = true;
    line.material = mat;
    line.isPickable = false;
    this.gazeLines.push(line);

    const ring = MeshBuilder.CreateTorus(
      "gazeRing",
      { diameter: 1.6, thickness: 0.09, tessellation: 24 },
      this.scene
    );
    ring.position = to.add(new Vector3(0, 0.6, 0));
    const ringMat = new StandardMaterial("gazeRingMat", this.scene);
    ringMat.emissiveColor = new Color3(1, 0.4, 0.9);
    ringMat.disableLighting = true;
    ring.material = ringMat;
    ring.isPickable = false;
    this.gazeLines.push(ring);
  }

  // ---------- 模式切换与运镜 ----------

  enterEditMode(): void {
    this.mode = "edit";
    this.fpvCamera.detachControl();
    this.editCamera.attachControl(this.canvas, true);
    this.scene.activeCamera = this.editCamera;
    this.headlight.setEnabled(false);
    this.keyLight.setEnabled(true);
    this.ambient.intensity = 0.85;
    this.setHelpersVisible(true);
    this.scene.fogDensity = fogDensity(3);
  }

  enterPreviewMode(): void {
    this.mode = "preview";
    this.editCamera.detachControl();
    this.fpvCamera.attachControl(this.canvas, true);
    this.scene.activeCamera = this.fpvCamera;
    this.headlight.setEnabled(true);
    // 井下环境:关闭顶光、压低环境光,仅靠矿灯照明
    this.keyLight.setEnabled(false);
    this.ambient.intensity = 0.12;
    // 隐藏编辑辅助物,避免第一人称穿模
    this.setHelpersVisible(false);
  }

  /** 编辑辅助物(路线管/关键点/节点球/注视标记)仅在编辑模式可见 */
  private setHelpersVisible(visible: boolean): void {
    const state = store.state;
    this.routeMeshes.forEach((m) => {
      if (!visible) m.visibility = 0;
      else {
        const routeId = m.id.replace("route_", "");
        m.visibility = routeId === state.activeRouteId ? 1 : 0.55;
      }
    });
    this.kpMeshes.forEach((m) => (m.visibility = visible ? 1 : 0));
    this.gazeLines.forEach((m) => (m.visibility = visible ? 1 : 0));
    this.nodeMeshes.forEach((m) => (m.visibility = visible ? 1 : 0));
  }

  /**
   * 第一人称运镜帧。
   * @param t 路径时间(s),用于头摆相位
   * @param headSwayDeg 头摆幅度(0~2 度)
   */
  updatePlayFrame(
    position: Vector3,
    forward: Vector3,
    fovDeg: number,
    fogPct: number,
    t: number,
    headSwayDeg: number
  ): void {
    const eye = position.add(new Vector3(0, 1.7, 0));
    this.fpvCamera.position.copyFrom(eye);
    this.fpvCamera.fov = (fovDeg * Math.PI) / 180;
    this.fpvCamera.setTarget(eye.add(forward));

    // 头部微摆:偏航/俯仰/侧滚不同频率的低频正弦
    const sway = (headSwayDeg * Math.PI) / 180;
    const yaw = sway * 0.6 * Math.sin(t * 1.7);
    const pitch = sway * 0.35 * Math.sin(t * 2.3 + Math.PI / 2);
    const roll = sway * 0.2 * Math.sin(t * 1.1);
    this.fpvCamera.rotation.y += yaw;
    this.fpvCamera.rotation.x += pitch;
    this.fpvCamera.rotation.z += roll;

    // 矿灯跟随视线(含头摆后的实际朝向)
    const dir = this.fpvCamera.getDirection(Vector3.Forward());
    this.headlight.position.copyFrom(eye);
    this.headlight.direction.copyFrom(dir);

    this.scene.fogDensity = fogDensity(fogPct);
  }

  setEditFog(pct: number): void {
    if (this.mode === "edit") this.scene.fogDensity = fogDensity(pct);
  }

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
