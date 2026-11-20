import * as THREE from 'three';
import { EYE_HEIGHT, FLOOR_BOUNDS } from '../scene/building';
import { clamp } from '../thermal/field';

/**
 * 第一人称漫游控制:点击画布锁定指针,WASD 移动,
 * Shift 加速,Q/E 或 Space/C 升降,Esc 释放指针。
 */
export class FPSControls {
  readonly object = new THREE.Object3D();
  enabled = true;

  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private dom: HTMLElement;
  private moveSpeed = 2.2;

  constructor(dom: HTMLElement, start: THREE.Vector3, yaw = 0) {
    this.dom = dom;
    this.object.position.copy(start);
    this.yaw = yaw;

    dom.addEventListener('click', () => {
      if (this.enabled && document.pointerLockElement !== dom) {
        dom.requestPointerLock();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || document.pointerLockElement !== this.dom) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = clamp(this.pitch - e.movementY * 0.0022, -1.45, 1.45);
    });
    document.addEventListener('keydown', (e) => this.keys.add(e.code));
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  get locked(): boolean {
    return document.pointerLockElement === this.dom;
  }

  /** 外部(自动漫游)接管时调用 */
  setPose(pos: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.object.position.copy(pos);
    const d = lookAt.clone().sub(pos);
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -1.45, 1.45);
  }

  update(dt: number): void {
    this.object.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    if (!this.enabled || !this.locked) return;

    const speed = this.moveSpeed * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 2.4 : 1);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const move = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) move.add(forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) move.sub(forward);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.add(right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);

    let dy = 0;
    if (this.keys.has('Space') || this.keys.has('KeyE')) dy += speed * dt * 0.7;
    if (this.keys.has('KeyC') || this.keys.has('KeyQ')) dy -= speed * dt * 0.7;

    const p = this.object.position.clone().add(move);
    p.x = clamp(p.x, FLOOR_BOUNDS.minX + 0.35, FLOOR_BOUNDS.maxX - 0.35);
    p.z = clamp(p.z, FLOOR_BOUNDS.minZ + 0.35, FLOOR_BOUNDS.maxZ - 0.35);
    p.y = clamp(this.object.position.y + dy, 0.5, 2.6);
    if (Math.abs(dy) < 1e-6) {
      // 缓慢回到站立眼高
      p.y += (EYE_HEIGHT - p.y) * Math.min(1, dt * 2);
    }
    this.object.position.copy(p);
  }
}
