import * as THREE from 'three';
import type { WeatherConfig } from './types';

/**
 * 雨雾天气系统：
 * - 雾：THREE.Fog 线性雾，far = 能见度，随能见度 50–500m 调整
 * - 雨：Points 雨粒子系统，包围盒跟随当前相机，按强度控制粒子数与下落速度
 * 上层 UI 另有一层 CSS 叠加层做雨幕/朦胧效果（见 RainOverlay 组件）
 */
export class WeatherSystem {
  readonly fog: THREE.Fog;
  private rain: THREE.Points;
  private rainVelocity: Float32Array;
  private readonly rainCount = 1400;
  private readonly boxHalf = 80;
  private config: WeatherConfig;
  private baseFogColor = new THREE.Color(0xb8c0c8);

  constructor(scene: THREE.Scene, config: WeatherConfig) {
    this.config = { ...config };
    this.fog = new THREE.Fog(this.baseFogColor.clone(), 10, config.visibility);
    scene.fog = this.fog;

    const positions = new Float32Array(this.rainCount * 3);
    this.rainVelocity = new Float32Array(this.rainCount);
    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.boxHalf * 2;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.boxHalf * 2;
      this.rainVelocity[i] = 28 + Math.random() * 22;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xcdd6e0,
      size: 0.35,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.rain = new THREE.Points(geo, mat);
    this.rain.frustumCulled = false;
    this.rain.visible = config.rain;
    scene.add(this.rain);
    this.applyFog();
  }

  update(config: WeatherConfig, camera: THREE.PerspectiveCamera, delta: number): void {
    const rainToggled = config.rain !== this.config.rain;
    const fogToggled = config.fog !== this.config.fog;
    this.config = { ...config };

    if (rainToggled) this.rain.visible = config.rain;
    if (fogToggled || config.visibility !== this.fog.far) this.applyFog();

    if (!config.rain) return;
    const mat = this.rain.material as THREE.PointsMaterial;
    mat.opacity = 0.25 + config.rainIntensity * 0.5;

    // 雨幕跟随相机，保证相机始终处于雨粒子包围盒中心
    this.rain.position.set(camera.position.x, camera.position.y - 5, camera.position.z);
    const attr = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const speedScale = 0.4 + config.rainIntensity;
    for (let i = 0; i < this.rainCount; i++) {
      let y = arr[i * 3 + 1] - this.rainVelocity[i] * speedScale * delta;
      if (y < -10) y = 55 + Math.random() * 8;
      arr[i * 3 + 1] = y;
    }
    attr.needsUpdate = true;
  }

  private applyFog(): void {
    if (this.config.fog) {
      this.fog.near = Math.min(10, this.config.visibility * 0.15);
      this.fog.far = this.config.visibility;
      this.fog.color.copy(this.baseFogColor);
    } else {
      // 关闭雾：推到无穷远，等同于禁用
      this.fog.near = 1e4;
      this.fog.far = 1e5;
    }
  }

  get fogColor(): THREE.Color {
    return this.baseFogColor;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.rain);
    this.rain.geometry.dispose();
    (this.rain.material as THREE.Material).dispose();
    scene.fog = null;
  }
}
