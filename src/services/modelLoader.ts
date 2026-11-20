import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBVH } from '../engine/bvh';
import type { SceneChunk } from '../engine/types';

export interface LoadedModel {
  group: THREE.Group;
  chunks: SceneChunk[];
  materials: THREE.MeshStandardMaterial[];
  disposables: { geometry: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }[];
}

const MAX_TRIS_PER_BATCH = 200_000;

/**
 * 加载线路三维模型（.glb / .gltf）：
 * - 全部网格变换到世界空间后按材质批合并，控制 draw call 总量
 * - 每批几何构建 BVH 并按世界空间分块，接入与演示场景相同的裁剪管线
 */
export async function loadLineModel(url: string): Promise<LoadedModel> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.updateMatrixWorld(true);

  // 按材质收集世界空间几何
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!batches.has(mat)) batches.set(mat, []);
      batches.get(mat)!.push(geo);
    }
  });

  const group = new THREE.Group();
  group.name = 'loaded-line-model';
  const chunks: SceneChunk[] = [];
  const disposables: { geometry: THREE.BufferGeometry; material?: THREE.Material }[] = [];
  const standardMaterials: THREE.MeshStandardMaterial[] = [];
  let chunkId = 0;

  for (const [srcMat, geos] of batches) {
    // 保证材质可被灯光与雾正确作用
    const mat =
      (srcMat as THREE.MeshStandardMaterial).isMeshStandardMaterial
        ? (srcMat as THREE.MeshStandardMaterial)
        : new THREE.MeshStandardMaterial({
            color: 0x9aa0a6,
            roughness: 0.9,
            map: (srcMat as THREE.MeshStandardMaterial).map ?? null,
          });
    standardMaterials.push(mat);

    // 超大批几何拆批，避免单 BVH 过大
    let bucket: THREE.BufferGeometry[] = [];
    let bucketTris = 0;
    const flush = () => {
      if (bucket.length === 0) return;
      const merged = mergeGeometries(bucket, false);
      bucket.forEach((g) => g.dispose());
      bucket = [];
      bucketTris = 0;
      if (!merged) return;
      buildBVH(merged);
      const mesh = new THREE.Mesh(merged, mat);
      const bbox = new THREE.Box3().setFromBufferAttribute(
        merged.getAttribute('position') as THREE.BufferAttribute,
      );
      const chunkGroup = new THREE.Group();
      chunkGroup.add(mesh);
      const chunk: SceneChunk = {
        id: chunkId++,
        group: chunkGroup,
        bvhMeshes: [mesh],
        extraMeshes: [],
        bbox,
        // world 距离模式下不使用里程，这里给包围盒到原点的距离作为占位
        distance: bbox.getCenter(new THREE.Vector3()).length(),
        length: 40,
      };
      chunks.push(chunk);
      group.add(chunkGroup);
      disposables.push({ geometry: merged });
    };

    for (const geo of geos) {
      const tris = Math.floor((geo.index ? geo.index.count : geo.getAttribute('position').count) / 3);
      if (bucketTris + tris > MAX_TRIS_PER_BATCH) flush();
      bucket.push(geo);
      bucketTris += tris;
    }
    flush();
  }

  chunks.sort((a, b) => a.id - b.id);
  return { group, chunks, materials: standardMaterials, disposables };
}

/** 中心线 JSON 文件格式：{ points: [[x,y,z], ...] } */
export interface CenterlineFile {
  points: [number, number, number][];
}

export function parseCenterline(json: CenterlineFile): THREE.CatmullRomCurve3 {
  if (!json || !Array.isArray(json.points) || json.points.length < 2) {
    throw new Error('中心线至少需要 2 个点');
  }
  const points = json.points.map(
    (p) => new THREE.Vector3(Number(p[0]), Number(p[1]), Number(p[2])),
  );
  if (points.some((p) => p.toArray().some(Number.isNaN))) {
    throw new Error('中心线包含非数值坐标');
  }
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  curve.arcLengthDivisions = Math.max(2000, points.length * 4);
  curve.updateArcLengths();
  return curve;
}

/** 把当前中心线导出为可分享的 JSON 数据 */
export function serializeCenterline(curve: THREE.CatmullRomCurve3): CenterlineFile {
  const divisions = Math.max(60, Math.ceil(curve.getLength() / 20));
  const points: [number, number, number][] = [];
  for (let i = 0; i <= divisions; i++) {
    const p = curve.getPointAt(i / divisions);
    points.push([
      Math.round(p.x * 1000) / 1000,
      Math.round(p.y * 1000) / 1000,
      Math.round(p.z * 1000) / 1000,
    ]);
  }
  return { points };
}
