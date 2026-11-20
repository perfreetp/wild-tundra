import * as THREE from 'three';

export const FLOOR_BOUNDS = { minX: -10, maxX: 10, minZ: -6, maxZ: 6 };
export const WALL_HEIGHT = 3;
export const EYE_HEIGHT = 1.6;

const WALL_T = 0.2;

interface WallRun {
  x1: number; z1: number; x2: number; z2: number;
  /** 门洞:沿墙走向的起点/终点坐标(水平轴上的值) */
  door?: { from: number; to: number };
}

/** 楼层平面:三室布局,两道纵墙一道横墙,各带门洞 */
const WALLS: WallRun[] = [
  // 外墙
  { x1: -10, z1: -6, x2: 10, z2: -6 },
  { x1: -10, z1: 6, x2: 10, z2: 6 },
  { x1: -10, z1: -6, x2: -10, z2: 6 },
  { x1: 10, z1: -6, x2: 10, z2: 6 },
  // 纵墙 x=-3,门洞 z∈[0.5, 1.7]
  { x1: -3, z1: -6, x2: -3, z2: 6, door: { from: 0.5, to: 1.7 } },
  // 纵墙 x=3.5(只到 z=2),门洞 z∈[-2.5, -1.3]
  { x1: 3.5, z1: -6, x2: 3.5, z2: 2, door: { from: -2.5, to: -1.3 } },
  // 横墙 z=-1(x∈[3.5,10]),门洞 x∈[6, 7.2]
  { x1: 3.5, z1: -1, x2: 10, z2: -1, door: { from: 6, to: 7.2 } }
];

const FURNITURE: Array<{ x: number; z: number; w: number; h: number; d: number; color: number }> = [
  { x: -7.5, z: 2.5, w: 2.0, h: 0.55, d: 0.9, color: 0x6b4f35 },  // 沙发
  { x: -6, z: -4.8, w: 1.6, h: 0.75, d: 0.8, color: 0x7a6248 },   // 桌
  { x: -8.8, z: -0.5, w: 0.6, h: 1.8, d: 1.2, color: 0x54503f },  // 柜
  { x: 0, z: 3.2, w: 1.8, h: 0.5, d: 0.9, color: 0x6b4f35 },
  { x: 1.5, z: -4.5, w: 1.2, h: 1.9, d: 0.6, color: 0x54503f },
  { x: 6.5, z: 3.5, w: 2.2, h: 0.6, d: 1.0, color: 0x71563a },    // 床
  { x: 8.8, z: 1.5, w: 0.7, h: 1.7, d: 0.7, color: 0x54503f },
  { x: 6.5, z: -4.3, w: 1.4, h: 0.8, d: 0.7, color: 0x7a6248 }
];

function wallMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.95, metalness: 0 });
}

function addBox(
  group: THREE.Group, mat: THREE.Material,
  cx: number, cy: number, cz: number, sx: number, sy: number, sz: number
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(cx, cy, cz);
  group.add(mesh);
  return mesh;
}

/** 一段墙(可带门洞),沿 x 或 z 轴 */
function buildWall(group: THREE.Group, run: WallRun): void {
  const mat = wallMaterial();
  const horizontal = Math.abs(run.x2 - run.x1) > Math.abs(run.z2 - run.z1);
  const len = horizontal ? run.x2 - run.x1 : run.z2 - run.z1;
  const cx = (run.x1 + run.x2) / 2;
  const cz = (run.z1 + run.z2) / 2;

  const seg = (from: number, to: number, y0: number, y1: number) => {
    const mid = (from + to) / 2;
    const l = Math.abs(to - from);
    if (l < 1e-4 || y1 - y0 < 1e-4) return;
    if (horizontal) {
      addBox(group, mat, mid, (y0 + y1) / 2, cz, l, y1 - y0, WALL_T);
    } else {
      addBox(group, mat, cx, (y0 + y1) / 2, mid, WALL_T, y1 - y0, l);
    }
  };

  const start = horizontal ? run.x1 : run.z1;
  if (!run.door) {
    seg(start, start + Math.abs(len), 0, WALL_HEIGHT);
    return;
  }
  // 门洞两侧墙段 + 门楣
  seg(start, run.door.from, 0, WALL_HEIGHT);
  seg(run.door.to, start + Math.abs(len), 0, WALL_HEIGHT);
  seg(run.door.from, run.door.to, 2.1, WALL_HEIGHT);
}

export interface Building {
  group: THREE.Group;
  /** 供漫游边界钳制用 */
  bounds: typeof FLOOR_BOUNDS;
}

export function buildBuilding(): Building {
  const group = new THREE.Group();

  // 地板
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.9 });
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX + 0.4, 0.1, FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ + 0.4),
    floorMat
  );
  floor.position.set(0, -0.05, 0);
  group.add(floor);

  // 顶棚
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x77726a, roughness: 0.95 });
  const ceil = new THREE.Mesh(
    new THREE.BoxGeometry(FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX + 0.4, 0.1, FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ + 0.4),
    ceilMat
  );
  ceil.position.set(0, WALL_HEIGHT + 0.05, 0);
  group.add(ceil);

  for (const run of WALLS) buildWall(group, run);

  // 家具
  for (const f of FURNITURE) {
    const mat = new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.85 });
    addBox(group, mat, f.x, f.h / 2, f.z, f.w, f.h, f.d);
  }

  return { group, bounds: FLOOR_BOUNDS };
}
