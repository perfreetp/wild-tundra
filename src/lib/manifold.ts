// manifold-3d WASM 初始化与网格构建工具
import Module from 'manifold-3d';
import type { Manifold, ManifoldToplevel, Mesh } from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
}

let wasm: ManifoldToplevel | null = null;

export async function initManifold(): Promise<void> {
  if (wasm) return;
  const mod = (await Module({ locateFile: () => wasmUrl })) as ManifoldToplevel;
  mod.setup();
  wasm = mod;
}

function ensure(): ManifoldToplevel {
  if (!wasm) throw new Error('manifold-3d 尚未初始化');
  return wasm;
}

/** 释放一组 manifold 对象的 WASM 内存 */
function dispose(...objs: Array<{ delete(): void } | null | undefined>): void {
  for (const o of objs) {
    try {
      o?.delete();
    } catch {
      /* 忽略重复释放 */
    }
  }
}

/**
 * 统一为逆时针(正环绕)。manifold 默认 Positive 填充规则,
 * 顺时针轮廓会被当作空洞而得到空实体。
 */
export function ensureCCW(profile: [number, number][]): [number, number][] {
  let area = 0;
  for (let i = 0; i < profile.length; i++) {
    const [x1, y1] = profile[i];
    const [x2, y2] = profile[(i + 1) % profile.length];
    area += x1 * y2 - x2 * y1;
  }
  return area >= 0 ? profile : [...profile].reverse();
}

/**
 * 计算一步开挖后的剩余岩体。
 *
 * 模型:断面轮廓在 XY 平面,隧道轴线为 Z 轴,初始岩体 = 轮廓沿 Z 拉伸 totalLength。
 * 第 i 步的剖切平面过轴上点 (0,0,i*stepLength),法向相对轴线倾斜 tiltAngle,
 * 倾斜方向绕 Z 轴旋转 cutAngle(0~360°)。
 * 剩余岩体 = 完整岩体 \ 剖切平面已开挖侧的半空间(用大盒体近似)。
 *
 * @returns 剩余体积(m³)与网格;调用方负责 delete() 返回的 Manifold
 */
export function cutStep(
  profile: [number, number][],
  totalLength: number,
  stepIndex: number,
  stepLength: number,
  cutAngleDeg: number,
  tiltAngleDeg: number,
): { solid: Manifold; volume: number } {
  const { Manifold } = ensure();
  const ccw = ensureCCW(profile);

  const prism = Manifold.extrude(ccw, totalLength);
  if (stepIndex <= 0) {
    const volume = prism.volume();
    return { solid: prism, volume };
  }

  // 包围尺寸:轮廓外接 + 总长,取足够大的盒体模拟半空间
  let maxR = 1;
  for (const [x, y] of profile) maxR = Math.max(maxR, Math.abs(x), Math.abs(y));
  const S = (maxR * 2 + totalLength) * 4;

  // 盒体:z ∈ [-S, 0],顶面即剖切平面;先绕 Y 倾斜,再绕 Z 旋转,最后平移到切点
  const cutter = Manifold.cube([S, S, S])
    .translate([-S / 2, -S / 2, -S])
    .rotate([0, tiltAngleDeg, 0])
    .rotate([0, 0, cutAngleDeg])
    .translate([0, 0, stepIndex * stepLength]);

  const remaining = Manifold.difference(prism, cutter);
  const volume = remaining.volume();
  dispose(prism, cutter);
  return { solid: remaining, volume };
}

/** 已开挖部分(完整岩体与切刀的交集),用于半透明幽灵显示 */
export function excavatedPart(
  profile: [number, number][],
  totalLength: number,
  stepIndex: number,
  stepLength: number,
  cutAngleDeg: number,
  tiltAngleDeg: number,
): MeshData | null {
  if (stepIndex <= 0) return null;
  const { Manifold } = ensure();
  const ccw = ensureCCW(profile);
  let maxR = 1;
  for (const [x, y] of ccw) maxR = Math.max(maxR, Math.abs(x), Math.abs(y));
  const S = (maxR * 2 + totalLength) * 4;

  const prism = Manifold.extrude(ccw, totalLength);
  const cutter = Manifold.cube([S, S, S])
    .translate([-S / 2, -S / 2, -S])
    .rotate([0, tiltAngleDeg, 0])
    .rotate([0, 0, cutAngleDeg])
    .translate([0, 0, stepIndex * stepLength]);
  const part = Manifold.intersection(prism, cutter);
  const mesh = part.getMesh();
  const data = meshToData(mesh);
  dispose(prism, cutter, part);
  return data;
}

/** Manifold Mesh → 普通 typed array(之后可安全 delete manifold 对象) */
export function meshToData(mesh: Mesh): MeshData {
  const numProp = mesh.numProp;
  const vertProps = mesh.vertProperties;
  const triVerts = mesh.triVerts;
  const numVert = mesh.numVert;
  const positions = new Float32Array(numVert * 3);
  for (let v = 0; v < numVert; v++) {
    positions[v * 3] = vertProps[v * numProp];
    positions[v * 3 + 1] = vertProps[v * numProp + 1];
    positions[v * 3 + 2] = vertProps[v * numProp + 2];
  }
  return { positions, indices: new Uint32Array(triVerts) };
}

/** 提取 Manifold 网格数据并释放对象 */
export function solidToData(solid: Manifold): MeshData {
  const mesh = solid.getMesh();
  const data = meshToData(mesh);
  solid.delete();
  return data;
}
