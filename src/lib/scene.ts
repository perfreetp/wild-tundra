// 引擎(WebGPU 优先,WebGL 回退)、场景、灯光、相机与视图模式
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  ShaderMaterial,
  ShaderLanguage,
  Vector3,
  WebGPUEngine,
} from "@babylonjs/core";
import type { CameraState } from "./types";

export interface SceneContext {
  engine: Engine | WebGPUEngine;
  scene: Scene;
  camera: ArcRotateCamera;
  isWebGPU: boolean;
  shaderLanguage: ShaderLanguage;
}

export async function createSceneContext(canvas: HTMLCanvasElement): Promise<SceneContext> {
  let engine: Engine | WebGPUEngine;
  let isWebGPU = false;

  const nav = navigator as Navigator & { gpu?: unknown };
  if (nav.gpu) {
    try {
      const gpuEngine = new WebGPUEngine(canvas, {
        antialias: true,
        stencil: true,
        adaptToDeviceRatio: true,
      });
      await gpuEngine.initAsync();
      engine = gpuEngine;
      isWebGPU = true;
    } catch (e) {
      console.warn("WebGPU 初始化失败,回退到 WebGL:", e);
      engine = new Engine(canvas, true, { stencil: true, adaptToDeviceRatio: true });
    }
  } else {
    engine = new Engine(canvas, true, { stencil: true, adaptToDeviceRatio: true });
  }

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.06, 0.07, 0.1, 1);

  const camera = new ArcRotateCamera("camera", -Math.PI / 3, Math.PI / 4.5, 320, new Vector3(0, 30, 0), scene);
  camera.attachControl(canvas, true);
  camera.wheelPrecision = 2;
  camera.lowerRadiusLimit = 40;
  camera.upperRadiusLimit = 900;
  camera.upperBetaLimit = Math.PI / 2 - 0.02;
  camera.panningSensibility = 80;

  const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.75;
  hemi.groundColor = new Color3(0.25, 0.25, 0.3);
  const dir = new DirectionalLight("dir", new Vector3(-0.5, -1, 0.35), scene);
  dir.intensity = 0.9;

  const shaderLanguage = isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
  buildGround(scene, shaderLanguage);

  return { engine, scene, camera, isWebGPU, shaderLanguage };
}

/** 地面:不受场景剖切平面影响的纯色网格(自定义着色器) */
function buildGround(scene: Scene, lang: ShaderLanguage): void {
  const ground = MeshBuilder.CreateDisc("ground", { radius: 400, tessellation: 48 }, scene);
  ground.rotation.x = Math.PI / 2;
  ground.position.y = -0.05;
  ground.isPickable = false;

  const mat = new ShaderMaterial(
    "groundMat",
    scene,
    { vertex: "unlit", fragment: "unlit" },
    {
      attributes: ["position"],
      uniforms: ["worldViewProjection", "baseColor"],
      shaderLanguage: lang,
    },
  );
  mat.setColor3("baseColor", new Color3(0.13, 0.14, 0.17));
  mat.backFaceCulling = false;
  ground.material = mat;
}

/** 视图模式:环绕 / 俯视 */
export function applyViewMode(camera: ArcRotateCamera, mode: "orbit" | "top"): void {
  if (mode === "top") {
    camera.beta = 0.03; // 接近正俯视
    camera.radius = Math.max(camera.radius, 260);
  } else {
    camera.beta = Math.PI / 4.5;
  }
}

export function readCameraState(camera: ArcRotateCamera): CameraState {
  return {
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
    target: [camera.target.x, camera.target.y, camera.target.z],
  };
}

export function applyCameraState(camera: ArcRotateCamera, s: CameraState): void {
  camera.alpha = s.alpha;
  camera.beta = s.beta;
  camera.radius = s.radius;
  camera.target = new Vector3(s.target[0], s.target[1], s.target[2]);
}
