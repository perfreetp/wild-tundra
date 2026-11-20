import { Uniform } from 'three';
import { BlendFunction, Effect } from 'postprocessing';

/**
 * 曝光与动态范围效果（模拟传感器响应）
 * - exposureStops：EV 档位补偿，每档亮度 ×2
 * - dynamicRange：传感器动态范围（档），决定高光软压缩的白点
 *
 * 使用带白点控制的 Reinhard 胶片曲线，隧道等大光比场景下
 * 低动态范围会出现高光截止 / 暗部死黑。
 */
export class ExposureEffect extends Effect {
  constructor(exposureStops = 0, dynamicRange = 12) {
    super('ExposureEffect', FRAGMENT, {
      blendFunction: BlendFunction.SET,
      uniforms: new Map<string, Uniform>([
        ['exposure', new Uniform(Math.pow(2, exposureStops))],
        ['whitePoint', new Uniform(drToWhite(dynamicRange))],
      ]),
    });
  }

  setStops(stops: number) {
    this.uniforms.get('exposure')!.value = Math.pow(2, stops);
  }

  setDynamicRange(dr: number) {
    this.uniforms.get('whitePoint')!.value = drToWhite(dr);
  }
}

function drToWhite(dr: number) {
  // 6 档 → 0.25（强烈裁切），12 档 → 16，20 档 → 4096
  return Math.pow(2, dr - 8);
}

const FRAGMENT = /* glsl */ `
uniform float exposure;
uniform float whitePoint;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 linear = inputColor.rgb * exposure;
  float w2 = whitePoint * whitePoint;
  // 扩展 Reinhard：白点处刚好映射到 1，超过白点的高光平滑截止
  vec3 mapped = (linear * (1.0 + linear / w2)) / (1.0 + linear);
  outputColor = vec4(mapped, inputColor.a);
}
`;
