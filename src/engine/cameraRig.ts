import * as THREE from 'three';
import type { CameraPose, ViewId } from './types';

/**
 * 相机自动机位（Camera Rig）：
 * 加载线路后沿轨道中心线在同一里程处生成三个视点 ——
 *   front     ：车头中轴前向
 *   leftFront ：向左偏转 18° 的左前视点
 *   rightFront：向右偏转 18° 的右前视点
 */
export class CameraRig {
  /** 车头相机相对轨面的抬升高度（米） */
  readonly eyeHeight = 2.8;
  /** 左/右前视点相对中轴线的横向偏移（米） */
  readonly lateralOffset = 1.05;
  /** 左前/右前视点的偏航角（弧度） */
  readonly yaw = THREE.MathUtils.degToRad(18);
  /** 观察目标点沿切线向前的距离（米） */
  readonly lookAhead = 120;

  private _up = new THREE.Vector3(0, 1, 0);

  constructor(public readonly centerline: THREE.CatmullRomCurve3) {}

  get length(): number {
    return this.centerline.getLength();
  }

  /** 里程（0..length）→ 该位置的三个视点机位 */
  getPosesAt(distance: number): Record<ViewId, CameraPose> {
    const s = THREE.MathUtils.clamp(distance, 0, this.length);
    const u = s / this.length;
    const point = this.centerline.getPointAt(u);
    const tangent = this.centerline.getTangentAt(u).normalize();

    // right = tangent × up，得到轨道局部坐标系的右方向
    const right = new THREE.Vector3().crossVectors(tangent, this._up).normalize();
    const base = point.clone().addScaledVector(this._up, this.eyeHeight);

    return {
      front: this.buildPose(base, tangent, right, 0),
      leftFront: this.buildPose(base, tangent, right, -1),
      rightFront: this.buildPose(base, tangent, right, 1),
    };
  }

  private buildPose(
    base: THREE.Vector3,
    tangent: THREE.Vector3,
    right: THREE.Vector3,
    side: -1 | 0 | 1,
  ): CameraPose {
    const position = base.clone();
    if (side !== 0) {
      // 左前/右前：先横向偏移，再绕 up 轴偏转朝向
      position.addScaledVector(right, side * this.lateralOffset);
    }

    let dir = tangent.clone();
    if (side !== 0) {
      // side=-1（左）→ +yaw；side=1（右）→ -yaw
      dir.applyAxisAngle(this._up, side === -1 ? this.yaw : -this.yaw);
    }
    const lookAt = position.clone().addScaledVector(dir, this.lookAhead);

    return {
      position: [position.x, position.y, position.z],
      lookAt: [lookAt.x, lookAt.y, lookAt.z],
      up: [this._up.x, this._up.y, this._up.z],
    };
  }
}
