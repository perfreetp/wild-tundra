import * as THREE from 'three';
import {
  MeshBVH,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import type { SceneChunk } from './types';

/**
 * 全局挂载 three-mesh-bvh 的加速结构：
 * - computeBoundsTree：为 BufferGeometry 懒计算 BVH
 * - acceleratedRaycast：让 mesh.raycast 走 BVH 加速（遮挡射线检测使用）
 * - disposeBoundsTree：几何释放时同步释放 BVH
 */
export function initBVHAcceleration(): void {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

/** 立即为几何构建 BVH 并返回实例（视锥 shapecast 直接使用，不依赖懒计算） */
export function buildBVH(geometry: THREE.BufferGeometry): MeshBVH {
  const bvh = new MeshBVH(geometry, {
    maxLeafTris: 16,
    strategy: 0, // CENTER 策略，场景分布较均匀
  });
  geometry.boundsTree = bvh;
  return bvh;
}

/** 对单个分块做视锥求交：BVH shapecast 与相机六面体求交 */
export function chunkIntersectsFrustum(
  chunk: SceneChunk,
  frustum: THREE.Frustum,
): boolean {
  for (const mesh of chunk.bvhMeshes) {
    const bvh = mesh.geometry.boundsTree as MeshBVH | undefined;
    if (!bvh) continue;
    let hit = false;
    bvh.shapecast({
      intersectsBounds: (box: THREE.Box3) => {
        if (frustum.intersectsBox(box)) return 1; // INTERSECT
        return 0; // MISS
      },
      intersectsTriangle: () => {
        hit = true;
        return true; // 命中首个三角形即停止
      },
    });
    if (hit) return true;
  }
  return false;
}

/** 遮挡射线：从相机位置射向分块中心，命中任何静态 BVH 网格即被遮挡 */
const _ray = new THREE.Raycaster();
_ray.firstHitOnly = true;

export function isChunkOccluded(
  chunk: SceneChunk,
  origin: THREE.Vector3,
  farDistance: number,
): boolean {
  const center = chunk.bbox.getCenter(new THREE.Vector3());
  const dir = center.sub(origin);
  const dist = dir.length();
  if (dist < 1e-3) return false;
  dir.divideScalar(dist);
  _ray.set(origin, dir);
  _ray.far = Math.max(farDistance - 0.5, 0.1);
  _ray.near = 0.05;
  const hits = _ray.intersectObjects(chunk.bvhMeshes, false);
  return hits.length > 0;
}
