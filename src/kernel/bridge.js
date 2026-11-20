// three.js BufferGeometry  <->  manifold Mesh / Manifold 桥接层
import * as THREE from 'three';
import { getManifold } from './manifoldModule.js';

/**
 * THREE.BufferGeometry -> manifold Mesh（要求水密，three 内置基础体均满足）
 * 注意：manifold Mesh 的 triVerts 需要 CCW 朝外，three 右手系内置体一致。
 */
export function geometryToMesh(geometry) {
  const M = getManifoldSync();
  const pos = geometry.getAttribute('position');
  let triVerts;
  if (geometry.index) {
    triVerts = Uint32Array.from(geometry.index.array);
  } else {
    triVerts = new Uint32Array(pos.count);
    for (let i = 0; i < pos.count; i++) triVerts[i] = i;
  }
  const vertProperties = Float32Array.from(pos.array);
  return new M.Mesh({ numProp: 3, vertProperties, triVerts });
}

/** THREE.BufferGeometry -> Manifold 实体 */
export function geometryToManifold(geometry) {
  const M = getManifoldSync();
  return new M.Manifold(geometryToMesh(geometry));
}

/**
 * Manifold -> THREE.BufferGeometry
 * getMesh 输出为非索引三角 soup，直接组装并计算法线。
 */
export function manifoldToGeometry(manifold) {
  if (!manifold || manifold.isEmpty()) return new THREE.BufferGeometry();
  const mesh = manifold.getMesh();
  const numVerts = mesh.vertProperties.length / mesh.numProp;
  const positions = new Float32Array(numVerts * 3);
  for (let i = 0; i < numVerts; i++) {
    positions[i * 3] = mesh.vertProperties[i * mesh.numProp];
    positions[i * 3 + 1] = mesh.vertProperties[i * mesh.numProp + 1];
    positions[i * 3 + 2] = mesh.vertProperties[i * mesh.numProp + 2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(Array.from(mesh.triVerts));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

let cachedModule = null;
export function getManifoldSync() {
  if (!cachedModule) {
    // 正常流程下 App 启动时已 await getManifold()
    throw new Error('Manifold 内核尚未初始化完成');
  }
  return cachedModule;
}

export async function primeKernel() {
  const m = await getManifold();
  cachedModule = m;
  return m;
}
