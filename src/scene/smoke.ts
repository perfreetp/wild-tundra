import * as THREE from 'three';
import { ThermalField } from '../thermal/field';
import { FLOOR_BOUNDS, WALL_HEIGHT } from './building';

const COUNT = 900;

function makeSmokeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.4)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 体积感烟气层:按烟气浓度场分布的粒子云,
 * 缓慢上浮翻滚,配合指数雾形成遮挡。热成像模式下粒子减淡。
 */
export class SmokeLayer {
  readonly points: THREE.Points;
  private positions: Float32Array;
  private speeds: Float32Array;
  private material: THREE.PointsMaterial;
  private baseOpacity = 0.32;

  constructor(private field: ThermalField) {
    this.positions = new Float32Array(COUNT * 3);
    this.speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      this.respawn(i, true);
      this.speeds[i] = 0.05 + Math.random() * 0.12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      size: 2.6,
      map: makeSmokeTexture(),
      transparent: true,
      opacity: this.baseOpacity,
      depthWrite: false,
      color: 0x2e2c2a,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  /** 按浓度场拒绝采样,让粒子聚集在烟气浓的区域 */
  private respawn(i: number, randomY = false): void {
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = FLOOR_BOUNDS.minX + Math.random() * (FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX);
      const z = FLOOR_BOUNDS.minZ + Math.random() * (FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ);
      const y = randomY
        ? 0.6 + Math.random() * (WALL_HEIGHT - 0.7)
        : 0.6 + Math.random() * 0.6;
      const s = this.field.smokeAt(new THREE.Vector3(x, y, z));
      if (Math.random() < s * 0.9) {
        this.positions[i * 3] = x;
        this.positions[i * 3 + 1] = y;
        this.positions[i * 3 + 2] = z;
        return;
      }
    }
    // 兜底:放到某个火源上方
    const f = this.field.fires[i % Math.max(1, this.field.fires.length)];
    this.positions[i * 3] = f ? f.position.x + (Math.random() - 0.5) * 2 : 0;
    this.positions[i * 3 + 1] = 1 + Math.random() * 1.5;
    this.positions[i * 3 + 2] = f ? f.position.z + (Math.random() - 0.5) * 2 : 0;
  }

  update(dt: number, t: number): void {
    const p = this.positions;
    for (let i = 0; i < COUNT; i++) {
      p[i * 3 + 1] += this.speeds[i] * dt;
      p[i * 3] += Math.sin(t * 0.6 + i * 1.7) * 0.05 * dt;
      p[i * 3 + 2] += Math.cos(t * 0.5 + i * 2.3) * 0.05 * dt;
      if (p[i * 3 + 1] > WALL_HEIGHT - 0.15) this.respawn(i);
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  /** 热成像模式下烟气穿透性更好,减淡粒子 */
  setThermalMode(thermal: boolean): void {
    this.material.opacity = thermal ? this.baseOpacity * 0.35 : this.baseOpacity;
  }
}
