import { PerspectiveCamera } from 'three';
import { degToRad } from '../core/math';

export const CAMERA_FOV = 58;
export const CAMERA_NEAR = 0.5;
export const CAMERA_FAR = 26000;

/**
 * 视景相机：位于驾驶室眼位，绕原点做俯仰 / 偏航。
 * 俯仰 + 抬头（向上），偏航 + 向右。
 */
export class ViewCamera {
  readonly camera: PerspectiveCamera;
  #pitch = 0;
  #yaw = 0;

  constructor() {
    this.camera = new PerspectiveCamera(CAMERA_FOV, 16 / 9, CAMERA_NEAR, CAMERA_FAR);
    this.camera.position.set(0, 2.6, 0);
    this.camera.rotation.order = 'YXZ';
  }

  get pitch(): number {
    return this.#pitch;
  }

  get yaw(): number {
    return this.#yaw;
  }

  setAngles(pitchDeg: number, yawDeg: number): void {
    this.#pitch = pitchDeg;
    this.#yaw = yawDeg;
    this.camera.rotation.set(degToRad(pitchDeg), degToRad(yawDeg), 0, 'YXZ');
    this.camera.updateMatrixWorld();
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    this.camera.updateMatrixWorld();
  }
}
