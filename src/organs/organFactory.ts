import * as THREE from 'three'
import type { OrganDescriptor } from '../shared/types'

/**
 * 程序化器官网格工厂。
 * 真实项目中这里替换为 GLTFLoader 加载官网格（loadGLTFOOrgan），
 * 下游 BVH / 蒙皮权重 / Worker 管线完全一致。
 */
export function createOrganGeometry(organ: OrganDescriptor): THREE.BufferGeometry {
  const s = organ.segments
  let geo: THREE.BufferGeometry
  switch (organ.id) {
    case 'liver':
      geo = buildLiver(s)
      break
    case 'kidney':
      geo = buildKidney(s)
      break
    case 'gland':
      geo = buildGland(s)
      break
    default:
      geo = buildLiver(s)
  }
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
  return geo
}

/** 脏函数式顶点位移：在单位球参数网格上做塑形 */
function parametricSphere(
  segments: number,
  deform: (dir: THREE.Vector3) => THREE.Vector3,
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, segments, Math.floor(segments / 2))
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  const out = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    out.copy(deform(v))
    pos.setXYZ(i, out.x, out.y, out.z)
  }
  pos.needsUpdate = true
  return geo
}

/** 肝脏：压扁的不对称楔形，下缘带起伏，有一个浅裂（胆囊切迹） */
function buildLiver(segments: number): THREE.BufferGeometry {
  return parametricSphere(segments, (dir) => {
    const p = dir.clone()
    // 整体压扁、拉宽
    p.x *= 1.55
    p.y *= 0.78
    p.z *= 1.05
    // 右叶（+x）更厚实，左叶渐薄
    const taper = 1 - 0.28 * THREE.MathUtils.clamp((-p.x + 1.0) / 2.6, 0, 1)
    p.y *= taper
    p.z *= 0.85 + 0.15 * taper
    // 下缘波浪起伏
    if (p.y < 0) {
      p.y += 0.09 * Math.sin(p.x * 3.1 + 1.2) * Math.cos(p.z * 2.4) * (-p.y)
    }
    // 胆囊切迹：底面一个浅凹陷
    const notch = new THREE.Vector3(0.55, -0.62, 0.55)
    const d = p.distanceTo(notch)
    if (d < 0.42) {
      const f = (1 - d / 0.42)
      p.addScaledVector(dir, -0.22 * f * f)
    }
    // 顶部穹隆隆起
    if (p.y > 0) p.y += 0.06 * Math.cos(p.x * 1.4) * p.y
    return p
  })
}

/** 肾脏：蚕豆形，肾门（hilum）内侧凹陷 */
function buildKidney(segments: number): THREE.BufferGeometry {
  return parametricSphere(segments, (dir) => {
    const p = dir.clone()
    p.x *= 0.72
    p.y *= 1.35
    p.z *= 0.85
    // 肾门：内侧面（-z）中部凹入
    const hilum = new THREE.Vector3(0, -0.05, -0.78)
    const d = p.distanceTo(hilum)
    if (d < 0.5) {
      const f = 1 - d / 0.5
      p.z += 0.3 * f * f
      p.x *= 1 + 0.12 * f
    }
    // 上下两极略收窄
    const pole = Math.abs(p.y) / 1.35
    const shrink = 1 - 0.12 * Math.pow(pole, 3)
    p.x *= shrink
    p.z *= shrink
    // 表面轻微分叶
    const lobe = 1 + 0.025 * Math.sin(dir.y * 14 + dir.x * 6) * Math.sin(dir.y * 5 + 2)
    p.x *= lobe
    p.z *= lobe
    return p
  })
}

/** 腺体：类球体带多个小叶突起与一条导管蒂 */
function buildGland(segments: number): THREE.BufferGeometry {
  return parametricSphere(segments, (dir) => {
    const p = dir.clone()
    p.x *= 1.05
    p.y *= 0.92
    p.z *= 1.0
    // 多小叶：低频球面谐波叠加
    const lobes =
      1 +
      0.07 * Math.sin(dir.x * 5 + 0.4) * Math.sin(dir.y * 4 - 0.7) +
      0.05 * Math.cos(dir.z * 6 + dir.x * 2) +
      0.03 * Math.sin((dir.x + dir.y + dir.z) * 9)
    p.multiplyScalar(lobes)
    // 导管蒂：顶部一个小突起
    if (dir.y > 0.55) {
      const f = (dir.y - 0.55) / 0.45
      p.y += 0.28 * f * f
      const neck = 1 - 0.35 * f
      p.x *= neck
      p.z *= neck
    }
    return p
  })
}

/** 从几何提取紧凑的传输数据（Transferable 友好） */
export function geometryToBuffers(geo: THREE.BufferGeometry): {
  restPositions: Float32Array
  indices: Uint32Array
  center: [number, number, number]
  radius: number
} {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const restPositions = new Float32Array(pos.array as Float32Array)
  const index = geo.getIndex()!
  const indices = new Uint32Array(index.count)
  for (let i = 0; i < index.count; i++) indices[i] = index.getX(i)
  const sphere = geo.boundingSphere!
  return {
    restPositions,
    indices,
    center: [sphere.center.x, sphere.center.y, sphere.center.z],
    radius: sphere.radius,
  }
}
