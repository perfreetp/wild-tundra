import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Vector3, Matrix, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { Mesh as MeshType } from "@babylonjs/core/Meshes/mesh";
import { createStudioMaterial } from "./studioMaterial";
import type { Corridor } from "../core/corridor";
import { TRACK } from "../core/types";
import { clamp } from "../core/math";

export interface TrackMeshes {
  root: Mesh;
  ballast: Mesh;
  sleepers: Mesh;
  rails: Mesh;
  centerline: Mesh;
  all: Mesh[];
}

/** 简单网格累加器：位置/法线/颜色/索引。 */
export class MeshBuf {
  pos: number[] = [];
  nrm: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, c: Color3) {
    this.pos.push(x, y, z);
    this.nrm.push(nx, ny, nz);
    this.col.push(c.r, c.g, c.b, 1);
    return this.pos.length / 3 - 1;
  }

  quad(a: number, b: number, c: number, d: number) {
    this.idx.push(a, b, c, a, c, d);
  }

  ribbon(
    left: { x: number; y: number; z: number }[],
    right: { x: number; y: number; z: number }[],
    nx: number,
    ny: number,
    nz: number,
    col: Color3,
    flip = false
  ) {
    const base = this.pos.length / 3;
    for (let i = 0; i < left.length; i++) {
      this.vertex(left[i].x, left[i].y, left[i].z, nx, ny, nz, col);
      this.vertex(right[i].x, right[i].y, right[i].z, nx, ny, nz, col);
    }
    for (let i = 0; i < left.length - 1; i++) {
      const a = base + i * 2;
      const b = base + i * 2 + 1;
      const c = base + (i + 1) * 2 + 1;
      const d = base + (i + 1) * 2;
      if (flip) this.idx.push(a, c, b, a, d, c);
      else this.quad(a, b, c, d);
    }
  }

  strip(
    prev: [number, number, number][],
    next: [number, number, number][],
    col: Color3,
    flip = false
  ) {
    const base = this.pos.length / 3;
    const n = prev.length;
    for (let i = 0; i < n; i++) {
      const a = prev[i];
      const b = next[i];
      // 该段四边形的法线由两条边叉积得出
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const ez = b[2] - a[2];
      let nx = -ez;
      let ny = 0;
      let nz = ex;
      const L = Math.hypot(nx, ny, nz) || 1;
      nx /= L;
      nz /= L;
      if (flip) {
        nx = -nx;
        nz = -nz;
      }
      this.vertex(a[0], a[1], a[2], nx, ny, nz, col);
    }
    for (let i = 0; i < n - 1; i++) {
      const p = base + i;
      if (flip) this.idx.push(p, p + 2, p + 1, p, p + 3, p + 2);
      else this.idx.push(p, p + 1, p + 2, p, p + 2, p + 3);
    }
  }

  apply(mesh: Mesh) {
    const vd = new VertexData();
    vd.positions = new Float32Array(this.pos);
    vd.normals = new Float32Array(this.nrm);
    vd.colors = new Float32Array(this.col);
    // Babylon 使用左手系顺时针为正面：统一翻转手工构建的三角形绕序
    const idx = this.idx;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    vd.indices = this.pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
    vd.applyToMesh(mesh, true);
    return mesh;
  }

  get empty() {
    return this.pos.length === 0;
  }
}

const RAIL_COLOR = new Color3(0.66, 0.69, 0.73);
const BALLAST_COLOR = new Color3(0.47, 0.45, 0.42);
const SLEEPER_COLOR = new Color3(0.40, 0.31, 0.23);
const CENTERLINE_COLOR = new Color3(0.99, 0.86, 0.45);

function sideNormal(ax: number, az: number, bx: number, bz: number, sign: number) {
  // 沿线路方向 → 横向
  const tx = bx - ax;
  const tz = bz - az;
  const L = Math.hypot(tx, tz) || 1;
  return { x: (-tz / L) * sign, z: (tx / L) * sign };
}

export function buildTrackMeshes(scene: Scene, corridor: Corridor, width: number): TrackMeshes {
  const root = new Mesh("trackRoot", scene);
  const ballast = new Mesh("ballast", scene);
  const sleepers = new Mesh("sleepers", scene);
  const rails = new Mesh("rails", scene);
  const centerline = new Mesh("centerline", scene);
  ballast.parent = root;
  sleepers.parent = root;
  rails.parent = root;
  centerline.parent = root;

  const stations = corridor.stations;
  const topHalf = width / 2;
  const bottomHalf = topHalf + TRACK.ballastHeight * TRACK.ballastSlope;

  // ---------- 道床 ----------
  const bb = new MeshBuf();
  if (stations.length >= 2) {
    const top: [number, number, number][][] = [];
    const topL: [number, number, number][] = [];
    const topR: [number, number, number][] = [];
    const botL: [number, number, number][] = [];
    const botR: [number, number, number][] = [];
    const lastIdx = stations.length - 1;

    // 顶面
    const baseTop = bb.pos.length / 3;
    for (const st of stations) {
      const y = st.yBallastTop;
      const l = { x: st.x + st.nx * topHalf, y, z: st.z + st.nz * topHalf };
      const r = { x: st.x - st.nx * topHalf, y, z: st.z - st.nz * topHalf };
      bb.vertex(l.x, y, l.z, 0, 1, 0, BALLAST_COLOR);
      bb.vertex(r.x, y, r.z, 0, 1, 0, BALLAST_COLOR);
    }
    for (let i = 0; i < stations.length - 1; i++) {
      const a = baseTop + i * 2;
      bb.quad(a, a + 2, a + 3, a + 1);
    }

    // 左右边坡
    for (const sign of [1, -1]) {
      const base = bb.pos.length / 3;
      for (const st of stations) {
        const ex = st.x + st.nx * topHalf * sign;
        const ez = st.z + st.nz * topHalf * sign;
        const bx = st.x + st.nx * bottomHalf * sign;
        const bz = st.z + st.nz * bottomHalf * sign;
        const n = sideNormal(0, 0, st.tx, st.tz, sign);
        bb.vertex(ex, st.yBallastTop, ez, n.x, 0.35, n.z, BALLAST_COLOR);
        bb.vertex(bx, st.formY, bz, n.x, 0.35, n.z, BALLAST_COLOR);
      }
      for (let i = 0; i < stations.length - 1; i++) {
        const a = base + i * 2;
        if (sign > 0) bb.quad(a, a + 1, a + 3, a + 2);
        else bb.quad(a, a + 2, a + 3, a + 1);
      }
    }

    // 两端封口
    for (const st of [stations[0], stations[lastIdx]]) {
      const n = sideNormal(0, 0, st.tx, st.tz, 1);
      const fx = n.z;
      const fz = -n.x;
      const sign = st === stations[0] ? -1 : 1;
      const verts: [number, number, number][] = [
        [st.x + st.nx * topHalf, st.yBallastTop, st.z + st.nz * topHalf],
        [st.x - st.nx * topHalf, st.yBallastTop, st.z - st.nz * topHalf],
        [st.x - st.nx * bottomHalf, st.formY, st.z - st.nz * bottomHalf],
        [st.x + st.nx * bottomHalf, st.formY, st.z + st.nz * bottomHalf],
      ];
      const b = bb.pos.length / 3;
      for (const v of verts) bb.vertex(v[0], v[1], v[2], fx * sign, 0, fz * sign, BALLAST_COLOR);
      bb.quad(b, b + 1, b + 2, b + 3);
      void top; void topL; void topR; void botL; void botR;
    }
  }
  bb.apply(ballast);
  ballast.material = createStudioMaterial(scene, "ballastMat", { rimPower: 0.02 });

  // ---------- 轨枕 ----------
  const sb = new MeshBuf();
  const sleeperSpacing = 0.7;
  const halfSleeper = TRACK.sleeperLength / 2;
  const slHeight = TRACK.sleeperHeight;
  const sleeperTopY = (st: { yBallastTop: number }) => st.yBallastTop + slHeight;
  {
    let acc = 0;
    for (let i = 1; i < stations.length; i++) {
      const a = stations[i - 1];
      const b = stations[i];
      const seg = b.s - a.s;
      acc += seg;
      if (acc < sleeperSpacing) continue;
      acc -= sleeperSpacing;
      const st = b;
      const y0 = st.yBallastTop + 0.01;
      const y1 = y0 + slHeight;
      const nx = st.nx * halfSleeper;
      const nz = st.nz * halfSleeper;
      const hx = st.tx * 0.13;
      const hz = st.tz * 0.13;
      const corners: [number, number, number][] = [
        [st.x + nx - hx, y1, st.z + nz - hz],
        [st.x - nx - hx, y1, st.z - nz - hz],
        [st.x - nx + hx, y1, st.z - nz + hz],
        [st.x + nx + hx, y1, st.z + nz + hz],
      ];
      const b0 = sb.pos.length / 3;
      for (const c of corners) sb.vertex(c[0], c[1], c[2], 0, 1, 0, SLEEPER_COLOR);
      sb.quad(b0, b0 + 1, b0 + 2, b0 + 3);
      // 侧面（简单的四点侧面四边形，让轨枕有体积感）
      for (let e = 0; e < 4; e++) {
        const p1 = corners[e];
        const p2 = corners[(e + 1) % 4];
        const b1 = sb.pos.length / 3;
        sb.vertex(p1[0], p1[1], p1[2], 0, 0.3, 0, SLEEPER_COLOR);
        sb.vertex(p2[0], p2[1], p2[2], 0, 0.3, 0, SLEEPER_COLOR);
        sb.vertex(p2[0], y0, p2[2], 0, 0.3, 0, SLEEPER_COLOR);
        sb.vertex(p1[0], y0, p1[2], 0, 0.3, 0, SLEEPER_COLOR);
        sb.quad(b1, b1 + 1, b1 + 2, b1 + 3);
      }
    }
  }
  sb.apply(sleepers);
  sleepers.material = createStudioMaterial(scene, "sleeperMat", { rimPower: 0.02 });

  // ---------- 钢轨 ----------
  const rb = new MeshBuf();
  {
    const halfGauge = TRACK.gauge / 2;
    const railHalfW = 0.038;
    const railTop = (st: { yBallastTop: number }) => st.yBallastTop + slHeight + TRACK.railHeight;
    for (const sideSign of [1, -1]) {
      const surf: { l: [number, number, number]; r: [number, number, number] }[] = [];
      for (const st of stations) {
        const cx = st.x + st.nx * halfGauge * sideSign;
        const cz = st.z + st.nz * halfGauge * sideSign;
        const y = railTop(st);
        surf.push({
          l: [cx + st.nx * railHalfW, y, cz + st.nz * railHalfW],
          r: [cx - st.nx * railHalfW, y, cz - st.nz * railHalfW],
        });
      }
      const base = rb.pos.length / 3;
      for (const p of surf) {
        rb.vertex(p.l[0], p.l[1], p.l[2], 0, 1, 0, RAIL_COLOR);
        rb.vertex(p.r[0], p.r[1], p.r[2], 0, 1, 0, RAIL_COLOR);
      }
      for (let i = 0; i < surf.length - 1; i++) {
        const a = base + i * 2;
        if (sideSign > 0) rb.quad(a, a + 2, a + 3, a + 1);
        else rb.quad(a + 1, a + 3, a + 2, a);
      }
      // 腹板（两条竖边）
      for (const edge of ["l", "r"] as const) {
        const b2 = rb.pos.length / 3;
        for (const st of stations) {
          const cx = st.x + st.nx * halfGauge * sideSign;
          const cz = st.z + st.nz * halfGauge * sideSign;
          const yy = edge === "l" ? 1 : -1;
          const ox = st.nx * railHalfW * yy;
          const oz = st.nz * railHalfW * yy;
          const yTop = railTop(st);
          const yBot = st.yBallastTop + slHeight;
          const nd = sideNormal(0, 0, st.tx, st.tz, yy * sideSign);
          rb.vertex(cx + ox, yTop, cz + oz, nd.x, 0, nd.z, RAIL_COLOR);
          rb.vertex(cx + ox, yBot, cz + oz, nd.x, 0, nd.z, RAIL_COLOR);
        }
        const n = stations.length;
        for (let i = 0; i < n - 1; i++) {
          const a = b2 + i * 2;
          const flip = (edge === "l") === (sideSign > 0);
          if (flip) rb.quad(a, a + 1, a + 3, a + 2);
          else rb.quad(a, a + 2, a + 3, a + 1);
        }
      }
    }
  }
  rb.apply(rails);
  rails.material = createStudioMaterial(scene, "railMat", { rimPower: 0.1 });

  // ---------- 中心线 ----------
  const cb = new MeshBuf();
  {
    const yOff = TRACK.railToFormation + 0.22;
    const halfW = 0.085;
    const left: [number, number, number][] = [];
    const right: [number, number, number][] = [];
    for (const st of stations) {
      const y = st.formY + yOff;
      left.push([st.x + st.nx * halfW, y, st.z + st.nz * halfW]);
      right.push([st.x - st.nx * halfW, y, st.z - st.nz * halfW]);
    }
    if (left.length > 1) {
      cb.ribbon(
        left.map((p) => ({ x: p[0], y: p[1], z: p[2] })),
        right.map((p) => ({ x: p[0], y: p[1], z: p[2] })),
        0, 1, 0, CENTERLINE_COLOR
      );
    }
  }
  cb.apply(centerline);
  centerline.material = createStudioMaterial(scene, "centerMat", { rimPower: 0.4 });

  return { root, ballast, sleepers, rails, centerline, all: [ballast, sleepers, rails, centerline] };
}

/** 用于拾取的简单不可见平面（拖动控制点时用）。 */
export function setMeshVisible(meshes: MeshType[], visible: boolean) {
  for (const m of meshes) m.setEnabled(visible);
}

export function makeTransform(pos: Vector3, yaw: number, scale: Vector3) {
  const q = Quaternion.RotationYawPitchRoll(yaw, 0, 0);
  return Matrix.Compose(scale, q, pos);
}

export function stationYaw(ax: number, az: number) {
  return Math.atan2(ax, az);
}

export { clamp };
