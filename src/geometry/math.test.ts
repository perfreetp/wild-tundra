// 纯 node 运行:node --experimental-strip-types src/geometry/math.test.ts
import {
  ALL_KINDS,
  computeFoldTransforms,
  connKey,
  findSnap,
  polygonsOverlap,
  shapeOf,
  tileOverlaps,
  type TileState,
  v,
  worldEdge,
  edgeMid,
  MAX_FOLD,
} from './math.ts';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${name} ${extra}`);
  }
}

// 1. 所有形状的直边长度都是 1
for (const kind of ALL_KINDS) {
  const s = shapeOf(kind);
  for (const ei of s.straightEdges) {
    check(`${kind} 直边 ${ei} 长度=1`, Math.abs(s.edges[ei].len - 1) < 1e-6, `got ${s.edges[ei].len}`);
  }
}

// 2. 扇形有两条直边 + 弧边
const sector = shapeOf('sector');
check('扇形两条直边', sector.straightEdges.length === 2);
check('扇形有弧边', sector.edges.some((e) => e.arc));

// 3. 正方形拖到另一个正方形右边 -> 吸附
const base: TileState = { id: 1, kind: 'square', x: 0, z: 0, rot: 0, color: '#fff' };
const moving: TileState = { id: 2, kind: 'square', x: 1.02, z: 0.03, rot: 0, color: '#fff' };
const snap = findSnap(moving, [base]);
check('相邻正方形产生吸附', snap !== null);
if (snap) {
  check('吸附后 x≈1', Math.abs(snap.targetX - 1) < 1e-6, `x=${snap.targetX}`);
  check('吸附后 z≈0', Math.abs(snap.targetZ) < 1e-6, `z=${snap.targetZ}`);
  check('吸附后无旋转', Math.abs(snap.targetRot) < 1e-6);
}

// 4. 带旋转的三角形接近时也能吸附:求解器自动算出 rot=-30° 的合法外侧位姿
const r = 1 / Math.sqrt(3);
const nearX = 1 + r * 0.5;
const legal: TileState = { id: 3, kind: 'triangle', x: nearX, z: 0, rot: 0, color: '#fff' };
check('参照位姿本身不重叠', !tileOverlaps(legal, [base], 3));
const rotated: TileState = { ...legal, id: 3, x: nearX + 0.03, z: 0.02, rot: 0 };
const snap2 = findSnap(rotated, [base]);
check('旋转片可吸附', snap2 !== null);
if (snap2) {
  check('吸附到正确外侧位姿',
    Math.abs(snap2.targetX - (0.5 + r * 0.5)) < 1e-5 &&
    Math.abs(snap2.targetZ) < 1e-5 &&
    Math.abs(snap2.targetRot + Math.PI / 6) < 1e-5,
    `(${snap2.targetX},${snap2.targetZ},${snap2.targetRot})`);
}

// 5. 太远不吸附
const far: TileState = { id: 4, kind: 'square', x: 3, z: 0, rot: 0, color: '#fff' };
check('距离过远不吸附', findSnap(far, [base]) === null);

// 6. SAT:重叠检测
const overlapA: TileState = { id: 5, kind: 'square', x: 0, z: 0, rot: 0, color: '#fff' };
const overlapB: TileState = { id: 6, kind: 'square', x: 0.3, z: 0.2, rot: 0, color: '#fff' };
check('重叠被检测到', tileOverlaps(overlapB, [overlapA]));
const touch: TileState = { id: 7, kind: 'square', x: 1, z: 0, rot: 0, color: '#fff' };
check('边相接不算重叠', !tileOverlaps(touch, [overlapA]));

// 7. 三角形与六边形可以互相吸附(等长边)。放在六边形边 1 外侧
const hex: TileState = { id: 9, kind: 'hexagon', x: 0, z: 0, rot: 0, color: '#fff' };
const tri: TileState = { id: 8, kind: 'triangle', x: 0.95, z: 1.25, rot: 0, color: '#fff' };
check('三角-六边形等长边可吸附', findSnap(tri, [hex]) !== null);

// 8. 折叠:两个相连正方形折 90°,第二片中心应抬起
const t1: TileState = { id: 1, kind: 'square', x: 0, z: 0, rot: 0, color: '#fff' };
const t2: TileState = { id: 2, kind: 'square', x: 1, z: 0, rot: 0, color: '#fff' };
const conns = [{ a: connKey(1, 1), b: connKey(2, 3), fold: Math.PI / 2 }];
const folds = computeFoldTransforms([t1, t2], conns, 1);
const f2 = folds.get(2)!;
check('折叠 90° 后 y≈0.5(中心抬起)', Math.abs(f2.y - 0.5) < 1e-4, `y=${f2.y}`);
check('折叠后 x≈0.5(铰链在 x=0.5)', Math.abs(f2.x - 0.5) < 1e-4, `x=${f2.x}`);
check('根片保持平铺', Math.abs(folds.get(1)!.y) < 1e-6);

// 9. 折叠 120° 上限常量
check('折叠上限为 120°', Math.abs(MAX_FOLD - (2 * Math.PI) / 3) < 1e-6);

// 10. 三片链式折叠,末端位置随角度变化
const t3: TileState = { id: 3, kind: 'square', x: 2, z: 0, rot: 0, color: '#fff' };
const conns3 = [
  { a: connKey(1, 1), b: connKey(2, 3), fold: Math.PI / 2 },
  { a: connKey(2, 1), b: connKey(3, 3), fold: Math.PI / 2 },
];
const chain = computeFoldTransforms([t1, t2, t3], conns3, 1);
const f3 = chain.get(3)!;
// 两片都折 90°:第三片应竖直,中心在 (0.5, 1, 0) 附近
check('链式折叠末端抬起', f3.y > 0.9, `y=${f3.y}`);

// 11. 边中点世界变换正确
const te: TileState = { id: 10, kind: 'square', x: 10, z: 5, rot: Math.PI / 2, color: '#fff' };
const mid = edgeMid(worldEdge(te, 0));
check('世界边中点随位姿变换', Math.abs(mid.x - 10.5) < 1e-6 && Math.abs(mid.z - 5) < 1e-6, `(${mid.x},${mid.z})`);

// 12. 多边形工具:顶点数
check('扇形近似顶点充足', shapeOf('sector').points.length >= 14);
check('六边形 6 顶点', shapeOf('hexagon').points.length === 6);
void polygonsOverlap;
void v;

console.log(`\n${pass} 通过, ${fail} 失败`);
if (fail) process.exit(1);
