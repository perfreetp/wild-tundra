import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';
import type { InstrumentState, JointAngles } from './types';

/** 运动学限位 */
export const LIMITS = {
  yaw: { min: -0.85, max: 0.85 },
  pitch: { min: 0.12, max: 1.15 },
  depth: { min: 8, max: 26 },
  jaw: { min: 0, max: 0.62 }
};

const HANDLE_LEN = 7; // 戳卡点外侧手柄长度
const SHAFT_RADIUS = 0.28;
const JAW_LEN = 1.7;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 由关节角求杆轴方向(戳卡点 -> 钳尖)。
 * dir = Ry(yaw) · Rx(pitch) · (0,-1,0)
 */
export function dirFromAngles(yaw: number, pitch: number): Vector3 {
  const sp = Math.sin(pitch);
  return new Vector3(-sp * Math.sin(yaw), -Math.cos(pitch), -sp * Math.cos(yaw));
}

/** dirFromAngles 的逆解 */
function anglesFromDir(dir: Vector3): { yaw: number; pitch: number } {
  const pitch = Math.acos(clamp(-dir.y, -1, 1));
  const yaw = Math.atan2(-dir.x, -dir.z);
  return { yaw, pitch };
}

/**
 * 虚拟抓钳:手柄移动经杠杆约束(戳卡点为支点)映射为钳尖反向旋转。
 * 关节链:戳卡偏航 -> 戳卡俯仰 -> 插入(移动副) -> 杆自转 -> 钳口(双侧)。
 */
export class Instrument {
  readonly name: string;
  readonly trocar: Vector3;

  /** 当前运动学状态 */
  state: InstrumentState;
  /** 手柄目标相对初始手柄点的偏移(世界 X/Y 平面) */
  private handleOffset = new Vector3(0, 0, 0);

  // 关节链节点
  private root: TransformNode;
  private yawNode: TransformNode;
  private pitchNode: TransformNode;
  private rollNode: TransformNode;
  private tipNode: TransformNode;
  private shaft: Mesh;
  private handle: Mesh;
  private jawL: Mesh;
  private jawR: Mesh;
  private tipMarker: Mesh;

  private prevTip: Vector3;
  readonly tipVelocity = Vector3.Zero();

  constructor(scene: Scene, name: string, trocar: Vector3, color: Color3) {
    this.name = name;
    this.trocar = trocar.clone();
    this.state = { yaw: 0, pitch: 0.55, depth: 16, roll: 0, jaw: 0.4 };

    const mat = new StandardMaterial(name + 'Mat', scene);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(0.5, 0.5, 0.5);
    const jawMat = new StandardMaterial(name + 'JawMat', scene);
    jawMat.diffuseColor = new Color3(0.82, 0.82, 0.86);
    jawMat.specularColor = new Color3(0.6, 0.6, 0.6);

    this.root = new TransformNode(name + '_root', scene);
    this.root.position = this.trocar;

    this.yawNode = new TransformNode(name + '_yaw', scene);
    this.yawNode.parent = this.root;
    this.pitchNode = new TransformNode(name + '_pitch', scene);
    this.pitchNode.parent = this.yawNode;

    // 杆:单位圆柱,按深度缩放
    this.shaft = MeshBuilder.CreateCylinder(name + '_shaft', { diameter: SHAFT_RADIUS * 2, height: 1, tessellation: 16 }, scene);
    this.shaft.parent = this.pitchNode;
    this.shaft.material = mat;

    // 手柄(支点外侧)
    this.handle = MeshBuilder.CreateBox(name + '_handle', { width: 1.1, height: 3.2, depth: 1.6 }, scene);
    this.handle.parent = this.pitchNode;
    this.handle.position = new Vector3(0, HANDLE_LEN, 0);
    this.handle.material = mat;

    // 钳尖关节链:插入点 -> 自转 -> 双钳口
    this.tipNode = new TransformNode(name + '_tip', scene);
    this.tipNode.parent = this.pitchNode;
    this.rollNode = new TransformNode(name + '_roll', scene);
    this.rollNode.parent = this.tipNode;

    const jawGeo = { width: 0.34, height: JAW_LEN, depth: 0.62 };
    this.jawL = MeshBuilder.CreateBox(name + '_jawL', jawGeo, scene);
    this.jawR = MeshBuilder.CreateBox(name + '_jawR', jawGeo, scene);
    for (const j of [this.jawL, this.jawR]) {
      j.parent = this.rollNode;
      j.material = jawMat;
      // 钳口绕自身根部(钳尖点)张开:几何中心前移半长
      j.setPivotPoint(new Vector3(0, JAW_LEN / 2, 0));
      j.position = new Vector3(0, -JAW_LEN / 2, 0);
    }

    this.tipMarker = MeshBuilder.CreateSphere(name + '_tipMark', { diameter: 0.5, segments: 8 }, scene);
    this.tipMarker.parent = this.rollNode;
    const tipMat = new StandardMaterial(name + 'TipMat', scene);
    tipMat.emissiveColor = color.scale(0.9);
    this.tipMarker.material = tipMat;

    this.applyState();
    this.prevTip = this.getTipPosition();
  }

  /**
   * 手柄移动输入(世界系水平面 X/Z 增量)。
   * 杠杆约束:手柄目标点决定杆轴方向 dir = normalize(trocar - handlePos),
   * 钳尖位于支点另一侧 —— 手柄前移则钳尖后移,天然形成反向旋转映射。
   */
  moveHandle(dx: number, dz: number): void {
    this.handleOffset.x = clamp(this.handleOffset.x + dx, -6, 6);
    this.handleOffset.z = clamp(this.handleOffset.z + dz, -6, 6);
    const handlePos = this.trocar.add(new Vector3(this.handleOffset.x, HANDLE_LEN, this.handleOffset.z));
    const dir = this.trocar.subtract(handlePos).normalize();
    const { yaw, pitch } = anglesFromDir(dir);
    this.state.yaw = clamp(yaw, LIMITS.yaw.min, LIMITS.yaw.max);
    this.state.pitch = clamp(pitch, LIMITS.pitch.min, LIMITS.pitch.max);
  }

  adjustDepth(dd: number): void {
    this.state.depth = clamp(this.state.depth + dd, LIMITS.depth.min, LIMITS.depth.max);
  }

  adjustRoll(dr: number): void {
    this.state.roll = (this.state.roll + dr) % (Math.PI * 2);
  }

  adjustJaw(dj: number): void {
    this.state.jaw = clamp(this.state.jaw + dj, LIMITS.jaw.min, LIMITS.jaw.max);
  }

  /** 限制插入深度(器官碰撞:限制穿透) */
  clampDepth(maxDepth: number): void {
    this.state.depth = Math.min(this.state.depth, maxDepth);
  }

  /** 关节链逐级解算:依次写入各关节节点 */
  applyState(): void {
    const s = this.state;
    this.yawNode.rotation.y = s.yaw;          // 第 1 级:戳卡偏航
    this.pitchNode.rotation.x = s.pitch;      // 第 2 级:戳卡俯仰
    // 第 3 级:插入移动副 —— 杆缩放 + 钳尖节点定位
    this.shaft.scaling.y = s.depth;
    this.shaft.position.y = -s.depth / 2;
    this.tipNode.position.y = -s.depth;
    this.rollNode.rotation.y = s.roll;        // 第 4 级:杆自转
    // 第 5 级:钳口双侧对称开合
    this.jawL.rotation.z = s.jaw;
    this.jawR.rotation.z = -s.jaw;
  }

  /** 回放/外部直接设置状态 */
  setState(s: InstrumentState): void {
    this.state = { ...s };
    // 反推手柄偏移,保持输入连续性
    const dir = dirFromAngles(s.yaw, s.pitch);
    const handlePos = this.trocar.subtract(dir.scale(HANDLE_LEN));
    const base = this.trocar.add(new Vector3(0, HANDLE_LEN, 0));
    const off = handlePos.subtract(base);
    this.handleOffset = new Vector3(off.x, 0, off.z);
    this.applyState();
  }

  getTipPosition(): Vector3 {
    const s = this.state;
    return this.trocar.add(dirFromAngles(s.yaw, s.pitch).scale(s.depth));
  }

  getShaftDir(): Vector3 {
    return dirFromAngles(this.state.yaw, this.state.pitch);
  }

  /** 每帧调用:更新钳尖速度估计 */
  update(dt: number): void {
    this.applyState();
    const tip = this.getTipPosition();
    if (dt > 0) {
      tip.subtractToRef(this.prevTip, this.tipVelocity);
      this.tipVelocity.scaleInPlace(1 / dt);
    }
    this.prevTip.copyFrom(tip);
  }

  /** 关节角读数(度 / mm) */
  getJointAngles(unitToMm: number): JointAngles {
    const d = 180 / Math.PI;
    return {
      trocarYaw: this.state.yaw * d,
      trocarPitch: this.state.pitch * d,
      insertion: this.state.depth * unitToMm,
      roll: this.state.roll * d,
      jaw: this.state.jaw * d
    };
  }
}
