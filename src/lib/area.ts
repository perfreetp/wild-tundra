// 剖切后网格的投影面积计算:
// 1. 将楼层网格三角形用剖切平面裁剪(Sutherland–Hodgman 单平面裁剪)
// 2. 保留下来的多边形投影到剖切平面上
// 3. 累加投影后的二维面积
import { AbstractMesh, Plane, Vector3, VertexBuffer } from "@babylonjs/core";

/** 计算网格被平面裁剪后、保留侧(n·p + d < 0,与 Babylon clipPlane 一致)部分在剖切平面上的投影面积(平方米)。
 *  只统计法向与平面法向同向的三角形,得到剪影( footprint )面积,
 *  避免封闭网格正反面投影重叠导致的重复计数。 */
export function clippedProjectionArea(mesh: AbstractMesh, plane: Plane): number {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  if (!positions || !indices) return 0;

  mesh.computeWorldMatrix(true);
  const world = mesh.getWorldMatrix();
  const n = plane.normal;

  // 平面正交基 (u, v),用于投影
  const u = Math.abs(n.y) > 0.9
    ? new Vector3(1, 0, 0)
    : Vector3.Cross(Vector3.Up(), n).normalize();
  const v = Vector3.Cross(n, u).normalize();

  let area = 0;
  const tri: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

  for (let i = 0; i < indices.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const idx = indices[i + k] * 3;
      tri[k] = Vector3.TransformCoordinates(
        new Vector3(positions[idx], positions[idx + 1], positions[idx + 2]),
        world,
      );
    }
    // 只统计朝向平面法向一侧的面,得到不重复的投影(剪影)面积。
    // 注意:Babylon 为左手系,正面为顺时针绕序,cross(e1,e2) 指向网格内侧,
    // 因此外侧包络面对应 dot < 0。保留侧为 n·p+d < 0,取"背离法向"的包络面,
    // 即 outward·(-n) > 0 ↔ cross·n > 0(内侧法向与 n 反向)。
    const faceNormal = Vector3.Cross(
      tri[1].subtract(tri[0]),
      tri[2].subtract(tri[0]),
    );
    if (Vector3.Dot(faceNormal, n) <= 0) continue;
    const clipped = clipPolygonByPlane(tri, plane);
    area += projectedPolygonArea(clipped, u, v);
  }
  return area;
}

/** 单平面裁剪凸多边形(三角形),返回保留侧(n·p+d < 0)多边形顶点 */
function clipPolygonByPlane(poly: Vector3[], plane: Plane): Vector3[] {
  const out: Vector3[] = [];
  const n = plane.normal;
  const dist = (p: Vector3) => Vector3.Dot(n, p) + plane.d;

  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const dCur = dist(cur);
    const dPrev = dist(prev);
    const curIn = dCur <= 1e-9;
    const prevIn = dPrev <= 1e-9;

    if (curIn !== prevIn) {
      // 边与平面求交
      const t = dPrev / (dPrev - dCur);
      out.push(Vector3.Lerp(prev, cur, t));
    }
    if (curIn) out.push(cur);
  }
  return out;
}

/** 多边形投影到 (u, v) 基平面后的有向面积绝对值(扇形三角化) */
function projectedPolygonArea(poly: Vector3[], u: Vector3, v: Vector3): number {
  if (poly.length < 3) return 0;
  const pts = poly.map((p) => ({ x: Vector3.Dot(p, u), y: Vector3.Dot(p, v) }));
  let sum = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i].x - pts[0].x;
    const ay = pts[i].y - pts[0].y;
    const bx = pts[i + 1].x - pts[0].x;
    const by = pts[i + 1].y - pts[0].y;
    sum += ax * by - ay * bx;
  }
  return Math.abs(sum) / 2;
}
