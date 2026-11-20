import { Effect } from 'postprocessing';
import { Texture, Uniform, Vector2 } from 'three';

const fragment = /* glsl */ `
uniform sampler2D maskMap;
uniform float threshold;
uniform float strength;
uniform vec2 texelSize;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = inputColor.rgb;
  float luma = luminance(color);

  // 灯带遮罩（5  taps 柔化），遮罩区域的高光单独保留
  float mask = texture2D(maskMap, uv).r * 0.5;
  mask += texture2D(maskMap, uv + vec2(texelSize.x, 0.0)).r * 0.125;
  mask += texture2D(maskMap, uv - vec2(texelSize.x, 0.0)).r * 0.125;
  mask += texture2D(maskMap, uv + vec2(0.0, texelSize.y)).r * 0.125;
  mask += texture2D(maskMap, uv - vec2(0.0, texelSize.y)).r * 0.125;
  mask = clamp(mask, 0.0, 1.0);

  // 超过阈值的区域做局部压暗（软膝压缩）
  float over = max(luma - threshold, 0.0);
  float dampen = 1.0 / (1.0 + over * strength * 6.0 * (1.0 - mask));
  outputColor = vec4(color * dampen, inputColor.a);
}
`;

/**
 * 过曝抑制：对亮度超过阈值（0.9）的区域做局部压暗，
 * 灯带遮罩内的像素跳过压缩，保留隧道灯带高光。
 */
export class HighlightSuppressionEffect extends Effect {
  constructor() {
    super('HighlightSuppressionEffect', fragment, {
      uniforms: new Map<string, Uniform>([
        ['maskMap', new Uniform(null as Texture | null)],
        ['threshold', new Uniform(0.9)],
        ['strength', new Uniform(0.7)],
        ['texelSize', new Uniform(new Vector2(1 / 512, 1 / 512))],
      ]),
    });
  }

  setMask(tex: Texture): void {
    this.uniforms.get('maskMap')!.value = tex;
  }

  setTexel(x: number, y: number): void {
    (this.uniforms.get('texelSize')!.value as Vector2).set(x, y);
  }

  get strength(): number {
    return this.uniforms.get('strength')!.value as number;
  }

  set strength(v: number) {
    this.uniforms.get('strength')!.value = v;
  }

  get threshold(): number {
    return this.uniforms.get('threshold')!.value as number;
  }

  set threshold(v: number) {
    this.uniforms.get('threshold')!.value = v;
  }
}
