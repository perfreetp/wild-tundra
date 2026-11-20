// 几何模块冒烟测试:node test/geometry.test.js
import {
  buildElements, sampleContour, earClip, buildExtrude, buildRevolve,
  resizeEdge, drawSnap, profileOnOneSide, snapAngle, polygonArea2, dist2,
} from '../src/lib/geometry.js'

let pass = 0, fail = 0
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log('❌', name)) }

// 1. 矩形三角化 + 拉伸
const rect = [
  { x: 0, z: 0 }, { x: 4, z: 0 }, { x: 4, z: 3 }, { x: 0, z: 3 },
]
ok('矩形 CCW', polygonArea2(rect) > 0)
const tris = earClip(rect)
ok('矩形耳切 2 个三角形', tris.length === 6)
const ext = buildExtrude(rect, 2)
ok('拉伸顶点数 8', ext.positions.length / 3 === 8)
ok('拉伸索引存在', ext.indices.length >= 12)

// 2. 圆角轮廓采样后仍为简单多边形且三角化成功
const corners = { 0: { type: 'fillet', r: 0.5 } }
const els = buildElements(rect, corners)
ok('轮廓含圆弧', els.some(e => e.type === 'arc'))
const loop = sampleContour(els)
ok('圆角采样点数 > 原顶点', loop.length > 4)
ok('圆角轮廓可三角化', earClip(loop).length >= 6)

// 3. 倒角
const chamferEls = buildElements(rect, { 1: { type: 'chamfer', r: 0.6 } })
ok('倒角全是线段', chamferEls.every(e => e.type === 'line'))

// 4. 凹多边形(L 形)三角化
const lshape = [
  { x: 0, z: 0 }, { x: 4, z: 0 }, { x: 4, z: 1.5 },
  { x: 1.5, z: 1.5 }, { x: 1.5, z: 4 }, { x: 0, z: 4 },
]
const ltris = earClip(lshape)
ok('L 形三角化 4 个三角形', ltris.length === 12)
const lEls = buildElements(lshape, { 2: { type: 'fillet', r: 0.3 }, 3: { type: 'fillet', r: 0.3 } })
const lLoop = sampleContour(lEls)
ok('L 形加工后可三角化', earClip(lLoop).length > 0)
ok('面积保持(加工后略小)', polygonArea2(lLoop) <= polygonArea2(lshape) + 1e-6)

// 5. 回转体:轴在轮廓外侧
const A = { x: -2, z: 0 }, B = { x: -2, z: 3 }
ok('轮廓在轴一侧', profileOnOneSide(rect, A, B))
const rev = buildRevolve(rect, A, B, 360)
ok('整圆回转无端面且有顶点', rev.positions.length / 3 > 8)
const rev90 = buildRevolve(rect, A, B, 90)
ok('90° 回转带端面,索引更多', rev90.indices.length > rev.indices.length / 4)
// 烘焙后最低点 y≈0
let minY = Infinity
for (let i = 1; i < rev.positions.length; i += 3) minY = Math.min(minY, rev.positions[i])
ok('回转体烘焙到地面', Math.abs(minY) < 1e-6)

// 6. 轴穿过轮廓 → 非单侧
const bad = profileOnOneSide(rect, { x: 2, z: 0 }, { x: 2, z: 3 })
ok('穿轮廓的轴被拒绝', !bad)

// 7. 尺寸编辑:改第一条边 4 → 6,顶点链平移
const resized = resizeEdge(rect, 0, 6)
ok('边长按预期变长', Math.abs(dist2(resized[0], resized[1]) - 6) < 1e-9)
ok('后续边长度不变', Math.abs(dist2(resized[1], resized[2]) - 3) < 1e-9)

// 8. 吸附与角度档
ok('网格吸附', drawSnap({ x: 0.21, z: -0.74 }, null).point.x === 0)
const s = drawSnap({ x: 2.01, z: 0.02 }, { x: 0, z: 0 })
ok('近水平加 h 约束', s.constraint === 'h' && s.point.z === 0)
ok('角度 15° 一档', snapAngle(77) === 75 && snapAngle(352) === 345)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
