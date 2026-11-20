import * as THREE from 'three';
import type { FireSource } from '../thermal/field';

/** 单个火源的可视化:双层锥形火焰 + 闪烁点光源 + 地面灼烧痕迹 */
export class FireVisual {
  readonly group = new THREE.Group();
  private outer: THREE.Mesh;
  private inner: THREE.Mesh;
  private light: THREE.PointLight;
  private seed: number;
  private baseIntensity: number;

  constructor(fire: FireSource, seed: number) {
    this.seed = seed;
    this.baseIntensity = fire.intensity;
    const s = fire.radius;

    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xff5a1a, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffd23c, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });

    this.outer = new THREE.Mesh(new THREE.ConeGeometry(s * 0.85, s * 2.6, 10, 1, true), outerMat);
    this.outer.position.y = s * 1.3;
    this.inner = new THREE.Mesh(new THREE.ConeGeometry(s * 0.45, s * 1.7, 8, 1, true), innerMat);
    this.inner.position.y = s * 0.85;
    this.group.add(this.outer, this.inner);

    // 地面灼烧圈
    const scorch = new THREE.Mesh(
      new THREE.CircleGeometry(s * 1.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x0c0a08, transparent: true, opacity: 0.85 })
    );
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.y = 0.012;
    this.group.add(scorch);

    this.light = new THREE.PointLight(0xff6a22, fire.intensity * 0.06, 16, 1.8);
    this.light.position.y = s * 1.2;
    this.group.add(this.light);

    this.group.position.copy(fire.position);
  }

  update(t: number): void {
    const f1 = Math.sin(t * 11 + this.seed * 13.7) * 0.5 + Math.sin(t * 23 + this.seed * 7.1) * 0.3;
    const f2 = Math.sin(t * 17 + this.seed * 3.3) * 0.5 + Math.sin(t * 29 + this.seed) * 0.3;
    this.outer.scale.set(1 + f1 * 0.12, 1 + f1 * 0.22, 1 + f2 * 0.12);
    this.inner.scale.set(1 + f2 * 0.15, 1 + f2 * 0.28, 1 + f1 * 0.15);
    this.outer.rotation.y = t * 1.7 + this.seed;
    this.inner.rotation.y = -t * 2.3 + this.seed;
    this.light.intensity = this.baseIntensity * 0.06 * (1 + f1 * 0.35);
  }
}
