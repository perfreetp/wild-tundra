import * as THREE from 'three';
import { chunkIntersectsFrustum, isChunkOccluded } from './bvh';
import type { SceneChunk } from './types';

/**
 * 裁剪管线（每个相机、每帧执行）：
 * 1. 距离阈值裁剪（同时服务于绘制调用预算的降级）
 *    - route 模式：按轨道里程相对距离，只渲染列车前方/附近分块（演示线路）
 *    - world 模式：按相机到分块包围盒的欧氏距离（外部加载模型，里程无意义）
 * 2. three-mesh-bvh 视锥求交（shapecast + Frustum）
 * 3. 射线遮挡检测（raycastFirst），结果按分块缓存并节流，避免逐帧全量射线
 */
export type DistanceMode = 'route' | 'world';

const CHUNK_HYSTERESIS = 60;

export class CullingManager {
  private frustum = new THREE.Frustum();
  private projScreen = new THREE.Matrix4();
  /** 遮挡缓存：chunkId → 是否被遮挡 */
  private occlusionCache = new Map<number, boolean>();
  /** 遮挡缓存条目过期时间 */
  private expiry = new Map<number, number>();
  private readonly cacheTTL = 600;
  /** 每帧最多发射的遮挡射线数（缓存命中以外的真实检测） */
  private readonly maxRaysPerFrame = 10;
  /** 只对该距离以外的分块做遮挡检测，近处直接保留 */
  private readonly occlusionMinDist = 50;
  private tmpCenter = new THREE.Vector3();

  distanceMode: DistanceMode = 'route';
  lastOcclusionCulled = 0;
  lastRaysFired = 0;

  cull(
    camera: THREE.PerspectiveCamera,
    chunks: SceneChunk[],
    cameraChunkDistance: number,
    maxViewDistance: number,
    now: number,
  ): Set<number> {
    camera.updateMatrixWorld();
    this.projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreen);

    const visible = new Set<number>();
    let rays = 0;
    let occludedCount = 0;
    const origin = camera.position;

    for (const chunk of chunks) {
      // 1) 距离裁剪
      const rel =
        this.distanceMode === 'route'
          ? chunk.distance - cameraChunkDistance
          : chunk.bbox.getCenter(this.tmpCenter).distanceTo(origin);
      const tooClose = this.distanceMode === 'route' && rel < -CHUNK_HYSTERESIS;
      if (tooClose || rel > maxViewDistance) {
        chunk.group.visible = false;
        continue;
      }

      // 2) BVH 视锥求交
      if (!chunkIntersectsFrustum(chunk, this.frustum)) {
        chunk.group.visible = false;
        continue;
      }

      // 3) 射线遮挡（缓存节流 + 每帧射线预算）
      let occluded: boolean | undefined = this.occlusionCache.get(chunk.id);
      if (occluded === undefined) {
        if (rel < this.occlusionMinDist || rays >= this.maxRaysPerFrame) {
          occluded = false; // 射线预算耗尽时保守保留
        } else {
          occluded = isChunkOccluded(chunk, origin, maxViewDistance);
          rays++;
        }
        this.occlusionCache.set(chunk.id, occluded);
        this.expiry.set(chunk.id, now + this.cacheTTL);
      }
      if (occluded) {
        occludedCount++;
        chunk.group.visible = false;
        continue;
      }

      chunk.group.visible = true;
      visible.add(chunk.id);
    }

    // 清理过期缓存
    if (this.occlusionCache.size > 120) {
      for (const [id, expireAt] of this.expiry) {
        if (expireAt < now) {
          this.expiry.delete(id);
          this.occlusionCache.delete(id);
        }
      }
    }

    this.lastOcclusionCulled = occludedCount;
    this.lastRaysFired = rays;
    return visible;
  }

  /** 场景重建（加载新模型）时清空缓存 */
  reset(): void {
    this.occlusionCache.clear();
    this.expiry.clear();
  }
}
