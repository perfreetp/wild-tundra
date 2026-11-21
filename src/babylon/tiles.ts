import {
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Quaternion,
  type Scene,
  type TransformNode,
  VertexData,
  MultiMaterial,
  SubMesh,
  type Material,
} from '@babylonjs/core';
import { shapeOf, type Shape2D, type TileKind, type Mat3, type Vec2 } from '../geometry/math';

export const TILE_THICKNESS = 0.08;

export interface TileMeshes {
  root: TransformNode;
  body: Mesh;
  frontMat: StandardMaterial;
  backMat: StandardMaterial;
  edgeGlows: Map<number, Mesh>;
  brokenOutlines: Map<number, Mesh>;
  handle: Mesh;
  kind: TileKind;
  /** 拾取用的隐形体(略大于实体,方便手指点) */
  pickProxy: Mesh;
}

function plastic(scene: Scene, name: string, hex: string, back: boolean): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const c = Color3.FromHexString(hex);
  mat.diffuseColor = c;
  mat.emissiveColor = c.scale(back ? 0.06 : 0.14);
  mat.specularColor = new Color3(0.95, 0.95, 0.95);
  mat.specularPower = 48;
  mat.alpha = back ? 0.88 : 0.6;
  return mat;
}

/**
 * 手工挤出多边形:顶点分上盖(+y)、下盖(-y)和侧面。
 * 上盖用 frontMat(材质索引 0),下盖用 backMat(1),侧面用 sideMat(2)。
 * 几何库 2D 点 (x,z) 直接作为 Babylon 的 (x, z),y 为厚度方向。
 */
function extrudePolygon(scene: Scene, shape: Shape2D, mats: Material[]): Mesh {
  const pts = shape.points;
  const n = pts.length;
  const h = TILE_THICKNESS / 2;
  const positions: number[] = [];
  const indices: number[] = [];

  // 上盖顶点 (0..n-1),下盖顶点 (n..2n-1)
  for (const p of pts) positions.push(p.x, h, p.z);
  for (const p of pts) positions.push(p.x, -h, p.z);

  // 上盖扇形三角化(多边形为凸或近似凸;扇形对本项目形状成立)
  const topStart = 0;
  const bottomStart = n;
  for (let i = 1; i < n - 1; i++) {
    indices.push(topStart, topStart + i, topStart + i + 1);
  }
  // 下盖(反向绕序,使法线朝下)
  for (let i = 1; i < n - 1; i++) {
    indices.push(bottomStart, bottomStart + i + 1, bottomStart + i);
  }

  // 侧面:每条边一个四边形
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const base = positions.length / 3;
    const a = pts[i];
    const b = pts[j];
    positions.push(a.x, h, a.z, b.x, h, b.z, b.x, -h, b.z, a.x, -h, a.z);
    // 朝外的绕序
    indices.push(base, base + 2, base + 1);
    indices.push(base, base + 3, base + 2);
  }

  const mesh = new Mesh('tile-body', scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  // 法线
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  vertexData.normals = normals;
  vertexData.applyToMesh(mesh);

  const multi = new MultiMaterial('tile-multi', scene);
  for (const m of mats) multi.subMaterials.push(m);
  mesh.material = multi;

  // 子网格材质索引:上盖 0、下盖 1、侧面 2
  const topCount = (n - 2) * 3;
  mesh.subMeshes = [];
  new SubMesh(0, 0, vertexData.positions.length, 0, topCount, mesh);
  new SubMesh(1, 0, vertexData.positions.length, topCount, topCount, mesh);
  new SubMesh(2, 0, vertexData.positions.length, topCount * 2, indices.length - topCount * 2, mesh);
  return mesh;
}

function edgeTube(
  scene: Scene,
  a: Vec2,
  b: Vec2,
  color: string,
  diameter: number,
  y: number,
  emissive: boolean,
): Mesh {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const tube = MeshBuilder.CreateCylinder('tube', {
    height: len,
    diameter,
    tessellation: 8,
  }, scene);
  const ang = Math.atan2(dz, dx);
  tube.rotation.z = Math.PI / 2;
  tube.rotation.y = -ang;
  tube.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
  const mat = new StandardMaterial('tube-mat', scene);
  const c = Color3.FromHexString(color);
  mat.diffuseColor = c;
  if (emissive) mat.emissiveColor = c;
  mat.alpha = 0.95;
  tube.material = mat;
  tube.setEnabled(false);
  return tube;
}

function buildHandle(scene: Scene, radius: number): Mesh {
  const handle = MeshBuilder.CreateSphere('handle', { diameter: 0.24, segments: 16 }, scene);
  handle.position.set(radius + 0.38, TILE_THICKNESS / 2 + 0.14, 0);
  const mat = new StandardMaterial('handle-mat', scene);
  const c = Color3.FromHexString('#4dabf7');
  mat.emissiveColor = c;
  mat.diffuseColor = c;
  mat.specularColor = new Color3(1, 1, 1);
  handle.material = mat;

  const arrow = MeshBuilder.CreateCylinder('arrow', {
    height: 0.18,
    diameterTop: 0,
    diameterBottom: 0.1,
    tessellation: 10,
  }, scene);
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(0.18, 0, 0);
  arrow.parent = handle;
  arrow.material = mat;
  return handle;
}

export function createTileMeshes(
  scene: Scene,
  kind: TileKind,
  colorHex: string,
  backHex: string,
): TileMeshes {
  const shape = shapeOf(kind);
  const root = new Mesh(`root-${kind}`, scene) as unknown as TransformNode;

  const frontMat = plastic(scene, `front-${kind}`, colorHex, false);
  const backMat = plastic(scene, `back-${kind}`, backHex, true);
  const sideMat = plastic(scene, `side-${kind}`, shade(colorHex, 0.65), true);
  sideMat.alpha = 0.92;

  const body = extrudePolygon(scene, shape, [frontMat, backMat, sideMat]);
  body.parent = root;

  // 拾取代理:一个略大的扁平盒,提升手指点选命中率
  const pickProxy = MeshBuilder.CreateBox('pick', {
    width: shape.radius * 2 + 0.15,
    height: TILE_THICKNESS + 0.12,
    depth: shape.radius * 2 + 0.15,
  }, scene);
  pickProxy.position.y = 0;
  const proxyMat = new StandardMaterial('proxy', scene);
  proxyMat.alpha = 0; // 全透明但可拾取
  pickProxy.material = proxyMat;
  pickProxy.parent = root;

  // 发光管/描边管/手柄保持在世界空间(不挂到会旋转的 root 下),
  // 由场景每帧按片的世界位姿同步,避免子节点姿态被 root 四元数复合打乱
  const edgeGlows = new Map<number, Mesh>();
  const brokenOutlines = new Map<number, Mesh>();
  for (const ei of shape.straightEdges) {
    const e = shape.edges[ei];
    const glow = edgeTube(scene, e.a, e.b, '#fff3bf', 0.05, TILE_THICKNESS / 2 + 0.02, true);
    edgeGlows.set(ei, glow);
    const broken = edgeTube(scene, e.a, e.b, '#fab005', 0.1, TILE_THICKNESS / 2 + 0.035, true);
    brokenOutlines.set(ei, broken);
  }

  const handle = buildHandle(scene, shape.radius);

  return { root, body, frontMat, backMat, edgeGlows, brokenOutlines, handle, kind, pickProxy };
}

function shade(hex: string, factor: number): string {
  const c = Color3.FromHexString(hex).scale(factor);
  return c.toHexString();
}

/** 3x3 旋转矩阵 → Babylon 四元数(两套坐标系同为 y-up,直接换算) */
export function matrixToQuaternion(m: Mat3): Quaternion {
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = m;
  const trace = m0 + m4 + m8;
  let x = 0, y = 0, z = 0, w = 1;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    w = 0.25 * s;
    x = (m7 - m5) / s;
    y = (m2 - m6) / s;
    z = (m3 - m1) / s;
  } else if (m0 > m4 && m0 > m8) {
    const s = Math.sqrt(1 + m0 - m4 - m8) * 2;
    w = (m7 - m5) / s;
    x = 0.25 * s;
    y = (m1 + m3) / s;
    z = (m2 + m6) / s;
  } else if (m4 > m8) {
    const s = Math.sqrt(1 + m4 - m0 - m8) * 2;
    w = (m2 - m6) / s;
    x = (m1 + m3) / s;
    y = 0.25 * s;
    z = (m5 + m7) / s;
  } else {
    const s = Math.sqrt(1 + m8 - m0 - m4) * 2;
    w = (m3 - m1) / s;
    x = (m2 + m6) / s;
    y = (m5 + m7) / s;
    z = 0.25 * s;
  }
  return new Quaternion(x, y, z, w);
}

export function setMeshTransform(
  node: TransformNode,
  x: number,
  y: number,
  z: number,
  m: Mat3,
) {
  node.position = new Vector3(x, y, z);
  node.rotationQuaternion = matrixToQuaternion(m);
}

/** 重叠变红;恢复时回到塑料材质 */
export function setOverlapVisual(meshes: TileMeshes, overlapping: boolean) {
  const multi = meshes.body.material as MultiMaterial;
  const front = multi.subMaterials[0] as StandardMaterial;
  if (overlapping) {
    front.emissiveColor = Color3.FromHexString('#ff3b3b');
    front.diffuseColor = Color3.FromHexString('#ff6b6b');
  } else {
    const base = Color3.FromHexString(meshes.frontMat.diffuseColor.toHexString());
    front.diffuseColor = base;
    front.emissiveColor = base.scale(0.14);
  }
}

export function disposeTileMeshes(meshes: TileMeshes) {
  // 世界空间的发光管/描边管/手柄不在 root 层级下,需手动释放
  for (const glow of meshes.edgeGlows.values()) glow.dispose();
  for (const outline of meshes.brokenOutlines.values()) outline.dispose();
  meshes.handle.dispose();
  meshes.root.dispose(false, true);
}
