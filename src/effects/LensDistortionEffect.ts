import { Uniform } from 'three';
import { BlendFunction, Effect } from 'postprocessing';

/**
 * 镜头畸变效果
 * amount > 0：桶形畸变（广角/鱼眼，画面向外鼓）
 * amount < 0：枕形畸变（长焦，画面向内收）
 * 使用 r² + r⁴ 多项式近似真实镜头径向畸变
 */
export class LensDistortionEffect extends Effect {
  constructor(amount = 0.35, aspect = 16 / 9) {
    super('LensDistortionEffect', FRAGMENT, {
      blendFunction: BlendFunction.SET,
      uniforms: new Map<string, Uniform>([
        ['amount', new Uniform(amount)],
        ['aspect', new Uniform(aspect)],
      ]),
    });
  }

  setAmount(v: number) {
    this.uniforms.get('amount')!.value = v;
  }

  setAspect(v: number) {
    this.uniforms.get('aspect')!.value = v;
  }
}

const FRAGMENT = /* glsl */ `
uniform float amount;
uniform float aspect;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (abs(amount) < 0.0001) {
    outputColor = inputColor;
    return;
  }
  // 归一化设备坐标，x 方向乘宽高比保证畸变各向同性
  vec2 cc = uv * 2.0 - 1.0;
  cc.x *= aspect;

  float r2 = dot(cc, cc);
  float r4 = r2 * r2;
  vec2 distorted = cc * (1.0 + amount * r2 + amount * 0.35 * r4);
  distorted.x /= aspect;

  vec2 sampleUv = distorted * 0.5 + 0.5;
  if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
    // 畸变后画面外区域填黑（传感器未感光区域）
    outputColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    outputColor = texture2D(inputBuffer, sampleUv);
  }
}
`;
