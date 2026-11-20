import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBVH } from './bvh';
import type { SceneChunk } from './types';

export interface BuiltWorld {
  group: THREE.Group;
  chunks: SceneChunk[];
  centerline: THREE.CatmullRomCurve3;
  tunnelMaterial: THREE.MeshStandardMaterial;
  trainMaterial: THREE.MeshStandardMaterial;
  trackMaterial: THREE.MeshStandardMaterial;
  train: THREE.Group;
  contactWire: THREE.Mesh;
  /** route：按轨道里程裁剪（演示世界）；world：按相机欧氏距离裁剪（外部模型） */
  distanceMode: 'route' | 'world';
  dispose: () => void;
}

const CHUNK_LEN = 40; // 每个分块沿线路长度（米）
const TUNNEL_RADIUS = 5.2;
const TUNNEL_PATTERN = 240; // 隧道 160m + 明线 80m 循环
const TUNNEL_SPAN = 160;
const GAUGE_HALF = 0.75; // 轨距半宽
const SLEEPER_STEP = 0.65;

/** 隧道/明线段判定：沿里程循环布置 */
export function isTunnelSection(distance: number): boolean {
  return distance % TUNNEL_PATTERN < TUNNEL_SPAN;
}

/** 构造一条带轻微起伏的 S 形轨道中心线（演示线路，约 1200m） */
export function buildDemoCenterline(): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const total = 1200;
  for (let x = 0; x <= total; x += 40) {
    const z = Math.sin(x * 0.006) * 60 + Math.sin(x * 0.017) * 12;
    const y = Math.sin(x * 0.004) * 1.5 + 0.6;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  curve.arcLengthDivisions = 2000;
  curve.updateArcLengths();
  return curve;
}

const _up = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();
const _matrix = new THREE.Matrix4();
const _scale = new THREE.Vector3();

function orientedBox(
  size: [number, number, number],
  position: THREE.Vector3,
  orient: THREE.Quaternion,
): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  _scale.set(1, 1, 1);
  _matrix.compose(position, orient, _scale);
  geo.applyMatrix4(_matrix);
  return geo;
}

function ensureUV(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.getAttribute('uv')) {
    const count = geo.getAttribute('position').count;
    const uv = new Float32Array(count * 2);
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
  return geo;
}

function safeMerge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(list.map(ensureUV), false);
  list.forEach((g) => g.dispose());
  if (!merged) throw new Error('几何合并失败');
  return merged;
}

/** 隧道拱形壁：沿切线局部截面的半圆弧顶点环 */
function buildTunnelWall(
  curve: THREE.CatmullRomCurve3,
  s0: number,
  s1: number,
  length: number,
): THREE.BufferGeometry {
  const segments = 10; // 沿里程采样环数
  const arcSeg = 14; // 半圆弧分段
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const ring: { p: THREE.Vector3; n: THREE.Vector3 }[] = [];

  for (let i = 0; i <= segments; i++) {
    const s = s0 + ((s1 - s0) * i) / segments;
    const u = s / length;
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, _up).normalize();
    ring.length = 0;
    for (let j = 0; j <= arcSeg; j++) {
      const theta = (Math.PI * j) / arcSeg; // 0..π：左墙脚→拱顶→右墙脚
      const offset = right
        .clone()
        .multiplyScalar(Math.cos(theta) * TUNNEL_RADIUS)
        .addScaledVector(_up, Math.sin(theta) * TUNNEL_RADIUS);
      const p = center.clone().add(offset);
      const n = offset.clone().normalize();
      ring.push({ p, n });
    }
    for (const { p, n } of ring) {
      positions.push(p.x, p.y, p.z);
      normals.push(n.x, n.y, n.z);
    }
  }

  const row = arcSeg + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < arcSeg; j++) {
      const a = i * row + j;
      const b = (i + 1) * row + j;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** 轨道：两根钢轨 + 轨枕，全部合并为单网格（每块 1 次绘制） */
function buildTrack(
  curve: THREE.CatmullRomCurve3,
  s0: number,
  s1: number,
  length: number,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const samples = Math.max(2, Math.ceil((s1 - s0) / 4));
  for (let i = 0; i < samples; i++) {
    const sa = s0 + ((s1 - s0) * i) / samples;
    const sb = s0 + ((s1 - s0) * (i + 1)) / samples;
    const sm = (sa + sb) / 2;
    const u = sm / length;
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, _up).normalize();
    _quat.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
    const segLen = sb - sa + 0.4;

    for (const side of [-1, 1]) {
      const pos = center
        .clone()
        .addScaledVector(right, side * GAUGE_HALF)
        .addScaledVector(_up, 0.12);
      parts.push(orientedBox([segLen, 0.16, 0.09], pos, _quat));
    }
  }

  // 轨枕
  for (let s = s0; s < s1; s += SLEEPER_STEP) {
    const u = s / length;
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, _up).normalize();
    _quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), right);
    const pos = center.clone().addScaledVector(_up, -0.02);
    parts.push(orientedBox([0.22, 0.14, 2.4], pos, _quat));
  }
  return safeMerge(parts);
}

/** 接触网支柱（实例化，每块仅 1 次绘制，不参与 BVH 遮挡） */
function buildCatenaryPoles(
  curve: THREE.CatmullRomCurve3,
  s0: number,
  s1: number,
  length: number,
): THREE.InstancedMesh {
  const spots: number[] = [];
  for (let s = Math.ceil(s0 / CHUNK_LEN) * CHUNK_LEN; s < s1; s += CHUNK_LEN) {
    spots.push(s);
  }
  const geo = new THREE.BoxGeometry(0.18, 5.8, 0.18);
  const mat = new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.6, metalness: 0.4 });
  const inst = new THREE.InstancedMesh(geo, mat, Math.max(spots.length, 1));
  spots.forEach((s, idx) => {
    const u = s / length;
    const center = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, _up).normalize();
    const side = idx % 2 === 0 ? 1 : -1;
    const pos = center.clone().addScaledVector(right, side * 2.6).addScaledVector(_up, 2.9);
    _quat.identity();
    _matrix.compose(pos, _quat, _scale);
    inst.setMatrixAt(idx, _matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

/** 列车车体：白车身 + 深色车窗带 + 车头，放置在轨道起点 */
function buildTrain(
  trainMaterial: THREE.MeshStandardMaterial,
): THREE.Group {
  const group = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: 0x101820,
    roughness: 0.15,
    metalness: 0.6,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(22, 2.6, 2.8), trainMaterial);
  body.position.y = 1.7;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.6), trainMaterial);
  nose.position.set(12.1, 1.6, 0);
  const windowBand = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 2.84), glass);
  windowBand.position.set(-0.5, 2.3, 0);
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(21, 0.5, 2.9),
    new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.7 }),
  );
  skirt.position.y = 0.45;
  group.add(body, nose, windowBand, skirt);
  return group;
}

/** 构建完整演示世界；可传入外部中心线（来自 JSON 导入） */
export function buildDemoWorld(externalCurve?: THREE.CatmullRomCurve3): BuiltWorld {
  const centerline = externalCurve ?? buildDemoCenterline();
  const length = centerline.getLength();
  const group = new THREE.Group();
  group.name = 'demo-world';

  const tunnelMaterial = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f6b3a,
    roughness: 1,
  });
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b6f75,
    roughness: 0.45,
    metalness: 0.7,
  });
  const trainMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8ecf1,
    roughness: 0.35,
    metalness: 0.25,
  });

  const chunks: SceneChunk[] = [];
  const chunkCount = Math.ceil(length / CHUNK_LEN);
  const disposables: { geometry: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const s0 = i * CHUNK_LEN;
    const s1 = Math.min((i + 1) * CHUNK_LEN, length);
    const mid = (s0 + s1) / 2;
    const tunnel = isTunnelSection(mid);
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `chunk-${i}`;

    const bvhMeshes: THREE.Mesh[] = [];
    const extraMeshes: THREE.Object3D[] = [];

    // 轨道（BVH，可遮挡）
    const trackGeo = buildTrack(centerline, s0, s1, length);
    const trackMesh = new THREE.Mesh(trackGeo, trackMaterial);
    trackMesh.name = 'track';
    buildBVH(trackGeo);
    bvhMeshes.push(trackMesh);
    chunkGroup.add(trackMesh);
    disposables.push({ geometry: trackGeo });

    if (tunnel) {
      // 隧道：拱形壁 + 隧底，合并为单网格
      const wallGeo = buildTunnelWall(centerline, s0, s1, length);
      const parts = [wallGeo];
      const samples = Math.ceil((s1 - s0) / 8);
      for (let k = 0; k < samples; k++) {
        const sa = s0 + ((s1 - s0) * k) / samples;
        const sb = s0 + ((s1 - s0) * (k + 1)) / samples;
        const u = ((sa + sb) / 2) / length;
        const c = centerline.getPointAt(u);
        const t = centerline.getTangentAt(u).normalize();
        _quat.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t);
        parts.push(
          orientedBox(
            [sb - sa + 0.5, 0.3, TUNNEL_RADIUS * 2],
            c.clone().addScaledVector(_up, -0.18),
            _quat,
          ),
        );
      }
      const tunnelGeo = safeMerge(parts);
      const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMaterial);
      tunnelMesh.name = 'tunnel-wall';
      buildBVH(tunnelGeo);
      bvhMeshes.push(tunnelMesh);
      chunkGroup.add(tunnelMesh);
      disposables.push({ geometry: tunnelGeo });
    } else {
      // 明线：两侧路堤挡墙 + 地面带，合并为单网格
      const parts: THREE.BufferGeometry[] = [];
      const samples = Math.ceil((s1 - s0) / 8);
      for (let k = 0; k < samples; k++) {
        const sa = s0 + ((s1 - s0) * k) / samples;
        const sb = s0 + ((s1 - s0) * (k + 1)) / samples;
        const u = ((sa + sb) / 2) / length;
        const c = centerline.getPointAt(u);
        const t = centerline.getTangentAt(u).normalize();
        const right = new THREE.Vector3().crossVectors(t, _up).normalize();
        _quat.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t);
        const segLen = sb - sa + 0.5;
        // 地面带
        parts.push(
          orientedBox([segLen, 0.4, 14], c.clone().addScaledVector(_up, -0.35), _quat),
        );
        for (const side of [-1, 1]) {
          parts.push(
            orientedBox(
              [segLen, 1.1, 0.4],
              c.clone().addScaledVector(right, side * 3.4).addScaledVector(_up, 0.25),
              _quat,
            ),
          );
        }
      }
      const terrainGeo = safeMerge(parts);
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
      terrainMesh.name = 'terrain';
      buildBVH(terrainGeo);
      bvhMeshes.push(terrainMesh);
      chunkGroup.add(terrainMesh);
      disposables.push({ geometry: terrainGeo });
    }

    // 接触网支柱（实例化，随分块显隐，不参与 BVH）
    const poles = buildCatenaryPoles(centerline, s0, s1, length);
    extraMeshes.push(poles);
    chunkGroup.add(poles);
    disposables.push({ geometry: poles.geometry, material: poles.material });

    const bbox = new THREE.Box3().setFromObject(chunkGroup);
    const chunk: SceneChunk = {
      id: i,
      group: chunkGroup,
      bvhMeshes,
      extraMeshes,
      bbox,
      distance: s0,
      length: s1 - s0,
    };
    chunks.push(chunk);
    group.add(chunkGroup);
  }

  // 接触线：沿整条中心线的连续管线（单网格，不进分块）
  const wirePoints: THREE.Vector3[] = [];
  const wireDivisions = Math.ceil(length / 4);
  for (let i = 0; i <= wireDivisions; i++) {
    wirePoints.push(centerline.getPointAt(i / wireDivisions).addScaledVector(_up, 5.6));
  }
  const wirePath = new THREE.CatmullRomCurve3(wirePoints);
  const contactWire = new THREE.Mesh(
    new THREE.TubeGeometry(wirePath, wireDivisions, 0.035, 6, false),
    new THREE.MeshStandardMaterial({ color: 0x777d84, metalness: 0.8, roughness: 0.35 }),
  );
  group.add(contactWire);
  disposables.push({ geometry: contactWire.geometry, material: contactWire.material });

  // 列车
  const train = buildTrain(trainMaterial);
  const startPoint = centerline.getPointAt(0);
  const startTangent = centerline.getTangentAt(0).normalize();
  train.position.copy(startPoint).addScaledVector(_up, 0.05);
  train.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), startTangent);
  group.add(train);

  return {
    group,
    chunks,
    centerline,
    tunnelMaterial,
    trainMaterial,
    trackMaterial,
    train,
    contactWire,
    distanceMode: 'route',
    dispose: () => {
      for (const d of disposables) {
        d.geometry.dispose();
        if (Array.isArray(d.material)) d.material.forEach((m) => m.dispose());
        else d.material?.dispose();
      }
    },
  };
}
