// 纯 2D/3D 几何运算:磁力片形状、SAT 碰撞检测、边吸附求解、折叠运动学
// 所有数学不依赖 Babylon,方便单元测试。

export interface Vec2 {
  x: number;
  z: number;
}

export type TileKind = 'square' | 'triangle' | 'hexagon' | 'sector';

export interface Edge2 {
  /** 边的起点(局部坐标) */
  a: Vec2;
  /** 边的终点(局部坐标) */
  b: Vec2;
  /** 边长 */
  len: number;
  /** 外法线(局部坐标,逆时针多边形朝外) */
  normal: Vec2;
  /** 弧边不可吸附(扇形的圆弧) */
  arc: boolean;
}

export interface Shape2D {
  kind: TileKind;
  /** 局部多边形顶点(逆时针,弧边用细密顶点近似) */
  points: Vec2[];
  edges: Edge2[];
  /** 可吸附的直边索引 */
  straightEdges: number[];
  /** 外接半径(用于拾取/手柄位置) */
  radius: number;
  label: string;
}

export interface TileState {
  id: number;
  kind: TileKind;
  /** 台面坐标(米) */
  x: number;
  z: number;
  /** 台面旋转(弧度,逆时针为正) */
  rot: number;
  color: string;
}

export interface Connection {
  /** 连接两端 "tileId:edgeIndex" 字符串 */
  a: string;
  b: string;
  /** 当前折叠角(弧度),0 = 平铺,>0 向上折 */
  fold: number;
}

export const SNAP_EDGE_LEN = 1;
export const SNAP_DIST = 0.8; // 边中点进入这个距离才考虑吸附
export const ANGLE_SNAP = Math.PI / 12; // 15°
export const MAX_FOLD = (120 * Math.PI) / 180; // 折角上限
export const FOLD_STEP = Math.PI / 12; // 每次折叠 15°
export const PARALLEL_TOL = Math.PI / 6; // 吸附时边方向容差 ±30°
export const EPS = 1e-6;

export const v = (x: number, z: number): Vec2 => ({ x, z });
export const add = (p: Vec2, q: Vec2): Vec2 => ({ x: p.x + q.x, z: p.z + q.z });
export const sub = (p: Vec2, q: Vec2): Vec2 => ({ x: p.x - q.x, z: p.z - q.z });
export const scale = (p: Vec2, s: number): Vec2 => ({ x: p.x * s, z: p.z * s });
export const dot = (p: Vec2, q: Vec2): number => p.x * q.x + p.z * q.z;
export const len = (p: Vec2): number => Math.hypot(p.x, p.z);
export const dist = (p: Vec2, q: Vec2): number => len(sub(p, q));
export const norm = (p: Vec2): Vec2 => {
  const l = len(p) || 1;
  return { x: p.x / l, z: p.z / l };
};
/** 逆时针 90°: (x,z) -> (-z, x),对逆时针多边形给出外法线 */
export const perp = (p: Vec2): Vec2 => ({ x: -p.z, z: p.x });
export const rotVec = (p: Vec2, a: number): Vec2 => ({
  x: p.x * Math.cos(a) - p.z * Math.sin(a),
  z: p.x * Math.sin(a) + p.z * Math.cos(a),
});

function edgeFrom(a: Vec2, b: Vec2, arc = false): Edge2 {
  const d = sub(b, a);
  const l = len(d);
  return { a, b, len: l, normal: perp(norm(d)), arc };
}

/** 边长为 1 的正方形 */
function makeSquare(): Shape2D {
  const h = 0.5;
  const points = [v(-h, -h), v(h, -h), v(h, h), v(-h, h)];
  return finishShape('square', '正方形', points, [false, false, false, false]);
}

/** 边长为 1 的等边三角形(重心在原点) */
function makeTriangle(): Shape2D {
  const r = 1 / Math.sqrt(3); // 外接圆半径
  const points = [v(0, -r), v(0.5, r * 0.5), v(-0.5, r * 0.5)];
  return finishShape('triangle', '三角形', points, [false, false, false]);
}

/** 边长为 1 的正六边形(外接圆半径 = 边长 = 1) */
function makeHexagon(): Shape2D {
  const points: Vec2[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    points.push(v(Math.cos(a), Math.sin(a)));
  }
  return finishShape('hexagon', '六边形', points, [false, false, false, false, false, false]);
}

/** 90° 扇形(四分之一圆盘),半径 = 1,两条直边可吸附,弧边不可吸附 */
function makeSector(): Shape2D {
  const points: Vec2[] = [v(0, 0)];
  const seg = 14;
  for (let i = 0; i <= seg; i++) {
    const a = (Math.PI / 2) * (i / seg);
    points.push(v(Math.cos(a), Math.sin(a)));
  }
  const arcFlags: boolean[] = [];
  // 边 0: 原点 -> 弧起点(直边); 中间 seg 条: 弧边; 最后一条: 弧终点 -> 原点(直边)
  arcFlags.push(false);
  for (let i = 0; i < seg; i++) arcFlags.push(true);
  arcFlags.push(false);
  return finishShape('sector', '扇形', points, arcFlags);
}

function finishShape(
  kind: TileKind,
  label: string,
  points: Vec2[],
  arcFlags: boolean[],
): Shape2D {
  const edges: Edge2[] = [];
  const straightEdges: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const arc = arcFlags[i];
    edges.push(edgeFrom(points[i], points[(i + 1) % points.length], arc));
    if (!arc) straightEdges.push(i);
  }
  const radius = Math.max(...points.map((p) => len(p)));
  return { kind, label, points, edges, straightEdges, radius };
}

const SHAPES: Record<TileKind, Shape2D> = {
  square: makeSquare(),
  triangle: makeTriangle(),
  hexagon: makeHexagon(),
  sector: makeSector(),
};

export const shapeOf = (kind: TileKind): Shape2D => SHAPES[kind];
export const ALL_KINDS: TileKind[] = ['square', 'triangle', 'hexagon', 'sector'];

// ---------- 世界坐标变换 ----------

export function worldPoint(t: Pick<TileState, 'x' | 'z' | 'rot'>, p: Vec2): Vec2 {
  const r = rotVec(p, t.rot);
  return { x: r.x + t.x, z: r.z + t.z };
}

export function worldEdge(t: TileState, edgeIndex: number): Edge2 {
  const e = SHAPES[t.kind].edges[edgeIndex];
  const a = worldPoint(t, e.a);
  const b = worldPoint(t, e.b);
  return { ...e, a, b, normal: rotVec(e.normal, t.rot) };
}

export function worldPolygon(t: TileState): Vec2[] {
  return SHAPES[t.kind].points.map((p) => worldPoint(t, p));
}

/** 边中点 */
export const edgeMid = (e: Edge2): Vec2 => scale(add(e.a, e.b), 0.5);

/** 边的方向单位向量 */
export const edgeDir = (e: Edge2): Vec2 => norm(sub(e.b, e.a));

// ---------- SAT 凸多边形相交 ----------

function projectPoly(poly: Vec2[], axis: Vec2): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const d = dot(p, axis);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return [min, max];
}

/** 两个凸多边形是否重叠(仅边相接不算) */
export function polygonsOverlap(a: Vec2[], b: Vec2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const d = sub(poly[(i + 1) % poly.length], poly[i]);
      const axis = norm(perp(d));
      const [aMin, aMax] = projectPoly(a, axis);
      const [bMin, bMax] = projectPoly(b, axis);
      // 仅在存在明确分离间隙时判定不相交(边/点相接、浮点噪声下视为不重叠)
      if (aMax <= bMin + 1e-3 || bMax <= aMin + 1e-3) return false;
    }
  }
  return true;
}

export function tileOverlaps(t: TileState, others: TileState[], ignoreId?: number): boolean {
  const poly = worldPolygon(t);
  for (const o of others) {
    if (o.id === ignoreId) continue;
    if (polygonsOverlap(poly, worldPolygon(o))) return true;
  }
  return false;
}

// ---------- 吸附求解 ----------

export interface SnapCandidate {
  tileId: number;
  edgeIndex: number;
  otherId: number;
  otherEdge: number;
  /** 吸附后 tile 应该处在的位置/旋转 */
  targetX: number;
  targetZ: number;
  targetRot: number;
  score: number;
}

function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * 寻找 tile 相对 others 的最佳吸附。
 * 规则:两条等长直边、中点距离 < SNAP_DIST、边方向夹角 < 90°,
 * 取距离最近、角度差最小的候选,返回吸附后的位姿(自动对齐到完全贴合)。
 */
export function findSnap(tile: TileState, others: TileState[]): SnapCandidate | null {
  const shape = SHAPES[tile.kind];
  let best: SnapCandidate | null = null;

  for (const ei of shape.straightEdges) {
    const e = worldEdge(tile, ei);
    const mid = edgeMid(e);
    const eDir = edgeDir(e);

    for (const o of others) {
      if (o.id === tile.id) continue;
      const os = SHAPES[o.kind];
      for (const oj of os.straightEdges) {
        const oe = worldEdge(o, oj);
        if (Math.abs(oe.len - e.len) > 0.02) continue;
        const d = dist(mid, edgeMid(oe));
        if (d > SNAP_DIST) continue;

        // 贴合时两条边方向相反(反向平行)。90° 内都给吸附机会,由打分排序
        const oeDir = edgeDir(oe);
        const dAng = Math.abs(angleDelta(
          Math.atan2(eDir.z, eDir.x),
          Math.atan2(-oeDir.z, -oeDir.x),
        ));
        if (dAng > Math.PI / 2 - 0.01) continue;

        // 目标旋转:让本地边方向与目标边反向平行
        const localAng = Math.atan2(sub(e.b, e.a).z, sub(e.b, e.a).x);
        const targetAng = Math.atan2(sub(oe.a, oe.b).z, sub(oe.a, oe.b).x);
        const targetRot = tile.rot + angleDelta(targetAng, localAng + tile.rot);

        // 目标平移:本地该边中点旋转后应对齐 oe 的中点
        const localMid = scale(add(shape.edges[ei].a, shape.edges[ei].b), 0.5);
        const rotatedMid = rotVec(localMid, targetRot);
        const targetX = edgeMid(oe).x - rotatedMid.x;
        const targetZ = edgeMid(oe).z - rotatedMid.z;

        const candidate: TileState = { ...tile, x: targetX, z: targetZ, rot: targetRot };
        // 吸附结果不能和第三片重叠
        if (tileOverlaps(candidate, others, tile.id)) continue;

        const score = d + dAng * 0.4;
        if (!best || score < best.score) {
          best = {
            tileId: tile.id,
            edgeIndex: ei,
            otherId: o.id,
            otherEdge: oj,
            targetX,
            targetZ,
            targetRot,
            score,
          };
        }
      }
    }
  }
  return best;
}

/** 吸附成功后建立/复用连接 key */
export const connKey = (tileId: number, edge: number): string => `${tileId}:${edge}`;

export function findConnection(
  conns: Connection[],
  tileId: number,
  edge: number,
): Connection | undefined {
  const k = connKey(tileId, edge);
  return conns.find((c) => c.a === k || c.b === k);
}

/** 移除与某片相关的全部连接,返回被断开的边 key 列表(用于黄色描边) */
export function removeConnectionsOf(conns: Connection[], tileId: number): { conns: Connection[]; broken: string[] } {
  const prefix = `${tileId}:`;
  const broken: string[] = [];
  const kept: Connection[] = [];
  for (const c of conns) {
    if (c.a.startsWith(prefix) || c.b.startsWith(prefix)) {
      broken.push(c.a, c.b);
    } else {
      kept.push(c);
    }
  }
  return { conns: kept, broken };
}

// ---------- 折叠运动学 ----------

export interface FoldTransform {
  /** 世界平移 */
  x: number;
  y: number;
  z: number;
  /** 世界旋转(3x3 行主序),交给渲染层转四元数 */
  m: number[];
}

/** 3x3 行主序旋转矩阵 */
export type Mat3 = number[];

export function rotY(a: number): Mat3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}
export function rotAxisAngle(x: number, y: number, z: number, a: number): Mat3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}
export function mul3(a: Mat3, b: Mat3): Mat3 {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      o[r * 3 + c] =
        a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
  }
  return o;
}
export function apply3(m: Mat3, p: { x: number; y: number; z: number }) {
  return {
    x: m[0] * p.x + m[1] * p.y + m[2] * p.z,
    y: m[3] * p.x + m[4] * p.y + m[5] * p.z,
    z: m[6] * p.x + m[7] * p.y + m[8] * p.z,
  };
}
export function inv3(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const idet = 1 / det;
  return [
    A * idet,
    (c * h - b * i) * idet,
    (b * f - c * e) * idet,
    B * idet,
    (a * i - c * g) * idet,
    (c * d - a * f) * idet,
    C * idet,
    (b * g - a * h) * idet,
    (a * e - b * d) * idet,
  ];
}
const add3v = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

/**
 * 沿连接图从根片(BFS)计算每片的 3D 变换。
 * 平铺时所有片在 y=0 的 XZ 平面;沿公共边按 conn.fold 向上折。
 * 未连接到根的片保持平铺在台面上。
 */
export function computeFoldTransforms(
  tiles: TileState[],
  conns: Connection[],
  rootId: number,
): Map<number, FoldTransform> {
  const result = new Map<number, FoldTransform>();
  const byId = new Map(tiles.map((t) => [t.id, t]));
  const root = byId.get(rootId);
  if (!root) return result;

  // 根片平铺
  result.set(rootId, { x: root.x, y: 0, z: root.z, m: rotY(-root.rot) });

  const queue: number[] = [rootId];
  const visited = new Set<number>([rootId]);

  while (queue.length) {
    const parentId = queue.shift()!;
    const parent = byId.get(parentId)!;
    const parentF = result.get(parentId)!;

    for (const conn of conns) {
      let childId: number;
      let parentEdgeIdx: number;
      let childEdgeIdx: number;
      const [aTile, aEdge] = conn.a.split(':').map(Number);
      const [bTile, bEdge] = conn.b.split(':').map(Number);
      if (aTile === parentId && !visited.has(bTile)) {
        childId = bTile;
        parentEdgeIdx = aEdge;
        childEdgeIdx = bEdge;
      } else if (bTile === parentId && !visited.has(aTile)) {
        childId = aTile;
        parentEdgeIdx = bEdge;
        childEdgeIdx = aEdge;
      } else {
        continue;
      }

      const child = byId.get(childId);
      if (!child) continue;

      // 父片本地铰链轴(父片本地 XZ 平面内的边方向)
      const parentLocalEdge = SHAPES[parent.kind].edges[parentEdgeIdx];
      const localAng = Math.atan2(
        sub(parentLocalEdge.b, parentLocalEdge.a).z,
        sub(parentLocalEdge.b, parentLocalEdge.a).x,
      );
      const axisX = Math.cos(localAng);
      const axisZ = Math.sin(localAng);

      // 折叠方向符号:让 child 向 +y 抬起。
      // 用平铺世界中铰链方向 × child 相对向量的 y 分量判断左右。
      const hingeFlat = worldEdge(parent, parentEdgeIdx);
      const hingeFlatMid = edgeMid(hingeFlat);
      const hingeDir = edgeDir(hingeFlat);
      const childCenter = worldPoint(child, v(0, 0));
      const toChild = sub(childCenter, hingeFlatMid);
      const crossY = hingeDir.x * toChild.z - hingeDir.z * toChild.x;
      const sign = crossY >= 0 ? -1 : 1;
      const foldAngle = sign * conn.fold;

      const hingeLocal = rotAxisAngle(axisX, 0, axisZ, foldAngle);
      const childM = mul3(parentF.m, mul3(hingeLocal, rotY(-child.rot)));

      // 铰链在父片当前(已折叠)世界姿态下的位置:父本地边中点 -> 父世界
      const parentLocalMid = scale(add(parentLocalEdge.a, parentLocalEdge.b), 0.5);
      const hingeWorld = add3v(
        { x: parentF.x, y: parentF.y, z: parentF.z },
        apply3(parentF.m, { x: parentLocalMid.x, y: 0, z: parentLocalMid.z }),
      );

      // 子中心相对铰链的向量:先在平铺世界取,换入父片平铺本地系,
      // 经铰链旋转后再换回父片当前世界系
      const childShape = SHAPES[child.kind];
      const childEdgeFlatMid = edgeMid({
        a: worldPoint(child, childShape.edges[childEdgeIdx].a),
        b: worldPoint(child, childShape.edges[childEdgeIdx].b),
      } as Edge2);
      const flatOffset = sub(childCenter, childEdgeFlatMid);
      const parentFlatM = rotY(-parent.rot);
      const offLocal = apply3(inv3(parentFlatM), {
        x: flatOffset.x,
        y: 0,
        z: flatOffset.z,
      });
      const foldedOff = apply3(hingeLocal, offLocal);
      const offWorld = apply3(parentF.m, foldedOff);

      const p = add3v(hingeWorld, offWorld);
      result.set(childId, { x: p.x, y: p.y, z: p.z, m: childM });
      visited.add(childId);
      queue.push(childId);
    }
  }

  // 未连通的片:平铺
  for (const t of tiles) {
    if (!result.has(t.id)) {
      result.set(t.id, { x: t.x, y: 0, z: t.z, m: rotY(-t.rot) });
    }
  }
  return result;
}

/** 把任意角度归一化到 [-π, π] */
export function wrapAngle(a: number): number {
  return angleDelta(a, 0);
}

/** 把角度吸附到 15° 网格(转动手柄用) */
export function quantizeAngle(a: number): number {
  return Math.round(a / ANGLE_SNAP) * ANGLE_SNAP;
}
