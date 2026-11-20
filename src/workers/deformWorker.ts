/// <reference lib="webworker" />
import type {
  FrameInputMessage,
  FrameResultMessage,
  HardnessProfile,
  InitDoneMessage,
  InitMessage,
} from '../shared/types'

/**
 * 软组织形变 Worker
 *
 * 管线：
 * 1. init：在器官包围球内生成虚拟骨骼晶格，为每个顶点预计算 4 骨骼蒙皮权重
 *    （Wendland 紧支核 + 空间哈希加速近邻查询）
 * 2. frame：
 *    a. 接触力——按命中点与顶点距离衰减给出目标位移，弹簧-阻尼积分
 *    b. 蒙皮扩散——顶点位移按权重聚合到骨骼，再从骨骼混合回顶点，形成平滑凹陷
 *    c. 松开接触后目标位移归零，按弹性系数逐帧回弹
 *    d. 输出静止位置 + 位移，并统计最大形变位移
 */

const MAX_BONES_PER_VERTEX = 4
const DIFFUSION_BLEND = 0.35 // 蒙皮扩散混合强度：兼顾邻域平滑与凹陷峰值保留

interface SkinData {
  vertexCount: number
  boneCount: number
  /** 每顶点 4 个骨骼索引，不足补 -1 */
  boneIds: Int32Array
  /** 每顶点 4 个归一化权重 */
  weights: Float32Array
  rest: Float32Array
  disp: Float32Array
  vel: Float32Array
  organRadius: number
}

let skin: SkinData | null = null

// ---------- 初始化：虚拟骨骼 + 蒙皮权重 ----------

function initSkin(msg: InitMessage): InitDoneMessage {
  const rest = new Float32Array(msg.restPositions)
  const vertexCount = msg.vertexCount
  const [cx, cy, cz] = msg.center
  const R = msg.radius

  // 在包围球内铺立方晶格骨骼，间距约为半径的 1/4
  const spacing = R / 4
  const bones: number[] = []
  const n = Math.ceil(R / spacing)
  for (let ix = -n; ix <= n; ix++) {
    for (let iy = -n; iy <= n; iy++) {
      for (let iz = -n; iz <= n; iz++) {
        const x = cx + ix * spacing
        const y = cy + iy * spacing
        const z = cz + iz * spacing
        const d2 = (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2
        if (d2 <= (R * 0.98) ** 2) bones.push(x, y, z)
      }
    }
  }
  const boneCount = bones.length / 3
  const boneXYZ = new Float32Array(bones)

  // 空间哈希：支撑半径 1.9 倍间距，保证每个顶点至少能找到 4 根骨骼
  const support = spacing * 1.9
  const cellSize = support
  const grid = new Map<number, number[]>()
  const cellKey = (gx: number, gy: number, gz: number) => {
    // 有符号三维格点转唯一整数键
    const ox = gx + 128
    const oy = gy + 128
    const oz = gz + 128
    return (ox * 256 + oy) * 256 + oz
  }
  for (let b = 0; b < boneCount; b++) {
    const gx = Math.floor((boneXYZ[b * 3] - cx) / cellSize)
    const gy = Math.floor((boneXYZ[b * 3 + 1] - cy) / cellSize)
    const gz = Math.floor((boneXYZ[b * 3 + 2] - cz) / cellSize)
    const key = cellKey(gx, gy, gz)
    let bucket = grid.get(key)
    if (!bucket) {
      bucket = []
      grid.set(key, bucket)
    }
    bucket.push(b)
  }

  const boneIds = new Int32Array(vertexCount * MAX_BONES_PER_VERTEX)
  const weights = new Float32Array(vertexCount * MAX_BONES_PER_VERTEX)
  const support2 = support * support

  // Wendland C2 紧支核：(1-r)^2 * (1+2r)，r = d/support
  const wendland = (d2: number) => {
    const r = Math.sqrt(d2) / support
    if (r >= 1) return 0
    const u = 1 - r
    return u * u * (1 + 2 * r)
  }

  const candidate: { id: number; w: number }[] = []
  for (let v = 0; v < vertexCount; v++) {
    const px = rest[v * 3]
    const py = rest[v * 3 + 1]
    const pz = rest[v * 3 + 2]
    const gx = Math.floor((px - cx) / cellSize)
    const gy = Math.floor((py - cy) / cellSize)
    const gz = Math.floor((pz - cz) / cellSize)

    candidate.length = 0
    for (let ax = gx - 1; ax <= gx + 1; ax++) {
      for (let ay = gy - 1; ay <= gy + 1; ay++) {
        for (let az = gz - 1; az <= gz + 1; az++) {
          const bucket = grid.get(cellKey(ax, ay, az))
          if (!bucket) continue
          for (const b of bucket) {
            const dx = boneXYZ[b * 3] - px
            const dy = boneXYZ[b * 3 + 1] - py
            const dz = boneXYZ[b * 3 + 2] - pz
            const d2 = dx * dx + dy * dy + dz * dz
            if (d2 <= support2) candidate.push({ id: b, w: wendland(d2) })
          }
        }
      }
    }

    // 取权重最大的 4 根骨骼并归一化
    candidate.sort((a, b) => b.w - a.w)
    let wsum = 0
    for (let k = 0; k < MAX_BONES_PER_VERTEX; k++) {
      const c = candidate[k]
      if (c && c.w > 0) {
        boneIds[v * MAX_BONES_PER_VERTEX + k] = c.id
        weights[v * MAX_BONES_PER_VERTEX + k] = c.w
        wsum += c.w
      } else {
        boneIds[v * MAX_BONES_PER_VERTEX + k] = -1
      }
    }
    if (wsum > 0) {
      for (let k = 0; k < MAX_BONES_PER_VERTEX; k++) {
        weights[v * MAX_BONES_PER_VERTEX + k] /= wsum
      }
    }
  }

  skin = {
    vertexCount,
    boneCount,
    boneIds,
    weights,
    rest,
    disp: new Float32Array(vertexCount * 3),
    vel: new Float32Array(vertexCount * 3),
    organRadius: R,
  }

  return { type: 'initDone', boneCount, weightsPerVertex: MAX_BONES_PER_VERTEX }
}

// ---------- 每帧物理 + 蒙皮扩散 ----------

function stepFrame(msg: FrameInputMessage): FrameResultMessage {
  const t0 = performance.now()
  const s = skin!
  const { rest, disp, vel, vertexCount, organRadius } = s
  const profile: HardnessProfile = msg.profile
  const dt = Math.min(msg.dt, 1 / 30) // 钳制大步长，保证积分稳定

  // 影响半径随器官尺寸归一化
  const radius = profile.influenceRadius * (organRadius / 1.2)
  const r2 = radius * radius
  const k = profile.springK
  const c = profile.damping

  // 两个子步，提升弹簧稳定性
  const sub = 2
  const h = dt / sub

  for (let pass = 0; pass < sub; pass++) {
    if (msg.contact && msg.depth > 0) {
      const { pointX, pointY, pointZ, normalX, normalY, normalZ, depth } = msg
      // 压入量以探针半径为参照归一化，限制最大凹陷为器官半径的 35%
      const press = Math.min(depth, organRadius * 0.35)
      for (let v = 0; v < vertexCount; v++) {
        const i3 = v * 3
        const dx = rest[i3] - pointX
        const dy = rest[i3 + 1] - pointY
        const dz = rest[i3 + 2] - pointZ
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 >= r2) continue
        // 平滑三次衰减：3t²-2t³
        const t = 1 - Math.sqrt(d2) / radius
        const falloff = t * t * (3 - 2 * t)
        // 目标凹陷位移（沿 -normal）：压入深度 × 距离衰减
        const targetMag = -press * falloff
        const tx = normalX * targetMag
        const ty = normalY * targetMag
        const tz = normalZ * targetMag
        // 弹簧-阻尼：向目标位移收敛
        vel[i3] += ((tx - disp[i3]) * k - vel[i3] * c) * h
        vel[i3 + 1] += ((ty - disp[i3 + 1]) * k - vel[i3 + 1] * c) * h
        vel[i3 + 2] += ((tz - disp[i3 + 2]) * k - vel[i3 + 2] * c) * h
      }
    }

    // 全部顶点：无接触目标为 0 → 弹簧回弹
    for (let i = 0; i < disp.length; i++) {
      vel[i] += (-disp[i] * k - vel[i] * c) * h
      disp[i] += vel[i] * h
    }
  }

  // 蒙皮扩散每帧只做一次：既保证邻域平滑，又不抹平凹陷峰值
  diffuseThroughBones(s)

  // 输出 + 统计最大形变
  const out = new Float32Array(msg.outputBuffer)
  let maxDef = 0
  for (let i = 0; i < disp.length; i++) {
    out[i] = rest[i] + disp[i]
  }
  for (let v = 0; v < vertexCount; v++) {
    const i3 = v * 3
    const d = Math.sqrt(disp[i3] ** 2 + disp[i3 + 1] ** 2 + disp[i3 + 2] ** 2)
    if (d > maxDef) maxDef = d
  }

  return {
    type: 'frameResult',
    positions: out.buffer,
    maxDeformation: maxDef,
    computeMs: performance.now() - t0,
  }
}

/**
 * 蒙皮扩散：顶点位移 → 骨骼（加权平均）→ 顶点（蒙皮混合）。
 * 相邻顶点共享骨骼，位移因此向邻域平滑扩散，形成连续凹陷而非尖坑。
 */
function diffuseThroughBones(s: SkinData): void {
  const { vertexCount, boneCount, disp } = s
  const boneIds = s.boneIds
  const weights = s.weights
  const boneDelta = new Float32Array(boneCount * 3)
  const boneWeight = new Float32Array(boneCount)

  // 1. 顶点位移聚合到骨骼
  for (let v = 0; v < vertexCount; v++) {
    const i3 = v * 3
    for (let j = 0; j < MAX_BONES_PER_VERTEX; j++) {
      const b = boneIds[v * MAX_BONES_PER_VERTEX + j]
      if (b < 0) continue
      const w = weights[v * MAX_BONES_PER_VERTEX + j]
      const b3 = b * 3
      boneDelta[b3] += disp[i3] * w
      boneDelta[b3 + 1] += disp[i3 + 1] * w
      boneDelta[b3 + 2] += disp[i3 + 2] * w
      boneWeight[b] += w
    }
  }
  for (let b = 0; b < boneCount; b++) {
    const w = boneWeight[b]
    if (w > 1e-8) {
      const b3 = b * 3
      const inv = 1 / w
      boneDelta[b3] *= inv
      boneDelta[b3 + 1] *= inv
      boneDelta[b3 + 2] *= inv
    }
  }

  // 2. 骨骼位移混合回顶点
  const keep = 1 - DIFFUSION_BLEND
  for (let v = 0; v < vertexCount; v++) {
    const i3 = v * 3
    let sx = 0
    let sy = 0
    let sz = 0
    for (let j = 0; j < MAX_BONES_PER_VERTEX; j++) {
      const b = boneIds[v * MAX_BONES_PER_VERTEX + j]
      if (b < 0) continue
      const w = weights[v * MAX_BONES_PER_VERTEX + j]
      const b3 = b * 3
      sx += boneDelta[b3] * w
      sy += boneDelta[b3 + 1] * w
      sz += boneDelta[b3 + 2] * w
    }
    disp[i3] = disp[i3] * keep + sx * DIFFUSION_BLEND
    disp[i3 + 1] = disp[i3 + 1] * keep + sy * DIFFUSION_BLEND
    disp[i3 + 2] = disp[i3 + 2] * keep + sz * DIFFUSION_BLEND
  }
}

self.onmessage = (ev: MessageEvent<InitMessage | FrameInputMessage>) => {
  const msg = ev.data
  if (msg.type === 'init') {
    const done = initSkin(msg)
    ;(self as unknown as Worker).postMessage(done)
  } else if (msg.type === 'frame') {
    if (!skin) return
    const result = stepFrame(msg)
    ;(self as unknown as Worker).postMessage(result, [result.positions])
  }
}
