import * as THREE from 'three';
import {
  MeshBVH,
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MATERIAL_DEFS } from './materials';
import type { MaterialId } from './types';

// 让 three 的 Raycaster 走 BVH 加速路径
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface CityScene {
  group: THREE.Group;
  /** 参与求交的 8 个材质网格（每个带独立 BVH） */
  raycastTargets: THREE.Mesh[];
  sensor: THREE.Object3D;
  sensorPosition: THREE.Vector3;
  fog: THREE.FogExp2;
  setFogVisual: (extinction: number) => void;
  dispose: () => void;
}

type PartMap = Record<MaterialId, THREE.BufferGeometry[]>;

function newPartMap(): PartMap {
  const map = {} as PartMap;
  for (const d of MATERIAL_DEFS) map[d.id] = [];
  return map;
}

function addPart(
  parts: PartMap,
  id: MaterialId,
  geometry: THREE.BufferGeometry,
  position: [number, number, number],
  rotation?: [number, number, number],
): void {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation?.[0] ?? 0, rotation?.[1] ?? 0, rotation?.[2] ?? 0),
    ),
    new THREE.Vector3(1, 1, 1),
  );
  geometry.applyMatrix4(m);
  parts[id].push(geometry);
}

function addBox(
  parts: PartMap,
  id: MaterialId,
  position: [number, number, number],
  size: [number, number, number],
  rotation?: [number, number, number],
): void {
  addPart(parts, id, new THREE.BoxGeometry(size[0], size[1], size[2]), position, rotation);
}

function addCylinder(
  parts: PartMap,
  id: MaterialId,
  position: [number, number, number],
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments = 16,
  rotation?: [number, number, number],
): void {
  addPart(
    parts,
    id,
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    position,
    rotation,
  );
}

function addSphere(
  parts: PartMap,
  id: MaterialId,
  position: [number, number, number],
  radius: number,
): void {
  addPart(parts, id, new THREE.SphereGeometry(radius, 16, 12), position);
}

/** 一辆简易乘用车：车身金属 + 车窗玻璃 + 保险杠/灯塑料 */
function addVehicle(
  parts: PartMap,
  position: [number, number, number],
  yaw: number,
): void {
  const g = new THREE.Group();
  g.position.set(...position);
  g.rotation.y = yaw;

  const local = (geo: THREE.BufferGeometry, id: MaterialId, pos: [number, number, number]): void => {
    geo.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    ));
    geo.applyMatrix4(g.matrixWorld);
    parts[id].push(geo);
  };
  g.updateMatrixWorld(true);

  // 下车身
  local(new THREE.BoxGeometry(1.9, 0.55, 4.4), 'vehicleMetal', [0, 0.65, 0]);
  // 上车舱
  local(new THREE.BoxGeometry(1.7, 0.6, 2.2), 'vehicleMetal', [0, 1.2, -0.2]);
  // 前/后挡风玻璃
  local(new THREE.BoxGeometry(1.55, 0.5, 0.08), 'glass', [0, 1.22, 0.95]);
  local(new THREE.BoxGeometry(1.55, 0.5, 0.08), 'glass', [0, 1.22, -1.35]);
  // 侧窗
  local(new THREE.BoxGeometry(0.08, 0.45, 1.9), 'glass', [0.88, 1.22, -0.2]);
  local(new THREE.BoxGeometry(0.08, 0.45, 1.9), 'glass', [-0.88, 1.22, -0.2]);
  // 前后保险杠（塑料）
  local(new THREE.BoxGeometry(1.95, 0.3, 0.35), 'plastic', [0, 0.5, 2.25]);
  local(new THREE.BoxGeometry(1.95, 0.3, 0.35), 'plastic', [0, 0.5, -2.25]);
  // 轮胎（塑料）
  for (const sx of [-0.95, 0.95]) {
    for (const sz of [-1.45, 1.45]) {
      local(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14), 'plastic', [sx, 0.36, sz]);
    }
  }
}

export function buildCityScene(): CityScene {
  const parts = newPartMap();
  const group = new THREE.Group();
  group.name = 'cityScene';

  // ---------- 地面与道路 ----------
  // 混凝土大地坪
  addBox(parts, 'concrete', [0, -0.3, 0], [220, 0.6, 220]);
  // 纵向主路（沥青），沿 Z 轴
  addBox(parts, 'asphalt', [0, 0.02, 0], [14, 0.04, 200]);
  // 横向支路
  addBox(parts, 'asphalt', [0, 0.02, 30], [80, 0.04, 12]);
  // 人行道（混凝土）
  addBox(parts, 'concrete', [-8.5, 0.12, 0], [3, 0.24, 200]);
  addBox(parts, 'concrete', [8.5, 0.12, 0], [3, 0.24, 200]);

  // 车道虚线（高反射标线材质）
  for (let z = -95; z <= 95; z += 8) {
    addBox(parts, 'signMetal', [0, 0.055, z], [0.18, 0.01, 4]);
  }
  // 路口停止线
  addBox(parts, 'signMetal', [-3.5, 0.055, 23], [0.2, 0.01, 3]);
  addBox(parts, 'signMetal', [3.5, 0.055, 23], [0.2, 0.01, 3]);

  // ---------- 建筑（混凝土体块） ----------
  const buildingSpots: Array<[number, number, number, number, number]> = [
    // x, z, w, h, d
    [-18, -25, 10, 22, 12],
    [-20, 5, 8, 14, 10],
    [-16, 35, 12, 30, 14],
    [18, -20, 10, 18, 12],
    [21, 8, 9, 26, 11],
    [17, 45, 12, 12, 14],
    [-24, 65, 14, 20, 16],
    [24, -55, 13, 24, 15],
    [-19, -60, 10, 16, 12],
  ];
  for (const [x, z, w, h, d] of buildingSpots) {
    addBox(parts, 'concrete', [x, h / 2, z], [w, h, d]);
  }

  // ---------- 护栏（W 梁 + 立柱） ----------
  for (const side of [-1, 1]) {
    const x = side * 6.6;
    addBox(parts, 'guardrailMetal', [x, 0.75, 0], [0.12, 0.18, 190]);
    for (let z = -92; z <= 92; z += 4) {
      addBox(parts, 'guardrailMetal', [x, 0.38, z], [0.1, 0.75, 0.1]);
    }
  }

  // ---------- 混凝土隔离墩 ----------
  for (let z = -40; z <= 40; z += 3) {
    addBox(parts, 'concrete', [5.6, 0.4, z], [0.5, 0.8, 2.4]);
  }

  // ---------- 路牌：金属立柱 + 高反射牌面 ----------
  const signSpots: Array<[number, number, number]> = [
    [-6, 0, -12],
    [6, 0, 18],
    [-6, 0, 55],
  ];
  for (const [x, , z] of signSpots) {
    addCylinder(parts, 'guardrailMetal', [x, 1.5, z], 0.06, 0.06, 3);
    addBox(parts, 'signMetal', [x, 2.7, z], [1.4, 0.9, 0.08]);
  }

  // ---------- 车辆 ----------
  addVehicle(parts, [-3, 0, -8], 0);
  addVehicle(parts, [3, 0, 12], Math.PI);
  addVehicle(parts, [-3, 0, 40], 0);
  addVehicle(parts, [3.2, 0, -45], Math.PI);
  addVehicle(parts, [9, 0.02, 30], Math.PI / 2);

  // ---------- 植被（树干 + 球形树冠，统一植被材质） ----------
  const treeSpots: Array<[number, number]> = [
    [-12, -35], [-12, -5], [-12, 22], [-12, 55],
    [12, -40], [12, -5], [12, 25], [12, 60],
    [-30, 80], [30, -75],
  ];
  for (const [x, z] of treeSpots) {
    addCylinder(parts, 'vegetation', [x, 1.2, z], 0.18, 0.25, 2.4, 10);
    addSphere(parts, 'vegetation', [x, 3.1, z], 1.6);
    addSphere(parts, 'vegetation', [x + 0.9, 2.6, z + 0.5], 1.1);
  }

  // ---------- 合并为 8 个材质网格并构建 BVH ----------
  const raycastTargets: THREE.Mesh[] = [];
  for (const def of MATERIAL_DEFS) {
    const geos = parts[def.id];
    if (geos.length === 0) continue;
    const merged = mergeGeometries(geos, false);
    if (!merged) throw new Error(`材质 ${def.id} 几何体合并失败`);
    merged.boundsTree = new MeshBVH(merged);
    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: def.defaultRoughness,
      metalness: def.id.includes('Metal') ? 0.6 : 0.05,
    });
    const mesh = new THREE.Mesh(merged, material);
    mesh.userData.materialId = def.id;
    mesh.name = def.id;
    group.add(mesh);
    raycastTargets.push(mesh);
    for (const g of geos) g.dispose();
  }

  // ---------- 传感器标记（不参与求交） ----------
  const sensor = new THREE.Group();
  const sensorPos = new THREE.Vector3(0, 1.8, 0);
  sensor.position.copy(sensorPos);
  const sensorCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00aa88 }),
  );
  const sensorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.03, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc }),
  );
  sensorRing.rotation.x = Math.PI / 2;
  sensor.add(sensorCore, sensorRing);
  group.add(sensor);

  // 雾效可视化（密度跟随消光系数），由调用方挂到 THREE.Scene 上
  const fog = new THREE.FogExp2(0x10151c, 0);

  return {
    group,
    raycastTargets,
    sensor,
    sensorPosition: sensorPos,
    fog,
    setFogVisual(extinction: number) {
      fog.density = extinction;
    },
    dispose() {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
    },
  };
}
