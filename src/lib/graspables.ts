import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3
} from '@babylonjs/core';
import { organContact, surfacePointAt, type Organ } from './world';

const GRAVITY = -22; // 场景单位 / s²
const REST_GROUND = 0;

export type GraspableKind = 'ball' | 'ring';

/**
 * 可抓取物体:钳尖靠近且钳口闭合到阈值时吸附,跟随钳尖运动;
 * 钳口张开时按当前钳尖速度抛出,之后走简易弹道 + 器官/地面碰撞。
 */
export class Graspable {
  readonly kind: GraspableKind;
  readonly label: string;
  readonly mesh: Mesh;
  readonly radius: number;
  velocity = Vector3.Zero();
  heldBy: number | null = null; // 器械索引
  /** 穿环任务:环是否已套在立柱上 */
  threaded = false;

  private home: Vector3;
  private organ: Organ;

  constructor(scene: Scene, organ: Organ, kind: GraspableKind, label: string, home: Vector3, color: Color3) {
    this.kind = kind;
    this.label = label;
    this.organ = organ;
    this.home = home.clone();

    if (kind === 'ball') {
      this.radius = 0.8;
      this.mesh = MeshBuilder.CreateSphere(label, { diameter: this.radius * 2, segments: 20 }, scene);
    } else {
      this.radius = 1.6;
      this.mesh = MeshBuilder.CreateTorus(label, { diameter: this.radius * 2, thickness: 0.4, tessellation: 40 }, scene);
    }
    const mat = new StandardMaterial(label + 'Mat', scene);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(0.3, 0.3, 0.3);
    this.mesh.material = mat;
    this.mesh.position = home.clone();
  }

  get position(): Vector3 {
    return this.mesh.position;
  }

  reset(): void {
    this.heldBy = null;
    this.threaded = false;
    this.velocity.setAll(0);
    this.mesh.position.copyFrom(this.home);
    this.mesh.rotation.setAll(0);
  }

  /** 吸附到钳尖 */
  attach(instrumentIndex: number): void {
    this.heldBy = instrumentIndex;
    this.velocity.setAll(0);
  }

  /** 松开:按钳尖当前速度抛出 */
  release(throwVelocity: Vector3): void {
    this.heldBy = null;
    this.velocity.copyFrom(throwVelocity);
  }

  /** 跟随钳尖(钳口中心略低于钳尖点) */
  followTip(tip: Vector3, shaftDir: Vector3): void {
    this.mesh.position.copyFrom(tip.add(shaftDir.scale(this.radius * 0.7)));
  }

  /** 自由状态物理 */
  update(dt: number): void {
    if (this.heldBy !== null || this.threaded) return;
    const p = this.mesh.position;
    this.velocity.y += GRAVITY * dt;
    p.x += this.velocity.x * dt;
    p.y += this.velocity.y * dt;
    p.z += this.velocity.z * dt;

    // 地面
    if (p.y < REST_GROUND + this.radius) {
      p.y = REST_GROUND + this.radius;
      if (this.velocity.y < 0) this.velocity.y = -this.velocity.y * 0.35;
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
    }

    // 器官表面:推出并衰减法向速度
    const hit = organContact(this.organ, p);
    if (hit.s < 1) {
      const q = p.subtract(this.organ.center);
      const n = new Vector3(
        q.x / (this.organ.radii.x * this.organ.radii.x),
        q.y / (this.organ.radii.y * this.organ.radii.y),
        q.z / (this.organ.radii.z * this.organ.radii.z)
      ).normalize();
      p.addInPlace(n.scale(hit.penetration + this.radius * 0.2));
      const vn = Vector3.Dot(this.velocity, n);
      if (vn < 0) this.velocity.subtractInPlace(n.scale(vn * 1.3));
      this.velocity.scaleInPlace(0.985); // 滚动摩擦
    }
  }
}

export function createGraspables(scene: Scene, organ: Organ): Graspable[] {
  const items: Graspable[] = [
    new Graspable(scene, organ, 'ball', 'ball_A', surfacePointAt(-1.5, 2.5).add(new Vector3(0, 0.8, 0)), new Color3(0.95, 0.85, 0.3)),
    new Graspable(scene, organ, 'ball', 'ball_B', surfacePointAt(1.5, -0.5).add(new Vector3(0, 0.8, 0)), new Color3(0.4, 0.85, 0.5)),
    new Graspable(scene, organ, 'ball', 'ball_C', surfacePointAt(-3, -1.5).add(new Vector3(0, 0.8, 0)), new Color3(0.5, 0.6, 0.95)),
    new Graspable(scene, organ, 'ring', 'ring', surfacePointAt(2.5, -4.5).add(new Vector3(0, 0.5, 0)), new Color3(0.9, 0.5, 0.85))
  ];
  return items;
}
