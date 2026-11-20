import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  Vector3
} from '@babylonjs/core';
import type { Engine } from '@babylonjs/core';

/** 场景单位约定:1 单位 ≈ 10mm,读数面板换算为 mm 显示 */
export const UNIT_TO_MM = 10;

export interface Organ {
  mesh: Mesh;
  center: Vector3;
  radii: Vector3;
  material: StandardMaterial;
}

export interface World {
  scene: Scene;
  camera: ArcRotateCamera;
  organ: Organ;
  trocars: Vector3[];
  targetZone: Mesh;
  targetZoneCenter: Vector3;
  targetZoneRadius: number;
  peg: Mesh;
  pegTop: Vector3;
  pegBase: Vector3;
  setOrganHighlight(on: boolean): void;
}

const ORGAN_CENTER = new Vector3(0, 5.2, 0);
const ORGAN_RADII = new Vector3(13, 4.2, 9.5);

export function createWorld(engine: Engine, canvas: HTMLCanvasElement): World {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.055, 0.06, 0.085, 1);

  // ---- 相机:左键旋转 / 中键平移 / 滚轮缩放 ----
  const camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.05, 34, new Vector3(0, 6, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 12;
  camera.upperRadiusLimit = 70;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 60;
  const pointers = camera.inputs.attached.pointers as unknown as { panningMouseButton: number };
  pointers.panningMouseButton = 1; // 中键平移(滚轮缩放为默认行为)

  // ---- 灯光 ----
  const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.75;
  const dir = new DirectionalLight('dir', new Vector3(-0.4, -1, 0.35), scene);
  dir.intensity = 0.9;
  const glow = new GlowLayer('glow', scene);
  glow.intensity = 0.6;

  // ---- 手术台面 ----
  const ground = MeshBuilder.CreateGround('ground', { width: 90, height: 70 }, scene);
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.16, 0.17, 0.2);
  groundMat.specularColor = Color3.Black();
  ground.material = groundMat;

  // ---- 器官(椭球软组织) ----
  const organMesh = MeshBuilder.CreateSphere('organ', { diameter: 2, segments: 32 }, scene);
  organMesh.scaling = ORGAN_RADII.clone();
  organMesh.position = ORGAN_CENTER.clone();
  const organMat = new StandardMaterial('organMat', scene);
  organMat.diffuseColor = new Color3(0.62, 0.22, 0.24);
  organMat.specularColor = new Color3(0.25, 0.12, 0.12);
  organMat.emissiveColor = Color3.Black();
  organMesh.material = organMat;

  const organ: Organ = {
    mesh: organMesh,
    center: ORGAN_CENTER.clone(),
    radii: ORGAN_RADII.clone(),
    material: organMat
  };

  let highlightOn = false;
  const setOrganHighlight = (on: boolean) => {
    if (on === highlightOn) return;
    highlightOn = on;
    organMat.emissiveColor = on ? new Color3(0.55, 0.1, 0.05) : Color3.Black();
  };

  // ---- 戳卡点 ----
  const trocars = [new Vector3(-6.5, 15.5, 5.5), new Vector3(6.5, 15.5, 5.5)];
  trocars.forEach((p, i) => {
    const port = MeshBuilder.CreateCylinder('trocar' + i, { diameterTop: 0.9, diameterBottom: 1.3, height: 1.6, tessellation: 24 }, scene);
    port.position = p.clone();
    const mat = new StandardMaterial('trocarMat' + i, scene);
    mat.diffuseColor = new Color3(0.75, 0.75, 0.8);
    mat.specularColor = new Color3(0.4, 0.4, 0.4);
    port.material = mat;
  });

  // ---- 放置目标区(发光圆环) ----
  const targetZoneCenter = surfacePointAt(5.5, -3.5);
  const targetZone = MeshBuilder.CreateTorus('targetZone', { diameter: 5, thickness: 0.28, tessellation: 48 }, scene);
  targetZone.position = targetZoneCenter.add(new Vector3(0, 0.15, 0));
  const zoneMat = new StandardMaterial('zoneMat', scene);
  zoneMat.emissiveColor = new Color3(0.1, 0.7, 0.9);
  zoneMat.diffuseColor = Color3.Black();
  targetZone.material = zoneMat;

  // ---- 穿孔环任务的立柱 ----
  const pegBase = surfacePointAt(-4.5, -4);
  const peg = MeshBuilder.CreateCylinder('peg', { diameter: 0.55, height: 4.4, tessellation: 24 }, scene);
  peg.position = pegBase.add(new Vector3(0, 2.2, 0));
  const pegMat = new StandardMaterial('pegMat', scene);
  pegMat.diffuseColor = new Color3(0.85, 0.7, 0.3);
  pegMat.emissiveColor = new Color3(0.12, 0.09, 0.02);
  peg.material = pegMat;
  const pegTop = pegBase.add(new Vector3(0, 4.4, 0));

  return {
    scene,
    camera,
    organ,
    trocars,
    targetZone,
    targetZoneCenter,
    targetZoneRadius: 2.5,
    peg,
    pegTop,
    pegBase,
    setOrganHighlight
  };
}

/** 器官表面 (x,z) 处的高度(上半椭球) */
export function surfacePointAt(x: number, z: number): Vector3 {
  const nx = (x - ORGAN_CENTER.x) / ORGAN_RADII.x;
  const nz = (z - ORGAN_CENTER.z) / ORGAN_RADII.z;
  const rest = Math.max(0, 1 - nx * nx - nz * nz);
  const y = ORGAN_CENTER.y + ORGAN_RADII.y * Math.sqrt(rest);
  return new Vector3(x, y, z);
}

export interface OrganHit {
  /** 归一化距离:<1 表示在器官内部 */
  s: number;
  /** 近似穿透深度(场景单位) */
  penetration: number;
  contact: boolean;
}

/** 钳尖与器官表面的接触检测(缩放空间单位球近似) */
export function organContact(organ: Organ, tip: Vector3): OrganHit {
  const q = tip.subtract(organ.center);
  const sx = q.x / organ.radii.x;
  const sy = q.y / organ.radii.y;
  const sz = q.z / organ.radii.z;
  const s = Math.sqrt(sx * sx + sy * sy + sz * sz);
  const rMin = Math.min(organ.radii.x, organ.radii.y, organ.radii.z);
  const penetration = Math.max(0, (1 - s) * rMin);
  return { s, penetration, contact: s < 1.02 };
}

/**
 * 杆轴与器官椭球的进入深度:沿 trocar->tip 方向求射线与椭球交点,
 * 返回允许的最大插入深度(交点深度 + 允许的穿透量),无交点返回 Infinity。
 */
export function maxDepthBeforePenetration(
  organ: Organ,
  trocar: Vector3,
  dir: Vector3,
  allowPenetration: number
): number {
  const ox = (trocar.x - organ.center.x) / organ.radii.x;
  const oy = (trocar.y - organ.center.y) / organ.radii.y;
  const oz = (trocar.z - organ.center.z) / organ.radii.z;
  const dx = dir.x / organ.radii.x;
  const dy = dir.y / organ.radii.y;
  const dz = dir.z / organ.radii.z;
  const A = dx * dx + dy * dy + dz * dz;
  const B = 2 * (ox * dx + oy * dy + oz * dz);
  const C = ox * ox + oy * oy + oz * oz - 1;
  const disc = B * B - 4 * A * C;
  if (disc <= 0 || A === 0) return Infinity;
  const sq = Math.sqrt(disc);
  const t1 = (-B - sq) / (2 * A);
  if (t1 <= 0) return Infinity; // 已在内部或不相交
  return t1 + allowPenetration;
}
