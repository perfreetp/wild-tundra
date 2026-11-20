import { Uniform } from 'three';
import { BlendFunction, Effect } from 'postprocessing';

/**
 * 滚动快门（Rolling Shutter）效果
 * CMOS 逐行曝光：每一行像素的采样时刻不同，相机/目标运动时
 * 画面产生剪切与“果冻”形变。
 *
 * motion：xy = 横向运动流（UV/帧），z = 前向运动流强度
 * tilt：倾斜量 0~1，0 表示全局快门
 */
export class RollingShutterEffect extends Effect {
  constructor(tilt = 0.25) {
    super('RollingShutterEffect', FRAGMENT, {
      blendFunction: BlendFunction.SET,
      uniforms: new Map<string, Uniform>([
        ['tilt', new Uniform(tilt)],
        ['motion', new Uniform({ x: 0, y: 0, z: 0 })],
      ]),
    });
  }

  setTilt(v: number) {
    this.uniforms.get('tilt')!.value = v;
  }

  /** 每帧由引擎更新当前运动流 */
  setMotion(x: number, y: number, z: number) {
    const m = this.uniforms.get('motion')!.value as {
      x: number;
      y: number;
      z: number;
    };
    m.x = x;
    m.y = y;
    m.z = z;
  }
}

const FRAGMENT = /* glsl */ `
uniform float tilt;
uniform vec3 motion;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (tilt < 0.0001) {
    outputColor = inputColor;
    return;
  }
  // 行曝光时刻：顶部行与底部行相差一个完整读出周期
  float rowTime = (uv.y - 0.5) * 2.0;
  float gate = tilt * rowTime;

  // 横向运动 → 垂直线条剪切；前向运动 → 径向果冻形变
  vec2 radial = uv - 0.5;
  vec2 sampleUv = uv;
  sampleUv.x -= motion.x * gate;
  sampleUv.y -= motion.y * gate;
  sampleUv -= radial * motion.z * gate;

  sampleUv = clamp(sampleUv, vec2(0.001), vec2(0.999));
  outputColor = texture2D(inputBuffer, sampleUv);
}
`;
