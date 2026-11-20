import { AmbientLight, Color, DirectionalLight, HemisphereLight, Scene } from 'three';
import type { Palette } from './palette';

/**
 * 为每个图层场景挂载与当前环境一致的三点光照：
 * 主光（太阳/月亮）+ 半球环境光 + 极弱的补光。
 * 图层场景是独立渲染的，因此各自持有一组灯光引用，调色板变化时统一更新。
 */
const tmpTint = new Color(1, 1, 1);

export class LayerLights {
  readonly sun: DirectionalLight;
  readonly hemi: HemisphereLight;
  readonly fill: DirectionalLight;
  readonly ambient: AmbientLight;

  constructor(scene: Scene) {
    this.sun = new DirectionalLight(0xffffff, 2.2);
    this.sun.position.set(0.4, 0.75, -0.5).multiplyScalar(1000);

    this.hemi = new HemisphereLight(0xbdd4e8, 0x4a4433, 0.9);

    this.fill = new DirectionalLight(0xa8c4e0, 0.35);
    this.fill.position.set(-0.6, 0.25, 0.7).multiplyScalar(1000);

    this.ambient = new AmbientLight(0xffffff, 0.12);

    scene.add(this.sun, this.sun.target, this.hemi, this.fill, this.fill.target, this.ambient);
  }

  apply(palette: Palette, night: number): void {
    const sun = this.sun;
    const target = sun.target;
    target.position.set(0, 0, 0);
    sun.position.copy(palette.sunDir).multiplyScalar(1200);
    sun.target.updateMatrixWorld();
    sun.color.copy(palette.sun);
    // 夜间以月光为主，压低强度并抬高补光比例
    sun.intensity = palette.sunIntensity * (night > 0.5 ? 0.55 : 1);

    this.hemi.color.copy(palette.hemiSky);
    this.hemi.groundColor.copy(palette.hemiGround).multiply(tmpTint);
    this.hemi.intensity = palette.hemiIntensity;
    // 夜间抬高半球光，让暗部不至于死黑
    this.hemi.intensity = palette.hemiIntensity * (0.85 + 0.55 * night);

    this.fill.color.copy(palette.hemiSky);
    this.fill.intensity = 0.3 + 0.22 * night;

    this.ambient.color.setRGB(0.62, 0.68, 0.76);
    this.ambient.intensity = 0.24 + 0.08 * night;
  }

  dispose(): void {
    this.sun.dispose();
    this.hemi.dispose();
    this.fill.dispose();
    this.ambient.dispose();
  }
}

/** 图层表面颜色（线性空间基准值），配合 Lambert 光照输出 */
export const SURFACE = {
  ballast: new Color(0.34, 0.33, 0.31),
  sleeper: new Color(0.42, 0.4, 0.37),
  rail: new Color(0.52, 0.53, 0.54),
  mast: new Color(0.27, 0.29, 0.31),
  wire: new Color(0.12, 0.13, 0.14),
  signalBox: new Color(0.13, 0.14, 0.15),
  shrub: new Color(0.13, 0.21, 0.1),
  ground: new Color(0.25, 0.3, 0.19),
  hill: new Color(0.2, 0.28, 0.16),
  canopy: new Color(0.1, 0.18, 0.09),
  trunk: new Color(0.14, 0.11, 0.08),
  wall: new Color(0.6, 0.56, 0.48),
  roof: new Color(0.36, 0.16, 0.12),
  water: new Color(0.11, 0.19, 0.25),
  pole: new Color(0.16, 0.145, 0.12),
} as const;
