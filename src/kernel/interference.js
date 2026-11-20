// 干涉检查：两实体交集 manifold、重叠体积与高亮几何
import { getManifoldSync, manifoldToGeometry } from './bridge.js';

/**
 * 对两个已求值实体做交集
 * @returns {{ volume:number, geometry: THREE.BufferGeometry, empty:boolean }}
 */
export function checkInterference(resultA, resultB) {
  const M = getManifoldSync();
  if (!resultA?.manifold || !resultB?.manifold) {
    return { volume: 0, geometry: null, empty: true };
  }
  const intersection = M.Manifold.intersection(resultA.manifold, resultB.manifold);
  const empty = intersection.isEmpty();
  const volume = empty ? 0 : intersection.volume();
  const geometry = empty ? null : manifoldToGeometry(intersection);
  return { volume, geometry, empty };
}
