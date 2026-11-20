import * as THREE from 'three';
import type { PointRecord } from './types';

/**
 * 蓝 → 青 → 绿 → 黄 → 红 五段色阶（jet 风格），t∈[0,1]
 */
export function intensityColor(t: number, out: THREE.Color): THREE.Color {
  const x = THREE.MathUtils.clamp(t, 0, 1) * 4;
  const r = Math.min(1, Math.max(0, x - 1.5));
  const g = Math.min(1, Math.max(0, 1.5 - Math.abs(x - 2)));
  const b = Math.min(1, Math.max(0, 1.5 - Math.abs(x - 3)));
  out.setRGB(r, g, b);
  return out;
}

/**
 * 点云渲染：
 *  - 主层按 intensity 着蓝→红渐变色
 *  - 强回波（法线近垂直且强度高）叠加白色加亮层
 * BufferGeometry 按需重建，单帧最多数十万点。
 */
export class PointCloudRenderer {
  readonly group = new THREE.Group();
  private mainPoints: THREE.Points | null = null;
  private highlightPoints: THREE.Points | null = null;
  private pointSize: number;

  constructor(pointSize = 0.12) {
    this.pointSize = pointSize;
  }

  setPointSize(size: number): void {
    this.pointSize = size;
    if (this.mainPoints) (this.mainPoints.material as THREE.PointsMaterial).size = size;
    if (this.highlightPoints) {
      (this.highlightPoints.material as THREE.PointsMaterial).size = size * 2.2;
    }
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  update(points: PointRecord[]): void {
    this.disposePoints();

    const n = points.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const hlPositions: number[] = [];
    const c = new THREE.Color();

    for (let i = 0; i < n; i++) {
      const p = points[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      intensityColor(p.intensity, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      if (p.highlight) {
        hlPositions.push(p.x, p.y, p.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: this.pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      depthWrite: false,
    });
    this.mainPoints = new THREE.Points(geo, mat);
    this.group.add(this.mainPoints);

    if (hlPositions.length > 0) {
      const hlGeo = new THREE.BufferGeometry();
      hlGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(hlPositions, 3),
      );
      const hlMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: this.pointSize * 2.2,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      this.highlightPoints = new THREE.Points(hlGeo, hlMat);
      this.group.add(this.highlightPoints);
    }
  }

  get highlightCount(): number {
    const attr = this.highlightPoints?.geometry.getAttribute('position');
    return attr ? attr.count : 0;
  }

  private disposePoints(): void {
    for (const child of [...this.group.children]) {
      const pts = child as THREE.Points;
      pts.geometry.dispose();
      (pts.material as THREE.Material).dispose();
      this.group.remove(pts);
    }
    this.mainPoints = null;
    this.highlightPoints = null;
  }

  dispose(): void {
    this.disposePoints();
  }
}
