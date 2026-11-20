// ============================================================
// geometry.js — 纯数学模块:网格吸附 / 闭合判断 / 倒角圆角 / 三角化 / 拉伸与回转几何
// 2D 点统一使用 { x, z }(画布平面),3D 点使用 { x, y, z }
// ============================================================

export const GRID = 0.5            // 网格步长
export const SNAP_ENDPOINT = 0.45  // 端点吸附半径
export const ANGLE_TOL = 4         // 水平/垂直约束判定角度(度)

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
export const snapGrid = (v, grid = GRID) => Math.round(v / grid) * grid
export const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

export function subtract2(a, b) { return { x: a.x - b.x, z: a.z - b.z } }
export function scale2(v, s) { return { x: v.x * s, z: v.z * s } }
export function add2(a, b) { return { x: a.x + b.x, z: a.z + b.z } }
export function normalize2(v) {
  const l = Math.hypot(v.x, v.z) || 1
  return { x: v.x / l, z: v.z / l }
}
// (x,z) 二维里的左法线(CCW 多边形内侧方向)
export function leftNormal2(v) { return { x: -v.z, z: v.x } }

export function polygonArea2(points) {
  let s = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    s += a.x * b.z - a.z * b.x
  }
  return s / 2
}

/** 返回 CCW(面积为正)方向的点集;若输入是 CW 则反转并给出索引映射 */
export function ensureCCW(points) {
  const pts = points.map(p => ({ ...p }))
  if (polygonArea2(pts) < 0) {
    pts.reverse()
    const map = pts.map((_, i) => points.length - 1 - i) // 旧索引 -> 新索引
    return { pts, map }
  }
  return { pts, map: pts.map((_, i) => i) }
}

/** 闭合判断:最后一个点是否贴近第一个点 */
export function isClosed(points, tol = SNAP_ENDPOINT) {
  if (points.length < 3) return false
  return dist2(points[0], points[points.length - 1]) <= tol
}

/** 画线时的网格 + 水平/垂直约束吸附 */
export function drawSnap(raw, prev) {
  const p = { x: snapGrid(raw.x), z: snapGrid(raw.z) }
  let constraint = null
  if (prev) {
    const dx = p.x - prev.x, dz = p.z - prev.z
    const len = Math.hypot(dx, dz)
    if (len > 1e-6) {
      if (Math.abs(Math.atan2(dz, dx)) * 180 / Math.PI <= ANGLE_TOL) { p.z = prev.z; constraint = 'h' }
      else if (Math.abs(Math.atan2(dx, dz)) * 180 / Math.PI <= ANGLE_TOL) { p.x = prev.x; constraint = 'v' }
    }
  }
  return { point: p, constraint }
}

/** 角度按档吸附(默认 15 度一档) */
export function snapAngle(deg, step = 15) {
  return clamp(Math.round(deg / step) * step, step, 360)
}

// ------------------------------------------------------------
// 轮廓元素:线段 { type:'line', a, b } / 圆弧 { type:'arc', c, r, a0, a1(弧度,CCW) }
// corners: { [顶点索引]: { type:'chamfer'|'fillet', r } }
// 只对凸顶点加工(凹顶点的内切圆在多边形外侧,保持尖角更安全)
// ------------------------------------------------------------
export function buildElements(points, corners = {}) {
  const n = points.length
  const entry = Array(n), exit = Array(n)
  const crossAt = i => {
    const v = points[i], pv = points[(i - 1 + n) % n], nx = points[(i + 1) % n]
    return (v.x - pv.x) * (nx.z - v.z) - (v.z - pv.z) * (nx.x - v.x)
  }
  for (let i = 0; i < n; i++) {
    const v = points[i], pv = points[(i - 1 + n) % n], nx = points[(i + 1) % n]
    const c = corners[i]
    const convex = crossAt(i) > 1e-9
    if (!c || !c.type || !convex) { entry[i] = { ...v }; exit[i] = { ...v }; continue }
    const lenIn = dist2(pv, v), lenOut = dist2(v, nx)
    const rr = clamp(c.r, 0.01, Math.min(lenIn, lenOut) * 0.45)
    entry[i] = add2(v, scale2(normalize2(subtract2(pv, v)), rr))
    exit[i] = add2(v, scale2(normalize2(subtract2(nx, v)), rr))
    entry[i]._rr = rr
  }
  const els = []
  const pushLine = (a, b) => {
    if (dist2(a, b) > 1e-5) els.push({ type: 'line', a: { ...a }, b: { ...b } })
  }
  for (let i = 0; i < n; i++) {
    const prevExit = exit[(i - 1 + n) % n]
    pushLine(prevExit, entry[i])
    const c = corners[i]
    if (c?.type === 'chamfer') {
      pushLine(entry[i], exit[i])
    } else if (c?.type === 'fillet') {
      const v = points[i], pv = points[(i - 1 + n) % n]
      const rr = entry[i]._rr
      const eIn = normalize2(subtract2(v, pv))
      const center = add2(entry[i], scale2(leftNormal2(eIn), rr))
      const a0 = Math.atan2(entry[i].z - center.z, entry[i].x - center.x)
      let a1 = Math.atan2(exit[i].z - center.z, exit[i].x - center.x)
      let sweep = a1 - a0
      while (sweep <= 0) sweep += Math.PI * 2
      els.push({ type: 'arc', c: center, r: rr, a0, a1: a0 + sweep })
    }
  }
  return els
}

/** 把轮廓元素采样成闭合点环(不重复首点) */
export function sampleContour(els, arcSteps = 6) {
  const pts = []
  for (const el of els) {
    if (el.type === 'line') {
      if (!pts.length || dist2(pts[pts.length - 1], el.a) > 1e-6) pts.push({ ...el.a })
      pts.push({ ...el.b })
    } else {
      for (let k = 0; k <= arcSteps; k++) {
        const a = el.a0 + (el.a1 - el.a0) * (k / arcSteps)
        pts.push({ x: el.c.x + Math.cos(a) * el.r, z: el.c.z + Math.sin(a) * el.r })
      }
    }
  }
  // 去除连续重复点 & 末尾与首点重合
  const out = []
  for (const p of pts) {
    if (!out.length || dist2(out[out.length - 1], p) > 1e-5) out.push(p)
  }
  if (out.length > 1 && dist2(out[0], out[out.length - 1]) < 1e-5) out.pop()
  return out
}

// ------------------------------------------------------------
// 耳切法三角化(2D,容忍共线点,要求简单多边形)
// ------------------------------------------------------------
export function earClip(poly) {
  const pts = poly.map(p => ({ x: p.x, z: p.z }))
  if (polygonArea2(pts) < 0) pts.reverse()
  const n = pts.length
  if (n < 3) return []
  const idx = pts.map((_, i) => i)
  const tris = []
  let guard = 0
  const sign = (a, b, c) =>
    (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
  const inside = (p, a, b, c) => {
    const s1 = sign(a, b, p), s2 = sign(b, c, p), s3 = sign(c, a, p)
    return s1 >= 0 && s2 >= 0 && s3 >= 0
  }
  while (idx.length > 3 && guard++ < n * n * 2) {
    let clipped = false
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k - 1 + idx.length) % idx.length]
      const i1 = idx[k]
      const i2 = idx[(k + 1) % idx.length]
      const a = pts[i0], b = pts[i1], c = pts[i2]
      if (Math.abs(sign(a, b, c)) < 1e-9) continue // 共线,跳过
      if (sign(a, b, c) < 0) continue
      let hit = false
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue
        if (inside(pts[j], a, b, c)) { hit = true; break }
      }
      if (!hit) {
        tris.push(i0, i1, i2)
        idx.splice(k, 1)
        clipped = true
        break
      }
    }
    if (!clipped) break // 容错:异常多边形直接退出,材质为双面不会穿帮
  }
  if (idx.length === 3) tris.push(idx[0], idx[1], idx[2])
  return tris
}

// ------------------------------------------------------------
// 拉伸几何:轮廓沿 +Y 拉伸 depth,底面落在 y=0
// ------------------------------------------------------------
export function buildExtrude(loop, depth) {
  const n = loop.length
  const positions = []
  const indices = []
  for (const p of loop) positions.push(p.x, 0, p.z)       // 底环 0..n-1
  for (const p of loop) positions.push(p.x, depth, p.z)   // 顶环 n..2n-1
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    indices.push(i, j, n + j, i, n + j, n + i)            // 侧壁
  }
  const cap = earClip(loop)
  for (const t of cap) indices.push(n + t)                // 顶面
  for (const t of cap) indices.push(t)                    // 底面(反向由双面材质兜底)
  return { positions, indices }
}

// ------------------------------------------------------------
// 回转几何:画布上的轴线 A->B(3D 中为 y=0 的水平轴),轮廓绕轴扫过 angleDeg 度
// ------------------------------------------------------------
export function revolveInfo(points, A, B) {
  const d = normalize2(subtract2(B, A))
  const n2 = leftNormal2(d)
  const info = points.map(p => {
    const rel = subtract2(p, A)
    return { t: rel.x * d.x + rel.z * d.z, h: rel.x * n2.x + rel.z * n2.z }
  })
  return { d, n2, info }
}

/** 轮廓是否整体位于轴线同一侧(允许贴轴) */
export function profileOnOneSide(points, A, B) {
  const { info } = revolveInfo(points, A, B)
  const pos = info.some(v => v.h > 1e-4)
  const neg = info.some(v => v.h < -1e-4)
  return !(pos && neg)
}

export function buildRevolve(loop, A, B, angleDeg) {
  const { d, n2, info } = revolveInfo(loop, A, B)
  const n = loop.length
  const full = angleDeg >= 359.999
  const steps = Math.max(8, Math.round(angleDeg / 15))
  const rings = full ? steps : steps + 1
  const positions = []
  const indices = []
  const up = { x: 0, y: 1, z: 0 }
  const ringAt = phi => info.map(v => {
    const c = Math.cos(phi), s = Math.sin(phi)
    return {
      x: A.x + d.x * v.t + n2.x * v.h * c,
      y: v.h * s,
      z: A.z + d.z * v.t + n2.z * v.h * c
    }
  })
  const ringBase = []
  for (let k = 0; k < rings; k++) {
    const phi = (angleDeg * Math.PI / 180) * (k / steps)
    ringBase.push(positions.length / 3)
    for (const p of ringAt(phi)) positions.push(p.x, p.y, p.z)
  }
  // 侧壁:每个角度段 × 每条轮廓边
  const segs = full ? steps : steps
  for (let k = 0; k < segs; k++) {
    const k2 = full ? (k + 1) % steps : k + 1
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = ringBase[k] + i, b = ringBase[k] + j
      const c = ringBase[k2] + j, e = ringBase[k2] + i
      indices.push(a, b, c, a, c, e)
    }
  }
  // 端面盖(非整圆时)
  if (!full) {
    const cap = earClip(loop)
    for (const t of cap) indices.push(ringBase[0] + t)
    const last = ringBase[rings - 1]
    for (const t of cap) indices.push(last + t)
  }
  // 烘焙:最低 y 归零,让积木稳稳落在画布上
  let minY = Infinity
  for (let i = 1; i < positions.length; i += 3) minY = Math.min(minY, positions[i])
  if (minY < 0) {
    for (let i = 1; i < positions.length; i += 3) positions[i] -= minY
  }
  return { positions, indices }
}

// ------------------------------------------------------------
// 尺寸编辑:修改第 edgeIndex 条边(原顶点 i -> i+1)的长度,
// 把 i+1 及其后的顶点链整体平移,其余边保持不变
// ------------------------------------------------------------
export function resizeEdge(points, edgeIndex, newLen) {
  const n = points.length
  const a = points[edgeIndex], b = points[(edgeIndex + 1) % n]
  const dir = normalize2(subtract2(b, a))
  const cur = dist2(a, b)
  const delta = clamp(newLen, GRID, 20) - cur
  const shift = scale2(dir, delta)
  return points.map((p, i) => {
    if (i <= edgeIndex) return { ...p }
    return { x: snapGrid(p.x + shift.x), z: snapGrid(p.z + shift.z) }
  })
}
