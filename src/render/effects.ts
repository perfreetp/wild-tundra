import { Effect, BlendFunction } from 'postprocessing';
import { Uniform, Vector2, Color } from 'three';

/**
 * 最终调色：曝光 → ACES 色调映射 → 对比度/饱和度 → 暗角 → 轻微颗粒。
 * 输出保持线性，末尾由 postprocessing 的 ENCODE_OUTPUT 统一做 sRGB 编码。
 */
const gradeFragment = /* glsl */ `
  uniform float exposure;
  uniform float contrast;
  uniform float saturation;
  uniform float vignette;
  uniform float grain;
  uniform vec3 lift;
  uniform float liftAmount;

  vec3 acesFilm(vec3 x) {
    // Narkowicz 2015 ACES 近似
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb * exposure;
    color = acesFilm(color);

    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luma), color, saturation);
    color = (color - 0.5) * contrast + 0.5;
    color = max(color, vec3(0.0));

    // 阴影抬升（同时给夜间一个冷调不纯黑）
    color += lift * liftAmount * (1.0 - smoothstep(0.0, 0.45, luma));

    // 暗角
    vec2 d = uv - 0.5;
    float r = length(d * vec2(1.0, 0.82));
    float vig = smoothstep(0.78, 0.24, r);
    color *= mix(1.0, vig, vignette);

    // 颗粒（时间抖动），幅度很小
    if (grain > 0.0) {
      float n = hash12(uv * resolution + fract(time) * 731.0) - 0.5;
      color += n * grain * 0.06;
    }

    outputColor = vec4(max(color, vec3(0.0)), inputColor.a);
  }
`;

export interface GradeOptions {
  exposure?: number;
  contrast?: number;
  saturation?: number;
  vignette?: number;
  grain?: number;
}

export class GradeEffect extends Effect {
  constructor(options: GradeOptions = {}) {
    super('GradeEffect', gradeFragment, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['exposure', new Uniform(options.exposure ?? 1)],
        ['contrast', new Uniform(options.contrast ?? 1.04)],
        ['saturation', new Uniform(options.saturation ?? 1.05)],
        ['vignette', new Uniform(options.vignette ?? 0.42)],
        ['grain', new Uniform(options.grain ?? 0.35)],
        ['lift', new Uniform(new Color(0.045, 0.06, 0.085))],
        ['liftAmount', new Uniform(0.0)],
      ]),
    });
  }

  get exposure(): number {
    return this.uniforms.get('exposure')?.value as number;
  }
  set exposure(v: number) {
    const u = this.uniforms.get('exposure');
    if (u) u.value = v;
  }

  get contrast(): number {
    return this.uniforms.get('contrast')?.value as number;
  }
  set contrast(v: number) {
    const u = this.uniforms.get('contrast');
    if (u) u.value = v;
  }

  get saturation(): number {
    return this.uniforms.get('saturation')?.value as number;
  }
  set saturation(v: number) {
    const u = this.uniforms.get('saturation');
    if (u) u.value = v;
  }

  get vignette(): number {
    return this.uniforms.get('vignette')?.value as number;
  }
  set vignette(v: number) {
    const u = this.uniforms.get('vignette');
    if (u) u.value = v;
  }

  get grain(): number {
    return this.uniforms.get('grain')?.value as number;
  }
  set grain(v: number) {
    const u = this.uniforms.get('grain');
    if (u) u.value = v;
  }

  setLift(color: Color, amount: number): void {
    const c = this.uniforms.get('lift');
    const a = this.uniforms.get('liftAmount');
    if (c) (c.value as Color).copy(color);
    if (a) a.value = amount;
  }
}

/**
 * 轻量 FXAA：在合成结果上做边缘检测方向的均值混合，抑制山脊/钢轨锯齿。
 */
const fxaaFragment = /* glsl */ `
  uniform vec2 resolution;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 texel = 1.0 / resolution;

    float lNW = luma(texture2D(inputBuffer, uv + vec2(-1.0, -1.0) * texel).rgb);
    float lNE = luma(texture2D(inputBuffer, uv + vec2( 1.0, -1.0) * texel).rgb);
    float lSW = luma(texture2D(inputBuffer, uv + vec2(-1.0,  1.0) * texel).rgb);
    float lSE = luma(texture2D(inputBuffer, uv + vec2( 1.0,  1.0) * texel).rgb);
    float lM  = luma(inputColor.rgb);

    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    float range = lMax - lMin;

    if (range < 0.045) {
      outputColor = inputColor;
      return;
    }

    vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
    float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
    float rcpMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
    dir = clamp(dir * rcpMin, vec2(-8.0), vec2(8.0)) * texel;

    vec3 a = 0.5 * (
      texture2D(inputBuffer, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
      texture2D(inputBuffer, uv + dir * (2.0 / 3.0 - 0.5)).rgb
    );
    vec3 b = a * 0.5 + 0.25 * (
      texture2D(inputBuffer, uv - dir * 0.5).rgb +
      texture2D(inputBuffer, uv + dir * 0.5).rgb
    );

    float lB = luma(b);
    outputColor = (lB < lMin || lB > lMax) ? vec4(a, inputColor.a) : vec4(b, inputColor.a);
  }
`;

export class FXAAEffect extends Effect {
  constructor(width = 1, height = 1) {
    super('FXAAEffect', fxaaFragment, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([['resolution', new Uniform(new Vector2(width, height))]]),
    });
  }

  setSize(width: number, height: number): void {
    const u = this.uniforms.get('resolution');
    if (u) (u.value as Vector2).set(width, height);
  }
}
