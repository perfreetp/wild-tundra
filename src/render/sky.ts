import {
  BackSide,
  type IUniform,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Texture,
} from 'three';
import type { Palette } from './palette';

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform float uNight;
  uniform float uStarIntensity;
  uniform sampler2D uCloudTex;
  uniform float uCloudCover;
  uniform float uCloudTime;
  uniform float uCloudScale;
  uniform vec3 uCloudTint;
  uniform float uCloudGlow;

  varying vec3 vWorldPosition;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float starField(vec3 dir) {
    vec3 p = dir * 190.0;
    vec3 id = floor(p);
    float h = hash3(id);
    if (h < 0.986) return 0.0;
    vec3 f = fract(p) - 0.5;
    float d = length(f);
    float core = smoothstep(0.22, 0.0, d);
    float flicker = 0.65 + 0.35 * sin(uCloudTime * 0.7 + h * 63.0);
    return core * flicker * (0.3 + 0.7 * hash3(id + 11.0));
  }

  vec2 cloudUv(vec3 dir, float scale, float height) {
    vec2 p = dir.xz / max(dir.y + height, 0.035);
    return p * scale + vec2(uCloudTime * 0.0035, uCloudTime * 0.0012);
  }

  void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);
    vec3 color = mix(uHorizon, uZenith, pow(clamp(dir.y, 0.0, 1.0), 0.52));
    // 地平线以下：向天顶色调而不是中灰色收，避免出现一片「灰蓝色地板」
    vec3 below = mix(uHorizon * 0.82, uZenith * 1.35 + uHorizon * 0.28, smoothstep(0.0, -0.3, dir.y));
    color = below;

    // 太阳 / 月亮
    float sd = max(dot(dir, uSunDir), 0.0);
    float disc = smoothstep(0.99935, 0.99975, sd);
    float glow = pow(sd, 320.0) * 0.55 + pow(sd, 14.0) * 0.14 + pow(sd, 3.0) * 0.045;
    vec3 sunContribution = uSunColor * (disc * 6.5 + glow) * uSunIntensity;
    color += sunContribution;

    // 星空
    float stars = starField(dir) * uStarIntensity * smoothstep(-0.03, 0.16, dir.y);
    color += vec3(0.82, 0.88, 1.0) * stars;

    // 云层（两层视差）
    float cloudFade = smoothstep(0.015, 0.22, dir.y);
    vec4 c1 = texture2D(uCloudTex, cloudUv(dir, uCloudScale, 0.24));
    vec4 c2 = texture2D(uCloudTex, cloudUv(dir, uCloudScale * 1.73, 0.15) + vec2(0.37, 0.61));
    float coverage = uCloudCover;
    float a1 = smoothstep(1.0 - coverage, 1.0 - coverage + 0.22, c1.a) * cloudFade;
    float a2 = smoothstep(1.0 - coverage * 0.8, 1.0 - coverage * 0.8 + 0.3, c2.a) * cloudFade * 0.75;
    float alpha = clamp(a1 * 0.85 + a2 * 0.5, 0.0, 1.0);

    vec3 lit = uCloudTint * (0.72 + 0.5 * pow(sd, 4.0));
    lit = mix(lit, uSunColor * (0.9 + 0.9 * pow(sd, 8.0)), uCloudGlow * pow(sd, 5.0));
    lit *= 1.0 - uNight * 0.78;
    color = mix(color, lit, alpha);

    // 地平线大气散射（把远处的天空提亮一点，避免死板）
    float band = exp(-abs(dir.y - 0.02) * 9.0);
    color += uHorizon * band * 0.16;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface SkyUniforms {
  uZenith: { value: Color };
  uHorizon: { value: Color };
  uGround: { value: Color };
  uSunDir: { value: Vector3 };
  uSunColor: { value: Color };
  uSunIntensity: { value: number };
  uNight: { value: number };
  uStarIntensity: { value: number };
  uCloudTex: { value: Texture | null };
  uCloudCover: { value: number };
  uCloudTime: { value: number };
  uCloudScale: { value: number };
  uCloudTint: { value: Color };
  uCloudGlow: { value: number };
}

export class SkyDome {
  readonly mesh: Mesh<SphereGeometry, ShaderMaterial>;
  readonly uniforms: SkyUniforms;

  constructor(cloudTexture: Texture) {
    const geometry = new SphereGeometry(18000, 48, 28);
    this.uniforms = {
      uZenith: { value: new Color(0.07, 0.16, 0.35) },
      uHorizon: { value: new Color(0.6, 0.72, 0.84) },
      uGround: { value: new Color(0.42, 0.46, 0.5) },
      uSunDir: { value: new Vector3(0, 0.5, -1).normalize() },
      uSunColor: { value: new Color(1.0, 0.94, 0.82) },
      uSunIntensity: { value: 1 },
      uNight: { value: 0 },
      uStarIntensity: { value: 0 },
      uCloudTex: { value: cloudTexture },
      uCloudCover: { value: 0.45 },
      uCloudTime: { value: 0 },
      uCloudScale: { value: 0.09 },
      uCloudTint: { value: new Color(0.92, 0.94, 0.97) },
      uCloudGlow: { value: 0.55 },
    };
    const material = new ShaderMaterial({
      uniforms: this.uniforms as unknown as { [uniform: string]: IUniform },
      vertexShader,
      fragmentShader,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.mesh = new Mesh(geometry, material);
    this.mesh.renderOrder = -1000;
    this.mesh.frustumCulled = false;
    this.mesh.name = 'SkyDome';
  }

  applyPalette(palette: Palette): void {
    const u = this.uniforms;
    u.uZenith.value.copy(palette.zenith);
    u.uHorizon.value.copy(palette.horizon);
    u.uGround.value.copy(palette.ground);
    u.uSunDir.value.copy(palette.sunDir);
    u.uSunColor.value.copy(palette.sun);
    u.uSunIntensity.value = palette.night > 0.5 ? 0.55 : 1.0;
    u.uNight.value = palette.night;
    u.uStarIntensity.value = Math.pow(palette.night, 2.2) * 1.25;
    u.uCloudCover.value = palette.cloudCover;
    u.uCloudTint.value.copy(palette.horizon).lerp(palette.sun, 0.35);
    u.uCloudGlow.value = 0.5 + 0.25 * palette.tint[0];
  }

  update(elapsed: number): void {
    this.uniforms.uCloudTime.value = elapsed;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
